import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAlerts, reviewAlert } from '../services/api';

function ReviewCard({ alert, onReviewed }) {
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (a) => {
    setAction(a);
    setSubmitting(true);
    try {
      await reviewAlert(alert.id, a, notes);
      setDone(true);
      setTimeout(() => onReviewed(), 800);
    } catch (_) {}
    setSubmitting(false);
  };

  const isReviewed = alert.status !== 'PENDING';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card"
      style={{
        marginBottom: 20,
        borderColor: isReviewed || done ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
        opacity: done ? 0.6 : 1,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--critical)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            🚨 SIF Alert #{alert.id}
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>{alert.title}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '2.4rem', fontWeight: 900,
            color: alert.risk_level === 'CRITICAL' ? 'var(--critical)' : 'var(--high)',
            lineHeight: 1, marginBottom: 4
          }}>{alert.risk_score}</div>
          <span className={`risk-badge ${alert.risk_level}`}>{alert.risk_level}</span>
        </div>
      </div>

      <div className="sep" />

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
        {[
          { l: 'Location', v: alert.location || '—', i: '📍' },
          { l: 'Activity', v: alert.activity || '—', i: '⚙️' },
          { l: 'Barrier Failure', v: alert.barrier_failure || '—', i: '🚫' },
        ].map(d => (
          <div key={d.l} className="entity-card">
            <div className="entity-label">{d.l}</div>
            <div className="entity-value">{d.i} {d.v}</div>
          </div>
        ))}
      </div>

      {/* AI Recommendation */}
      <div style={{
        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 12, padding: '14px', marginBottom: 20
      }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          🤖 AI Recommendation
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {alert.ai_recommendation}
        </div>
      </div>

      {!isReviewed && !done ? (
        <>
          {/* Notes */}
          <textarea
            className="textarea-report"
            style={{ minHeight: 80, marginBottom: 14 }}
            placeholder="HSE Notes (optional)..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }} className="hse-actions">
            <button
              className="btn btn-accept"
              disabled={submitting}
              onClick={() => handleSubmit('ACCEPT')}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {submitting && action === 'ACCEPT' ? '...' : '✅ Accept'}
            </button>
            <button
              className="btn btn-reject"
              disabled={submitting}
              onClick={() => handleSubmit('REJECT')}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {submitting && action === 'REJECT' ? '...' : '❌ Reject'}
            </button>
            <button
              className="btn btn-escalate"
              disabled={submitting}
              onClick={() => handleSubmit('ESCALATE')}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              {submitting && action === 'ESCALATE' ? '...' : '⬆️ Escalate'}
            </button>
          </div>

          <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            AI assists HSE professionals — it does not make independent safety decisions.
          </div>
        </>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px', background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12
        }}>
          <span style={{ fontSize: '1.5rem' }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--low)', fontSize: '0.9rem' }}>
              Action Recorded: {alert.status}
            </div>
            {alert.hse_notes && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Note: {alert.hse_notes}
              </div>
            )}
            {alert.reviewed_at && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Reviewed: {new Date(alert.reviewed_at).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function HSEReview() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAlerts();
      setAlerts(res.data);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const pending = alerts.filter(a => a.status === 'PENDING');
  const reviewed = alerts.filter(a => a.status !== 'PENDING');
  const displayed = showAll ? alerts : pending;

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <h1 className="page-title">👁️ HSE Review</h1>
      <p className="page-subtitle">Human-in-the-loop decision making for AI-flagged SIF alerts</p>

      {/* Doctrine note */}
      <div style={{
        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 14, padding: '16px 20px', marginBottom: 24,
        display: 'flex', alignItems: 'flex-start', gap: 14
      }}>
        <span style={{ fontSize: '1.8rem' }}>⚖️</span>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 4 }}>Human-in-the-Loop Principle</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            SIF-Sense AI identifies and prioritizes potential SIF precursors. Every alert requires a qualified HSE professional to
            review, accept, reject, or escalate before any action is taken. AI assists — it does not make safety-critical decisions.
          </div>
        </div>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className={`btn btn-sm ${!showAll ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowAll(false)}>
          🔔 Pending ({pending.length})
        </button>
        <button className={`btn btn-sm ${showAll ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowAll(true)}>
          📋 All Alerts ({alerts.length})
        </button>
        <button onClick={load} className="btn btn-sm btn-outline" style={{ marginLeft: 'auto' }}>↻ Refresh</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)' }}>Loading reviews...</div>
        </div>
      ) : displayed.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>All caught up!</div>
          <div className="empty-state-text">No pending alerts require review</div>
        </div>
      ) : (
        <AnimatePresence>
          {displayed.map(alert => (
            <ReviewCard key={alert.id} alert={alert} onReviewed={load} />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
