from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Dict, Any

class PredictionRequest(BaseModel):
    applicant_id: UUID

class PredictionResponse(BaseModel):
    id: UUID
    applicant_id: UUID
    evaluator_id: UUID
    default_probability: float = Field(..., ge=0.0, le=1.0)
    risk_score: int = Field(..., ge=300, le=850)
    risk_category: str # Enum: low_risk, medium_risk, high_risk
    decision_recommendation: str # Enum: approve, manual_review, reject
    shap_values: Dict[str, float]
    ai_explanation: str
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True
