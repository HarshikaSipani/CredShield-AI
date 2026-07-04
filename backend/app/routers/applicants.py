import csv
import io
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from ..config.db import get_db
from ..models.applicant import Applicant
from ..models.user import User
from ..schemas.applicant import ApplicantCreate, ApplicantUpdate, ApplicantResponse, ApplicantPaginatedResponse
from .deps import get_current_user, RoleChecker

router = APIRouter(prefix="/applicants", tags=["Applicants Directory"])

# Role guard: Admin and Risk Analyst can write/update/delete. Auditors can only read.
write_guards = Depends(RoleChecker(["admin", "risk_analyst"]))
read_guards = Depends(RoleChecker(["admin", "risk_analyst", "auditor"]))

@router.get("", response_model=ApplicantPaginatedResponse)
def get_applicants(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = read_guards
):
    query = db.query(Applicant)
    
    if search:
        query = query.filter(
            (Applicant.first_name.ilike(f"%{search}%")) |
            (Applicant.last_name.ilike(f"%{search}%")) |
            (Applicant.email.ilike(f"%{search}%"))
        )
        
    total = query.count()
    offset = (page - 1) * limit
    applicants = query.offset(offset).limit(limit).all()
    
    total_pages = (total + limit - 1) // limit
    
    return {
        "data": applicants,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    }

@router.post("", response_model=ApplicantResponse, status_code=status.HTTP_201_CREATED)
def create_applicant(
    applicant_in: ApplicantCreate,
    db: Session = Depends(get_db),
    current_user: User = write_guards
):
    existing_applicant = db.query(Applicant).filter(Applicant.email == applicant_in.email).first()
    if existing_applicant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Applicant with this email already exists."
        )
        
    db_applicant = Applicant(
        **applicant_in.model_dump(),
        created_by=current_user.id
    )
    db.add(db_applicant)
    db.commit()
    db.refresh(db_applicant)
    return db_applicant

@router.get("/{id}", response_model=ApplicantResponse)
def get_applicant(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = read_guards
):
    applicant = db.query(Applicant).filter(Applicant.id == str(id)).first()
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Applicant not found."
        )
    return applicant

@router.get("/{id}/raw")
def get_raw_applicant(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = read_guards
):
    applicant = db.query(Applicant).filter(Applicant.id == str(id)).first()
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Applicant not found."
        )
    return applicant

@router.put("/{id}", response_model=ApplicantResponse)
def update_applicant(
    id: UUID,
    applicant_in: ApplicantUpdate,
    db: Session = Depends(get_db),
    current_user: User = write_guards
):
    applicant = db.query(Applicant).filter(Applicant.id == str(id)).first()
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Applicant not found."
        )
        
    update_data = applicant_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(applicant, field, value)
        
    db.commit()
    db.refresh(applicant)
    return applicant

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_applicant(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = write_guards
):
    applicant = db.query(Applicant).filter(Applicant.id == str(id)).first()
    if not applicant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Applicant not found."
        )
        
    db.delete(applicant)
    db.commit()
    return

@router.post("/import", status_code=status.HTTP_201_CREATED)
def import_applicants_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = write_guards
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Please upload a standard CSV file."
        )
    
    try:
        content = file.file.read().decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        
        imported = 0
        skipped = 0
        
        for row in csv_reader:
            email = row.get('email')
            if not email:
                continue
                
            # Check unique email
            existing = db.query(Applicant).filter(Applicant.email == email).first()
            if existing:
                skipped += 1
                continue
                
            db_applicant = Applicant(
                first_name=row.get('first_name', 'Imported'),
                last_name=row.get('last_name', 'Applicant'),
                email=email,
                revolving_utilization=float(row.get('revolving_utilization', 0.0)),
                age=int(row.get('age', 35)),
                number_30_59_days_past_due=int(row.get('number_30_59_days_past_due', 0)),
                debt_ratio=float(row.get('debt_ratio', 0.0)),
                monthly_income=float(row.get('monthly_income', 0.0)),
                number_open_credit_lines=int(row.get('number_open_credit_lines', 0)),
                number_90_days_late=int(row.get('number_90_days_late', 0)),
                number_real_estate_loans=int(row.get('number_real_estate_loans', 0)),
                number_60_89_days_past_due=int(row.get('number_60_89_days_past_due', 0)),
                number_of_dependents=int(row.get('number_of_dependents', 0)),
                created_by=current_user.id
            )
            db.add(db_applicant)
            imported += 1
            
        db.commit()
        return {
            "status": "success",
            "message": f"Successfully imported {imported} applicants. Skipped {skipped} duplicates."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process bulk import CSV: {e}"
        )


