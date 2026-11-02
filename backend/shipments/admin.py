from django.contrib import admin
from .models import Shipment


@admin.register(Shipment)
class ShipmentAdmin(admin.ModelAdmin):
    list_display = ("id", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("id",)
    date_hierarchy = "created_at"
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")
    list_per_page = 25
    list_select_related = True
    actions = ["mark_delivered"]

    @admin.action(description="Mark selected shipments as Delivered")
    def mark_delivered(self, request, queryset):
        updated = queryset.update(status="delivered")
        self.message_user(request, f"{updated} shipment(s) updated.")
