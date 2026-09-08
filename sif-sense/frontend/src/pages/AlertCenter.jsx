import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAlerts, reviewAlert } from '../services/api';

/* =========================================================
   SIF-SENSE — PREMIUM LIGHT ALERT CENTER
   ---------------------------------------------------------
   Features preserved:
   ✓ Load alerts
   ✓ Status filters
   ✓ Search
   ✓ Risk score
   ✓ Location / activity / barrier failure
   ✓ Similar reports
   ✓ AI recommendation
   ✓ HSE notes
   ✓ Accept
   ✓ Escalate with notes
   ✓ Dismiss
   ✓ Loading state
   ✓ Empty state
   ========================================================= */

const FILTERS = [
  {
    key: 'PENDING',
    label: 'Needs Action',
    description: 'Alerts waiting for review',
  },
  {
    key: 'ESCALATED',
    label: 'Escalated',
    description: 'Sent for leadership review',
  },
  {
    key: 'ACCEPTED',
    label: 'Accepted',
    description: 'Mitigation approved',
  },
  {
    key: 'REJECTED',
    label: 'Dismissed',
    description: 'Closed alerts',
  },
  {
    key: '',
    label: 'All Alerts',
    description: 'Complete alert history',
  },
];

function getRiskConfig(level) {
  switch ((level || '').toUpperCase()) {
    case 'CRITICAL':
      return {
        label: 'Critical Risk',
        shortLabel: 'Critical',
        color: '#DC2626',
        soft: '#FEF2F2',
        border: '#FECACA',
        icon: '!',
      };

    case 'HIGH':
      return {
        label: 'High Risk',
        shortLabel: 'High',
        color: '#EA580C',
        soft: '#FFF7ED',
        border: '#FED7AA',
        icon: '!',
      };

    case 'MODERATE':
    case 'MEDIUM':
      return {
        label: 'Moderate Risk',
        shortLabel: 'Moderate',
        color: '#CA8A04',
        soft: '#FEFCE8',
        border: '#FEF08A',
        icon: '!',
      };

    default:
      return {
        label: 'Risk Alert',
        shortLabel: 'Alert',
        color: '#2563EB',
        soft: '#EFF6FF',
        border: '#BFDBFE',
        icon: 'i',
      };
  }
}

function formatDate(dateValue) {
  if (!dateValue) return 'Time unavailable';

  try {
    return new Date(dateValue).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Time unavailable';
  }
}

function StatusBadge({ status }) {
  const styles = {
    PENDING: {
      text: 'Needs Action',
      color: '#B45309',
      background: '#FFFBEB',
      border: '#FDE68A',
    },

    ACCEPTED: {
      text: 'Accepted',
      color: '#047857',
      background: '#ECFDF5',
      border: '#A7F3D0',
    },

    ESCALATED: {
      text: 'Escalated',
      color: '#B91C1C',
      background: '#FEF2F2',
      border: '#FECACA',
    },

    REJECTED: {
      text: 'Dismissed',
      color: '#475569',
      background: '#F8FAFC',
      border: '#E2E8F0',
    },
  };

  const style = styles[status] || styles.PENDING;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 999,
        background: style.background,
        border: `1px solid ${style.border}`,
        color: style.color,
        fontSize: '0.72rem',
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: style.color,
        }}
      />

      {style.text}
    </span>
  );
}

function InfoItem({ label, value, icon, danger = false }) {
  return (
    <div
      className="alert-info-item"
      style={{
        background: '#F8FAFC',
        border: '1px solid #E8EEF5',
        borderRadius: 14,
        padding: '13px 14px',
        minHeight: 82,
      }}
    >
      <div
        style={{
          color: '#94A3B8',
          fontWeight: 700,
          fontSize: '0.67rem',
          letterSpacing: '0.055em',
          textTransform: 'uppercase',
          marginBottom: 7,
        }}
      >
        {label}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          color: danger ? '#B91C1C' : '#1E293B',
          fontSize: '0.82rem',
          fontWeight: 650,
          lineHeight: 1.4,
        }}
      >
        <span style={{ fontSize: '0.95rem', opacity: 0.8 }}>
          {icon}
        </span>

        <span>{value}</span>
      </div>
    </div>
  );
}

