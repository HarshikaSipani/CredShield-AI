import uuid
from sqlalchemy import Column, Integer, Double, String, ForeignKey, DateTime, Enum, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..config.db import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    applicant_id = Column(String(36), ForeignKey("applicants.id", ondelete="CASCADE"), nullable=False)
    evaluator_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    
    default_probability = Column(Double, nullable=False)
    risk_score = Column(Integer, nullable=False)
    risk_category = Column(Enum('low_risk', 'medium_risk', 'high_risk', name='risk_category_tier'), nullable=False)
    decision_recommendation = Column(Enum('approve', 'manual_review', 'reject', name='decision_rec'), nullable=False)
    
    # Store explainable AI outputs as JSON for MySQL support
    shap_values = Column(JSON, nullable=False)
    ai_explanation = Column(Text, nullable=False)
    model_version = Column(String(50), default="ensemble_v1.0.0", nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    applicant = relationship("Applicant", back_populates="predictions")
    evaluator = relationship("User", back_populates="predictions")
    report = relationship("Report", back_populates="prediction", uselist=False, cascade="all, delete-orphan")
