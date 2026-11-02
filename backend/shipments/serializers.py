from rest_framework import serializers
from .models import Shipment, ShipmentTrackingEvent, Driver, Vehicle, MaintenanceRecord, PredictionRecord, AnomalyAlert
from accounts.serializers import UserSerializer


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = '__all__'


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRecord
        fields = '__all__'


class DriverSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    performance_score = serializers.ReadOnlyField()
    
    class Meta:
        model = Driver
        fields = '__all__'


class TrackingEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentTrackingEvent
        fields = '__all__'


class ShipmentListSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()
    vehicle_reg = serializers.SerializerMethodField()

    class Meta:
        model = Shipment
        fields = ['id', 'tracking_id', 'sender_name', 'receiver_name', 'sender_address',
                  'receiver_address', 'status', 'priority', 'weight_kg', 'distance_km',
                  'delay_risk', 'delay_probability', 'driver_name', 'vehicle_reg',
                  'estimated_delivery', 'created_at', 'updated_at']

    def get_driver_name(self, obj):
        if obj.driver:
            return obj.driver.user.get_full_name() or obj.driver.user.username
        return None

    def get_vehicle_reg(self, obj):
        return obj.vehicle.registration_number if obj.vehicle else None


class ShipmentDetailSerializer(serializers.ModelSerializer):
    tracking_events = TrackingEventSerializer(many=True, read_only=True)
    driver = DriverSerializer(read_only=True)
    vehicle = VehicleSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Shipment
        fields = '__all__'


class ShipmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = ['sender_name', 'sender_address', 'receiver_name', 'receiver_address',
                  'origin_lat', 'origin_lng', 'destination_lat', 'destination_lng',
                  'weight_kg', 'distance_km', 'priority', 'driver', 'vehicle', 'notes',
                  'estimated_delivery']


class PredictionRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PredictionRecord
        fields = '__all__'


class AnomalyAlertSerializer(serializers.ModelSerializer):
    shipment_tracking_id = serializers.SerializerMethodField()

    class Meta:
        model = AnomalyAlert
        fields = '__all__'

    def get_shipment_tracking_id(self, obj):
        return obj.shipment.tracking_id if obj.shipment else None
