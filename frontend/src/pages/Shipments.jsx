import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, Filter, RefreshCw, Eye, AlertTriangle } from 'lucide-react';
import { djangoClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CreateShipmentModal from '../components/CreateShipmentModal';
import ShipmentDetailModal from '../components/ShipmentDetailModal';

export default function Shipments() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedShipmentId, setSelectedShipmentId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const fetchShipments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('page_size', 15);
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (riskFilter) params.append('delay_risk', riskFilter);

      const res = await djangoClient.get(`/api/shipments/?${params.toString()}`);
      if (res.data.results) {
        setShipments(res.data.results);
        setCount(res.data.count);
      } else {
        setShipments(res.data);
        setCount(res.data.length);
      }
    } catch (err) {
      console.warn('Failed to load shipments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, [page, statusFilter, riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchShipments();
  };

  const handleOpenDetail = (id) => {
    setSelectedShipmentId(id);
    setDetailModalOpen(true);
  };

  return (
    <div className="page-content">
      {/* Title & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>Consignment & Shipment Operations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage lifecycle, assign fleet vehicles, and monitor AI delay risk scores
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchShipments} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          {['ADMIN', 'MANAGER'].includes(user?.role) && (
            <button onClick={() => setCreateModalOpen(true)} className="btn btn-primary" style={{ gap: '0.4rem' }}>
              <Plus size={16} /> New Consignment
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 250px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Tracking ID, Sender, Receiver..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.4rem',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.875rem' }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELAYED">Delayed</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => { setRiskFilter(e.target.value); setPage(1); }}
            style={{ padding: '0.55rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: '0.875rem' }}
          >
            <option value="">All AI Risks</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1rem' }}>
            Filter
          </button>
        </form>
      </div>

      {/* Main Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Tracking ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Sender</th>
                <th style={{ padding: '0.75rem 1rem' }}>Destination</th>
                <th style={{ padding: '0.75rem 1rem' }}>Weight & Priority</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Delay Risk</th>
                <th style={{ padding: '0.75rem 1rem' }}>Assigned Driver & Fleet</th>
                <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading consignments...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No shipments match the current criteria.
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => handleOpenDetail(s.id)}
                    style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 600 }}>
                      {s.tracking_id}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#fff', fontWeight: 500 }}>
                      {s.sender_name}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ color: '#fff' }}>{s.receiver_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{s.receiver_address?.slice(0, 30)}...</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ color: '#fff' }}>{s.weight_kg} kg</div>
                      <span style={{ fontSize: '0.75rem', color: s.priority === 'URGENT' ? '#fb7185' : 'var(--text-muted)' }}>
                        {s.priority}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${
                        s.status === 'DELIVERED' ? 'badge-success' :
                        s.status === 'IN_TRANSIT' ? 'badge-info' :
                        s.status === 'DELAYED' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${
                        s.delay_risk === 'HIGH' ? 'badge-danger' :
                        s.delay_risk === 'MEDIUM' ? 'badge-warning' : 'badge-success'
                      }`}>
                        {s.delay_risk || 'LOW'}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <div>{s.driver_name || '—'}</div>
                      <div style={{ color: 'var(--text-dim)' }}>{s.vehicle_reg || '—'}</div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenDetail(s.id); }}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                      >
                        <Eye size={12} /> Dossier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {count > 15 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {shipments.length} of {count} consignments
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              >
                Previous
              </button>
              <button
                disabled={page * 15 >= count}
                onClick={() => setPage(page + 1)}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateShipmentModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => { setPage(1); fetchShipments(); }}
      />

      <ShipmentDetailModal
        shipmentId={selectedShipmentId}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onUpdated={fetchShipments}
      />
    </div>
  );
}
