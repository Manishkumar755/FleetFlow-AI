import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Server, Cpu, Database, CheckCircle, RefreshCw, Globe, Shield } from 'lucide-react';
import { djangoClient, fastapiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState({
    django: { status: 'checking', latency: null, version: '', dbEngine: '' },
    fastapi: { status: 'checking', latency: null, version: '', modelsCount: 0 },
  });
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);

    // Test Django
    const dStart = performance.now();
    try {
      const dRes = await djangoClient.get('/api/health/');
      const dTime = Math.round(performance.now() - dStart);
      setDiagnostics((prev) => ({
        ...prev,
        django: {
          status: 'healthy',
          latency: dTime,
          version: dRes.data.version || '1.0.0',
          dbEngine: dRes.data.database?.engine || 'PostgreSQL',
        },
      }));
    } catch {
      setDiagnostics((prev) => ({
        ...prev,
        django: { status: 'unreachable', latency: null, version: '', dbEngine: 'N/A' },
      }));
    }

    // Test FastAPI
    const fStart = performance.now();
    try {
      const fRes = await fastapiClient.get('/health');
      const fTime = Math.round(performance.now() - fStart);
      const loadedCount = Object.values(fRes.data.models_loaded || {}).filter(Boolean).length;
      setDiagnostics((prev) => ({
        ...prev,
        fastapi: {
          status: 'healthy',
          latency: fTime,
          version: fRes.data.version || '1.0.0',
          modelsCount: loadedCount,
        },
      }));
    } catch {
      setDiagnostics((prev) => ({
        ...prev,
        fastapi: { status: 'unreachable', latency: null, version: '', modelsCount: 0 },
      }));
    }

    setTesting(false);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <div className="page-content">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>
            Platform Settings & System Diagnostics
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Service health telemetry, microservice connectivity, and free-tier cloud deployment configuration
          </p>
        </div>
        <button onClick={runDiagnostics} disabled={testing} className="btn btn-secondary" style={{ gap: '0.4rem' }}>
          <RefreshCw size={14} /> {testing ? 'Testing...' : 'Run Diagnostics'}
        </button>
      </div>

      {/* Diagnostics Cards */}
      <div className="grid-cols-2" style={{ marginBottom: '1.75rem' }}>
        {/* Django Backend Diagnostics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={18} color="#60a5fa" />
              Django 5 REST Backend
            </h3>
            <span className={`badge ${diagnostics.django.status === 'healthy' ? 'badge-success' : 'badge-danger'}`}>
              {diagnostics.django.status}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Endpoint</span>
              <span style={{ fontFamily: 'monospace', color: '#fff' }}>http://localhost:8000</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ping Latency</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>{diagnostics.django.latency ? `${diagnostics.django.latency} ms` : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Database Connection</span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{diagnostics.django.dbEngine}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Release Tag</span>
              <span style={{ color: '#fff' }}>{diagnostics.django.version}</span>
            </div>
          </div>
        </div>

        {/* FastAPI ML Microservice Diagnostics */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Cpu size={18} color="#a78bfa" />
              FastAPI ML Microservice
            </h3>
            <span className={`badge ${diagnostics.fastapi.status === 'healthy' ? 'badge-success' : 'badge-danger'}`}>
              {diagnostics.fastapi.status}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Target Endpoint</span>
              <span style={{ fontFamily: 'monospace', color: '#fff' }}>http://localhost:8001</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ping Latency</span>
              <span style={{ color: '#34d399', fontWeight: 600 }}>{diagnostics.fastapi.latency ? `${diagnostics.fastapi.latency} ms` : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Active Serialized Models</span>
              <span style={{ color: '#a78bfa', fontWeight: 600 }}>{diagnostics.fastapi.modelsCount} / 3 Loaded</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Interactive Docs</span>
              <a href="http://localhost:8001/docs" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'underline' }}>
                Open Swagger UI
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Free-Tier Cloud Deployment Strategy */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Globe size={18} color="#06b6d4" />
            Free-Tier Cloud Deployment Architecture
          </h3>
          <span className="badge badge-success">Zero Cloud Hosting Cost</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Frontend SPA</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>Vercel Free Tier</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Continuous deployment via Git repository. Global edge CDN caching, automatic HTTPS, sub-second TTFB.
            </p>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase' }}>Backend & ML</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>Render Free Web Services</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Independent containers for Django REST API and FastAPI ML microservice. Native Docker buildpacks with automated spin-up.
            </p>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>Managed Database</span>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginTop: '0.25rem' }}>Supabase / Neon Postgres</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              PostgreSQL 16 cloud database with automated daily backups, connection pooling, and 500MB free storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
