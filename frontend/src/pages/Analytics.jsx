import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { BarChart3, TrendingUp, RefreshCw, Award, Truck } from 'lucide-react';
import { djangoClient } from '../api/client';

const COLORS = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

export default function Analytics() {
  const [summary, setSummary] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [sumRes, drvRes, vehRes] = await Promise.all([
        djangoClient.get('/api/shipments/summary/'),
        djangoClient.get('/api/shipments/drivers/'),
        djangoClient.get('/api/shipments/vehicles/'),
      ]);
      setSummary(sumRes.data);
      setDrivers(drvRes.data);
      setVehicles(vehRes.data);
    } catch (err) {
      console.warn('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const statusData = summary
    ? [
        { name: 'Pending', value: summary.pending || 0 },
        { name: 'Assigned', value: summary.assigned || 0 },
        { name: 'In Transit', value: summary.in_transit || 0 },
        { name: 'Delivered', value: summary.delivered || 0 },
        { name: 'Delayed', value: summary.delayed || 0 },
      ]
    : [];

  const riskData = summary?.delay_risk
    ? [
        { name: 'Low Risk', count: summary.delay_risk.low || 0, fill: '#10b981' },
        { name: 'Medium Risk', count: summary.delay_risk.medium || 0, fill: '#f59e0b' },
        { name: 'High Risk', count: summary.delay_risk.high || 0, fill: '#f43f5e' },
      ]
    : [];

  const driverRankings = drivers
    .map((d) => ({
      name: d.user?.first_name ? `${d.user.first_name} ${d.user.last_name}` : d.user?.username,
      score: d.performance_score,
      deliveries: d.total_deliveries,
      onTime: d.on_time_rate,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>
            Operational Analytics & Fleet KPIs
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Interactive charts, delivery volume distributions, and driver performance telemetry
          </p>
        </div>
        <button onClick={fetchAnalyticsData} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh Analytics
        </button>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* Status Distribution Pie */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Consignment Lifecycle Breakdown</h3>
            <span className="badge badge-info">{summary ? `${summary.total} Total` : '—'}</span>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => (value > 0 ? `${name}: ${value}` : '')}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Delay Risk Distribution Bar */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">AI Delay Risk Distribution</h3>
            <span className="badge badge-warning">Probabilistic Tiers</span>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ background: '#1f2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskData.map((entry, index) => (
                    <Cell key={`risk-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Driver Performance Ranking Leaderboard */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={18} color="#fbbf24" />
            Driver Performance Telemetry Leaderboard
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Formula: 60% On-Time + 40% Customer Rating</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Rank</th>
                <th style={{ padding: '0.75rem 1rem' }}>Driver Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Composite Performance Score</th>
                <th style={{ padding: '0.75rem 1rem' }}>On-Time Rate</th>
                <th style={{ padding: '0.75rem 1rem' }}>Total Deliveries</th>
              </tr>
            </thead>
            <tbody>
              {driverRankings.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No drivers evaluated yet.
                  </td>
                </tr>
              ) : (
                driverRankings.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: idx === 0 ? '#fbbf24' : '#fff' }}>
                      #{idx + 1}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#fff' }}>
                      {d.name}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '120px', height: '6px', background: 'var(--bg-card)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ width: `${d.score}%`, height: '100%', background: '#38bdf8' }} />
                        </div>
                        <span style={{ fontWeight: 700, color: '#38bdf8' }}>{d.score}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#34d399', fontWeight: 600 }}>
                      {d.onTime}%
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {d.deliveries} completed
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
