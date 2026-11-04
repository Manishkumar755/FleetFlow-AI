import React, { useState, useEffect } from 'react';
import { Server, Cpu, CheckCircle2, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FASTAPI_BASE_URL } from '../api/client';

export default function Header({ djangoOnline, fastapiOnline }) {
  const { user } = useAuth();
  const [mlStatus, setMlStatus] = useState('Waking up...');

  useEffect(() => {
    let isMounted = true;
    let retryTimer = null;
    const healthUrl = `${FASTAPI_BASE_URL}/health`;

    const updateStatus = (status) => {
      if (!isMounted) return;
      setMlStatus(status);
      console.log(`ML health: ${status} ${healthUrl}`);
    };

    const performHealthCheck = async () => {
      updateStatus('Waking up...');

      // First attempt with 60000ms timeout for cold start
      try {
        const res = await axios.get(healthUrl, { timeout: 60000 });
        if (res.status === 200) {
          updateStatus('Online');
          return;
        }
      } catch (err) {
        // First attempt failed; proceed to retry
      }

      if (!isMounted) return;

      // Wait 5 seconds and retry once
      retryTimer = setTimeout(async () => {
        if (!isMounted) return;
        try {
          const retryRes = await axios.get(healthUrl, { timeout: 60000 });
          if (retryRes.status === 200) {
            updateStatus('Online');
            return;
          }
          updateStatus('Offline');
        } catch (retryErr) {
          updateStatus('Offline');
        }
      }, 5000);
    };

    performHealthCheck();

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
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
              <XCircle size={12} /> Waking up...
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
