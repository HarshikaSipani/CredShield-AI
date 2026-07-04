import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..config.db import Base

class User(Base):
    __tablename__ = "users"

    # UUID stored as String(36) for cross-database compatibility (MySQL, SQLite)
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum('admin', 'risk_analyst', 'auditor', name='user_role'), default='risk_analyst', nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    applicants = relationship("Applicant", back_populates="creator")
    predictions = relationship("Prediction", back_populates="evaluator")
    reports = relationship("Report", back_populates="user")
