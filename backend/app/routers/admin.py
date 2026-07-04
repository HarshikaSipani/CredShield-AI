import os
import sys
import subprocess
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks, UploadFile, File
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..models.audit_log import AuditLog
from ..models.fraud_rule import FraudRule
from ..models.user import User
from ..schemas.audit_log import AuditLogResponse, AuditLogPaginatedResponse
from ..schemas.fraud_rule import FraudRuleCreate, FraudRuleUpdate, FraudRuleResponse, FraudRuleListResponse
from .deps import get_current_user, RoleChecker

# Dynamic dataset path relative to root directory (works on Windows/Linux)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
csv_path = os.path.join(BASE_DIR, "cs-training.csv")

router = APIRouter(prefix="/admin", tags=["Administrator Settings"])

# Ensure only administrators can access these endpoints
admin_guards = Depends(RoleChecker(["admin"]))
auditor_guards = Depends(RoleChecker(["admin", "auditor"]))

@router.get("/audit-logs", response_model=AuditLogPaginatedResponse)
def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    action_type: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = auditor_guards
):
    query = db.query(AuditLog)
    
    if action_type:
        query = query.filter(AuditLog.action_type == action_type)
        
    total = query.count()
    offset = (page - 1) * limit
    logs = query.order_by(AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    
    total_pages = (total + limit - 1) // limit
    
    return {
        "data": logs,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }

@router.get("/fraud-rules", response_model=FraudRuleListResponse)
def list_fraud_rules(
    db: Session = Depends(get_db),
    current_user: User = admin_guards
):
    rules = db.query(FraudRule).all()
    return {"data": rules}

@router.post("/fraud-rules", response_model=FraudRuleResponse, status_code=status.HTTP_201_CREATED)
def create_fraud_rule(
    rule_in: FraudRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = admin_guards
):
    existing = db.query(FraudRule).filter(FraudRule.rule_name == rule_in.rule_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A fraud rule with this name already exists."
        )
        
    db_rule = FraudRule(
        **rule_in.model_dump(),
        created_by=current_user.id
    )
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.put("/fraud-rules/{id}", response_model=FraudRuleResponse)
def update_fraud_rule(
    id: UUID,
    rule_in: FraudRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = admin_guards
):
    rule = db.query(FraudRule).filter(FraudRule.id == id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fraud rule not found."
        )
        
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
        
    db.commit()
    db.refresh(rule)
    return rule

def run_retrain_script():
    try:
        # Run training pipeline directly in-process to save 150MB+ RAM (prevents Render OOM)
        from ..ml.train import run_training_pipeline
        from ..services.model_service import model_service
        
        output_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "ml_assets"
        )
        
        print("Starting in-process model retraining pipeline...")
        run_training_pipeline(csv_path, output_dir)
        print("In-process model retraining completed successfully.")
        
        # Reload newly generated binary models in memory
        model_service._load_assets()
        print("Model assets reloaded successfully in server memory.")
    except Exception as e:
        print(f"Error during background model retraining: {e}")

@router.post("/model/retrain", status_code=status.HTTP_202_ACCEPTED)
def retrain_model(
    background_tasks: BackgroundTasks,
    current_user: User = admin_guards
):
    background_tasks.add_task(run_retrain_script)
    return {
        "status": "training",
        "message": "Ensemble model retraining has been initiated in the background."
    }

@router.post("/model/upload-dataset")
def upload_dataset(
    file: UploadFile = File(...),
    current_user: User = admin_guards
):
    # Verify extension
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only CSV datasets are accepted."
        )
        
    # Write uploaded dataset over existing training path (resolves to dynamic root path)
    try:
        with open(csv_path, "wb") as buffer:
            buffer.write(file.file.read())
        return {
            "status": "success",
            "message": f"Dataset file '{file.filename}' uploaded and replaced 'cs-training.csv' successfully."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write dataset to disk: {e}"
        )
