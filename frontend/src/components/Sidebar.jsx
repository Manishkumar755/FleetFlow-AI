import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  UserCheck,
  Truck,
  Activity,
  AlertTriangle,
  BarChart3,
  Settings,
  Search,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/', label: 'Command Center', icon: LayoutDashboard },
    { to: '/shipments', label: 'Shipments', icon: Package },
    { to: '/tracking', label: 'Live Map & Fleet', icon: MapPin },
    { to: '/drivers', label: 'Drivers', icon: UserCheck, roles: ['ADMIN', 'MANAGER'] },
    { to: '/vehicles', label: 'Vehicles & Fleet', icon: Truck, roles: ['ADMIN', 'MANAGER'] },
    { to: '/predictions', label: 'AI Delay & ETA', icon: Activity },
    { to: '/anomalies', label: 'Anomaly Alerts', icon: AlertTriangle },
    { to: '/analytics', label: 'Analytics & KPIs', icon: BarChart3 },
    { to: '/users', label: 'User Directory', icon: Users, roles: ['ADMIN', 'MANAGER'] },
    { to: '/settings', label: 'Platform Settings', icon: Settings, roles: ['ADMIN'] },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Truck size={22} />
        </div>
        <div>
          <span className="brand-name">FleetFlow</span>
          <span className="brand-tag">AI</span>
        </div>
      </div>

      <ul className="nav-links">
        {navItems.map((item) => {
          if (item.roles && (!user || !item.roles.includes(user.role))) {
            return null;
          }
          const Icon = item.icon;
          return (
            <li key={item.to} className="nav-item">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            </li>
          );
        })}

        <li className="nav-item" style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
          <NavLink to="/portal" target="_blank" rel="noopener noreferrer">
            <Search size={18} />
            <span>Public Tracking</span>
          </NavLink>
        </li>
      </ul>

      {user && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.username}
              </div>
              <span
                className="badge"
                style={{
                  background: 'rgba(37, 99, 235, 0.2)',
                  color: '#60a5fa',
                  fontSize: '0.65rem',
                  padding: '1px 6px',
                  marginTop: '2px',
                }}
              >
                {user.role}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="btn btn-secondary"
              style={{ padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
