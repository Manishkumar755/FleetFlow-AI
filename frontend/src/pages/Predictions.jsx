import React, { useState, useEffect } from 'react';
import { Activity, Clock, AlertTriangle, Cpu, CheckCircle2, TrendingUp, BarChart2 } from 'lucide-react';
import { fastapiClient } from '../api/client';

export default function Predictions() {
  const [formData, setFormData] = useState({
    distance_km: 450,
    vehicle_type: 'TRUCK',
    traffic_level: 'HIGH',
    weather_condition: 'RAIN',
    day_of_week: 3,
    dispatch_hour: 14,
    driver_rating: 4.5,
    historical_avg_hours: 8.5,
    weight_kg: 3500,
  });

  const [prediction, setPrediction] = useState(null);
  const [etaResult, setEtaResult] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch ML model metrics on load
    fastapiClient.get('/ml/model-metrics')
      .then((res) => setModelMetrics(res.data))
      .catch((err) => console.warn('Failed to load ML metrics:', err));
  }, []);

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      // 1. Predict Delay Probability
      const delayRes = await fastapiClient.post('/ml/predict-delay', {
        distance_km: Number(formData.distance_km),
        historical_avg_hours: Number(formData.historical_avg_hours),
        traffic_level: formData.traffic_level,
        weather_condition: formData.weather_condition,
        day_of_week: Number(formData.day_of_week),
        dispatch_hour: Number(formData.dispatch_hour),
        vehicle_type: formData.vehicle_type,
        driver_rating: Number(formData.driver_rating),
        weight_kg: Number(formData.weight_kg),
      });
      setPrediction(delayRes.data);

      // 2. Predict ETA Duration
      const etaRes = await fastapiClient.post('/ml/predict-eta', {
        distance_km: Number(formData.distance_km),
        vehicle_type: formData.vehicle_type,
        traffic_level: formData.traffic_level,
        weather_condition: formData.weather_condition,
        day_of_week: Number(formData.day_of_week),
        dispatch_hour: Number(formData.dispatch_hour),
      });
      setEtaResult(etaRes.data);
    } catch (err) {
      alert('ML Prediction failed. Ensure FastAPI microservice is running on port 8001.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>
          AI Delay Prediction & ETA Regressor Engine
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Real-time probabilistic risk assessment powered by ensemble VotingClassifier & HistGradientBoosting
        </p>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* Prediction Input Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="#38bdf8" />
              Route & Transit Parameters
            </h3>
            <span className="badge badge-info">FastAPI ML v1.0</span>
          </div>

          <form onSubmit={handlePredict} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Distance (km)</label>
                <input
                  type="number"
                  step="10"
                  value={formData.distance_km}
                  onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Historical Avg (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.historical_avg_hours}
                  onChange={(e) => setFormData({ ...formData, historical_avg_hours: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Vehicle Type</label>
                <select
                  value={formData.vehicle_type}
                  onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                >
                  <option value="BIKE">Cargo Bike (25 km/h)</option>
                  <option value="VAN">Delivery Van (55 km/h)</option>
                  <option value="TRUCK">Box Truck (48 km/h)</option>
                  <option value="HEAVY_TRAILER">Semi-Trailer (42 km/h)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Traffic Congestion</label>
                <select
                  value={formData.traffic_level}
                  onChange={(e) => setFormData({ ...formData, traffic_level: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                >
                  <option value="LOW">Low (Fluid)</option>
                  <option value="MEDIUM">Medium (Moderate)</option>
                  <option value="HIGH">High (Heavy Gridlock)</option>
                  <option value="SEVERE">Severe (Major Bottlenecks)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Weather Conditions</label>
                <select
                  value={formData.weather_condition}
                  onChange={(e) => setFormData({ ...formData, weather_condition: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                >
                  <option value="CLEAR">Clear & Dry</option>
                  <option value="RAIN">Moderate Rain</option>
                  <option value="FOG">Dense Fog</option>
                  <option value="SNOW">Snow & Icy Roads</option>
                  <option value="STORM">Severe Storm</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Driver Experience Rating (1-5)</label>
                <input
                  type="number"
                  step="0.1"
                  max="5.0"
                  min="1.0"
                  value={formData.driver_rating}
                  onChange={(e) => setFormData({ ...formData, driver_rating: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Dispatch Hour (0-23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.dispatch_hour}
                  onChange={(e) => setFormData({ ...formData, dispatch_hour: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Consignment Weight (kg)</label>
                <input
                  type="number"
                  step="100"
                  value={formData.weight_kg}
                  onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', fontWeight: 600 }}
            >
              {loading ? 'Evaluating Model Inference...' : 'Calculate Delay Risk & ETA'}
            </button>
          </form>
        </div>

        {/* Prediction Results Display */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card-header">
            <h3 className="card-title">Inference Output</h3>
            {prediction && (
              <span className={`badge ${
                prediction.risk_level === 'HIGH' ? 'badge-danger' :
                prediction.risk_level === 'MEDIUM' ? 'badge-warning' : 'badge-success'
              }`}>
                {prediction.risk_level} RISK
              </span>
            )}
          </div>

          {!prediction ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Cpu size={48} color="#38bdf8" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <h4>Model Ready for Inference</h4>
              <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                Adjust parameters on the left and click "Calculate Delay Risk & ETA" to evaluate live ML predictions.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Delay Meter */}
              <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Delay Probability</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: prediction.risk_level === 'HIGH' ? '#fb7185' : prediction.risk_level === 'MEDIUM' ? '#fbbf24' : '#34d399' }}>
                    {(prediction.delay_probability * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-card)', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.min(100, prediction.delay_probability * 100)}%`,
                      height: '100%',
                      background: prediction.risk_level === 'HIGH' ? '#f43f5e' : prediction.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>

              {/* ETA Duration & Margin */}
              {etaResult && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Estimated Duration</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.2rem' }}>
                      {etaResult.estimated_hours} hrs
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      ± {etaResult.error_margin_hours} hrs error margin
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Confidence Window</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>
                      {etaResult.confidence_interval?.min_hours}h — {etaResult.confidence_interval?.max_hours}h
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      95% Confidence Interval
                    </div>
                  </div>
                </div>
              )}

              {/* Contributing Risk Factors */}
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                  Key Explanatory Factors
                </span>
                {prediction.contributing_factors && prediction.contributing_factors.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {prediction.contributing_factors.map((f, i) => (
                      <span key={i} className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                        {f.factor} ({f.impact})
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Normal operational transit conditions
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Model Benchmark & Training Metrics Card */}
      {modelMetrics && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Production Model Performance & Metrics</h3>
            <span className="badge badge-success">Models Serialized in artifacts/</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>VotingClassifier (Delay)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Random Forest + Gradient Boosting</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Accuracy: <strong style={{ color: '#34d399' }}>{(modelMetrics.models.delay_classifier.accuracy * 100).toFixed(1)}%</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                F1 Score: <strong style={{ color: '#38bdf8' }}>{modelMetrics.models.delay_classifier.f1_score}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                ROC-AUC: <strong style={{ color: '#a78bfa' }}>{modelMetrics.models.delay_classifier.roc_auc}</strong>
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>HistGradientBoosting (ETA)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Non-linear regression</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                R² Score: <strong style={{ color: '#34d399' }}>{modelMetrics.models.eta_regressor.r2_score}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                MAE: <strong style={{ color: '#38bdf8' }}>{modelMetrics.models.eta_regressor.mae_hours} hrs</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                RMSE: <strong style={{ color: '#fbbf24' }}>{modelMetrics.models.eta_regressor.rmse_hours} hrs</strong>
              </div>
            </div>

            <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>IsolationForest (Anomaly)</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Unsupervised route & duration outliers</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Contamination: <strong style={{ color: '#fbbf24' }}>{(modelMetrics.models.anomaly_detector.contamination * 100).toFixed(1)}%</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                F1 Score: <strong style={{ color: '#38bdf8' }}>{modelMetrics.models.anomaly_detector.f1_score}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Accuracy: <strong style={{ color: '#34d399' }}>{(modelMetrics.models.anomaly_detector.accuracy * 100).toFixed(1)}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
