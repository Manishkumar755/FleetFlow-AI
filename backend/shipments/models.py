import uuid
from datetime import datetime
from django.db import models
from django.conf import settings


def generate_tracking_id():
    now = datetime.now()
    return f"FF-{now.strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"


class Vehicle(models.Model):
    VEHICLE_TYPES = [
        ('BIKE', 'Bike'),
        ('VAN', 'Van'),
        ('TRUCK', 'Truck'),
        ('HEAVY_TRAILER', 'Heavy Trailer'),
    ]
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('IN_TRANSIT', 'In Transit'),
        ('MAINTENANCE', 'Maintenance'),
        ('RETIRED', 'Retired'),
    ]
    registration_number = models.CharField(max_length=50, unique=True)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_TYPES, default='TRUCK')
    capacity_kg = models.FloatField(default=1000.0)
    fuel_type = models.CharField(max_length=30, default='Diesel')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    mileage_km = models.FloatField(default=0.0)
    model_name = models.CharField(max_length=100, blank=True)
    year = models.IntegerField(default=2020)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.registration_number} ({self.vehicle_type})"


class Driver(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='driver_profile')
    license_number = models.CharField(max_length=50, unique=True)
    is_available = models.BooleanField(default=True)
    on_time_rate = models.FloatField(default=90.0)  # percentage
    customer_feedback_score = models.FloatField(default=4.5)  # out of 5
    total_deliveries = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def performance_score(self):
        return round(0.6 * self.on_time_rate + 0.4 * (self.customer_feedback_score / 5.0) * 100, 1)

    def __str__(self):
        return f"Driver: {self.user.get_full_name() or self.user.username}"


class MaintenanceRecord(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenance_records')
    service_date = models.DateField()
    description = models.TextField()
    cost = models.FloatField(default=0.0)
    next_service_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Maintenance {self.vehicle} on {self.service_date}"


class Shipment(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('ASSIGNED', 'Assigned'),
        ('IN_TRANSIT', 'In Transit'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
        ('DELAYED', 'Delayed'),
    ]
    tracking_id = models.CharField(max_length=30, unique=True, default=generate_tracking_id)
    sender_name = models.CharField(max_length=200)
    sender_address = models.TextField()
    receiver_name = models.CharField(max_length=200)
    receiver_address = models.TextField()
    # Coordinates
    origin_lat = models.FloatField(null=True, blank=True)
    origin_lng = models.FloatField(null=True, blank=True)
    destination_lat = models.FloatField(null=True, blank=True)
    destination_lng = models.FloatField(null=True, blank=True)
    # Logistics
    weight_kg = models.FloatField(default=10.0)
    distance_km = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    priority = models.CharField(max_length=20, choices=[('LOW','Low'),('NORMAL','Normal'),('HIGH','High'),('URGENT','Urgent')], default='NORMAL')
    # Relations
    driver = models.ForeignKey(Driver, null=True, blank=True, on_delete=models.SET_NULL, related_name='shipments')
    vehicle = models.ForeignKey(Vehicle, null=True, blank=True, on_delete=models.SET_NULL, related_name='shipments')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_shipments')
    # ML fields
    delay_risk = models.CharField(max_length=10, choices=[('LOW','Low'),('MEDIUM','Medium'),('HIGH','High')], default='LOW')
    delay_probability = models.FloatField(null=True, blank=True)
    estimated_delivery = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    # Notes
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tracking_id} — {self.status}"


class ShipmentTrackingEvent(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='tracking_events')
    status = models.CharField(max_length=20)
    location = models.CharField(max_length=300, blank=True)
    lat = models.FloatField(null=True, blank=True)
    lng = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.shipment.tracking_id} — {self.status} at {self.timestamp}"


class PredictionRecord(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='predictions', null=True, blank=True)
    prediction_type = models.CharField(max_length=50)
    input_data = models.JSONField(default=dict)
    result = models.JSONField(default=dict)
    model_version = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AnomalyAlert(models.Model):
    SEVERITY_CHOICES = [('LOW','Low'),('MEDIUM','Medium'),('HIGH','High'),('CRITICAL','Critical')]
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='anomalies', null=True, blank=True)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='LOW')
    description = models.TextField()
    is_resolved = models.BooleanField(default=False)
    resolved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
