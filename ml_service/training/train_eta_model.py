"""
FleetFlow AI Phase 6 - Train ETA Regression Model
HistGradientBoostingRegressor
"""
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import math

DATASETS_DIR = Path(__file__).resolve().parent.parent / 'datasets'
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / 'artifacts'
ARTIFACTS_DIR.mkdir(exist_ok=True)

FEATURES = [
    'distance_km', 'vehicle_type_enc', 'traffic_level_enc',
    'weather_condition_enc', 'day_of_week', 'dispatch_hour'
]
TARGET = 'actual_duration_hours'


def train():
    df = pd.read_csv(DATASETS_DIR / 'logistics_dataset.csv')
    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = HistGradientBoostingRegressor(
        max_iter=200, learning_rate=0.05, max_depth=8,
        min_samples_leaf=20, random_state=42
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = math.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)

    metrics = {
        'mae_hours': round(mae, 4),
        'rmse_hours': round(rmse, 4),
        'r2_score': round(r2, 4),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'features': FEATURES,
        'algorithm': 'HistGradientBoostingRegressor',
    }

    artifact = {'model': model, 'metrics': metrics, 'features': FEATURES}
    output_path = ARTIFACTS_DIR / 'eta_model.joblib'
    joblib.dump(artifact, output_path)
    print(f"ETA model saved -> {output_path}")
    for k, v in metrics.items():
        if isinstance(v, float):
            print(f"  {k}: {v:.4f}")
    return artifact


if __name__ == '__main__':
    train()
