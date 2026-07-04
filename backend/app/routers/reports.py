import os
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..models.prediction import Prediction
from ..models.applicant import Applicant
from ..models.report import Report
from ..models.user import User
from ..schemas.report import ReportRequest, ReportResponse
from ..services.pdf_service import pdf_service
from .deps import get_current_user, RoleChecker

router = APIRouter(prefix="/reports", tags=["Reports Export"])

read_guards = Depends(RoleChecker(["admin", "risk_analyst", "auditor"]))
write_guards = Depends(RoleChecker(["admin", "risk_analyst"]))

# Static reports folder path
REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

def compile_pdf_background(report_id: UUID, prediction_id: UUID, db_session_factory):
    db = db_session_factory()
    try:
        report = db.query(Report).filter(Report.id == str(report_id)).first()
        prediction = db.query(Prediction).filter(Prediction.id == str(prediction_id)).first()
        if not report or not prediction:
            return
            
        applicant = db.query(Applicant).filter(Applicant.id == prediction.applicant_id).first()
        
        output_filename = f"{prediction.id}.pdf"
        output_path = os.path.join(REPORTS_DIR, output_filename)
        
        # Call PDF service compiler
        pred_dict = {
            "id": prediction.id,
            "evaluator_id": prediction.evaluator_id,
            "default_probability": prediction.default_probability,
            "risk_score": prediction.risk_score,
            "risk_category": prediction.risk_category,
            "decision_recommendation": prediction.decision_recommendation,
            "shap_values": prediction.shap_values,
            "ai_explanation": prediction.ai_explanation,
            "model_version": prediction.model_version
        }
        
        app_dict = {
            "first_name": applicant.first_name,
            "last_name": applicant.last_name,
            "email": applicant.email
        }
        
        pdf_service.generate_audit_pdf(pred_dict, app_dict, output_path)
        
        # Update database entry
        report.status = "completed"
        report.s3_report_url = f"/static_reports/{output_filename}"
        db.commit()
    except Exception as e:
        print(f"Failed background PDF compilation: {e}")
        try:
            report.status = "failed"
            db.commit()
        except:
            pass
    finally:
        db.close()

@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_202_ACCEPTED)
def generate_report(
    report_in: ReportRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = write_guards
):
    prediction = db.query(Prediction).filter(Prediction.id == str(report_in.prediction_id)).first()
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found."
        )
        
    # Check if a report already exists for this prediction
    existing_report = db.query(Report).filter(Report.prediction_id == prediction.id).first()
    if existing_report and existing_report.status == "completed":
        return existing_report
        
    db_report = Report(
        prediction_id=prediction.id,
        user_id=current_user.id,
        status="pending"
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    # Spawn background task thread for PDF compilation
    from ..config.db import SessionLocal
    background_tasks.add_task(
        compile_pdf_background,
        db_report.id,
        prediction.id,
        SessionLocal
    )
    
    return db_report

@router.get("/{id}", response_model=ReportResponse)
def get_report_status(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = read_guards
):
    report = db.query(Report).filter(Report.id == str(id)).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report record not found."
        )
    return report

@router.get("/download/{prediction_id}")
def download_pdf_report(
    prediction_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = read_guards
):
    prediction = db.query(Prediction).filter(Prediction.id == str(prediction_id)).first()
    if not prediction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found."
        )
        
    output_filename = f"{prediction.id}.pdf"
    file_path = os.path.join(REPORTS_DIR, output_filename)
    
    if not os.path.exists(file_path):
        # Generate inline synchronously if not pre-compiled
        applicant = db.query(Applicant).filter(Applicant.id == prediction.applicant_id).first()
        pred_dict = {
            "id": prediction.id,
            "evaluator_id": prediction.evaluator_id,
            "default_probability": prediction.default_probability,
            "risk_score": prediction.risk_score,
            "risk_category": prediction.risk_category,
            "decision_recommendation": prediction.decision_recommendation,
            "shap_values": prediction.shap_values,
            "ai_explanation": prediction.ai_explanation,
            "model_version": prediction.model_version
        }
        app_dict = {
            "first_name": applicant.first_name,
            "last_name": applicant.last_name,
            "email": applicant.email
        }
        try:
            pdf_service.generate_audit_pdf(pred_dict, app_dict, file_path)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Synchronous PDF generation failed: {e}"
            )
            
    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"credit_decision_report_{prediction_id}.pdf"
    )
