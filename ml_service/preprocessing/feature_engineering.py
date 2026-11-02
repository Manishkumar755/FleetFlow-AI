"""
FleetFlow AI - Feature Engineering Pipeline
"""
import numpy as np
import pandas as pd

VEHICLE_TYPES = ['BIKE', 'VAN', 'TRUCK', 'HEAVY_TRAILER']
TRAFFIC_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'SEVERE']
WEATHER_CONDITIONS = ['CLEAR', 'RAIN', 'FOG', 'SNOW', 'STORM']


def encode_categorical(val, categories):
    try:
        return categories.index(str(val).upper())
    except ValueError:
        return 0


def build_delay_features(data: dict) -> np.ndarray:
    """Build feature vector for delay prediction."""
    return np.array([[
        float(data.get('distance_km', 500)),
        encode_categorical(data.get('vehicle_type', 'TRUCK'), VEHICLE_TYPES),
        encode_categorical(data.get('traffic_level', 'MEDIUM'), TRAFFIC_LEVELS),
        encode_categorical(data.get('weather_condition', 'CLEAR'), WEATHER_CONDITIONS),
        int(data.get('day_of_week', 1)),
        int(data.get('dispatch_hour', 10)),
        float(data.get('driver_rating', 4.0)),
        float(data.get('weight_kg', 500)),
        float(data.get('historical_avg_hours', 10)),
    ]])


def build_eta_features(data: dict) -> np.ndarray:
    """Build feature vector for ETA regression."""
    return np.array([[
        float(data.get('distance_km', 500)),
        encode_categorical(data.get('vehicle_type', 'TRUCK'), VEHICLE_TYPES),
        encode_categorical(data.get('traffic_level', 'MEDIUM'), TRAFFIC_LEVELS),
        encode_categorical(data.get('weather_condition', 'CLEAR'), WEATHER_CONDITIONS),
        int(data.get('day_of_week', 1)),
        int(data.get('dispatch_hour', 10)),
    ]])


def build_anomaly_features(data: dict) -> np.ndarray:
    """Build feature vector for anomaly detection."""
    expected = float(data.get('expected_duration_hours', 10))
    actual = float(data.get('actual_duration_hours', 10))
    ratio = actual / max(0.1, expected)
    return np.array([[
        float(data.get('distance_km', 500)),
        actual,
        expected,
        ratio,
        float(data.get('route_deviation_km', 0)),
        int(data.get('status_updates_count', 3)),
        encode_categorical(data.get('traffic_level', 'MEDIUM'), TRAFFIC_LEVELS),
    ]])
