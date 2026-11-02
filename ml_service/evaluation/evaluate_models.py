"""
FleetFlow AI - Model Evaluation & Metrics Summary
"""
import joblib
from pathlib import Path

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / 'artifacts'


def load_metrics():
    results = {}
    for model_name, filename in [
        ('delay_classifier', 'delay_model.joblib'),
        ('eta_regressor', 'eta_model.joblib'),
        ('anomaly_detector', 'anomaly_model.joblib'),
    ]:
        path = ARTIFACTS_DIR / filename
        if path.exists():
            artifact = joblib.load(path)
            results[model_name] = artifact.get('metrics', {})
        else:
            results[model_name] = {'status': 'not_trained'}
    return results


if __name__ == '__main__':
    metrics = load_metrics()
    for name, m in metrics.items():
        print(f"\n{name}:")
        for k, v in m.items():
            print(f"  {k}: {v}")
