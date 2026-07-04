import uuid
from sqlalchemy import Column, String, Double, Boolean, ForeignKey, DateTime, Enum, Text
from sqlalchemy.sql import func
from ..config.db import Base

class FraudRule(Base):
    __tablename__ = "fraud_rules"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rule_name = Column(String(150), unique=True, nullable=False)
    rule_description = Column(Text, nullable=True)
    
    # Conditional logic structure (e.g. IF condition_feature condition_operator condition_value THEN action)
    condition_feature = Column(String(100), nullable=False)
    condition_operator = Column(String(10), nullable=False)
    condition_value = Column(Double, nullable=False)
    
    action = Column(Enum('auto_reject', 'auto_flag', 'bypass', name='fraud_rule_action'), default='auto_flag', nullable=False)
    is_active = Column(Boolean, default=True)
    
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
