from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
from pathlib import Path
import numpy as np
from schemas.prediction_schemas import (
    HealthCheckResponse,
    DelayPredictionRequest,
    DelayPredictionResponse,
    ETAPredictionRequest,
    ETAPredictionResponse,
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
    ModelMetricsResponse,
)
from config import settings
from api.routing import RouteCompareRequest, RouteCompareResponse, compare_routes_engine
from preprocessing.feature_engineering import build_delay_features, build_eta_features, build_anomaly_features
from evaluation.evaluate_models import load_metrics

router = APIRouter()

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"
DELAY_MODEL_PATH = ARTIFACTS_DIR / "delay_model.joblib"
ETA_MODEL_PATH = ARTIFACTS_DIR / "eta_model.joblib"
ANOMALY_MODEL_PATH = ARTIFACTS_DIR / "anomaly_model.joblib"


def get_models(request: Request):
    return getattr(request.app.state, 'models', {})


@router.post("/routing/compare-routes", response_model=RouteCompareResponse)
async def compare_routes_endpoint(payload: RouteCompareRequest):
    return await compare_routes_engine(payload)


@router.get("/health", response_model=HealthCheckResponse)
def get_health(request: Request):
    models = get_models(request)
    models_status = {
        "delay_model": "delay" in models,
        "eta_model": "eta" in models,
        "anomaly_model": "anomaly" in models,
    }
    return HealthCheckResponse(
        status="healthy",
        service="fleetflow-fastapi-ml-service",
        timestamp=datetime.now(timezone.utc),
        version="1.0.0-phase7",
        environment=settings.ENVIRONMENT,
        phase=7,
        models_loaded=models_status,
    )


@router.get("/ml/model-metrics", response_model=ModelMetricsResponse)
def get_model_metrics(request: Request):
    models = get_models(request)
    try:
        trained_metrics = load_metrics()
    except Exception:
        trained_metrics = {}

    delay_m = trained_metrics.get('delay_classifier', {})
    eta_m = trained_metrics.get('eta_regressor', {})
    anomaly_m = trained_metrics.get('anomaly_detector', {})

    return ModelMetricsResponse(
        status="operational",
        phase=7,
        models={
            "delay_classifier": {
                "algorithm": delay_m.get('algorithm', 'VotingClassifier(RandomForest + GradientBoosting)'),
                "accuracy": delay_m.get('accuracy'),
                "f1_score": delay_m.get('f1_score'),
                "precision": delay_m.get('precision'),
                "recall": delay_m.get('recall'),
                "roc_auc": delay_m.get('roc_auc'),
                "status": "ready" if "delay" in models else "baseline_heuristic",
                "train_samples": delay_m.get('train_samples'),
            },
            "eta_regressor": {
                "algorithm": eta_m.get('algorithm', 'HistGradientBoostingRegressor'),
                "mae_hours": eta_m.get('mae_hours'),
                "rmse_hours": eta_m.get('rmse_hours'),
                "r2_score": eta_m.get('r2_score'),
                "status": "ready" if "eta" in models else "baseline_heuristic",
                "train_samples": eta_m.get('train_samples'),
            },
            "anomaly_detector": {
                "algorithm": anomaly_m.get('algorithm', 'IsolationForest'),
                "contamination": anomaly_m.get('contamination'),
                "f1_score": anomaly_m.get('f1_score'),
                "accuracy": anomaly_m.get('accuracy'),
                "status": "ready" if "anomaly" in models else "baseline_heuristic",
                "train_samples": anomaly_m.get('train_samples'),
            }
        },
        last_trained=datetime.now(timezone.utc).isoformat() if DELAY_MODEL_PATH.exists() else None,
        note="Phase 7: Real trained models active." if models else "No trained models loaded — using heuristic baselines."
    )


@router.post("/ml/predict-delay", response_model=DelayPredictionResponse)
def predict_delay(payload: DelayPredictionRequest, request: Request):
    models = get_models(request)
    synthetic = False

    if "delay" in models:
        try:
            artifact = models["delay"]
            pipeline = artifact["pipeline"]
            features = build_delay_features(payload.model_dump())
            prob = float(pipeline.predict_proba(features)[0][1])
            is_delayed = prob >= 0.50
            synthetic = False
        except Exception:
            prob, is_delayed, synthetic = _heuristic_delay(payload)
    else:
        prob, is_delayed, synthetic = _heuristic_delay(payload)
        synthetic = True

    risk_level = "HIGH" if prob >= 0.60 else ("MEDIUM" if prob >= 0.35 else "LOW")
    factors = []
    if payload.traffic_level.upper() in ["HIGH", "SEVERE"]:
        factors.append({"factor": "Traffic Congestion", "impact": "High"})
    if payload.weather_condition.upper() in ["STORM", "SNOW", "RAIN"]:
        factors.append({"factor": "Adverse Weather", "impact": "Moderate to High"})
    if payload.driver_rating < 3.5:
        factors.append({"factor": "Driver Experience Factor", "impact": "Moderate"})

    return DelayPredictionResponse(
        delay_probability=round(prob, 3),
        is_delayed=is_delayed,
        risk_level=risk_level,
        contributing_factors=factors,
        model_version="1.0.0-phase7-ml" if not synthetic else "1.0.0-phase7-baseline",
        synthetic=synthetic,
        timestamp=datetime.now(timezone.utc),
    )


