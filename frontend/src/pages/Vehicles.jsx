import React, { useState, useEffect } from 'react';
import { Truck, Wrench, RefreshCw, Plus, X, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { djangoClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Vehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Register Modal
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    registration_number: '',
    vehicle_type: 'TRUCK',
    capacity_kg: 5000,
    fuel_type: 'Diesel',
    model_name: '',
    year: 2024,
    mileage_km: 15000,
  });

  // Maintenance Modal
  const [maintModalOpen, setMaintModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [maintRecords, setMaintRecords] = useState([]);
  const [newMaint, setNewMaint] = useState({
    service_date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 250.0,
    next_service_date: '',
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await djangoClient.get('/api/shipments/vehicles/');
      setVehicles(res.data);
    } catch (err) {
      console.warn('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleRegisterVehicle = async (e) => {
    e.preventDefault();
    try {
      await djangoClient.post('/api/shipments/vehicles/', {
        ...newVehicle,
        capacity_kg: Number(newVehicle.capacity_kg),
        mileage_km: Number(newVehicle.mileage_km),
        year: Number(newVehicle.year),
      });
      setRegisterModalOpen(false);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to register vehicle.');
    }
  };

  const handleOpenMaintenance = async (v) => {
    setSelectedVehicle(v);
    setMaintModalOpen(true);
    try {
      const res = await djangoClient.get(`/api/shipments/vehicles/${v.id}/maintenance/`);
      setMaintRecords(res.data);
    } catch (err) {}
  };

  const handleAddMaintenance = async (e) => {
    e.preventDefault();
    try {
      await djangoClient.post(`/api/shipments/vehicles/${selectedVehicle.id}/maintenance/`, {
        ...newMaint,
        cost: Number(newMaint.cost),
      });
      setNewMaint({
        service_date: new Date().toISOString().split('T')[0],
        description: '',
        cost: 250.0,
        next_service_date: '',
      });
      const res = await djangoClient.get(`/api/shipments/vehicles/${selectedVehicle.id}/maintenance/`);
      setMaintRecords(res.data);
    } catch (err) {
      alert('Failed to log service record.');
    }
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>Fleet & Vehicle Registry</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Payload limits, engine fuel types, scheduled maintenance tracking, and transit statuses
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchVehicles} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {['ADMIN', 'MANAGER'].includes(user?.role) && (
            <button onClick={() => setRegisterModalOpen(true)} className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Plus size={16} /> Register Vehicle
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Registration Number</th>
                <th style={{ padding: '0.75rem 1rem' }}>Vehicle Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Capacity (kg)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Fuel / Engine</th>
                <th style={{ padding: '0.75rem 1rem' }}>Mileage (km)</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Maintenance</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading vehicle registry...
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No fleet vehicles registered. Click "Register Vehicle" to add one.
                  </td>
                </tr>
              ) : (
                vehicles.map((v) => (
                  <tr key={v.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                      {v.registration_number}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#fff', fontWeight: 500 }}>
                      {v.vehicle_type}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {v.capacity_kg} kg
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {v.fuel_type}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {v.mileage_km.toLocaleString()} km
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${
                        v.status === 'AVAILABLE' ? 'badge-success' :
                        v.status === 'IN_TRANSIT' ? 'badge-info' :
                        v.status === 'MAINTENANCE' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenMaintenance(v)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                      >
                        <Wrench size={13} /> Service Log
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Vehicle Modal */}
      {registerModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>Register Fleet Vehicle</h3>
              <button onClick={() => setRegisterModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRegisterVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRK-5501"
                  value={newVehicle.registration_number}
                  onChange={(e) => setNewVehicle({ ...newVehicle, registration_number: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Vehicle Type</label>
                  <select
                    value={newVehicle.vehicle_type}
                    onChange={(e) => setNewVehicle({ ...newVehicle, vehicle_type: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  >
                    <option value="BIKE">Cargo Bike</option>
                    <option value="VAN">Delivery Van</option>
                    <option value="TRUCK">Medium Truck</option>
                    <option value="HEAVY_TRAILER">Heavy Semi-Trailer</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Fuel Type</label>
                  <select
                    value={newVehicle.fuel_type}
                    onChange={(e) => setNewVehicle({ ...newVehicle, fuel_type: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="Electric">Electric (EV)</option>
                    <option value="Petrol">Petrol</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Payload Capacity (kg)</label>
                  <input
                    type="number"
                    step="10"
                    required
                    value={newVehicle.capacity_kg}
                    onChange={(e) => setNewVehicle({ ...newVehicle, capacity_kg: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Current Mileage (km)</label>
                  <input
                    type="number"
                    value={newVehicle.mileage_km}
                    onChange={(e) => setNewVehicle({ ...newVehicle, mileage_km: e.target.value })}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setRegisterModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {maintModalOpen && selectedVehicle && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>Vehicle Maintenance Dossier</h3>
                <span style={{ fontFamily: 'monospace', color: '#38bdf8', fontSize: '0.9rem' }}>
                  {selectedVehicle.registration_number} ({selectedVehicle.vehicle_type})
                </span>
              </div>
              <button onClick={() => setMaintModalOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Past Maintenance Records */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>Service History</h4>
              {maintRecords.length === 0 ? (
                <div style={{ padding: '1.5rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No maintenance records logged for this vehicle yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {maintRecords.map((m) => (
                    <div key={m.id} style={{ padding: '0.75rem 1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{m.service_date}</span>
                        <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 600 }}>${m.cost}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{m.description}</div>
                      {m.next_service_date && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                          Next scheduled: {m.next_service_date}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Log New Service Form */}
            {['ADMIN', 'MANAGER'].includes(user?.role) && (
              <form onSubmit={handleAddMaintenance} style={{ padding: '1rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.75rem' }}>
                  Log New Service Event
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Service Date</label>
                    <input type="date" required value={newMaint.service_date} onChange={(e) => setNewMaint({ ...newMaint, service_date: e.target.value })} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Cost ($)</label>
                    <input type="number" step="0.5" required value={newMaint.cost} onChange={(e) => setNewMaint({ ...newMaint, cost: e.target.value })} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }} />
                  </div>
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Service Description *</label>
                  <input type="text" required placeholder="e.g. Brake pad inspection, synthetic oil change, tire rotation" value={newMaint.description} onChange={(e) => setNewMaint({ ...newMaint, description: e.target.value })} style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.85rem' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}>
                    Record Maintenance
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
