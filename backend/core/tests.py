from unittest.mock import patch

from django.conf import settings
from django.db.utils import OperationalError
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase


class HealthCheckTests(APITestCase):
    def test_health_check_ok(self):
        response = self.client.get(reverse("health_check"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "healthy")
        self.assertEqual(response.data["service"], "fleetflow-django-backend")
        self.assertTrue(response.data["database"]["connected"])
        self.assertEqual(response.data["phase"], settings.IMPLEMENTATION_PHASE)

    def test_health_check_database_failure(self):
        with patch("core.views.connection.cursor") as cursor_ctx:
            cursor_ctx.side_effect = OperationalError("database unavailable")
            response = self.client.get(reverse("health_check"))
        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.data["status"], "unhealthy")
        self.assertFalse(response.data["database"]["connected"])

    def test_system_status(self):
        response = self.client.get(reverse("system_status"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["phase"], settings.IMPLEMENTATION_PHASE)
        self.assertIn("django_backend", response.data["services"])
        self.assertIn("fastapi_microservice", response.data["services"])
