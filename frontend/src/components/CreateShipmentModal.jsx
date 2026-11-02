import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { djangoClient } from '../api/client';

export default function CreateShipmentModal({ isOpen, onClose, onCreated }) {
  const [formData, setFormData] = useState({
    sender_name: '',
    sender_address: '',
    receiver_name: '',
    receiver_address: '',
    origin_lat: 41.8781,
    origin_lng: -87.6298,
    destination_lat: 32.7767,
    destination_lng: -96.7970,
    weight_kg: 500,
    distance_km: 1480,
    priority: 'NORMAL',
    vehicle: '',
    driver: '',
    notes: '',
  });

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      djangoClient.get('/api/shipments/vehicles/').then((res) => {
        setVehicles(res.data.filter((v) => v.status === 'AVAILABLE'));
      }).catch(() => {});

      djangoClient.get('/api/shipments/drivers/').then((res) => {
        setDrivers(res.data.filter((d) => d.is_available));
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate selected vehicle capacity
    if (formData.vehicle) {
      const selectedV = vehicles.find((v) => String(v.id) === String(formData.vehicle));
      if (selectedV && Number(formData.weight_kg) > selectedV.capacity_kg) {
        setError(`Shipment payload (${formData.weight_kg} kg) exceeds vehicle capacity (${selectedV.capacity_kg} kg).`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        weight_kg: Number(formData.weight_kg),
        distance_km: Number(formData.distance_km),
        origin_lat: Number(formData.origin_lat),
        origin_lng: Number(formData.origin_lng),
        destination_lat: Number(formData.destination_lat),
        destination_lng: Number(formData.destination_lng),
        vehicle: formData.vehicle ? Number(formData.vehicle) : null,
        driver: formData.driver ? Number(formData.driver) : null,
      };

      const res = await djangoClient.post('/api/shipments/', payload);
      onCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to dispatch shipment. Verify all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>Create New Consignment Dispatch</h3>
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-md)', color: '#fb7185', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Sender Name *</label>
              <input type="text" name="sender_name" required value={formData.sender_name} onChange={handleChange} placeholder="e.g. Apex Electronics Ltd" style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Receiver Name *</label>
              <input type="text" name="receiver_name" required value={formData.receiver_name} onChange={handleChange} placeholder="e.g. Dallas Distribution Hub" style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Sender Origin Address *</label>
              <input type="text" name="sender_address" required value={formData.sender_address} onChange={handleChange} placeholder="e.g. 100 Industrial Rd, Chicago, IL" style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Receiver Destination Address *</label>
              <input type="text" name="receiver_address" required value={formData.receiver_address} onChange={handleChange} placeholder="e.g. 500 Commerce Blvd, Dallas, TX" style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Origin Lat</label>
              <input type="number" step="0.0001" name="origin_lat" value={formData.origin_lat} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Origin Lng</label>
              <input type="number" step="0.0001" name="origin_lng" value={formData.origin_lng} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Dest Lat</label>
              <input type="number" step="0.0001" name="destination_lat" value={formData.destination_lat} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Dest Lng</label>
              <input type="number" step="0.0001" name="destination_lng" value={formData.destination_lng} onChange={handleChange} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Weight (kg) *</label>
              <input type="number" step="0.1" name="weight_kg" required value={formData.weight_kg} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Distance (km)</label>
              <input type="number" step="0.1" name="distance_km" value={formData.distance_km} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Assign Fleet Vehicle</label>
              <select name="vehicle" value={formData.vehicle} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
                <option value="">-- Select Available Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} ({v.vehicle_type} - {v.capacity_kg} kg cap)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Assign Certified Driver</label>
              <select name="driver" value={formData.driver} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}>
                <option value="">-- Select Available Driver --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.user?.first_name ? `${d.user.first_name} ${d.user.last_name}` : d.user?.username} ({d.performance_score}% Score)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Creating...' : 'Dispatch Shipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
