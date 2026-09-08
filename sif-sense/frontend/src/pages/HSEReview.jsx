import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAlerts, reviewAlert } from '../services/api';

/* =========================================================
   SIF-SENSE — PREMIUM LIGHT HSE REVIEW
   ========================================================= */

const RISK_CONFIG = {
  CRITICAL: {
    color: '#DC2626',
    soft: '#FEF2F2',
    border: '#FECACA',
    label: 'Critical Risk'
  },
  HIGH: {
    color: '#EA580C',
    soft: '#FFF7ED',
    border: '#FED7AA',
    label: 'High Risk'
  },
  MEDIUM: {
    color: '#CA8A04',
    soft: '#FEFCE8',
    border: '#FDE68A',
    label: 'Moderate Risk'
  },
  MODERATE: {
    color: '#CA8A04',
    soft: '#FEFCE8',
    border: '#FDE68A',
    label: 'Moderate Risk'
  },
  LOW: {
    color: '#16A34A',
    soft: '#F0FDF4',
    border: '#BBF7D0',
    label: 'Low Risk'
  }
};

function getRiskConfig(level) {
  return (
    RISK_CONFIG[String(level || '').toUpperCase()] ||
    RISK_CONFIG.LOW
  );
}

function formatDate(value) {
  if (!value) return 'Time unavailable';

  try {
    return new Date(value).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Time unavailable';
  }
}

/* =========================================================
   INFO TILE
========================================================= */

function InfoTile({ label, value, icon }) {
  return (
    <div
      style={{
        background: '#F8FAFC',
        border: '1px solid #E7EDF4',
        borderRadius: 13,
        padding: '12px 13px',
        minWidth: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#94A3B8',
          fontSize: '0.63rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 6
        }}
      >
        <span>{icon}</span>
        {label}
      </div>

      <div
        style={{
          color: '#334155',
          fontSize: '0.78rem',
          fontWeight: 700,
          lineHeight: 1.4,
          overflowWrap: 'anywhere'
        }}
      >
        {value || 'Not identified'}
      </div>
    </div>
  );
}

/* =========================================================
   REVIEW CARD
========================================================= */

