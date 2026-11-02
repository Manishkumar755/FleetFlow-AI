import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Shield, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { djangoClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [message, setMessage] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await djangoClient.get('/api/auth/users/');
      setUsers(res.data);
    } catch (err) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    setMessage('');
    try {
      await djangoClient.patch(`/api/auth/users/${userId}/role/`, { role: newRole });
      setMessage(`Role updated to ${newRole}`);
      fetchUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update role.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>User & Access Control Directory</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage organization members, assign roles (Admin, Manager, Driver, Customer), and review permissions
          </p>
        </div>
        <button onClick={fetchUsers} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {message && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)', color: '#34d399', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          <CheckCircle size={16} />
          <span>{message}</span>
        </div>
      )}

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 1rem' }}>User / Full Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Email Address</th>
                <th style={{ padding: '0.75rem 1rem' }}>Phone</th>
                <th style={{ padding: '0.75rem 1rem' }}>Current Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                {currentUser?.role === 'ADMIN' && (
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Role Assignment</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{u.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : 'No display name'}
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                      {u.phone || '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${
                        u.role === 'ADMIN' ? 'badge-danger' :
                        u.role === 'MANAGER' ? 'badge-info' :
                        u.role === 'DRIVER' ? 'badge-warning' : 'badge-success'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ fontSize: '0.8rem', color: u.is_active ? '#34d399' : '#fb7185', fontWeight: 500 }}>
                        {u.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    {currentUser?.role === 'ADMIN' && (
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <select
                          disabled={updatingId === u.id || u.id === currentUser.id}
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: '#fff',
                            fontSize: '0.8rem',
                          }}
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="DRIVER">DRIVER</option>
                          <option value="CUSTOMER">CUSTOMER</option>
                        </select>
                      </td>
                    )}
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
