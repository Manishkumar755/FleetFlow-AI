import random
from datetime import datetime, timedelta, timezone
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from shipments.models import Vehicle, Driver, Shipment, ShipmentTrackingEvent

User = get_user_model()

CITIES = [
    ('Mumbai', 19.0760, 72.8777),
    ('Delhi', 28.6139, 77.2090),
    ('Bangalore', 12.9716, 77.5946),
    ('Chennai', 13.0827, 80.2707),
    ('Hyderabad', 17.3850, 78.4867),
    ('Kolkata', 22.5726, 88.3639),
    ('Pune', 18.5204, 73.8567),
    ('Ahmedabad', 23.0225, 72.5714),
    ('Jaipur', 26.9124, 75.7873),
    ('Surat', 21.1702, 72.8311),
]

class Command(BaseCommand):
    help = 'Seed FleetFlow AI with realistic demo data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding FleetFlow AI demo data...')

        # Users
        admin, _ = User.objects.get_or_create(username='admin', defaults={
            'email': 'admin@fleetflow.ai', 'role': 'ADMIN',
            'first_name': 'Admin', 'last_name': 'FleetFlow', 'is_staff': True, 'is_superuser': True
        })
        admin.set_password('Admin@123')
        admin.save()

        manager, _ = User.objects.get_or_create(username='manager', defaults={
            'email': 'manager@fleetflow.ai', 'role': 'MANAGER',
            'first_name': 'Sarah', 'last_name': 'Johnson'
        })
        manager.set_password('Manager@123')
        manager.save()

        driver_users = []
        for i, (name, fname, lname) in enumerate([
            ('driver1', 'Ravi', 'Kumar'),
            ('driver2', 'Priya', 'Sharma'),
            ('driver3', 'Arjun', 'Singh'),
        ]):
            u, _ = User.objects.get_or_create(username=name, defaults={
                'email': f'{name}@fleetflow.ai', 'role': 'DRIVER',
                'first_name': fname, 'last_name': lname
            })
            u.set_password('Driver@123')
            u.save()
            driver_users.append(u)

        customer, _ = User.objects.get_or_create(username='customer', defaults={
            'email': 'customer@fleetflow.ai', 'role': 'CUSTOMER',
            'first_name': 'Alex', 'last_name': 'Customer'
        })
        customer.set_password('Customer@123')
        customer.save()

        # Vehicles
        vehicle_data = [
            ('MH-01-AB-1234', 'TRUCK', 5000, 'Diesel', 'Tata Prima', 2021),
            ('DL-02-CD-5678', 'VAN', 1500, 'Petrol', 'Toyota HiAce', 2022),
            ('KA-03-EF-9012', 'HEAVY_TRAILER', 20000, 'Diesel', 'Ashok Leyland', 2020),
            ('TN-04-GH-3456', 'TRUCK', 8000, 'Diesel', 'Mahindra Blazo', 2023),
            ('GJ-05-IJ-7890', 'VAN', 2000, 'CNG', 'Force Traveller', 2022),
        ]
        vehicles = []
        for reg, vtype, cap, fuel, model, year in vehicle_data:
            v, _ = Vehicle.objects.get_or_create(registration_number=reg, defaults={
                'vehicle_type': vtype, 'capacity_kg': cap, 'fuel_type': fuel,
                'model_name': model, 'year': year, 'mileage_km': random.uniform(10000, 80000)
            })
            vehicles.append(v)

        # Drivers
        drivers = []
        for i, user in enumerate(driver_users):
            d, _ = Driver.objects.get_or_create(user=user, defaults={
                'license_number': f'DL-{2020+i}-{1000+i*111:04d}',
                'on_time_rate': random.uniform(75, 98),
                'customer_feedback_score': round(random.uniform(3.8, 5.0), 1),
                'total_deliveries': random.randint(50, 300),
            })
            drivers.append(d)

        # Shipments
        statuses = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED', 'CANCELLED']
        status_weights = [0.15, 0.15, 0.30, 0.25, 0.10, 0.05]
        priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
        risk_levels = ['LOW', 'MEDIUM', 'HIGH']

        for i in range(25):
            origin_city = random.choice(CITIES)
            dest_city = random.choice([c for c in CITIES if c != origin_city])
            st = random.choices(statuses, weights=status_weights)[0]
            driver = random.choice(drivers + [None, None])
            vehicle = random.choice(vehicles + [None])
            distance = random.uniform(200, 1800)
            created_dt = datetime.now(timezone.utc) - timedelta(days=random.randint(0, 30))
            est_delivery = created_dt + timedelta(hours=distance / 50)

            if Shipment.objects.count() >= 25:
                break

            s = Shipment.objects.create(
                sender_name=f'Company {chr(65+i)}',
                sender_address=f'{origin_city[0]}, India',
                receiver_name=f'Receiver {chr(90-i)}',
                receiver_address=f'{dest_city[0]}, India',
                origin_lat=origin_city[1] + random.uniform(-0.05, 0.05),
                origin_lng=origin_city[2] + random.uniform(-0.05, 0.05),
                destination_lat=dest_city[1] + random.uniform(-0.05, 0.05),
                destination_lng=dest_city[2] + random.uniform(-0.05, 0.05),
                weight_kg=random.uniform(50, 4000),
                distance_km=round(distance, 1),
                status=st,
                priority=random.choice(priorities),
                driver=driver,
                vehicle=vehicle,
                created_by=manager,
                delay_risk=random.choice(risk_levels),
                delay_probability=round(random.uniform(0.05, 0.85), 2),
                estimated_delivery=est_delivery,
                notes=f'Demo shipment #{i+1}',
            )
            # Add tracking events
            ShipmentTrackingEvent.objects.create(
                shipment=s, status='PENDING',
                location=origin_city[0],
                lat=origin_city[1], lng=origin_city[2],
                notes='Shipment created.'
            )
            if st in ['ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED']:
                ShipmentTrackingEvent.objects.create(
                    shipment=s, status='ASSIGNED',
                    location=origin_city[0],
                    lat=origin_city[1], lng=origin_city[2],
                    notes='Driver and vehicle assigned.'
                )
            if st in ['IN_TRANSIT', 'DELIVERED', 'DELAYED']:
                mid_lat = (origin_city[1] + dest_city[1]) / 2
                mid_lng = (origin_city[2] + dest_city[2]) / 2
                ShipmentTrackingEvent.objects.create(
                    shipment=s, status='IN_TRANSIT',
                    location='En route',
                    lat=mid_lat, lng=mid_lng,
                    notes='Shipment picked up and in transit.'
                )
            if st == 'DELIVERED':
                ShipmentTrackingEvent.objects.create(
                    shipment=s, status='DELIVERED',
                    location=dest_city[0],
                    lat=dest_city[1], lng=dest_city[2],
                    notes='Delivered successfully.'
                )

        self.stdout.write(self.style.SUCCESS(
            f'Seeded: {User.objects.count()} users, {Vehicle.objects.count()} vehicles, '
            f'{Driver.objects.count()} drivers, {Shipment.objects.count()} shipments.'
        ))
        self.stdout.write('Demo accounts:')
        self.stdout.write('  Admin:    admin / Admin@123')
        self.stdout.write('  Manager:  manager / Manager@123')
        self.stdout.write('  Driver:   driver1 / Driver@123')
        self.stdout.write('  Customer: customer / Customer@123')
