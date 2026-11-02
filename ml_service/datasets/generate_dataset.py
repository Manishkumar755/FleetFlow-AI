"""
FleetFlow AI - Phase 6 Synthetic Dataset Generator
Generates realistic logistics shipment data for ML training.
"""
import random
import numpy as np
import pandas as pd
from pathlib import Path

random.seed(42)
np.random.seed(42)

DATASET_DIR = Path(__file__).resolve().parent

VEHICLE_TYPES = ['BIKE', 'VAN', 'TRUCK', 'HEAVY_TRAILER']
TRAFFIC_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'SEVERE']
WEATHER_CONDITIONS = ['CLEAR', 'RAIN', 'FOG', 'SNOW', 'STORM']
DAYS_OF_WEEK = list(range(7))  # 0=Monday ... 6=Sunday


def encode_categorical(val, categories):
    return categories.index(val) if val in categories else 0


def generate_record(i):
    vehicle_type = random.choice(VEHICLE_TYPES)
    traffic_level = random.choice(TRAFFIC_LEVELS)
    weather_condition = random.choices(
        WEATHER_CONDITIONS, weights=[0.55, 0.20, 0.12, 0.08, 0.05]
    )[0]
    day_of_week = random.randint(0, 6)
    dispatch_hour = random.randint(5, 22)
    distance_km = round(random.uniform(50, 2500), 1)
    driver_rating = round(random.uniform(2.5, 5.0), 1)
    weight_kg = round(random.uniform(10, 15000), 1)

    # Compute base speed
    speed_map = {'BIKE': 25, 'VAN': 55, 'TRUCK': 48, 'HEAVY_TRAILER': 42}
    base_speed = speed_map[vehicle_type]

    traffic_mult = {'LOW': 0.9, 'MEDIUM': 1.05, 'HIGH': 1.4, 'SEVERE': 1.8}[traffic_level]
    weather_mult = {'CLEAR': 1.0, 'RAIN': 1.15, 'FOG': 1.25, 'SNOW': 1.4, 'STORM': 1.65}[weather_condition]
    driver_factor = max(0.9, 1.1 - (driver_rating - 2.5) * 0.05)
    weight_factor = 1.0 + (weight_kg / 20000) * 0.2
    peak_hour_factor = 1.2 if dispatch_hour in [8, 9, 17, 18, 19] else 1.0
    weekend_factor = 0.9 if day_of_week in [5, 6] else 1.0

    historical_avg = round((distance_km / base_speed) * 1.25, 2)
    expected_hours = historical_avg

    actual_hours = max(
        0.5,
        (distance_km / base_speed) * traffic_mult * weather_mult * driver_factor * weight_factor * peak_hour_factor * weekend_factor + float(np.random.normal(0, 0.3))
    )

    # Delay: actual delivery time > 125% of scheduled historical average (occurs in ~20-25% adverse cases)
    delay_threshold = historical_avg * 1.25
    is_delayed = int(actual_hours > delay_threshold)

    # Anomaly features
    route_deviation_km = max(0, np.random.exponential(5))
    if random.random() < 0.05:
        route_deviation_km += random.uniform(20, 80)
    status_updates = random.randint(1, 12)
    if random.random() < 0.03:
        status_updates = 0

    is_anomaly = int(
        (actual_hours > expected_hours * 1.8) or
        (route_deviation_km > 15) or
        (status_updates == 0)
    )

    return {
        'id': i,
        'distance_km': distance_km,
        'vehicle_type': vehicle_type,
        'vehicle_type_enc': encode_categorical(vehicle_type, VEHICLE_TYPES),
        'traffic_level': traffic_level,
        'traffic_level_enc': encode_categorical(traffic_level, TRAFFIC_LEVELS),
        'weather_condition': weather_condition,
        'weather_condition_enc': encode_categorical(weather_condition, WEATHER_CONDITIONS),
        'day_of_week': day_of_week,
        'dispatch_hour': dispatch_hour,
        'driver_rating': driver_rating,
        'weight_kg': weight_kg,
        'historical_avg_hours': historical_avg,
        'expected_duration_hours': round(expected_hours, 3),
        'actual_duration_hours': round(actual_hours, 3),
        'route_deviation_km': round(route_deviation_km, 2),
        'status_updates_count': status_updates,
        'is_delayed': is_delayed,
        'is_anomaly': is_anomaly,
    }


def generate_dataset(n=12000):
    records = [generate_record(i) for i in range(n)]
    df = pd.DataFrame(records)
    output_path = DATASET_DIR / 'logistics_dataset.csv'
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} records -> {output_path}")
    print(f"Delay rate: {df['is_delayed'].mean():.1%}")
    print(f"Anomaly rate: {df['is_anomaly'].mean():.1%}")
    return df


if __name__ == '__main__':
    generate_dataset()
