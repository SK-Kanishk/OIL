import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAlerts, reviewAlert } from '../services/api';

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [notesModal, setNotesModal] = useState(null); // { alertId, action, title }
  const [actionNote, setActionNote] = useState('');

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAlerts(statusFilter || undefined);
      setAlerts(res.data);
    } catch (_) {}
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const handleAction = async (alertId, action, notes = '') => {
    try {
      setActioningId(alertId);
      await reviewAlert(alertId, action, notes || undefined);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      setNotesModal(null);
      setActionNote('');
    } catch (err) {
      alert('Failed to update alert: ' + (err.response?.data?.detail || err.message));
    } finally {
      setActioningId(null);
    }
  };

  const filtered = alerts.filter(a =>
    !search ||
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.location?.toLowerCase().includes(search.toLowerCase()) ||
    a.activity?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Top Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: '1.5rem'
      }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(15, 23, 42, 0.6)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
          {[
            { key: 'PENDING', label: '⚠️ Pending Action' },
            { key: 'ACCEPTED', label: '✓ Accepted' },
            { key: 'ESCALATED', label: '🚨 Escalated' },
            { key: 'REJECTED', label: '✕ Dismissed' },
            { key: '', label: 'All Alerts' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              style={{
                background: statusFilter === tab.key ? 'var(--primary)' : 'transparent',
                color: statusFilter === tab.key ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 7,
                padding: '6px 12px',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="text"
            placeholder="Search alerts by site, activity..."
            className="input-field"
            style={{ width: 240, fontSize: '0.8rem', padding: '6px 12px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {filtered.length} alert{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)' }}>Loading alerts...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🛡️</div>
          <h3 style={{ margin: '0 0 6px 0', color: '#f1f5f9' }}>No Alerts Found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            {statusFilter === 'PENDING'
              ? 'All SIF precursor warnings have been reviewed and addressed!'
              : 'No alerts matching the selected filter criteria.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((alert, idx) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="card"
              style={{
                padding: '1.25rem 1.5rem',
                borderLeft: `4px solid ${alert.risk_level === 'CRITICAL' ? '#ef4444' : '#f97316'}`,
                background: 'rgba(30, 41, 59, 0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: alert.risk_level === 'CRITICAL' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                      color: alert.risk_level === 'CRITICAL' ? '#fca5a5' : '#fed7aa',
                      letterSpacing: '0.05em'
                    }}>
                      SIF EARLY WARNING #{alert.id}
                    </span>
                    <span className={`status-badge ${alert.status}`}>{alert.status}</span>
                  </div>
                  <h3 style={{ margin: '4px 0 0 0', fontSize: '1.05rem', color: '#f8fafc' }}>
                    {alert.title}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    lineHeight: 1,
                    color: alert.risk_level === 'CRITICAL' ? '#ef4444' : '#f97316'
                  }}>
                    {alert.risk_score}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SCORE / 100</div>
                </div>
              </div>

              {/* Context row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>LOCATION</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9', marginTop: 2 }}>📍 {alert.location || 'Site Unspecified'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ACTIVITY</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9', marginTop: 2 }}>⚙️ {alert.activity || 'General Operations'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>BARRIER FAILURE</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fca5a5', marginTop: 2 }}>🚫 {alert.barrier_failure || 'Control Absent'}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: 6 }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SIMILAR REPORTS</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9', marginTop: 2 }}>🔁 {alert.related_reports_count || 0} repeat cases</div>
                </div>
              </div>

              {/* AI Recommendation */}
              {alert.ai_recommendation && (
                <div style={{
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  color: '#e0e7ff',
                  marginBottom: 12
                }}>
                  💡 <strong>Recommended Action:</strong> {alert.ai_recommendation}
                </div>
              )}

              {/* Existing HSE Notes if already reviewed */}
              {alert.hse_notes && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.76rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 12
                }}>
                  📝 <strong>HSE Notes:</strong> {alert.hse_notes}
                </div>
              )}

              {/* Footer & 1-Click Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Report #{alert.report_id} · Triggered {new Date(alert.created_at).toLocaleString()}
                </span>

                {alert.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                      disabled={actioningId === alert.id}
                      onClick={() => handleAction(alert.id, 'ACCEPT')}
                    >
                      ✓ Accept & Mitigate
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171' }}
                      disabled={actioningId === alert.id}
                      onClick={() => setNotesModal({ alertId: alert.id, action: 'ESCALATE', title: alert.title })}
                    >
                      🚨 Escalate to Leadership
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      disabled={actioningId === alert.id}
                      onClick={() => handleAction(alert.id, 'REJECT')}
                    >
                      ✕ Dismiss
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Escalation / Notes Modal */}
      {notesModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div className="card" style={{ maxWidth: 460, width: '100%', padding: '1.5rem', background: '#0f172a' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc' }}>
              🚨 Escalate SIF Warning
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
              Provide instructions or justification for escalating: <strong>{notesModal.title}</strong>
            </p>

            <textarea
              className="input-field"
              style={{ width: '100%', minHeight: 90, padding: '8px', fontSize: '0.85rem', marginBottom: 14 }}
              placeholder="e.g. Work stopped immediately. Site safety director notified. Awaiting secondary gas isolation test."
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setNotesModal(null)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ background: '#ef4444' }}
                onClick={() => handleAction(notesModal.alertId, notesModal.action, actionNote)}
              >
                Confirm Escalation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
