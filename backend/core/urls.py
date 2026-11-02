from django.urls import path

from .views import health_check, system_status

urlpatterns = [
    path("health/", health_check, name="health_check"),
    path("status/", system_status, name="system_status"),
]
