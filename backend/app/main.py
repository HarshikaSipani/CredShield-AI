import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config.settings import settings
from .config.init_db import seed_database
from .routers import auth, applicants, predictions, reports, analytics, admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Enterprise Credit Risk Scoring SaaS API Engine",
    version="1.0.0",
    docs_url=f"{settings.API_V1_STR}/docs",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Vite dev server
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Folder to serve compiled PDF audit reports
REPORTS_DIR = os.path.join(os.path.dirname(__file__), "static_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)
app.mount("/static_reports", StaticFiles(directory=REPORTS_DIR), name="static_reports")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(applicants.router, prefix=settings.API_V1_STR)
app.include_router(predictions.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    # Synchronize database tables and seed initial user credentials on start
    seed_database()

@app.get("/")
def read_root():
    return {"message": f"Welcome to the {settings.PROJECT_NAME} API Engine. Navigate to {settings.API_V1_STR}/docs for Swagger documentation."}
