import uuid
from sqlalchemy import Column, String, Integer, Double, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..config.db import Base

class Applicant(Base):
    __tablename__ = "applicants"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Financial features mapped directly from the dataset
    revolving_utilization = Column(Double, nullable=False)
    age = Column(Integer, nullable=False)
    number_30_59_days_past_due = Column(Integer, default=0, nullable=False)
    debt_ratio = Column(Double, nullable=False)
    monthly_income = Column(Double, nullable=False)
    number_open_credit_lines = Column(Integer, default=0, nullable=False)
    number_90_days_late = Column(Integer, default=0, nullable=False)
    number_real_estate_loans = Column(Integer, default=0, nullable=False)
    number_60_89_days_past_due = Column(Integer, default=0, nullable=False)
    number_of_dependents = Column(Integer, default=0, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    creator = relationship("User", back_populates="applicants")
    predictions = relationship("Prediction", back_populates="applicant", cascade="all, delete-orphan")
