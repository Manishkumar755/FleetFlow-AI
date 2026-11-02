from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    status: str
    service: str
    timestamp: datetime
    version: str
    environment: str
    phase: int
    models_loaded: Dict[str, bool]


class DelayPredictionRequest(BaseModel):
    distance_km: float = Field(..., gt=0)
    historical_avg_hours: float = Field(..., gt=0)
    traffic_level: str = Field("MEDIUM")
    weather_condition: str = Field("CLEAR")
    day_of_week: int = Field(..., ge=0, le=6)
    dispatch_hour: int = Field(..., ge=0, le=23)
    vehicle_type: str = Field("TRUCK")
    driver_rating: float = Field(4.5, ge=1.0, le=5.0)


class DelayPredictionResponse(BaseModel):
    delay_probability: float
    is_delayed: bool
    risk_level: str
    contributing_factors: List[Dict[str, Any]]
    model_version: str
    synthetic: bool
    timestamp: datetime


class ETAPredictionRequest(BaseModel):
    distance_km: float = Field(..., gt=0)
    vehicle_type: str = Field("TRUCK")
    historical_avg_hours: Optional[float] = Field(None, gt=0)
    traffic_level: str = Field("MEDIUM")
    weather_condition: str = Field("CLEAR")
    day_of_week: int = Field(..., ge=0, le=6)
    dispatch_hour: int = Field(..., ge=0, le=23)


class ETAPredictionResponse(BaseModel):
    estimated_hours: float
    estimated_delivery_iso: str
    error_margin_hours: float
    confidence_interval: Dict[str, float]
    model_version: str
    synthetic: bool
    timestamp: datetime


class AnomalyDetectionRequest(BaseModel):
    shipment_id: str
    distance_km: float = Field(..., gt=0)
    actual_duration_hours: float = Field(..., ge=0)
    expected_duration_hours: float = Field(..., gt=0)
    route_deviation_km: float = Field(0.0, ge=0)
    status_updates_count: int = Field(1, ge=0)
    traffic_level: str = Field("MEDIUM")


class AnomalyDetectionResponse(BaseModel):
    shipment_id: str
    is_anomaly: bool
    anomaly_score: float
    severity: str
    triggered_rules: List[str]
    model_version: str
    synthetic: bool
    timestamp: datetime


class ModelMetricsResponse(BaseModel):
    status: str
    phase: int
    models: Dict[str, Any]
    last_trained: Optional[str] = None
    note: str
