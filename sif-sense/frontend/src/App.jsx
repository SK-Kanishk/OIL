import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Analyzer from './pages/Analyzer';
import Dashboard from './pages/Dashboard';
import AlertCenter from './pages/AlertCenter';
import HSEReview from './pages/HSEReview';
import Reports from './pages/Reports';
import ModelInsights from './pages/ModelInsights';
import { getAlerts, getDatabaseStatus, updateDatabaseConnection } from './services/api';

const NAV_ITEMS = [
  { path: '/',         icon: '🧠', label: 'Analyzer',    exact: true },
  { path: '/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/model',    icon: '⚡', label: 'OSHA Model' },
  { path: '/alerts',   icon: '🚨', label: 'Alerts & Review' },
  { path: '/reports',  icon: '📄', label: 'Report Log' },
];

const PAGE_META = {
  '/':          { title: 'SIF Analyzer',    sub: 'Real-time incident evaluation powered by OSHA ML model' },
  '/dashboard': { title: 'Command Center',  sub: 'Live SIF intelligence & precursor hotspot trends' },
  '/model':     { title: 'OSHA AI Telemetry', sub: 'Trained on 105,996 severe workplace injury records' },
  '/alerts':    { title: 'Alerts & Actions', sub: 'Active SIF early warnings & human-in-the-loop review' },
  '/review':    { title: 'HSE Review',      sub: 'Audit decisions & mitigation trail' },
  '/reports':   { title: 'Incident Log',    sub: 'Historical reports with export & inspection' },
};

