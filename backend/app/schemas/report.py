from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ReportRequest(BaseModel):
    prediction_id: UUID

class ReportResponse(BaseModel):
    id: UUID
    prediction_id: UUID
    user_id: UUID
    status: str # Enum: pending, completed, failed
    s3_report_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
