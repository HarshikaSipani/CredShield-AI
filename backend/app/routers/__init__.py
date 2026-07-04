from .auth import router as auth_router
from .applicants import router as applicants_router
from .predictions import router as predictions_router
from .reports import router as reports_router
from .analytics import router as analytics_router
from .admin import router as admin_router

__all__ = [
    "auth_router",
    "applicants_router",
    "predictions_router",
    "reports_router",
    "analytics_router",
    "admin_router"
]
