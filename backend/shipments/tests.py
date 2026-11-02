from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from shipments.models import (
    Shipment, ShipmentTrackingEvent, Driver, Vehicle,
    MaintenanceRecord, AnomalyAlert
)

User = get_user_model()


class ShipmentAndFleetTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser('admin', 'admin@fleetflow.io', 'pass123', role='ADMIN')
        self.manager = User.objects.create_user('manager', 'mgr@fleetflow.io', 'pass123', role='MANAGER')
        self.driver_user = User.objects.create_user('driver_bob', 'bob@fleetflow.io', 'pass123', role='DRIVER')
        self.customer = User.objects.create_user('customer_alice', 'alice@fleetflow.io', 'pass123', role='CUSTOMER')

        self.driver = Driver.objects.create(
            user=self.driver_user,
            license_number='DL-998877',
            is_available=True,
            on_time_rate=95.0,
            customer_feedback_score=4.8,
            total_deliveries=120
        )

        self.vehicle = Vehicle.objects.create(
            registration_number='TRK-1001',
            vehicle_type='TRUCK',
            capacity_kg=5000.0,
            fuel_type='Diesel',
            status='AVAILABLE',
            mileage_km=45000.0
        )

    def test_driver_performance_calculation(self):
        # 60% on_time_rate (95.0) + 40% (4.8/5.0 * 100) = 57.0 + 38.4 = 95.4
        self.assertEqual(self.driver.performance_score, 95.4)

    def test_create_shipment_success(self):
        self.client.force_authenticate(user=self.manager)
        payload = {
            'sender_name': 'Acme Corp',
            'sender_address': '100 Industrial Rd, Chicago, IL',
            'receiver_name': 'Apex Retail',
            'receiver_address': '500 Commerce Blvd, Dallas, TX',
            'origin_lat': 41.8781,
            'origin_lng': -87.6298,
            'destination_lat': 32.7767,
            'destination_lng': -96.7970,
            'weight_kg': 1500.0,
            'distance_km': 1480.0,
            'priority': 'HIGH',
            'driver': self.driver.pk,
            'vehicle': self.vehicle.pk,
        }
        res = self.client.post(reverse('shipment_list_create'), payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data['tracking_id'].startswith('FF-'))
        self.assertEqual(res.data['status'], 'PENDING')
        
        # Check automatic tracking event
        shipment = Shipment.objects.get(pk=res.data['id'])
        self.assertEqual(shipment.tracking_events.count(), 1)
        self.assertEqual(shipment.tracking_events.first().status, 'PENDING')

    def test_create_shipment_exceeds_vehicle_capacity(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            'sender_name': 'Heavy Industries',
            'sender_address': 'Factory 1, Chicago',
            'receiver_name': 'Warehouse 2',
            'receiver_address': 'Terminal 5, Dallas',
            'weight_kg': 8000.0,  # Capacity is only 5000kg
            'vehicle': self.vehicle.pk,
        }
        res = self.client.post(reverse('shipment_list_create'), payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('exceeds vehicle capacity', res.data['detail'])

    def test_shipment_status_patch_creates_event(self):
        shipment = Shipment.objects.create(
            sender_name='Tech Supply',
            sender_address='San Jose, CA',
            receiver_name='Retail Hub',
            receiver_address='Seattle, WA',
            driver=self.driver,
            vehicle=self.vehicle,
            created_by=self.manager
        )
        self.client.force_authenticate(user=self.manager)
        res = self.client.patch(
            reverse('shipment_detail', kwargs={'pk': shipment.pk}),
            {'status': 'IN_TRANSIT', 'location': 'Sacramento, CA', 'notes': 'Departed hub'},
            format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        shipment.refresh_from_db()
        self.assertEqual(shipment.status, 'IN_TRANSIT')
        
        # Verify event logged
        events = shipment.tracking_events.all()
        self.assertEqual(events.count(), 1)
        self.assertEqual(events.last().status, 'IN_TRANSIT')
        self.assertEqual(events.last().location, 'Sacramento, CA')

    def test_public_tracking_endpoint(self):
        shipment = Shipment.objects.create(
            sender_name='Alpha Sender',
            sender_address='Boston, MA',
            receiver_name='Beta Receiver',
            receiver_address='New York, NY',
            origin_lat=42.3601,
            origin_lng=-71.0589,
            destination_lat=40.7128,
            destination_lng=-74.0060,
        )
        ShipmentTrackingEvent.objects.create(
            shipment=shipment,
            status='IN_TRANSIT',
            location='Hartford, CT',
            lat=41.7658,
            lng=-72.6734
        )
        
        # Unauthenticated customer lookup
        res = self.client.get(reverse('public_tracking', kwargs={'tracking_id': shipment.tracking_id}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['tracking_id'], shipment.tracking_id)
        self.assertEqual(len(res.data['tracking_events']), 1)

    def test_shipment_summary_kpis(self):
        Shipment.objects.create(sender_name='S1', sender_address='A', receiver_name='R1', receiver_address='B', status='PENDING', delay_risk='LOW')
        Shipment.objects.create(sender_name='S2', sender_address='A', receiver_name='R2', receiver_address='B', status='IN_TRANSIT', delay_risk='HIGH')
        Shipment.objects.create(sender_name='S3', sender_address='A', receiver_name='R3', receiver_address='B', status='DELIVERED', delay_risk='LOW')
        
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(reverse('shipment_summary'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['total'], 3)
        self.assertEqual(res.data['pending'], 1)
        self.assertEqual(res.data['in_transit'], 1)
        self.assertEqual(res.data['delivered'], 1)
        self.assertEqual(res.data['delay_risk']['high'], 1)

    def test_vehicle_maintenance_logging(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            'service_date': '2026-11-01',
            'description': 'Full brake pad replacement and synthetic oil change',
            'cost': 450.0,
            'next_service_date': '2027-05-01'
        }
        res = self.client.post(reverse('vehicle_maintenance', kwargs={'pk': self.vehicle.pk}), payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.vehicle.maintenance_records.count(), 1)

    def test_live_tracking_map_endpoint(self):
        Shipment.objects.create(
            sender_name='S4', sender_address='Denver', receiver_name='R4', receiver_address='Phoenix',
            origin_lat=39.7392, origin_lng=-104.9903, destination_lat=33.4484, destination_lng=-112.0740,
            status='IN_TRANSIT', driver=self.driver, vehicle=self.vehicle
        )
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(reverse('live_tracking_map'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)
        self.assertEqual(res.data[0]['status'], 'IN_TRANSIT')

    def test_anomaly_alert_resolution(self):
        alert = AnomalyAlert.objects.create(
            severity='HIGH',
            description='Route deviation > 30km detected by Isolation Forest',
            is_resolved=False
        )
        self.client.force_authenticate(user=self.admin)
        res = self.client.patch(reverse('anomaly_resolve', kwargs={'pk': alert.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        alert.refresh_from_db()
        self.assertTrue(alert.is_resolved)
        self.assertIsNotNone(alert.resolved_at)