def _heuristic_delay(payload):
    traffic_weight = {"LOW": 0.05, "MEDIUM": 0.15, "HIGH": 0.40, "SEVERE": 0.70}.get(payload.traffic_level.upper(), 0.20)
    weather_weight = {"CLEAR": 0.0, "RAIN": 0.15, "FOG": 0.25, "SNOW": 0.40, "STORM": 0.60}.get(payload.weather_condition.upper(), 0.10)
    driver_factor = max(0.0, (5.0 - payload.driver_rating) * 0.1)
    prob = min(0.95, max(0.05, 0.10 + traffic_weight + weather_weight + driver_factor))
    return prob, prob >= 0.50, True


@router.post("/ml/predict-eta", response_model=ETAPredictionResponse)
def predict_eta(payload: ETAPredictionRequest, request: Request):
    models = get_models(request)
    synthetic = False

    if "eta" in models:
        try:
            artifact = models["eta"]
            model = artifact["model"]
            features = build_eta_features(payload.model_dump())
            duration_hours = float(model.predict(features)[0])
            synthetic = False
        except Exception:
            duration_hours, synthetic = _heuristic_eta(payload)
    else:
        duration_hours, synthetic = _heuristic_eta(payload)
        synthetic = True

    margin = round(duration_hours * 0.12, 2)
    delivery_time = datetime.now(timezone.utc) + timedelta(hours=duration_hours)

    return ETAPredictionResponse(
        estimated_hours=round(max(0.5, duration_hours), 2),
        estimated_delivery_iso=delivery_time.isoformat(),
        error_margin_hours=margin,
        confidence_interval={
            "min_hours": round(max(0.5, duration_hours - margin), 2),
            "max_hours": round(duration_hours + margin, 2)
        },
        model_version="1.0.0-phase7-ml" if not synthetic else "1.0.0-phase7-baseline",
        synthetic=synthetic,
        timestamp=datetime.now(timezone.utc),
    )


def _heuristic_eta(payload):
    speed_map = {"BIKE": 25.0, "VAN": 50.0, "TRUCK": 45.0, "HEAVY_TRAILER": 40.0}
    avg_speed = speed_map.get(payload.vehicle_type.upper(), 45.0)
    traffic_multiplier = {"LOW": 0.9, "MEDIUM": 1.1, "HIGH": 1.4, "SEVERE": 1.8}.get(payload.traffic_level.upper(), 1.1)
    weather_multiplier = {"CLEAR": 1.0, "RAIN": 1.15, "FOG": 1.25, "SNOW": 1.4, "STORM": 1.6}.get(payload.weather_condition.upper(), 1.0)
    return (payload.distance_km / avg_speed) * traffic_multiplier * weather_multiplier, True


@router.post("/ml/detect-anomaly", response_model=AnomalyDetectionResponse)
def detect_anomaly(payload: AnomalyDetectionRequest, request: Request):
    models = get_models(request)
    synthetic = False

    if "anomaly" in models:
        try:
            artifact = models["anomaly"]
            model = artifact["model"]
            features = build_anomaly_features(payload.model_dump())
            pred = model.predict(features)[0]
            score_raw = float(model.decision_function(features)[0])
            # Convert: more negative = more anomalous
            anomaly_score = max(0.0, min(1.0, 0.5 - score_raw))
            is_anomaly = pred == -1
            synthetic = False
        except Exception:
            is_anomaly, anomaly_score, synthetic = _heuristic_anomaly(payload)
    else:
        is_anomaly, anomaly_score, synthetic = _heuristic_anomaly(payload)
        synthetic = True

    triggered = []
    ratio = payload.actual_duration_hours / max(0.1, payload.expected_duration_hours)
    if ratio > 1.8:
        triggered.append(f"Excessive delivery duration: {round(ratio, 2)}x expected")
    if payload.route_deviation_km > 15.0:
        triggered.append(f"Unusual route deviation: {payload.route_deviation_km} km")
    if payload.status_updates_count == 0:
        triggered.append("Zero status updates during transit")

    severity = "HIGH" if anomaly_score > 0.7 else ("MEDIUM" if anomaly_score > 0.4 else "NORMAL")

    return AnomalyDetectionResponse(
        shipment_id=payload.shipment_id,
        is_anomaly=is_anomaly,
        anomaly_score=round(anomaly_score, 3),
        severity=severity,
        triggered_rules=triggered,
        model_version="1.0.0-phase7-ml" if not synthetic else "1.0.0-phase7-baseline",
        synthetic=synthetic,
        timestamp=datetime.now(timezone.utc),
    )


def _heuristic_anomaly(payload):
    triggered = []
    ratio = payload.actual_duration_hours / max(0.1, payload.expected_duration_hours)
    if ratio > 1.8:
        triggered.append("duration")
    if payload.route_deviation_km > 15.0:
        triggered.append("deviation")
    if payload.status_updates_count == 0:
        triggered.append("updates")
    is_anomaly = len(triggered) > 0
    score = min(1.0, len(triggered) * 0.35 + (ratio - 1.0) * 0.2) if is_anomaly else 0.05
    return is_anomaly, score, True
