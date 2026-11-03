import React, { useState, useEffect } from 'react';
import { Server, Cpu, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FASTAPI_BASE_URL } from '../api/client';

export default function Header({ djangoOnline, fastapiOnline }) {
  const { user } = useAuth();
  const [mlStatus, setMlStatus] = useState('Checking...');

  useEffect(() => {
    let isMounted = true;
    const healthUrl = `${FASTAPI_BASE_URL}/health`;
    console.log(`ML health check URL: ${healthUrl}`);

    axios
      .get(healthUrl, { timeout: 5000 })
      .then((res) => {
        if (!isMounted) return;
        if (res.status === 200) {
          setMlStatus('Online');
        } else {
          setMlStatus('Offline');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setMlStatus('Offline');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff' }}>
          Smart Logistics & Predictive Intelligence
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Service Status Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            background: 'var(--bg-card)',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem',
          }}
        >
          <Server size={14} color="#60a5fa" />
          <span style={{ color: 'var(--text-muted)' }}>Django Backend:</span>
          {djangoOnline ? (
            <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <CheckCircle2 size={12} /> Online
            </span>
          ) : (
            <span style={{ color: '#fb7185', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <XCircle size={12} /> Checking...
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.75rem',
            background: 'var(--bg-card)',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem',
          }}
        >
          <Cpu size={14} color="#a78bfa" />
          <span style={{ color: 'var(--text-muted)' }}>FastAPI ML:</span>
          {mlStatus === 'Online' ? (
            <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <CheckCircle2 size={12} /> Online
            </span>
          ) : mlStatus === 'Offline' ? (
            <span style={{ color: '#fb7185', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <XCircle size={12} /> Offline
            </span>
          ) : (
            <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
              <XCircle size={12} /> Checking...
            </span>
          )}
        </div>

        {user && (
          <div
            style={{
              padding: '0.35rem 0.85rem',
              background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(6,182,212,0.2))',
              border: '1px solid rgba(6,182,212,0.3)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: '#38bdf8',
            }}
          >
            {user.role}
          </div>
        )}
      </div>
    </header>
  );
}
