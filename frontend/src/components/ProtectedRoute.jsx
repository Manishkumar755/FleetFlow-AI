import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="page-content">
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff' }}>Access Restricted</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Your current role (<strong style={{ color: 'var(--accent-cyan)' }}>{user.role}</strong>) does not have sufficient permissions to view this resource.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-dim)' }}>
            Required roles: {allowedRoles.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return children;
}
