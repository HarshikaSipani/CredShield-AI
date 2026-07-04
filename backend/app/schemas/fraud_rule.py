from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class FraudRuleBase(BaseModel):
    rule_name: str = Field(..., max_length=150)
    rule_description: Optional[str] = None
    condition_feature: str = Field(..., description="E.g., debt_ratio")
    condition_operator: str = Field(..., description="E.g., >, <, ==")
    condition_value: float
    action: str = Field("auto_flag", description="Action: auto_reject, auto_flag, bypass")
    is_active: bool = True

class FraudRuleCreate(FraudRuleBase):
    pass

class FraudRuleUpdate(BaseModel):
    rule_name: Optional[str] = Field(None, max_length=150)
    rule_description: Optional[str] = None
    condition_feature: Optional[str] = None
    condition_operator: Optional[str] = None
    condition_value: Optional[float] = None
    action: Optional[str] = None
    is_active: Optional[bool] = None

class FraudRuleResponse(FraudRuleBase):
    id: UUID
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class FraudRuleListResponse(BaseModel):
    data: list[FraudRuleResponse]

