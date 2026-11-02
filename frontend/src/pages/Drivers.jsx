import React, { useState, useEffect } from 'react';
import { UserCheck, Star, Award, Phone, CheckCircle, XCircle, RefreshCw, Plus, X } from 'lucide-react';
import { djangoClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Drivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [newDriver, setNewDriver] = useState({
    user_id: '',
    license_number: '',
    on_time_rate: 92.0,
    customer_feedback_score: 4.7,
  });

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await djangoClient.get('/api/shipments/drivers/');
      setDrivers(res.data);
    } catch (err) {
      console.warn('Failed to load drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleUsers = async () => {
    try {
      const res = await djangoClient.get('/api/auth/users/');
      // Users that don't have driver profile
      setEligibleUsers(res.data.filter((u) => u.role === 'DRIVER' || u.role === 'CUSTOMER'));
    } catch (err) {}
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleToggleAvailability = async (driverId, current) => {
    try {
      await djangoClient.patch(`/api/shipments/drivers/${driverId}/`, {
        is_available: !current,
      });
      fetchDrivers();
    } catch (err) {
      alert('Failed to update availability.');
    }
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    try {
      await djangoClient.post('/api/shipments/drivers/', {
        ...newDriver,
        user_id: Number(newDriver.user_id),
        on_time_rate: Number(newDriver.on_time_rate),
        customer_feedback_score: Number(newDriver.customer_feedback_score),
      });
      setAddModalOpen(false);
      fetchDrivers();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to add driver profile.');
    }
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>Driver Roster & Performance</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Monitor availability, driving licenses, delivery feedback, and composite performance ratings
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchDrivers} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {['ADMIN', 'MANAGER'].includes(user?.role) && (
            <button
              onClick={() => { fetchEligibleUsers(); setAddModalOpen(true); }}
              className="btn btn-primary"
              style={{ gap: '0.4rem' }}
            >
              <Plus size={16} /> Add Driver
            </button>
          )}
        </div>
      </div>

      <div className="grid-cols-2">
        {loading ? (
          <div className="card" style={{ gridColumn: 'span 2', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading driver roster...
          </div>
        ) : drivers.length === 0 ? (
          <div className="card" style={{ gridColumn: 'span 2', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No registered drivers. Click "Add Driver" or run demo seed.
          </div>
        ) : (
          drivers.map((d) => (
            <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: '#fff',
                    }}
                  >
                    {d.user?.first_name ? d.user.first_name[0] : d.user?.username[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
                      {d.user?.first_name ? `${d.user.first_name} ${d.user.last_name}` : d.user?.username}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                      License: {d.license_number}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.25rem 0.65rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(37,99,235,0.2)',
                      border: '1px solid rgba(37,99,235,0.4)',
                      color: '#60a5fa',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  >
                    <Award size={16} />
                    {d.performance_score}% Score
                  </div>
                </div>
              </div>

              {/* Performance Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'var(--bg-primary)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>On-Time Rate</span>
                  <div style={{ fontWeight: 600, color: '#34d399', fontSize: '0.95rem', marginTop: '2px' }}>
                    {d.on_time_rate}%
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Feedback</span>
                  <div style={{ fontWeight: 600, color: '#fbbf24', fontSize: '0.95rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Star size={13} fill="#fbbf24" /> {d.customer_feedback_score} / 5
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Deliveries</span>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem', marginTop: '2px' }}>
                    {d.total_deliveries} trips
                  </div>
                </div>
              </div>

              {/* Status and Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${d.is_available ? 'badge-success' : 'badge-warning'}`}>
                    {d.is_available ? 'Available for Duty' : 'On Active Transit'}
                  </span>
                </div>

                {['ADMIN', 'MANAGER'].includes(user?.role) && (
                  <button
                    onClick={() => handleToggleAvailability(d.id, d.is_available)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    Toggle {d.is_available ? 'Unavailable' : 'Available'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Driver Modal */}
      {addModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>Add Driver Profile</h3>
              <button onClick={() => setAddModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDriver} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Select User Account *</label>
                <select
                  required
                  value={newDriver.user_id}
                  onChange={(e) => setNewDriver({ ...newDriver, user_id: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                >
                  <option value="">-- Choose User --</option>
                  {eligibleUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Commercial License Number *</label>
                <input
                  type="text"
                  required
                  value={newDriver.license_number}
                  onChange={(e) => setNewDriver({ ...newDriver, license_number: e.target.value })}
                  placeholder="e.g. CDL-998811"
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>On-Time Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newDriver.on_time_rate}
                    onChange={(e) => setNewDriver({ ...newDriver, on_time_rate: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Feedback Score (0-5)</label>
                  <input
                    type="number"
                    step="0.1"
                    max="5.0"
                    value={newDriver.customer_feedback_score}
                    onChange={(e) => setNewDriver({ ...newDriver, customer_feedback_score: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setAddModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