function ReviewCard({ alert, onReviewed }) {
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const risk = getRiskConfig(alert.risk_level);
  const isReviewed = alert.status !== 'PENDING';

  const handleSubmit = async (selectedAction) => {
    setAction(selectedAction);
    setSubmitting(true);

    try {
      await reviewAlert(
        alert.id,
        selectedAction,
        notes.trim() || undefined
      );

      setDone(true);

      setTimeout(() => {
        onReviewed();
      }, 700);
    } catch (error) {
      console.error('HSE review failed:', error);

      window.alert(
        'Unable to record the HSE action. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.28 }}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${
          isReviewed || done ? '#DCEFE5' : risk.border
        }`,
        borderRadius: 19,
        marginBottom: 15,
        overflow: 'hidden',
        boxShadow: '0 8px 28px rgba(15, 23, 42, 0.045)',
        opacity: done ? 0.72 : 1
      }}
    >
      {/* Risk accent */}

      <div
        style={{
          height: 4,
          background: risk.color
        }}
      />

      <div style={{ padding: '18px' }}>
        {/* HEADER */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 20,
            marginBottom: 16
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 8
              }}
            >
              <span
                style={{
                  color: risk.color,
                  background: risk.soft,
                  border: `1px solid ${risk.border}`,
                  borderRadius: 999,
                  padding: '4px 9px',
                  fontSize: '0.62rem',
                  fontWeight: 850,
                  textTransform: 'uppercase',
                  letterSpacing: '0.045em'
                }}
              >
                SIF Alert #{alert.id}
              </span>

              {alert.status && (
                <span
                  style={{
                    color:
                      alert.status === 'PENDING'
                        ? '#B45309'
                        : '#047857',
                    background:
                      alert.status === 'PENDING'
                        ? '#FFFBEB'
                        : '#ECFDF5',
                    border:
                      alert.status === 'PENDING'
                        ? '1px solid #FDE68A'
                        : '1px solid #A7F3D0',
                    borderRadius: 999,
                    padding: '4px 9px',
                    fontSize: '0.62rem',
                    fontWeight: 800
                  }}
                >
                  {alert.status === 'PENDING'
                    ? 'Needs Action'
                    : alert.status}
                </span>
              )}
            </div>

            <h2
              style={{
                margin: 0,
                color: '#0F172A',
                fontSize: '1.05rem',
                lineHeight: 1.35,
                fontWeight: 820,
                letterSpacing: '-0.015em'
              }}
            >
              {alert.title || 'Safety alert requiring review'}
            </h2>

            <div
              style={{
                marginTop: 6,
                color: '#94A3B8',
                fontSize: '0.66rem'
              }}
            >
              Reported {formatDate(alert.created_at)}
            </div>
          </div>

          {/* SCORE */}

          <div
            style={{
              textAlign: 'right',
              flexShrink: 0
            }}
          >
            <div
              style={{
                color: risk.color,
                fontSize: '2rem',
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: '-0.045em'
              }}
            >
              {alert.risk_score ?? '—'}
            </div>

            <div
              style={{
                marginTop: 4,
                color: '#94A3B8',
                fontSize: '0.59rem',
                fontWeight: 700
              }}
            >
              RISK SCORE / 100
            </div>

            <div
              style={{
                marginTop: 7,
                display: 'inline-flex',
                padding: '4px 8px',
                borderRadius: 999,
                background: risk.soft,
                border: `1px solid ${risk.border}`,
                color: risk.color,
                fontSize: '0.61rem',
                fontWeight: 850
              }}
            >
              {risk.label}
            </div>
          </div>
        </div>

        {/* SCORE BAR */}

        <div
          style={{
            height: 7,
            background: '#EEF2F6',
            borderRadius: 999,
            overflow: 'hidden',
            marginBottom: 17
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(
                100,
                Math.max(0, Number(alert.risk_score) || 0)
              )}%`
            }}
            transition={{ duration: 0.7 }}
            style={{
              height: '100%',
              background: risk.color,
              borderRadius: 999
            }}
          />
        </div>

        {/* DETAILS */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 9,
            marginBottom: 16
          }}
        >
          <InfoTile
            label="Location"
            value={alert.location}
            icon="⌖"
          />

          <InfoTile
            label="Activity"
            value={alert.activity}
            icon="◈"
          />

          <InfoTile
            label="Barrier Failure"
            value={alert.barrier_failure}
            icon="×"
          />

          {alert.related_reports && (
            <InfoTile
              label="Related Reports"
              value={alert.related_reports}
              icon="↗"
            />
          )}
        </div>

        {/* AI RECOMMENDATION */}

        <div
          style={{
            background:
              'linear-gradient(135deg, #F8FBFF 0%, #F5F3FF 100%)',
            border: '1px solid #E2E8F7',
            borderRadius: 14,
            padding: '14px',
            marginBottom: 17
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 7
            }}
          >
            <div
              style={{
                width: 27,
                height: 27,
                borderRadius: 9,
                background: '#FFFFFF',
                border: '1px solid #DDE6F5',
                color: '#2563EB',
                display: 'grid',
                placeItems: 'center',
                fontSize: '0.63rem',
                fontWeight: 900
              }}
            >
              AI
            </div>

            <span
              style={{
                color: '#2563EB',
                fontSize: '0.65rem',
                fontWeight: 850,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              AI Safety Recommendation
            </span>
          </div>

          <div
            style={{
              color: '#475569',
              fontSize: '0.79rem',
              lineHeight: 1.6
            }}
          >
            {alert.ai_recommendation ||
              'No recommendation provided.'}
          </div>
        </div>

        {/* REVIEWED STATE */}

        {(isReviewed || done) ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '13px 14px',
              background: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 13
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: '#DCFCE7',
                color: '#15803D',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 900,
                flexShrink: 0
              }}
            >
              ✓
            </div>

            <div>
              <div
                style={{
                  color: '#166534',
                  fontSize: '0.78rem',
                  fontWeight: 800
                }}
              >
                Action Recorded:{' '}
                {done ? 'Submitted' : alert.status}
              </div>

              {alert.hse_notes && (
                <div
                  style={{
                    marginTop: 5,
                    color: '#64748B',
                    fontSize: '0.7rem',
                    lineHeight: 1.5
                  }}
                >
                  HSE note: {alert.hse_notes}
                </div>
              )}

              {alert.reviewed_at && (
                <div
                  style={{
                    marginTop: 3,
                    color: '#94A3B8',
                    fontSize: '0.63rem'
                  }}
                >
                  Reviewed {formatDate(alert.reviewed_at)}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* NOTES */}

            <label
              style={{
                display: 'block',
                color: '#475569',
                fontSize: '0.7rem',
                fontWeight: 750,
                marginBottom: 7
              }}
            >
              HSE Review Notes
              <span
                style={{
                  color: '#94A3B8',
                  fontWeight: 500
                }}
              >
                {' '}
                · Optional
              </span>
            </label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your review findings, mitigation notes or follow-up actions..."
              disabled={submitting}
              style={{
                width: '100%',
                minHeight: 82,
                resize: 'vertical',
                boxSizing: 'border-box',
                padding: '11px 12px',
                borderRadius: 11,
                border: '1px solid #DCE3EC',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: '0.76rem',
                lineHeight: 1.5,
                outline: 'none',
                fontFamily: 'inherit',
                marginBottom: 11
              }}
            />

            {/* ACTIONS */}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(150px, 1fr))',
                gap: 9
              }}
            >
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('ACCEPT')}
                style={{
                  minHeight: 42,
                  borderRadius: 11,
                  border: '1px solid #A7F3D0',
                  background: '#ECFDF5',
                  color: '#047857',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  cursor: submitting
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                {submitting && action === 'ACCEPT'
                  ? 'Recording...'
                  : '✓ Accept & Mitigate'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('REJECT')}
                style={{
                  minHeight: 42,
                  borderRadius: 11,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#475569',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  cursor: submitting
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                {submitting && action === 'REJECT'
                  ? 'Recording...'
                  : '× Reject'}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit('ESCALATE')}
                style={{
                  minHeight: 42,
                  borderRadius: 11,
                  border: '1px solid #FED7AA',
                  background: '#FFF7ED',
                  color: '#C2410C',
                  fontSize: '0.73rem',
                  fontWeight: 800,
                  cursor: submitting
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                {submitting && action === 'ESCALATE'
                  ? 'Recording...'
                  : '↑ Escalate'}
              </button>
            </div>

            <div
              style={{
                marginTop: 10,
                textAlign: 'center',
                color: '#94A3B8',
                fontSize: '0.62rem',
                lineHeight: 1.5
              }}
            >
              AI assists qualified HSE professionals. It does not
              independently make safety-critical decisions.
            </div>
          </>
        )}
      </div>
    </motion.article>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */

export default function HSEReview() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await getAlerts();

      setAlerts(
        Array.isArray(res?.data)
          ? res.data
          : []
      );
    } catch (error) {
      console.error('Unable to load HSE alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pending = alerts.filter(
    (alert) => alert.status === 'PENDING'
  );

  const reviewed = alerts.filter(
    (alert) => alert.status !== 'PENDING'
  );

  const displayed = showAll ? alerts : pending;

  const criticalPending = pending.filter(
    (alert) =>
      String(alert.risk_level).toUpperCase() ===
      'CRITICAL'
  ).length;

  const highPending = pending.filter(
    (alert) =>
      String(alert.risk_level).toUpperCase() ===
      'HIGH'
  ).length;

  return (
    <div
      className="page-container animate-fade-in"
      style={{
        maxWidth: 1050,
        margin: '0 auto',
        paddingBottom: '4rem'
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 20,
          flexWrap: 'wrap',
          marginBottom: 21
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              padding: '5px 9px',
              borderRadius: 999,
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              color: '#C2410C',
              fontSize: '0.62rem',
              fontWeight: 850,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 9
            }}
          >
            Human Safety Review
          </div>

          <h1
            style={{
              margin: 0,
              color: '#0F172A',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 850,
              letterSpacing: '-0.04em'
            }}
          >
            HSE Review
          </h1>

          <p
            style={{
              margin: '7px 0 0',
              color: '#64748B',
              fontSize: '0.83rem',
              lineHeight: 1.5
            }}
          >
            Review AI-flagged SIF risks and record the appropriate
            safety decision.
          </p>
        </div>

        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            height: 40,
            padding: '0 14px',
            borderRadius: 11,
            border: '1px solid #DDE4ED',
            background: '#FFFFFF',
            color: '#334155',
            fontSize: '0.72rem',
            fontWeight: 750,
            cursor: refreshing
              ? 'default'
              : 'pointer'
          }}
        >
          {refreshing ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </section>

      {/* =====================================================
          HUMAN-IN-THE-LOOP NOTICE
      ===================================================== */}

      <section
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 13,
          background:
            'linear-gradient(135deg, #F8FBFF 0%, #F5F3FF 100%)',
          border: '1px solid #DDE5F3',
          borderRadius: 17,
          padding: '15px 17px',
          marginBottom: 17
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: '#FFFFFF',
            border: '1px solid #DDE6F4',
            color: '#2563EB',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 900,
            flexShrink: 0
          }}
        >
          HSE
        </div>

        <div>
          <div
            style={{
              color: '#1E40AF',
              fontSize: '0.76rem',
              fontWeight: 850,
              marginBottom: 4
            }}
          >
            Human-in-the-Loop Safety Principle
          </div>

          <div
            style={{
              color: '#64748B',
              fontSize: '0.7rem',
              lineHeight: 1.6
            }}
          >
            SIF-Sense identifies and prioritizes potential SIF
            precursors. A qualified HSE professional reviews each
            alert and decides whether to accept, reject or escalate
            it. AI assists the review process rather than replacing
            safety judgment.
          </div>
        </div>
      </section>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 10,
          marginBottom: 17
        }}
      >
        {[
          {
            label: 'Pending Review',
            value: pending.length,
            color: '#B45309',
            bg: '#FFFBEB'
          },
          {
            label: 'Critical Pending',
            value: criticalPending,
            color: '#DC2626',
            bg: '#FEF2F2'
          },
          {
            label: 'High Risk Pending',
            value: highPending,
            color: '#EA580C',
            bg: '#FFF7ED'
          },
          {
            label: 'Already Reviewed',
            value: reviewed.length,
            color: '#047857',
            bg: '#ECFDF5'
          }
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5EAF1',
              borderRadius: 14,
              padding: '12px 14px',
              boxShadow:
                '0 5px 18px rgba(15,23,42,.035)'
            }}
          >
            <div
              style={{
                color: '#94A3B8',
                fontSize: '0.61rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.045em'
              }}
            >
              {item.label}
            </div>

            <div
              style={{
                marginTop: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span
                style={{
                  color: item.color,
                  fontSize: '1.35rem',
                  fontWeight: 900
                }}
              >
                {item.value}
              </span>

              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: item.color
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* =====================================================
          FILTER
      ===================================================== */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 15,
          flexWrap: 'wrap'
        }}
      >
        <button
          type="button"
          onClick={() => setShowAll(false)}
          style={{
            height: 36,
            padding: '0 12px',
            borderRadius: 10,
            border: !showAll
              ? '1px solid #BFDBFE'
              : '1px solid #E2E8F0',
            background: !showAll
              ? '#EFF6FF'
              : '#FFFFFF',
            color: !showAll
              ? '#2563EB'
              : '#64748B',
            fontSize: '0.7rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Pending ({pending.length})
        </button>

        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{
            height: 36,
            padding: '0 12px',
            borderRadius: 10,
            border: showAll
              ? '1px solid #BFDBFE'
              : '1px solid #E2E8F0',
            background: showAll
              ? '#EFF6FF'
              : '#FFFFFF',
            color: showAll
              ? '#2563EB'
              : '#64748B',
            fontSize: '0.7rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          All Alerts ({alerts.length})
        </button>

        <span
          style={{
            marginLeft: 'auto',
            color: '#94A3B8',
            fontSize: '0.66rem'
          }}
        >
          {showAll
            ? `${alerts.length} total alerts`
            : `${pending.length} awaiting review`}
        </span>
      </div>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      {loading ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5EAF1',
            borderRadius: 18,
            padding: '4rem 2rem',
            textAlign: 'center'
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
              animation:
                'sifHseSpin .8s linear infinite'
            }}
          />

          <style>
            {`
              @keyframes sifHseSpin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>

          <div
            style={{
              color: '#334155',
              fontSize: '0.8rem',
              fontWeight: 750
            }}
          >
            Loading HSE reviews
          </div>

          <div
            style={{
              color: '#94A3B8',
              fontSize: '0.67rem',
              marginTop: 4
            }}
          >
            Retrieving current safety alerts...
          </div>
        </div>
      ) : displayed.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5EAF1',
            borderRadius: 19,
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow:
              '0 8px 28px rgba(15,23,42,.04)'
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              margin: '0 auto 15px',
              borderRadius: 17,
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#047857',
              display: 'grid',
              placeItems: 'center',
              fontSize: '1.45rem',
              fontWeight: 900
            }}
          >
            ✓
          </div>

          <h3
            style={{
              margin: 0,
              color: '#0F172A',
              fontSize: '1rem',
              fontWeight: 800
            }}
          >
            All caught up
          </h3>

          <p
            style={{
              margin: '7px auto 0',
              maxWidth: 430,
              color: '#64748B',
              fontSize: '0.74rem',
              lineHeight: 1.6
            }}
          >
            {showAll
              ? 'There are no safety alerts in the system yet.'
              : 'No pending alerts require HSE review right now.'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {displayed.map((alert) => (
            <ReviewCard
              key={alert.id}
              alert={alert}
              onReviewed={load}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}