function EmptyState({ statusFilter }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5EAF1',
        borderRadius: 22,
        padding: '4rem 2rem',
        textAlign: 'center',
        boxShadow: '0 12px 34px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div
        style={{
          width: 68,
          height: 68,
          margin: '0 auto 18px',
          borderRadius: 20,
          display: 'grid',
          placeItems: 'center',
          background:
            'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
          border: '1px solid #DBEAFE',
          fontSize: '1.8rem',
        }}
      >
        ✓
      </div>

      <h3
        style={{
          margin: 0,
          color: '#0F172A',
          fontSize: '1.15rem',
          fontWeight: 800,
        }}
      >
        {statusFilter === 'PENDING'
          ? 'No alerts need attention'
          : 'No alerts found'}
      </h3>

      <p
        style={{
          color: '#64748B',
          maxWidth: 460,
          margin: '8px auto 0',
          lineHeight: 1.65,
          fontSize: '0.86rem',
        }}
      >
        {statusFilter === 'PENDING'
          ? 'All current SIF early warnings have been reviewed. New high-risk alerts will appear here automatically.'
          : 'There are no alerts matching the selected category or search terms.'}
      </p>
    </motion.div>
  );
}

export default function AlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const [notesModal, setNotesModal] = useState(null);
  const [actionNote, setActionNote] = useState('');

  /* =========================================================
     LOAD ALERTS
     ========================================================= */

  const loadAlerts = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getAlerts(statusFilter || undefined);
      setAlerts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Unable to load alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  /* =========================================================
     ACTION HANDLER
     ========================================================= */

  const handleAction = async (alertId, action, notes = '') => {
    try {
      setActioningId(alertId);

      await reviewAlert(
        alertId,
        action,
        notes?.trim() ? notes.trim() : undefined
      );

      setAlerts((prev) => prev.filter((item) => item.id !== alertId));

      setNotesModal(null);
      setActionNote('');
    } catch (err) {
      window.alert(
        'Failed to update alert: ' +
          (err.response?.data?.detail || err.message)
      );
    } finally {
      setActioningId(null);
    }
  };

  /* =========================================================
     SEARCH
     ========================================================= */

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return alerts;

    return alerts.filter((item) => {
      return [
        item.title,
        item.location,
        item.activity,
        item.barrier_failure,
        item.ai_recommendation,
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [alerts, search]);

  const criticalCount = useMemo(
    () =>
      filtered.filter(
        (item) => String(item.risk_level).toUpperCase() === 'CRITICAL'
      ).length,
    [filtered]
  );

  const highCount = useMemo(
    () =>
      filtered.filter(
        (item) => String(item.risk_level).toUpperCase() === 'HIGH'
      ).length,
    [filtered]
  );

  return (
    <div
      className="page-container alert-center-page animate-fade-in"
      style={{
        paddingBottom: '4rem',
        maxWidth: 1500,
        margin: '0 auto',
      }}
    >
      {/* =====================================================
          PAGE INTRO
          ===================================================== */}

      <section
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 20,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: '#EFF6FF',
              border: '1px solid #DBEAFE',
              color: '#2563EB',
              padding: '6px 11px',
              borderRadius: 999,
              fontSize: '0.7rem',
              fontWeight: 800,
              letterSpacing: '0.035em',
              marginBottom: 11,
            }}
          >
            SIF EARLY WARNING CENTER
          </div>

          <h1
            style={{
              margin: 0,
              color: '#0F172A',
              fontSize: 'clamp(1.55rem, 3vw, 2.1rem)',
              letterSpacing: '-0.035em',
              fontWeight: 850,
            }}
          >
            Safety Alerts
          </h1>

          <p
            style={{
              color: '#64748B',
              margin: '7px 0 0',
              lineHeight: 1.55,
              fontSize: '0.9rem',
              maxWidth: 680,
            }}
          >
            Review high-risk safety events, understand why they were flagged
            and decide the appropriate mitigation action.
          </p>
        </div>

        <button
          type="button"
          onClick={loadAlerts}
          disabled={loading}
          style={{
            height: 42,
            padding: '0 15px',
            borderRadius: 12,
            background: '#FFFFFF',
            border: '1px solid #DDE4ED',
            color: '#334155',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: loading ? 'default' : 'pointer',
            boxShadow: '0 4px 12px rgba(15,23,42,0.04)',
          }}
        >
          ↻ Refresh alerts
        </button>
      </section>

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      {!loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <SummaryCard
            label="Visible Alerts"
            value={filtered.length}
            helper="Current selection"
            accent="#2563EB"
            background="#EFF6FF"
          />

          <SummaryCard
            label="Critical"
            value={criticalCount}
            helper="Immediate attention"
            accent="#DC2626"
            background="#FEF2F2"
          />

          <SummaryCard
            label="High Risk"
            value={highCount}
            helper="Review recommended"
            accent="#EA580C"
            background="#FFF7ED"
          />
        </div>
      )}

      {/* =====================================================
          FILTER + SEARCH TOOLBAR
          ===================================================== */}

      <section
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5EAF1',
          borderRadius: 18,
          padding: 10,
          marginBottom: 20,
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.045)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              overflowX: 'auto',
              maxWidth: '100%',
              paddingBottom: 2,
            }}
          >
            {FILTERS.map((tab) => {
              const selected = statusFilter === tab.key;

              return (
                <button
                  key={tab.key || 'all'}
                  type="button"
                  title={tab.description}
                  onClick={() => setStatusFilter(tab.key)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    borderRadius: 11,
                    padding: '9px 13px',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    fontSize: '0.76rem',
                    fontWeight: 750,
                    color: selected ? '#FFFFFF' : '#64748B',
                    background: selected ? '#1D4ED8' : 'transparent',
                    boxShadow: selected
                      ? '0 5px 14px rgba(37, 99, 235, 0.22)'
                      : 'none',
                    transition:
                      'background .2s ease, color .2s ease, transform .2s ease',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div
            style={{
              position: 'relative',
              flex: '1 1 260px',
              maxWidth: 360,
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 13,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
                pointerEvents: 'none',
              }}
            >
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search site, activity or alert..."
              style={{
                width: '100%',
                height: 40,
                borderRadius: 11,
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                color: '#0F172A',
                outline: 'none',
                padding: '0 14px 0 37px',
                fontSize: '0.78rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTENT
          ===================================================== */}

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState statusFilter={statusFilter} />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <AnimatePresence>
            {filtered.map((alert, index) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                index={index}
                actioningId={actioningId}
                onAccept={() =>
                  handleAction(alert.id, 'ACCEPT')
                }
                onEscalate={() => {
                  setNotesModal({
                    alertId: alert.id,
                    action: 'ESCALATE',
                    title: alert.title,
                  });

                  setActionNote('');
                }}
                onDismiss={() =>
                  handleAction(alert.id, 'REJECT')
                }
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* =====================================================
          ESCALATION MODAL
          ===================================================== */}

      <AnimatePresence>
        {notesModal && (
          <EscalationModal
            modal={notesModal}
            note={actionNote}
            setNote={setActionNote}
            loading={actioningId === notesModal.alertId}
            onClose={() => {
              setNotesModal(null);
              setActionNote('');
            }}
            onConfirm={() =>
              handleAction(
                notesModal.alertId,
                notesModal.action,
                actionNote
              )
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
  label,
  value,
  helper,
  accent,
  background,
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5EAF1',
        borderRadius: 18,
        padding: '17px 18px',
        boxShadow: '0 8px 28px rgba(15, 23, 42, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          flex: '0 0 44px',
          borderRadius: 13,
          display: 'grid',
          placeItems: 'center',
          background,
          color: accent,
          fontWeight: 850,
          fontSize: '1rem',
        }}
      >
        {value}
      </div>

      <div>
        <div
          style={{
            color: '#0F172A',
            fontWeight: 800,
            fontSize: '0.84rem',
          }}
        >
          {label}
        </div>

        <div
          style={{
            color: '#94A3B8',
            fontSize: '0.7rem',
            marginTop: 3,
          }}
        >
          {helper}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ALERT CARD
   ========================================================= */

function AlertCard({
  alert,
  index,
  actioningId,
  onAccept,
  onEscalate,
  onDismiss,
}) {
  const risk = getRiskConfig(alert.risk_level);
  const isPending = alert.status === 'PENDING';
  const isWorking = actioningId === alert.id;

  const score = Math.max(
    0,
    Math.min(100, Number(alert.risk_score) || 0)
  );

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{
        duration: 0.28,
        delay: Math.min(index * 0.035, 0.2),
      }}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5EAF1',
        borderRadius: 22,
        boxShadow: '0 12px 35px rgba(15, 23, 42, 0.055)',
        overflow: 'hidden',
      }}
    >
      {/* Risk Accent */}

      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${risk.color}, ${risk.color}88)`,
        }}
      />

      <div style={{ padding: '20px 22px 19px' }}>
        {/* HEADER */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: 18,
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 9,
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: risk.color,
                  background: risk.soft,
                  border: `1px solid ${risk.border}`,
                  borderRadius: 999,
                  padding: '5px 9px',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    width: 17,
                    height: 17,
                    borderRadius: '50%',
                    background: risk.color,
                    color: '#FFFFFF',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '0.65rem',
                  }}
                >
                  {risk.icon}
                </span>

                {risk.label}
              </span>

              <StatusBadge status={alert.status} />

              <span
                style={{
                  color: '#94A3B8',
                  fontSize: '0.7rem',
                  fontWeight: 650,
                }}
              >
                Alert #{alert.id}
              </span>
            </div>

            <h3
              style={{
                color: '#0F172A',
                margin: 0,
                fontWeight: 820,
                fontSize: '1.06rem',
                lineHeight: 1.45,
                letterSpacing: '-0.015em',
              }}
            >
              {alert.title || 'Safety Risk Detected'}
            </h3>

            <p
              style={{
                color: '#64748B',
                fontSize: '0.76rem',
                margin: '6px 0 0',
              }}
            >
              This event was identified by SIF-Sense as requiring HSE
              review.
            </p>
          </div>

          {/* SCORE */}

          <div
            style={{
              minWidth: 95,
              padding: '11px 12px',
              borderRadius: 16,
              background: risk.soft,
              border: `1px solid ${risk.border}`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: risk.color,
                fontSize: '1.7rem',
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: '-0.045em',
              }}
            >
              {score}
            </div>

            <div
              style={{
                color: '#64748B',
                marginTop: 5,
                fontSize: '0.62rem',
                fontWeight: 750,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Risk / 100
            </div>
          </div>
        </div>

        {/* RISK BAR */}

        <div style={{ marginTop: 17, marginBottom: 17 }}>
          <div
            style={{
              height: 7,
              background: '#EEF2F6',
              borderRadius: 999,
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: risk.color,
                borderRadius: 999,
              }}
            />
          </div>
        </div>

        {/* CONTEXT */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 10,
          }}
        >
          <InfoItem
            label="Location"
            icon="⌖"
            value={alert.location || 'Site not specified'}
          />

          <InfoItem
            label="Work Activity"
            icon="◈"
            value={alert.activity || 'General operations'}
          />

          <InfoItem
            label="Safety Barrier Failure"
            icon="×"
            danger
            value={
              alert.barrier_failure ||
              'Safety control not identified'
            }
          />

          <InfoItem
            label="Repeated Pattern"
            icon="↻"
            value={`${alert.related_reports_count || 0} similar report${
              Number(alert.related_reports_count || 0) === 1
                ? ''
                : 's'
            }`}
          />
        </div>

        {/* AI RECOMMENDATION */}

        {alert.ai_recommendation && (
          <div
            style={{
              marginTop: 13,
              borderRadius: 15,
              padding: '13px 15px',
              background:
                'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
              border: '1px solid #DBEAFE',
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 31,
                  height: 31,
                  flex: '0 0 31px',
                  borderRadius: 10,
                  background: '#FFFFFF',
                  border: '1px solid #DBEAFE',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#2563EB',
                  fontWeight: 850,
                }}
              >
                ✦
              </div>

              <div>
                <div
                  style={{
                    color: '#1E40AF',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    marginBottom: 4,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Recommended Safety Action
                </div>

                <div
                  style={{
                    color: '#334155',
                    fontSize: '0.8rem',
                    lineHeight: 1.6,
                  }}
                >
                  {alert.ai_recommendation}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HSE NOTES */}

        {alert.hse_notes && (
          <div
            style={{
              marginTop: 11,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: '11px 14px',
            }}
          >
            <div
              style={{
                color: '#64748B',
                fontWeight: 800,
                fontSize: '0.68rem',
                marginBottom: 4,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              HSE Review Notes
            </div>

            <div
              style={{
                color: '#475569',
                fontSize: '0.78rem',
                lineHeight: 1.55,
              }}
            >
              {alert.hse_notes}
            </div>
          </div>
        )}

        {/* FOOTER */}

        <div
          style={{
            borderTop: '1px solid #EEF2F6',
            marginTop: 16,
            paddingTop: 15,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div
            style={{
              color: '#94A3B8',
              fontSize: '0.7rem',
              lineHeight: 1.5,
            }}
          >
            Report #{alert.report_id || '—'}
            <span style={{ padding: '0 6px' }}>•</span>
            Triggered {formatDate(alert.created_at)}
          </div>

          {isPending && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <button
                type="button"
                disabled={isWorking}
                onClick={onDismiss}
                style={{
                  height: 38,
                  padding: '0 13px',
                  borderRadius: 11,
                  border: '1px solid #DDE4ED',
                  background: '#FFFFFF',
                  color: '#64748B',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  cursor: isWorking ? 'default' : 'pointer',
                }}
              >
                Dismiss
              </button>

              <button
                type="button"
                disabled={isWorking}
                onClick={onEscalate}
                style={{
                  height: 38,
                  padding: '0 14px',
                  borderRadius: 11,
                  border: '1px solid #FECACA',
                  background: '#FEF2F2',
                  color: '#B91C1C',
                  fontWeight: 750,
                  fontSize: '0.74rem',
                  cursor: isWorking ? 'default' : 'pointer',
                }}
              >
                Escalate
              </button>

              <button
                type="button"
                disabled={isWorking}
                onClick={onAccept}
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 11,
                  border: '1px solid #2563EB',
                  background:
                    'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  fontWeight: 750,
                  fontSize: '0.74rem',
                  cursor: isWorking ? 'default' : 'pointer',
                  boxShadow:
                    '0 6px 16px rgba(37, 99, 235, 0.2)',
                }}
              >
                {isWorking
                  ? 'Updating...'
                  : 'Accept & Start Mitigation'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   LOADING STATE
   ========================================================= */

function LoadingState() {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5EAF1',
        borderRadius: 22,
        padding: '4rem 2rem',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          margin: '0 auto 13px',
          borderRadius: '50%',
          border: '3px solid #DBEAFE',
          borderTopColor: '#2563EB',
          animation: 'sifAlertSpin 0.8s linear infinite',
        }}
      />

      <style>
        {`
          @keyframes sifAlertSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      <div
        style={{
          color: '#334155',
          fontSize: '0.84rem',
          fontWeight: 700,
        }}
      >
        Loading safety alerts
      </div>

      <div
        style={{
          color: '#94A3B8',
          fontSize: '0.73rem',
          marginTop: 4,
        }}
      >
        Checking current SIF warnings...
      </div>
    </div>
  );
}

/* =========================================================
   ESCALATION MODAL
   ========================================================= */

function EscalationModal({
  modal,
  note,
  setNote,
  loading,
  onClose,
  onConfirm,
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.38)',
        backdropFilter: 'blur(7px)',
        display: 'grid',
        placeItems: 'center',
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#FFFFFF',
          border: '1px solid #E5EAF1',
          borderRadius: 22,
          boxShadow: '0 28px 70px rgba(15,23,42,0.22)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 21px 17px',
            borderBottom: '1px solid #EEF2F6',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#DC2626',
              fontWeight: 900,
              fontSize: '1.15rem',
              marginBottom: 13,
            }}
          >
            !
          </div>

          <h3
            style={{
              margin: 0,
              color: '#0F172A',
              fontSize: '1.1rem',
              fontWeight: 850,
              letterSpacing: '-0.02em',
            }}
          >
            Escalate Safety Alert
          </h3>

          <p
            style={{
              color: '#64748B',
              fontSize: '0.79rem',
              lineHeight: 1.6,
              margin: '7px 0 0',
            }}
          >
            This alert will be marked for leadership attention.
            Add the reason for escalation and any immediate safety
            action already taken.
          </p>
        </div>

        <div style={{ padding: 21 }}>
          <div
            style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 13,
              padding: '11px 13px',
              marginBottom: 15,
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                color: '#94A3B8',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: 4,
              }}
            >
              Alert
            </div>

            <div
              style={{
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 700,
                lineHeight: 1.5,
              }}
            >
              {modal.title}
            </div>
          </div>

          <label
            style={{
              display: 'block',
              color: '#334155',
              fontSize: '0.74rem',
              fontWeight: 800,
              marginBottom: 7,
            }}
          >
            Escalation notes
          </label>

          <textarea
            autoFocus
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Example: Work stopped immediately. Site safety manager notified. Secondary isolation verification requested."
            style={{
              width: '100%',
              minHeight: 115,
              resize: 'vertical',
              boxSizing: 'border-box',
              padding: '12px 13px',
              borderRadius: 13,
              border: '1px solid #DDE4ED',
              outline: 'none',
              background: '#F8FAFC',
              color: '#0F172A',
              fontFamily: 'inherit',
              fontSize: '0.8rem',
              lineHeight: 1.55,
            }}
          />

          <div
            style={{
              marginTop: 17,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 9,
            }}
          >
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              style={{
                height: 40,
                padding: '0 15px',
                borderRadius: 11,
                background: '#FFFFFF',
                border: '1px solid #DDE4ED',
                color: '#64748B',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              style={{
                height: 40,
                padding: '0 17px',
                borderRadius: 11,
                background:
                  'linear-gradient(135deg, #DC2626, #B91C1C)',
                border: '1px solid #DC2626',
                color: '#FFFFFF',
                fontWeight: 750,
                cursor: loading ? 'default' : 'pointer',
                boxShadow:
                  '0 7px 18px rgba(220,38,38,0.18)',
              }}
            >
              {loading
                ? 'Escalating...'
                : 'Confirm Escalation'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}