import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw, ShieldAlert, Cpu, Check } from 'lucide-react';
import { djangoClient, fastapiClient } from '../api/client';

export default function Anomalies() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Anomaly Tester State
  const [testPayload, setTestPayload] = useState({
    shipment_id: 'FF-LIVE-TEST-09',
    distance_km: 320,
    actual_duration_hours: 8.5,
    expected_duration_hours: 3.5,
    route_deviation_km: 24.5,
    status_updates_count: 0,
    traffic_level: 'LOW',
  });
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await djangoClient.get('/api/shipments/anomalies/');
      setAlerts(res.data);
    } catch (err) {
      console.warn('Failed to load anomaly alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (alertId) => {
    try {
      await djangoClient.patch(`/api/shipments/anomalies/${alertId}/resolve/`);
      fetchAlerts();
    } catch (err) {
      alert('Failed to resolve alert.');
    }
  };

  const handleRunAnomalyTest = async (e) => {
    e.preventDefault();
    setTesting(true);
    try {
      const res = await fastapiClient.post('/ml/detect-anomaly', {
        ...testPayload,
        distance_km: Number(testPayload.distance_km),
        actual_duration_hours: Number(testPayload.actual_duration_hours),
        expected_duration_hours: Number(testPayload.expected_duration_hours),
        route_deviation_km: Number(testPayload.route_deviation_km),
        status_updates_count: Number(testPayload.status_updates_count),
      });
      setTestResult(res.data);
    } catch (err) {
      alert('Anomaly detection test failed.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>
            Anomaly Detection & Security Alerts
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Isolation Forest monitoring flagging route deviations, silent dropouts, and abnormal delay spikes
          </p>
        </div>
        <button onClick={fetchAlerts} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh Alerts
        </button>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* Active Alerts List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="#f43f5e" />
              Active Operational Alerts ({alerts.filter((a) => !a.is_resolved).length})
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '480px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading anomaly alerts...
              </div>
            ) : alerts.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#34d399', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={32} />
                <span>Zero anomalous routing deviations detected across active fleet.</span>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: alert.is_resolved ? 'var(--bg-primary)' : 'rgba(244,63,94,0.08)',
                    border: `1px solid ${alert.is_resolved ? 'var(--border-color)' : 'rgba(244,63,94,0.3)'}`,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge ${
                        alert.severity === 'CRITICAL' ? 'badge-danger' :
                        alert.severity === 'HIGH' ? 'badge-danger' :
                        alert.severity === 'MEDIUM' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {alert.severity}
                      </span>
                      {alert.shipment_tracking_id && (
                        <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>
                          {alert.shipment_tracking_id}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: '#fff', marginBottom: '0.5rem' }}>
                    {alert.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: '0.75rem', color: alert.is_resolved ? '#34d399' : '#fb7185' }}>
                      {alert.is_resolved ? '✓ Resolved' : 'Active Attention Required'}
                    </span>
                    {!alert.is_resolved && (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', gap: '0.25rem' }}
                      >
                        <Check size={12} /> Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time Anomaly Inspection Tool */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#a78bfa" />
              Isolation Forest Telemetry Inspector
            </h3>
            <span className="badge badge-info">Real-time ML</span>
          </div>

          <form onSubmit={handleRunAnomalyTest} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Expected Duration (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={testPayload.expected_duration_hours}
                  onChange={(e) => setTestPayload({ ...testPayload, expected_duration_hours: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Actual Transit (hrs)</label>
                <input
                  type="number"
                  step="0.5"
                  value={testPayload.actual_duration_hours}
                  onChange={(e) => setTestPayload({ ...testPayload, actual_duration_hours: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Route Deviation (km)</label>
                <input
                  type="number"
                  step="1"
                  value={testPayload.route_deviation_km}
                  onChange={(e) => setTestPayload({ ...testPayload, route_deviation_km: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Status Check-ins Count</label>
                <input
                  type="number"
                  value={testPayload.status_updates_count}
                  onChange={(e) => setTestPayload({ ...testPayload, status_updates_count: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={testing}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem', marginTop: '0.5rem' }}
            >
              {testing ? 'Evaluating Outlier Model...' : 'Run Anomaly Detection Check'}
            </button>
          </form>

          {/* Test Result */}
          {testResult && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>Isolation Forest Verdict:</span>
                <span className={`badge ${testResult.is_anomaly ? 'badge-danger' : 'badge-success'}`}>
                  {testResult.is_anomaly ? 'ANOMALY DETECTED' : 'NORMAL BEHAVIOR'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Anomaly Outlier Score: <strong style={{ color: '#fff' }}>{testResult.anomaly_score}</strong> (Severity: {testResult.severity})
              </div>
              {testResult.triggered_rules && testResult.triggered_rules.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                    Triggered Violation Rules:
                  </span>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.8rem', color: '#fb7185' }}>
                    {testResult.triggered_rules.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
