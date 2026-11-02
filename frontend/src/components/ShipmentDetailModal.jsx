import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Clock, Truck, MapPin, AlertCircle, PlusCircle } from 'lucide-react';
import { djangoClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ShipmentDetailModal({ shipmentId, isOpen, onClose, onUpdated }) {
  const { user } = useAuth();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = async () => {
    if (!shipmentId) return;
    setLoading(true);
    try {
      const res = await djangoClient.get(`/api/shipments/${shipmentId}/`);
      setShipment(res.data);
      setNewStatus(res.data.status);
    } catch (err) {
      console.warn('Failed to fetch detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && shipmentId) {
      fetchDetail();
    }
  }, [isOpen, shipmentId]);

  if (!isOpen) return null;

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await djangoClient.patch(`/api/shipments/${shipmentId}/`, {
        status: newStatus,
        location: location || 'Transit checkpoint',
        notes: notes || `Status changed to ${newStatus}`,
      });
      setLocation('');
      setNotes('');
      fetchDetail();
      if (onUpdated) onUpdated();
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>Shipment Dossier & Tracking</h3>
            <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.9rem', fontWeight: 600 }}>
              {shipment?.tracking_id}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading shipment details...</div>
        ) : !shipment ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#fb7185' }}>Shipment not found.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Status</span>
                <div style={{ marginTop: '0.25rem' }}>
                  <span className={`badge ${
                    shipment.status === 'DELIVERED' ? 'badge-success' :
                    shipment.status === 'IN_TRANSIT' ? 'badge-info' :
                    shipment.status === 'DELAYED' ? 'badge-danger' : 'badge-warning'
                  }`}>
                    {shipment.status}
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Delay Risk</span>
                <div style={{ marginTop: '0.25rem' }}>
                  <span className={`badge ${
                    shipment.delay_risk === 'HIGH' ? 'badge-danger' :
                    shipment.delay_risk === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                  }`}>
                    {shipment.delay_risk || 'LOW'} ({((shipment.delay_probability || 0.1) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Priority</span>
                <div style={{ marginTop: '0.25rem', fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                  {shipment.priority}
                </div>
              </div>
            </div>

            {/* Sender / Receiver / Logistics Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>Origin / Consignor</span>
                <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>{shipment.sender_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{shipment.sender_address}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                  Coords: {shipment.origin_lat?.toFixed(4)}, {shipment.origin_lng?.toFixed(4)}
                </div>
              </div>

              <div style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, textTransform: 'uppercase' }}>Destination / Consignee</span>
                <div style={{ fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>{shipment.receiver_name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{shipment.receiver_address}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
                  Coords: {shipment.destination_lat?.toFixed(4)}, {shipment.destination_lng?.toFixed(4)}
                </div>
              </div>
            </div>

            {/* Driver & Vehicle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Truck size={20} color="#60a5fa" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Vehicle</div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>
                    {shipment.vehicle ? `${shipment.vehicle.registration_number} (${shipment.vehicle.vehicle_type})` : 'Unassigned'}
                  </div>
                </div>
              </div>

              <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Clock size={20} color="#a78bfa" />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Driver</div>
                  <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>
                    {shipment.driver ? (shipment.driver.user?.first_name ? `${shipment.driver.user.first_name} ${shipment.driver.user.last_name}` : shipment.driver.user?.username) : 'Unassigned'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking History Stepper */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>
                Milestone Event History
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: '2px solid var(--border-color)', marginLeft: '0.75rem', paddingLeft: '1.25rem' }}>
                {shipment.tracking_events && shipment.tracking_events.length > 0 ? (
                  shipment.tracking_events.map((evt, idx) => (
                    <div key={evt.id || idx} style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-1.65rem', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{evt.status}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {evt.location && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={12} /> {evt.location}
                        </div>
                      )}
                      {evt.notes && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '2px' }}>
                          "{evt.notes}"
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No tracking events logged yet.</div>
                )}
              </div>
            </div>

            {/* Staff / Driver Status Transition Form */}
            {['ADMIN', 'MANAGER', 'DRIVER'].includes(user?.role) && (
              <form onSubmit={handleUpdateStatus} style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.75rem' }}>
                  Update Live Status & Log Event
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>New Status</label>
                    <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }}>
                      <option value="PENDING">PENDING</option>
                      <option value="ASSIGNED">ASSIGNED</option>
                      <option value="IN_TRANSIT">IN_TRANSIT</option>
                      <option value="DELAYED">DELAYED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Current Location</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Checkpoint Alpha" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Milestone Notes</label>
                    <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Loaded onto truck" style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }} />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  {submitting ? 'Updating...' : 'Log Tracking Milestone'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
