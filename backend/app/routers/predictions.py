from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..models.applicant import Applicant
from ..models.prediction import Prediction
from ..models.user import User
from ..models.audit_log import AuditLog
from ..models.fraud_rule import FraudRule
from ..schemas.prediction import PredictionRequest, PredictionResponse
from ..services.model_service import model_service
from ..services.shap_service import shap_service
from .deps import get_current_user, RoleChecker

router = APIRouter(prefix="/predictions", tags=["Predictions Analytics"])

# Only Risk Analysts and Administrators can initiate predictions
evaluate_guards = Depends(RoleChecker(["admin", "risk_analyst"]))
read_guards = Depends(RoleChecker(["admin", "risk_analyst", "auditor"]))

@router.post("/evaluate", response_model=PredictionResponse, status_code=status.HTTP_201_CREATED)
def evaluate_risk(
    request: Request,
    pred_in: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = evaluate_guards
):
    # 1. Fetch applicant details
    applicant = db.query(Applicant).filter(Applicant.id == str(pred_in.applicant_id)).first()
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Applicant record not found"
        )
        
    applicant_dict = {
        "revolving_utilization": applicant.revolving_utilization,
        "age": applicant.age,
        "number_30_59_days_past_due": applicant.number_30_59_days_past_due,
        "debt_ratio": applicant.debt_ratio,
        "monthly_income": applicant.monthly_income,
        "number_open_credit_lines": applicant.number_open_credit_lines,
        "number_90_days_late": applicant.number_90_days_late,
        "number_real_estate_loans": applicant.number_real_estate_loans,
        "number_60_89_days_past_due": applicant.number_60_89_days_past_due,
        "number_of_dependents": applicant.number_of_dependents
    }

    # 2. Intercept using Fraud Prevention Rules
    active_rules = db.query(FraudRule).filter(FraudRule.is_active == True).all()
    triggered_rule = None
    
    for rule in active_rules:
        val = applicant_dict.get(rule.condition_feature)
        if val is not None:
            # Evaluate conditional statement
            triggered = False
            if rule.condition_operator == ">" and val > rule.condition_value:
                triggered = True
            elif rule.condition_operator == "<" and val < rule.condition_value:
                triggered = True
            elif rule.condition_operator == "==" and val == rule.condition_value:
                triggered = True
                
            if triggered:
                triggered_rule = rule
                break

    if triggered_rule:
        # Fraud rule triggered: Bypass ML model and execute automatic rule action
        prob = 1.0 if triggered_rule.action == "auto_reject" else 0.5
        score = 300 if triggered_rule.action == "auto_reject" else 550
        category = "high_risk" if triggered_rule.action == "auto_reject" else "medium_risk"
        rec = "reject" if triggered_rule.action == "auto_reject" else "manual_review"
        
        shap_vals = {triggered_rule.condition_feature: 1.0}
        ai_exp = f"Automated decision triggered by fraud prevention rule: '{triggered_rule.rule_name}'."
        model_ver = f"rule_engine:{triggered_rule.id}"
    else:
        # 3. Call ML Model Ensemble Service
        try:
            pred_out = model_service.predict_default(applicant_dict)
            prob = pred_out["default_probability"]
            score = pred_out["risk_score"]
            category = pred_out["risk_category"]
            rec = pred_out["decision_recommendation"]
            
            # 4. Generate SHAP explainability attributions
            scaled_data = model_service.preprocess(applicant_dict)
            shap_vals = shap_service.explain_prediction(scaled_data)
            ai_exp = shap_service.generate_natural_language_explanation(shap_vals, applicant_dict)
            model_ver = "ensemble_v1.0.0"
        except Exception as e:
            # Fallback to Simple Logistic Regression if Ensemble assets aren't ready
            print(f"Prediction failed: {e}. Falling back to default baseline.")
            prob = 0.15
            score = 650
            category = "medium_risk"
            rec = "manual_review"
            shap_vals = {}
            ai_exp = "Model fallback triggered. Review applicant files manually."
            model_ver = "fallback_v1.0.0"

    # 5. Save the prediction record
    db_pred = Prediction(
        applicant_id=applicant.id,
        evaluator_id=current_user.id,
        default_probability=prob,
        risk_score=score,
        risk_category=category,
        decision_recommendation=rec,
        shap_values=shap_vals,
        ai_explanation=ai_exp,
        model_version=model_ver
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)

    # 6. Log the audit activity (append-only)
    ip_addr = request.client.host if request.client else "unknown"
    audit_log = AuditLog(
        user_id=current_user.id,
        action_type="EVALUATE_CREDIT",
        description=f"Evaluated credit risk for applicant {applicant.first_name} {applicant.last_name}. Probability: {prob}, Recommendation: {rec}.",
        ip_address=ip_addr
    )
    db.add(audit_log)
    db.commit()

    return db_pred

@router.get("/{id}", response_model=PredictionResponse)
def get_prediction(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = read_guards
):
    prediction = db.query(Prediction).filter(Prediction.id == str(id)).first()
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found"
        )
    return prediction
