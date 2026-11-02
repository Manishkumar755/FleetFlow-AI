import pytest
import sys
from pathlib import Path
from datetime import datetime, timezone
import joblib

# Add ml_service root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import app, DELAY_MODEL_PATH, ETA_MODEL_PATH, ANOMALY_MODEL_PATH
from api.routes import get_health, get_model_metrics, predict_delay, predict_eta, detect_anomaly
from schemas.prediction_schemas import (
    DelayPredictionRequest,
    ETAPredictionRequest,
    AnomalyDetectionRequest,
)

# Initialize models into app.state
models = {}
for key, path in [('delay', DELAY_MODEL_PATH), ('eta', ETA_MODEL_PATH), ('anomaly', ANOMALY_MODEL_PATH)]:
    if path.exists():
        models[key] = joblib.load(path)
app.state.models = models


class MockRequest:
    def __init__(self, current_app):
        self.app = current_app


mock_req = MockRequest(app)


def test_health_endpoint():
    res = get_health(mock_req)
    assert res.status == "healthy"
    assert res.service == "fleetflow-fastapi-ml-service"
    assert res.phase == 7
    assert res.models_loaded["delay_model"] is True
    assert res.models_loaded["eta_model"] is True
    assert res.models_loaded["anomaly_model"] is True


def test_model_metrics_endpoint():
    res = get_model_metrics(mock_req)
    assert res.status == "operational"
    assert "delay_classifier" in res.models
    assert "eta_regressor" in res.models
    assert "anomaly_detector" in res.models
    assert res.models["delay_classifier"]["accuracy"] > 0.90
    assert res.models["eta_regressor"]["r2_score"] > 0.90


def test_predict_delay_success():
    req_data = DelayPredictionRequest(
        distance_km=250.5,
        historical_avg_hours=4.5,
        traffic_level="HIGH",
        weather_condition="RAIN",
        day_of_week=4,
        dispatch_hour=14,
        vehicle_type="TRUCK",
        driver_rating=4.8
    )
    res = predict_delay(req_data, mock_req)
    assert 0.0 <= res.delay_probability <= 1.0
    assert res.risk_level in ["LOW", "MEDIUM", "HIGH"]
    assert isinstance(res.contributing_factors, list)
    assert res.synthetic is False


def test_predict_delay_validation_failure():
    with pytest.raises(Exception):
        DelayPredictionRequest(
            distance_km=-50.0,
            historical_avg_hours=3.0,
            day_of_week=9,
            dispatch_hour=35
        )


def test_predict_eta_success():
    req_data = ETAPredictionRequest(
        distance_km=180.0,
        vehicle_type="TRUCK",
        traffic_level="LOW",
        weather_condition="CLEAR",
        day_of_week=1,
        dispatch_hour=8
    )
    res = predict_eta(req_data, mock_req)
    assert res.estimated_hours > 0
    assert res.error_margin_hours > 0
    assert "min_hours" in res.confidence_interval
    assert res.synthetic is False


def test_detect_anomaly_flagged():
    req_data = AnomalyDetectionRequest(
        shipment_id="SHP-TEST-001",
        distance_km=100.0,
        actual_duration_hours=6.5,
        expected_duration_hours=2.0,
        route_deviation_km=28.5,
        status_updates_count=0,
        traffic_level="LOW"
    )
    res = detect_anomaly(req_data, mock_req)
    assert res.is_anomaly is True
    assert res.severity in ["MEDIUM", "HIGH"]
    assert len(res.triggered_rules) >= 1
