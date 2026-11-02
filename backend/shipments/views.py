from datetime import datetime, timezone
from django.db.models import Q, Count
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination

from .models import (Shipment, ShipmentTrackingEvent, Driver, Vehicle,
                     MaintenanceRecord, PredictionRecord, AnomalyAlert)
from .serializers import (
    ShipmentListSerializer, ShipmentDetailSerializer, ShipmentCreateSerializer,
    TrackingEventSerializer, DriverSerializer, VehicleSerializer,
    MaintenanceRecordSerializer, PredictionRecordSerializer, AnomalyAlertSerializer
)


# ---------- Pagination ----------
class ShipmentPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# =================== SHIPMENTS ===================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def shipment_list_create(request):
    if request.method == 'GET':
        qs = Shipment.objects.all().order_by('-created_at')
        # Role-based filtering
        if request.user.role == 'DRIVER':
            try:
                qs = qs.filter(driver=request.user.driver_profile)
            except Exception:
                qs = qs.none()
        elif request.user.role == 'CUSTOMER':
            qs = qs.filter(created_by=request.user)
        # Search & filter
        search = request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(tracking_id__icontains=search) |
                Q(sender_name__icontains=search) |
                Q(receiver_name__icontains=search) |
                Q(sender_address__icontains=search) |
                Q(receiver_address__icontains=search)
            )
        status_filter = request.query_params.get('status', '')
        if status_filter:
            qs = qs.filter(status=status_filter)
        priority_filter = request.query_params.get('priority', '')
        if priority_filter:
            qs = qs.filter(priority=priority_filter)
        risk_filter = request.query_params.get('delay_risk', '')
        if risk_filter:
            qs = qs.filter(delay_risk=risk_filter)
        paginator = ShipmentPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ShipmentListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    # POST — create shipment
    if request.user.role not in ['ADMIN', 'MANAGER']:
        return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
    serializer = ShipmentCreateSerializer(data=request.data)
    if serializer.is_valid():
        # Validate capacity
        vehicle_id = request.data.get('vehicle')
        weight = float(request.data.get('weight_kg', 0))
        if vehicle_id:
            try:
                vehicle = Vehicle.objects.get(pk=vehicle_id)
                if vehicle.status == 'IN_TRANSIT':
                    return Response({'detail': 'Vehicle is already in transit.'}, status=400)
                if weight > vehicle.capacity_kg:
                    return Response({'detail': f'Shipment weight ({weight} kg) exceeds vehicle capacity ({vehicle.capacity_kg} kg).'}, status=400)
            except Vehicle.DoesNotExist:
                pass
        driver_id = request.data.get('driver')
        if driver_id:
            try:
                driver = Driver.objects.get(pk=driver_id)
                if not driver.is_available:
                    return Response({'detail': 'Driver is not available.'}, status=400)
            except Driver.DoesNotExist:
                pass
        shipment = serializer.save(created_by=request.user)
        ShipmentTrackingEvent.objects.create(
            shipment=shipment,
            status='PENDING',
            location=shipment.sender_address[:200],
            notes='Shipment created and awaiting assignment.'
        )
        return Response(ShipmentDetailSerializer(shipment).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def shipment_detail(request, pk):
    try:
        shipment = Shipment.objects.get(pk=pk)
    except Shipment.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)

    # Access control
    if request.user.role == 'DRIVER':
        try:
            if shipment.driver != request.user.driver_profile:
                return Response({'detail': 'Forbidden.'}, status=403)
        except Exception:
            return Response({'detail': 'Forbidden.'}, status=403)
    elif request.user.role == 'CUSTOMER':
        if shipment.created_by != request.user:
            return Response({'detail': 'Forbidden.'}, status=403)

    if request.method == 'GET':
        return Response(ShipmentDetailSerializer(shipment).data)

    if request.method == 'PATCH':
        if request.user.role not in ['ADMIN', 'MANAGER', 'DRIVER']:
            return Response({'detail': 'Forbidden.'}, status=403)
        old_status = shipment.status
        new_status = request.data.get('status', old_status)
        for field, value in request.data.items():
            if hasattr(shipment, field):
                setattr(shipment, field, value)
        shipment.save()
        if new_status != old_status:
            ShipmentTrackingEvent.objects.create(
                shipment=shipment,
                status=new_status,
                location=request.data.get('location', ''),
                notes=request.data.get('notes', f'Status updated to {new_status}')
            )
        return Response(ShipmentDetailSerializer(shipment).data)

    if request.method == 'DELETE':
        if request.user.role != 'ADMIN':
            return Response({'detail': 'Only admins can delete shipments.'}, status=403)
        shipment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([AllowAny])
