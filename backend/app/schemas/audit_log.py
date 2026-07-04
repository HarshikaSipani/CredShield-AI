from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[UUID] = None
    action_type: str
    description: str
    ip_address: str
    created_at: datetime

    class Config:
        from_attributes = True

from .applicant import PaginationInfo

class AuditLogPaginatedResponse(BaseModel):
    data: list[AuditLogResponse]
    pagination: PaginationInfo

