import datetime

from django.conf import settings
from django.db import connection
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(["GET"])
@permission_classes([AllowAny])
def health_check(request):
    """Health check for local run, Docker, and Render."""
    db_ok = True
    db_vendor = "unknown"
    error_msg = None

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1;")
            cursor.fetchone()
        db_vendor = connection.vendor
    except Exception as exc:
        db_ok = False
        error_msg = str(exc)

    http_status = status.HTTP_200_OK if db_ok else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(
        {
            "status": "healthy" if db_ok else "unhealthy",
            "service": "fleetflow-django-backend",
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "database": {
                "connected": db_ok,
                "engine": db_vendor,
                "error": error_msg,
            },
            "environment": "development" if settings.DEBUG else "production",
            "phase": settings.IMPLEMENTATION_PHASE,
            "version": settings.PLATFORM_VERSION,
        },
        status=http_status,
    )


@api_view(["GET"])
@permission_classes([AllowAny])
def system_status(request):
    return Response(
        {
            "platform": "FleetFlow AI - Smart Logistics Management",
            "phase": settings.IMPLEMENTATION_PHASE,
            "version": settings.PLATFORM_VERSION,
            "services": {
                "django_backend": {
                    "role": "Core logistics API, auth, and PostgreSQL (CRUD from Phase 2)",
                    "status": "operational",
                },
                "fastapi_microservice": {
                    "url": settings.FASTAPI_SERVICE_URL,
                    "role": "ML predictions and tracking intelligence",
                    "status": "independent",
                },
            },
            "incomplete": [
                "JWT roles and shipment CRUD (Phase 2)",
                "React product modules (Phase 3+)",
                "Trained Joblib models (Phase 6)",
            ],
        }
    )
