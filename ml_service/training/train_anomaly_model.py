"""
FleetFlow AI Phase 6 - Train Anomaly Detection Model
IsolationForest
"""
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split

DATASETS_DIR = Path(__file__).resolve().parent.parent / 'datasets'
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / 'artifacts'
ARTIFACTS_DIR.mkdir(exist_ok=True)

FEATURES = [
    'distance_km', 'actual_duration_hours', 'expected_duration_hours',
    'route_deviation_km', 'status_updates_count', 'traffic_level_enc'
]


def train():
    df = pd.read_csv(DATASETS_DIR / 'logistics_dataset.csv')
    df['duration_ratio'] = df['actual_duration_hours'] / df['expected_duration_hours'].clip(lower=0.1)

    feature_cols = FEATURES + ['duration_ratio']
    X = df[feature_cols].values
    y_true = df['is_anomaly'].values

    contamination = float(y_true.mean())
    contamination = min(max(contamination, 0.01), 0.3)

    model = IsolationForest(
        n_estimators=200, contamination=contamination,
        random_state=42, n_jobs=-1
    )
    model.fit(X)

    raw_scores = model.decision_function(X)
    preds = model.predict(X)
    y_pred = (preds == -1).astype(int)

    from sklearn.metrics import accuracy_score, f1_score
    metrics = {
        'contamination': round(contamination, 4),
        'anomaly_rate_detected': round(y_pred.mean(), 4),
        'anomaly_rate_actual': round(y_true.mean(), 4),
        'f1_score': round(f1_score(y_true, y_pred, zero_division=0), 4),
        'accuracy': round(accuracy_score(y_true, y_pred), 4),
        'train_samples': len(X),
        'features': feature_cols,
        'algorithm': 'IsolationForest',
    }

    artifact = {'model': model, 'metrics': metrics, 'features': feature_cols, 'contamination': contamination}
    output_path = ARTIFACTS_DIR / 'anomaly_model.joblib'
    joblib.dump(artifact, output_path)
    print(f"Anomaly model saved -> {output_path}")
    for k, v in metrics.items():
        if isinstance(v, float):
            print(f"  {k}: {v:.4f}")
    return artifact


if __name__ == '__main__':
    train()
