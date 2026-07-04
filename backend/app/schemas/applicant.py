from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class ApplicantBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    revolving_utilization: float = Field(..., ge=0.0, description="Total balance on credit cards and personal lines of credit divided by credit limit")
    age: int = Field(..., ge=18, le=120, description="Age of the debtor in years")
    number_30_59_days_past_due: int = Field(0, ge=0, description="Number of times borrower has been 30-59 days past due but no worse in the last 2 years")
    debt_ratio: float = Field(..., ge=0.0, description="Monthly debt payments, alimony, living costs divided by monthly gross income")
    monthly_income: float = Field(..., ge=0.0, description="Monthly gross income")
    number_open_credit_lines: int = Field(0, ge=0, description="Number of open credit loans and lines of credit")
    number_90_days_late: int = Field(0, ge=0, description="Number of times borrower has been 90 days or more past due")
    number_real_estate_loans: int = Field(0, ge=0, description="Number of mortgage and real estate loans including home equity lines of credit")
    number_60_89_days_past_due: int = Field(0, ge=0, description="Number of times borrower has been 60-89 days past due but no worse in the last 2 years")
    number_of_dependents: int = Field(0, ge=0, description="Number of dependents in family excluding themselves")

class ApplicantCreate(ApplicantBase):
    pass

class ApplicantUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    revolving_utilization: Optional[float] = Field(None, ge=0.0)
    age: Optional[int] = Field(None, ge=18, le=120)
    number_30_59_days_past_due: Optional[int] = Field(None, ge=0)
    debt_ratio: Optional[float] = Field(None, ge=0.0)
    monthly_income: Optional[float] = Field(None, ge=0.0)
    number_open_credit_lines: Optional[int] = Field(None, ge=0)
    number_90_days_late: Optional[int] = Field(None, ge=0)
    number_real_estate_loans: Optional[int] = Field(None, ge=0)
    number_60_89_days_past_due: Optional[int] = Field(None, ge=0)
    number_of_dependents: Optional[int] = Field(None, ge=0)

class ApplicantResponse(ApplicantBase):
    id: UUID
    created_by: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaginationInfo(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int

class ApplicantPaginatedResponse(BaseModel):
    data: list[ApplicantResponse]
    pagination: PaginationInfo

