from django.urls import path
from . import views

urlpatterns = [
    # Shipments
    path('', views.shipment_list_create, name='shipment_list_create'),
    path('<int:pk>/', views.shipment_detail, name='shipment_detail'),
    path('<int:pk>/tracking-events/', views.shipment_tracking_events, name='shipment_tracking_events'),
    path('track/<str:tracking_id>/', views.public_tracking, name='public_tracking'),
    path('summary/', views.shipment_summary, name='shipment_summary'),
    # Map
    path('map/live/', views.live_tracking_map, name='live_tracking_map'),
    path('map/all/', views.all_shipments_map, name='all_shipments_map'),
    # Drivers
    path('drivers/', views.driver_list_create, name='driver_list_create'),
    path('drivers/<int:pk>/', views.driver_detail, name='driver_detail'),
    # Vehicles
    path('vehicles/', views.vehicle_list_create, name='vehicle_list_create'),
    path('vehicles/<int:pk>/', views.vehicle_detail, name='vehicle_detail'),
    path('vehicles/<int:pk>/maintenance/', views.vehicle_maintenance, name='vehicle_maintenance'),
    # ML
    path('predictions/', views.prediction_list, name='prediction_list'),
    path('anomalies/', views.anomaly_alert_list, name='anomaly_alert_list'),
    path('anomalies/<int:pk>/resolve/', views.anomaly_resolve, name='anomaly_resolve'),
]