def public_tracking(request, tracking_id):
    try:
        shipment = Shipment.objects.get(tracking_id=tracking_id)
    except Shipment.DoesNotExist:
        return Response({'detail': 'Tracking ID not found.'}, status=404)
    return Response({
        'tracking_id': shipment.tracking_id,
        'status': shipment.status,
        'sender_name': shipment.sender_name,
        'receiver_name': shipment.receiver_name,
        'origin': shipment.sender_address,
        'destination': shipment.receiver_address,
        'origin_lat': shipment.origin_lat,
        'origin_lng': shipment.origin_lng,
        'destination_lat': shipment.destination_lat,
        'destination_lng': shipment.destination_lng,
        'estimated_delivery': shipment.estimated_delivery,
        'actual_delivery': shipment.actual_delivery,
        'tracking_events': TrackingEventSerializer(shipment.tracking_events.all(), many=True).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shipment_summary(request):
    qs = Shipment.objects.all()
    if request.user.role == 'DRIVER':
        try:
            qs = qs.filter(driver=request.user.driver_profile)
        except Exception:
            qs = qs.none()
    elif request.user.role == 'CUSTOMER':
        qs = qs.filter(created_by=request.user)
    total = qs.count()
    status_counts = {item['status']: item['count'] for item in qs.values('status').annotate(count=Count('id'))}
    risk_counts = {item['delay_risk']: item['count'] for item in qs.values('delay_risk').annotate(count=Count('id'))}
    return Response({
        'total': total,
        'pending': status_counts.get('PENDING', 0),
        'assigned': status_counts.get('ASSIGNED', 0),
        'in_transit': status_counts.get('IN_TRANSIT', 0),
        'delivered': status_counts.get('DELIVERED', 0),
        'delayed': status_counts.get('DELAYED', 0),
        'cancelled': status_counts.get('CANCELLED', 0),
        'delay_risk': {
            'low': risk_counts.get('LOW', 0),
            'medium': risk_counts.get('MEDIUM', 0),
            'high': risk_counts.get('HIGH', 0),
        }
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def shipment_tracking_events(request, pk):
    try:
        shipment = Shipment.objects.get(pk=pk)
    except Shipment.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)
    if request.method == 'GET':
        events = shipment.tracking_events.all()
        return Response(TrackingEventSerializer(events, many=True).data)
    if request.user.role not in ['ADMIN', 'MANAGER', 'DRIVER']:
        return Response({'detail': 'Forbidden.'}, status=403)
    serializer = TrackingEventSerializer(data={**request.data, 'shipment': shipment.pk})
    if serializer.is_valid():
        event = serializer.save(shipment=shipment)
        return Response(TrackingEventSerializer(event).data, status=201)
    return Response(serializer.errors, status=400)


# =================== DRIVERS ===================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def driver_list_create(request):
    if request.user.role not in ['ADMIN', 'MANAGER']:
        return Response({'detail': 'Forbidden.'}, status=403)
    if request.method == 'GET':
        drivers = Driver.objects.select_related('user').all()
        return Response(DriverSerializer(drivers, many=True).data)
    # POST: create driver profile for an existing user
    from accounts.models import User
    user_id = request.data.get('user_id')
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response({'detail': 'User not found.'}, status=404)
    if hasattr(user, 'driver_profile'):
        return Response({'detail': 'Driver profile already exists.'}, status=400)
    driver = Driver.objects.create(
        user=user,
        license_number=request.data.get('license_number', f'LIC-{user.pk:06d}'),
        on_time_rate=float(request.data.get('on_time_rate', 90.0)),
        customer_feedback_score=float(request.data.get('customer_feedback_score', 4.5)),
    )
    user.role = 'DRIVER'
    user.save()
    return Response(DriverSerializer(driver).data, status=201)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def driver_detail(request, pk):
    if request.user.role not in ['ADMIN', 'MANAGER']:
        return Response({'detail': 'Forbidden.'}, status=403)
    try:
        driver = Driver.objects.select_related('user').get(pk=pk)
    except Driver.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)
    if request.method == 'GET':
        return Response(DriverSerializer(driver).data)
    for field in ['is_available', 'on_time_rate', 'customer_feedback_score', 'license_number']:
        if field in request.data:
            setattr(driver, field, request.data[field])
    driver.save()
    return Response(DriverSerializer(driver).data)


# =================== VEHICLES ===================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def vehicle_list_create(request):
    if request.user.role not in ['ADMIN', 'MANAGER']:
        return Response({'detail': 'Forbidden.'}, status=403)
    if request.method == 'GET':
        vehicles = Vehicle.objects.all()
        return Response(VehicleSerializer(vehicles, many=True).data)
    serializer = VehicleSerializer(data=request.data)
    if serializer.is_valid():
        vehicle = serializer.save()
        return Response(VehicleSerializer(vehicle).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def vehicle_detail(request, pk):
    if request.user.role not in ['ADMIN', 'MANAGER']:
        return Response({'detail': 'Forbidden.'}, status=403)
    try:
        vehicle = Vehicle.objects.get(pk=pk)
    except Vehicle.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)
    if request.method == 'GET':
        return Response(VehicleSerializer(vehicle).data)
    if request.method == 'PATCH':
        serializer = VehicleSerializer(vehicle, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    if request.method == 'DELETE':
        vehicle.delete()
        return Response(status=204)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def vehicle_maintenance(request, pk):
    if request.user.role not in ['ADMIN', 'MANAGER']:
        return Response({'detail': 'Forbidden.'}, status=403)
    try:
        vehicle = Vehicle.objects.get(pk=pk)
    except Vehicle.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)
    if request.method == 'GET':
        records = vehicle.maintenance_records.all().order_by('-service_date')
        return Response(MaintenanceRecordSerializer(records, many=True).data)
    serializer = MaintenanceRecordSerializer(data={**request.data, 'vehicle': vehicle.pk})
    if serializer.is_valid():
        record = serializer.save(vehicle=vehicle)
        return Response(MaintenanceRecordSerializer(record).data, status=201)
    return Response(serializer.errors, status=400)


# =================== ML / PREDICTIONS ===================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def prediction_list(request):
    qs = PredictionRecord.objects.all().order_by('-created_at')[:50]
    return Response(PredictionRecordSerializer(qs, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def anomaly_alert_list(request):
    qs = AnomalyAlert.objects.all().order_by('-created_at')
    resolved = request.query_params.get('resolved', '')
    if resolved == 'false':
        qs = qs.filter(is_resolved=False)
    elif resolved == 'true':
        qs = qs.filter(is_resolved=True)
    return Response(AnomalyAlertSerializer(qs, many=True).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def anomaly_resolve(request, pk):
    try:
        alert = AnomalyAlert.objects.get(pk=pk)
    except AnomalyAlert.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=404)
    alert.is_resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    alert.save()
    return Response(AnomalyAlertSerializer(alert).data)


# =================== LIVE TRACKING MAP ===================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def live_tracking_map(request):
    """Returns all active shipments with coordinates for map display."""
    qs = Shipment.objects.filter(status='IN_TRANSIT').exclude(
        origin_lat=None, origin_lng=None, destination_lat=None, destination_lng=None
    ).select_related('driver__user', 'vehicle')
    result = []
    for s in qs:
        last_event = s.tracking_events.last()
        result.append({
            'id': s.pk,
            'tracking_id': s.tracking_id,
            'status': s.status,
            'delay_risk': s.delay_risk,
            'origin_lat': s.origin_lat,
            'origin_lng': s.origin_lng,
            'destination_lat': s.destination_lat,
            'destination_lng': s.destination_lng,
            'current_lat': last_event.lat if last_event and last_event.lat else s.origin_lat,
            'current_lng': last_event.lng if last_event and last_event.lng else s.origin_lng,
            'sender_name': s.sender_name,
            'receiver_name': s.receiver_name,
            'driver_name': s.driver.user.get_full_name() if s.driver else None,
            'vehicle_reg': s.vehicle.registration_number if s.vehicle else None,
            'last_update': last_event.timestamp.isoformat() if last_event else None,
        })
    return Response(result)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_shipments_map(request):
    """Returns all shipments with coordinates for full map view."""
    qs = Shipment.objects.exclude(
        origin_lat=None, origin_lng=None
    ).select_related('driver__user', 'vehicle').order_by('-created_at')[:200]
    result = []
    for s in qs:
        last_event = s.tracking_events.last()
        result.append({
            'id': s.pk,
            'tracking_id': s.tracking_id,
            'status': s.status,
            'delay_risk': s.delay_risk,
            'origin_lat': s.origin_lat,
            'origin_lng': s.origin_lng,
            'destination_lat': s.destination_lat,
            'destination_lng': s.destination_lng,
            'current_lat': last_event.lat if last_event and last_event.lat else s.origin_lat,
            'current_lng': last_event.lng if last_event and last_event.lng else s.origin_lng,
            'sender_name': s.sender_name,
            'receiver_name': s.receiver_name,
            'driver_name': s.driver.user.get_full_name() if s.driver else None,
            'vehicle_reg': s.vehicle.registration_number if s.vehicle else None,
            'estimated_delivery': s.estimated_delivery.isoformat() if s.estimated_delivery else None,
            'last_update': last_event.timestamp.isoformat() if last_event else None,
        })
    return Response(result)
