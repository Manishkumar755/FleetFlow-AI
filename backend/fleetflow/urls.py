from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

admin.site.site_header = "FleetFlow-AI Admin"
admin.site.site_title = "FleetFlow-AI"
admin.site.index_title = "Fleet Management"


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("", health),
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    path("api/auth/", include("accounts.urls")),
    path("api/shipments/", include("shipments.urls")),
]
