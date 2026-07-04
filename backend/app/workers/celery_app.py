from celery import Celery
from ..config.settings import settings

# Initialize Celery app
celery_worker = Celery(
    "credishield_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Auto-discover tasks in the project
celery_worker.autodiscover_tasks(['app.workers'])

@celery_worker.task(name="test_celery_connection")
def test_connection():
    print("Celery worker successfully received background queue task!")
    return "success"