/* ─────────────────── TOPBAR ─────────────────────────────────────────────── */
function Topbar({ onMenuClick, pendingAlerts, dbStatus, onOpenDbModal }) {
  const loc = useLocation();
  const meta = PAGE_META[loc.pathname] || { title: 'SIF-Sense AI', sub: '' };
  const [downloadOpen, setDownloadOpen] = useState(false);

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuClick} aria-label="Toggle menu">
          ☰
        </button>
        <div>
          <div className="topbar-title">{meta.title}</div>
          <div className="topbar-subtitle">{meta.sub}</div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Download Bundle & PDFs Button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setDownloadOpen(prev => !prev)}
            style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.25))',
              border: '1px solid rgba(168, 85, 247, 0.45)',
              borderRadius: 20,
              padding: '5px 12px',
              fontSize: '0.74rem',
              color: '#d8b4fe',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s ease'
            }}
            title="Download full project zip and PDF documentation"
          >
            <span>📥 Download Project & PDFs</span>
          </button>

          {downloadOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '120%',
                width: 270,
                background: '#0f172a',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: 12,
                padding: '10px',
                zIndex: 9999,
                boxShadow: '0 12px 36px rgba(0,0,0,0.65)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Available Downloads
              </div>

              <a
                href="http://localhost:8000/api/download/project-zip"
                download="SIF_Sense_AI_Project_Bundle.zip"
                onClick={() => setDownloadOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 8,
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  color: '#f8fafc',
                  textDecoration: 'none',
                  fontSize: '0.78rem'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📦</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#a5b4fc' }}>Full Project (.zip)</div>
                  <div style={{ fontSize: '0.67rem', color: '#cbd5e1' }}>Complete Code + Trained ML (2.5 MB)</div>
                </div>
              </a>

              <a
                href="http://localhost:8000/api/download/technical-pdf"
                download="SIF_Sense_AI_Technical_Deep_Dive_and_Storage_Architecture.pdf"
                onClick={() => setDownloadOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 8,
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  color: '#f8fafc',
                  textDecoration: 'none',
                  fontSize: '0.78rem'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#38bdf8' }}>Architecture & Storage PDF</div>
                  <div style={{ fontSize: '0.67rem', color: '#cbd5e1' }}>OSHA Science & 512MB Strategy</div>
                </div>
              </a>

              <a
                href="http://localhost:8000/api/download/user-guide-pdf"
                download="SIF_Sense_AI_Complete_User_and_Operation_Guide.pdf"
                onClick={() => setDownloadOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  borderRadius: 8,
                  background: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  color: '#f8fafc',
                  textDecoration: 'none',
                  fontSize: '0.78rem'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📘</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#34d399' }}>User Operation Guide PDF</div>
                  <div style={{ fontSize: '0.67rem', color: '#cbd5e1' }}>Page-by-page system manual</div>
                </div>
              </a>
            </div>
          )}
        </div>

        {/* Database Pill */}
        <button
          onClick={onOpenDbModal}
          style={{
            background: dbStatus?.connected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.12)',
            border: `1px solid ${dbStatus?.connected ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.3)'}`,
            borderRadius: 20,
            padding: '4px 10px',
            fontSize: '0.72rem',
            color: dbStatus?.connected ? '#34d399' : '#818cf8',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5
          }}
          title="Click to view or configure MongoDB connection"
        >
          <span>🍃 {dbStatus?.connected ? 'MongoDB' : 'DB Ready'}</span>
        </button>

        {pendingAlerts > 0 && (
          <NavLink to="/alerts" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 20, padding: '4px 10px', fontSize: '0.72rem', color: '#f87171',
              fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer'
            }}>
              <span style={{
                display: 'inline-block', width: 7, height: 7,
                background: '#ef4444', borderRadius: '50%',
                boxShadow: '0 0 6px #ef4444'
              }} />
              {pendingAlerts}
            </div>
          </NavLink>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── DESKTOP/TABLET SIDEBAR ─────────────────────────────── */
function Sidebar({ open, onClose, dbStatus, onOpenDbModal }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${open ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-text">⚡ SIF-Sense AI</div>
          <div className="logo-sub">OSHA 2015–2025 Intelligence</div>
        </div>

        <div className="live-badge" onClick={onOpenDbModal} style={{ cursor: 'pointer' }}>
          <span className="live-dot" />
          <span className="live-badge-text">
            {dbStatus?.connected ? 'MONGODB SYNCED' : 'OSHA 106k MODEL'}
          </span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              onClick={isMobile ? onClose : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className="ai-status-card"
            onClick={onOpenDbModal}
            style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            <div className="ai-status-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🍃 Database</span>
              <span style={{ fontSize: '0.65rem', color: dbStatus?.connected ? '#10b981' : '#f59e0b', fontWeight: 700 }}>
                {dbStatus?.connected ? 'MONGODB' : 'SQLITE'}
              </span>
            </div>
            <div className="ai-status-row" style={{ fontSize: '0.72rem' }}>
              User: <strong style={{ color: '#e2e8f0' }}>kanishkskcet_db_user</strong>
            </div>
            <div className="ai-status-row" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Click to configure / test
            </div>
          </div>

          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <a
              href="http://localhost:8000/api/download/project-zip"
              download="SIF_Sense_AI_Project_Bundle.zip"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                color: '#e2e8f0',
                fontSize: '0.72rem',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>📦 Download Project (.zip)</span>
            </a>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <a
                href="http://localhost:8000/api/download/technical-pdf"
                download="SIF_Sense_AI_Technical_Deep_Dive_and_Storage_Architecture.pdf"
                style={{
                  textAlign: 'center',
                  padding: '5px 4px',
                  borderRadius: 6,
                  background: 'rgba(56, 189, 248, 0.1)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  color: '#38bdf8',
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                📄 Tech PDF
              </a>
              <a
                href="http://localhost:8000/api/download/user-guide-pdf"
                download="SIF_Sense_AI_Complete_User_and_Operation_Guide.pdf"
                style={{
                  textAlign: 'center',
                  padding: '5px 4px',
                  borderRadius: 6,
                  background: 'rgba(52, 211, 153, 0.1)',
                  border: '1px solid rgba(52, 211, 153, 0.2)',
                  color: '#34d399',
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                📘 Guide PDF
              </a>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────── MOBILE BOTTOM NAV ──────────────────────────────────── */
function BottomNav() {
  const loc = useLocation();
  return (
    <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
      {NAV_ITEMS.map(item => {
        const isActive = item.exact
          ? loc.pathname === item.path
          : loc.pathname.startsWith(item.path);
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={`bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="bnav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/* ─────────────────── DATABASE MODAL ─────────────────────────────────────── */
function DatabaseModal({ open, onClose, dbStatus, onRefresh }) {
  const [host, setHost] = useState(dbStatus?.active_host || 'cluster0.mongodb.net');
  const [customUri, setCustomUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!open) return null;

  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await updateDatabaseConnection({
        host: host.trim() || undefined,
        uri: customUri.trim() || undefined
      });
      setMsg({
        success: res.data.success,
        text: res.data.success ? 'Connected to MongoDB Atlas!' : `Status: ${res.data.message}`
      });
      onRefresh();
    } catch (err) {
      setMsg({ success: false, text: 'Connection request failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: 16
    }}>
      <div className="card" style={{ maxWidth: 480, width: '100%', padding: '1.5rem', background: '#0f172a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.3rem' }}>🍃</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>MongoDB Configuration</h3>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div style={{
          background: dbStatus?.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: `1px solid ${dbStatus?.connected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
          borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: '0.78rem'
        }}>
          <div><strong>Status:</strong> {dbStatus?.connected ? '✓ Connected to MongoDB Atlas' : '○ Standby / Local SQLite Active'}</div>
          <div><strong>User:</strong> kanishkskcet_db_user</div>
          <div><strong>Database:</strong> sif_sense</div>
        </div>

        <form onSubmit={handleConnect}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              MongoDB Atlas Cluster Host
            </label>
            <input
              type="text"
              className="input-field"
              style={{ width: '100%', fontSize: '0.82rem', padding: '8px 10px' }}
              placeholder="e.g. cluster0.abcde.mongodb.net"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
              Or Full MongoDB URI (optional)
            </label>
            <input
              type="text"
              className="input-field"
              style={{ width: '100%', fontSize: '0.82rem', padding: '8px 10px' }}
              placeholder="mongodb+srv://kanishkskcet_db_user:password@cluster.mongodb.net/..."
              value={customUri}
              onChange={(e) => setCustomUri(e.target.value)}
            />
          </div>

          {msg && (
            <div style={{
              padding: '8px 12px', borderRadius: 6, fontSize: '0.76rem', marginBottom: 12,
              background: msg.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: msg.success ? '#34d399' : '#f87171'
            }}>
              {msg.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
              Close
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? 'Testing Connection...' : 'Test & Connect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────── APP ROOT ───────────────────────────────────────────── */
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [dbStatus, setDbStatus] = useState(null);
  const [dbModalOpen, setDbModalOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 640) setSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const refreshStatus = async () => {
    try {
      const [al, db] = await Promise.all([
        getAlerts('PENDING'),
        getDatabaseStatus()
      ]);
      setPendingAlerts(al.data.length);
      setDbStatus(db.data);
    } catch (_) {}
  };

  useEffect(() => {
    refreshStatus();
    const iv = setInterval(refreshStatus, 20000);
    return () => clearInterval(iv);
  }, []);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          dbStatus={dbStatus}
          onOpenDbModal={() => setDbModalOpen(true)}
        />

        <div className="main-content" id="main-content">
          <Topbar
            onMenuClick={() => setSidebarOpen(v => !v)}
            pendingAlerts={pendingAlerts}
            dbStatus={dbStatus}
            onOpenDbModal={() => setDbModalOpen(true)}
          />

          <Routes>
            <Route path="/" element={<Analyzer onNewAlert={() => setPendingAlerts(p => p + 1)} />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/model" element={<ModelInsights />} />
            <Route path="/alerts" element={<AlertCenter />} />
            <Route path="/review" element={<HSEReview />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>

        <BottomNav />

        <DatabaseModal
          open={dbModalOpen}
          onClose={() => setDbModalOpen(false)}
          dbStatus={dbStatus}
          onRefresh={refreshStatus}
        />
      </div>
    </BrowserRouter>
  );
}
