from ..config.db import engine, Base
from ..models import User, Applicant
from ..services.auth_service import AuthService
from sqlalchemy.orm import sessionmaker

SessionLocal = sessionmaker(bind=engine)

def seed_database():
    print("Initiating database table creation...")
    Base.metadata.create_all(bind=engine)
    print("Database tables synchronized successfully.")
    
    db = SessionLocal()
    try:
        # 1. Seed Users if not present
        admin_exists = db.query(User).filter(User.email == "admin@credishield.com").first()
        if not admin_exists:
            print("Seeding default Administrator account...")
            admin_user = User(
                email="admin@credishield.com",
                password_hash=AuthService.get_password_hash("AdminPassword123!"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            
            print("Seeding default Risk Underwriter analyst account...")
            analyst_user = User(
                email="analyst@credishield.com",
                password_hash=AuthService.get_password_hash("AnalystPassword123!"),
                role="risk_analyst",
                is_active=True
            )
            db.add(analyst_user)
            
            print("Seeding default Compliance Auditor account...")
            auditor_user = User(
                email="auditor@credishield.com",
                password_hash=AuthService.get_password_hash("AuditorPassword123!"),
                role="auditor",
                is_active=True
            )
            db.add(auditor_user)
            db.commit()
            print("Database users seeded successfully.")
        else:
            print("Database users already exist. Skipping users seeding.")

        # 2. Seed Default Applicants if not present
        applicant_exists = db.query(Applicant).first()
        if not applicant_exists:
            print("Seeding default applicant profiles for risk testing...")
            
            # Fetch a creator ID
            creator = db.query(User).filter(User.role == "admin").first()
            creator_id = creator.id if creator else None
            
            # Low Risk Profile (Stable metrics)
            low_risk_app = Applicant(
                first_name="John",
                last_name="Doe",
                email="john.doe@gmail.com",
                created_by=creator_id,
                revolving_utilization=0.12,
                age=45,
                number_30_59_days_past_due=0,
                debt_ratio=0.18,
                monthly_income=8500.0,
                number_open_credit_lines=6,
                number_90_days_late=0,
                number_real_estate_loans=1,
                number_60_89_days_past_due=0,
                number_of_dependents=1
            )
            db.add(low_risk_app)

            # Medium Risk Profile (Some utilization and a late payment)
            med_risk_app = Applicant(
                first_name="Jane",
                last_name="Smith",
                email="jane.smith@gmail.com",
                created_by=creator_id,
                revolving_utilization=0.45,
                age=34,
                number_30_59_days_past_due=1,
                debt_ratio=0.32,
                monthly_income=4200.0,
                number_open_credit_lines=5,
                number_90_days_late=0,
                number_real_estate_loans=0,
                number_60_89_days_past_due=0,
                number_of_dependents=2
            )
            db.add(med_risk_app)

            # High Risk Profile (High utilization, severe history of delinquency)
            high_risk_app = Applicant(
                first_name="Bob",
                last_name="Johnson",
                email="bob.johnson@gmail.com",
                created_by=creator_id,
                revolving_utilization=0.95,
                age=28,
                number_30_59_days_past_due=2,
                debt_ratio=0.55,
                monthly_income=2900.0,
                number_open_credit_lines=8,
                number_90_days_late=3,
                number_real_estate_loans=0,
                number_60_89_days_past_due=1,
                number_of_dependents=0
            )
            db.add(high_risk_app)
            
            db.commit()
            print("Database applicant profiles seeded successfully.")
        else:
            print("Applicants already exist in database. Skipping applicants seeding.")
            
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    seed_database()
