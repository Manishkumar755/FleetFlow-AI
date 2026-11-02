import React, { useState } from 'react';
import { Search, Package, MapPin, CheckCircle, Clock, Truck, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { djangoClient } from '../api/client';

export default function CustomerPortal() {
  const [trackingId, setTrackingId] = useState('');
  const [shipment, setShipment] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    if (e) e.preventDefault();
    if (!trackingId.trim()) return;
    setError('');
    setLoading(true);
    setShipment(null);

    try {
      const res = await djangoClient.get(`/api/shipments/track/${trackingId.trim()}/`);
      setShipment(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Tracking ID not found. Verify your tracking code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = (demoId) => {
    setTrackingId(demoId);
    setError('');
    setLoading(true);
    djangoClient.get(`/api/shipments/track/${demoId}/`)
      .then((res) => setShipment(res.data))
      .catch((err) => setError('Consignment not found.'))
      .finally(() => setLoading(false));
  };

  const stages = ['PENDING', 'ASSIGNED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  const getStageIndex = (status) => {
    if (status === 'DELIVERED') return 4;
    if (status === 'IN_TRANSIT') return 2;
    if (status === 'ASSIGNED') return 1;
    return 0;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-main)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Navigation & Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Truck size={22} />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: '1.25rem', color: '#fff' }}>FleetFlow</span>
              <span className="brand-tag">TRACK</span>
            </div>
          </div>
          <Link to="/login" className="btn btn-secondary" style={{ fontSize: '0.85rem', gap: '0.4rem' }}>
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>

        {/* Hero Search Box */}
        <div className="card" style={{ padding: '2.5rem 2rem', textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
            Track Your Consignment
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
            Enter your unique FleetFlow Tracking ID to view real-time location & milestone updates
          </p>

          <form onSubmit={handleTrack} style={{ display: 'flex', gap: '0.75rem', maxWidth: '540px', margin: '0 auto' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="e.g. FF-202611-ABC123"
                style={{
                  width: '100%',
                  padding: '0.8rem 1rem 0.8rem 2.8rem',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '0.95rem',
                }}
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem', fontWeight: 600 }}>
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </form>

          {/* Quick Demo Tracking Selector */}
          <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <span>Try searching a seeded tracking ID or click one from your shipments table.</span>
          </div>
        </div>

        {error && (
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', border: '1px solid rgba(244,63,94,0.3)', marginBottom: '2rem' }}>
            <AlertCircle size={28} color="#fb7185" style={{ margin: '0 auto 0.5rem' }} />
            <h4 style={{ color: '#fb7185', fontWeight: 600 }}>{error}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Please check your confirmation email or dispatch docket for the correct code.
            </p>
          </div>
        )}

        {/* Shipment Tracking Dossier Result */}
        {shipment && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tracking Number</span>
                <h3 style={{ fontSize: '1.5rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                  {shipment.tracking_id}
                </h3>
              </div>
              <span className={`badge ${
                shipment.status === 'DELIVERED' ? 'badge-success' :
                shipment.status === 'IN_TRANSIT' ? 'badge-info' :
                shipment.status === 'DELAYED' ? 'badge-danger' : 'badge-warning'
              }`} style={{ fontSize: '0.9rem', padding: '0.4rem 1rem' }}>
                {shipment.status}
              </span>
            </div>

            {/* 5-Stage Visual Stepper */}
            <div style={{ padding: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '16px', left: '10%', right: '10%', height: '3px', background: 'var(--border-color)', zIndex: 1 }} />
                {['Order Placed', 'Assigned', 'In Transit', 'Out for Delivery', 'Delivered'].map((label, idx) => {
                  const currentIdx = getStageIndex(shipment.status);
                  const isCompleted = idx <= currentIdx;
                  return (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: isCompleted ? '#2563eb' : 'var(--bg-card)',
                          border: `2px solid ${isCompleted ? '#38bdf8' : 'var(--border-color)'}`,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          boxShadow: isCompleted ? '0 0 10px rgba(37,99,235,0.5)' : 'none',
                        }}
                      >
                        {isCompleted ? <CheckCircle size={16} /> : idx + 1}
                      </div>
                      <span style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: isCompleted ? '#fff' : 'var(--text-dim)', fontWeight: isCompleted ? 600 : 400, textAlign: 'center' }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Origin & Destination Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>From</span>
                <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>{shipment.sender_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{shipment.origin}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>To</span>
                <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.2rem' }}>{shipment.receiver_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{shipment.destination}</div>
              </div>
            </div>

            {/* Milestone Event Timeline */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
                Event Log History
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '2px solid var(--border-color)', marginLeft: '0.75rem', paddingLeft: '1.25rem' }}>
                {shipment.tracking_events && shipment.tracking_events.length > 0 ? (
                  shipment.tracking_events.map((evt, idx) => (
                    <div key={evt.id || idx}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{evt.status}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {evt.location && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={13} color="#38bdf8" /> {evt.location}
                        </div>
                      )}
                      {evt.notes && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px', fontStyle: 'italic' }}>
                          "{evt.notes}"
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No milestone events logged yet.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
