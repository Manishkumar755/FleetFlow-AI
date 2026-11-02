"""
FleetFlow AI Phase 6 - Train Delay Prediction Model
RandomForestClassifier + GradientBoostingClassifier ensemble
"""
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

DATASETS_DIR = Path(__file__).resolve().parent.parent / 'datasets'
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / 'artifacts'
ARTIFACTS_DIR.mkdir(exist_ok=True)

FEATURES = [
    'distance_km', 'vehicle_type_enc', 'traffic_level_enc',
    'weather_condition_enc', 'day_of_week', 'dispatch_hour',
    'driver_rating', 'weight_kg', 'historical_avg_hours'
]
TARGET = 'is_delayed'


def train():
    df = pd.read_csv(DATASETS_DIR / 'logistics_dataset.csv')
    X = df[FEATURES].values
    y = df[TARGET].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    rf = RandomForestClassifier(n_estimators=150, max_depth=12, random_state=42, n_jobs=-1)
    gb = GradientBoostingClassifier(n_estimators=100, learning_rate=0.1, max_depth=5, random_state=42)
    ensemble = VotingClassifier(estimators=[('rf', rf), ('gb', gb)], voting='soft')

    pipeline = Pipeline([('model', ensemble)])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]

    metrics = {
        'accuracy': round(accuracy_score(y_test, y_pred), 4),
        'f1_score': round(f1_score(y_test, y_pred), 4),
        'precision': round(precision_score(y_test, y_pred), 4),
        'recall': round(recall_score(y_test, y_pred), 4),
        'roc_auc': round(roc_auc_score(y_test, y_prob), 4),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'features': FEATURES,
        'algorithm': 'VotingClassifier(RandomForest + GradientBoosting)',
    }

    artifact = {'pipeline': pipeline, 'metrics': metrics, 'features': FEATURES}
    output_path = ARTIFACTS_DIR / 'delay_model.joblib'
    joblib.dump(artifact, output_path)
    print(f"Delay model saved -> {output_path}")
    for k, v in metrics.items():
        if isinstance(v, float):
            print(f"  {k}: {v:.4f}")
    return artifact


if __name__ == '__main__':
    train()
