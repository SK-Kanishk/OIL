import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  feedSimulatedIncident,
  getModelStatus
} from '../services/api';

/* =========================================================
   SIF-SENSE — PREMIUM LIGHT INCIDENT SIMULATOR
   ---------------------------------------------------------
   Existing functionality preserved:
   ✓ Continuous live incident stream
   ✓ Single-step incident generation
   ✓ Configurable stream interval
   ✓ Severity/category selection
   ✓ OSHA model status
   ✓ SIF ratio
   ✓ Average client latency
   ✓ IOGP rule count
   ✓ Latest 25 simulated events
   ✓ Inspect incident in Analyzer
   ✓ Clear feed
   ========================================================= */

const COLORS = {
  navy: '#0F172A',
  text: '#334155',
  muted: '#64748B',
  subtle: '#94A3B8',
  border: '#E5EAF1',
  borderStrong: '#D7DEE8',
  surface: '#FFFFFF',
  background: '#F8FAFC',

  blue: '#2563EB',
  blueSoft: '#EFF6FF',
  blueBorder: '#BFDBFE',

  indigo: '#4F46E5',
  indigoSoft: '#EEF2FF',
  indigoBorder: '#C7D2FE',

  red: '#DC2626',
  redSoft: '#FEF2F2',
  redBorder: '#FECACA',

  orange: '#EA580C',
  orangeSoft: '#FFF7ED',
  orangeBorder: '#FED7AA',

  yellow: '#CA8A04',
  yellowSoft: '#FEFCE8',
  yellowBorder: '#FEF08A',

  green: '#16A34A',
  greenSoft: '#F0FDF4',
  greenBorder: '#BBF7D0'
};

const SEVERITY_OPTIONS = [
  {
    id: 'ANY',
    label: 'Random',
    description: 'All incident types',
    shortLabel: 'Random'
  },
  {
    id: 'CRITICAL_SIF',
    label: 'Critical SIF',
    description: 'Critical SIF precursor',
    shortLabel: 'Critical SIF'
  },
  {
    id: 'HIGH_RISK_NEAR_MISS',
    label: 'High-Potential',
    description: 'High-risk near miss',
    shortLabel: 'High Risk'
  },
  {
    id: 'MEDIUM_PRECURSOR',
    label: 'Medium Risk',
    description: 'Operational precursor',
    shortLabel: 'Medium'
  },
  {
    id: 'LOW_OBSERVATION',
    label: 'Low Risk',
    description: 'Observation / low risk',
    shortLabel: 'Low Risk'
  }
];

const INTERVAL_OPTIONS = [2, 4, 6];

function getRiskConfig(level) {
  switch (String(level || '').toUpperCase()) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        color: COLORS.red,
        soft: COLORS.redSoft,
        border: COLORS.redBorder
      };

    case 'HIGH':
      return {
        label: 'High',
        color: COLORS.orange,
        soft: COLORS.orangeSoft,
        border: COLORS.orangeBorder
      };

    case 'MEDIUM':
    case 'MODERATE':
      return {
        label: 'Medium',
        color: COLORS.yellow,
        soft: COLORS.yellowSoft,
        border: COLORS.yellowBorder
      };

    default:
      return {
        label: 'Low',
        color: COLORS.green,
        soft: COLORS.greenSoft,
        border: COLORS.greenBorder
      };
  }
}

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '—';
  }

  return number.toLocaleString();
}

function formatProbability(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '0.0%';
  }

  const percentage = number <= 1 ? number * 100 : number;

  return `${percentage.toFixed(1)}%`;
}

function getScore(incident) {
  const value =
    incident?.risk?.risk_score ??
    incident?.risk?.score ??
    0;

  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
}

function getLevel(incident) {
  return (
    incident?.risk?.risk_level ||
    incident?.risk?.level ||
    'LOW'
  );
}

function getIncidentNarrative(incident) {
  return (
    incident?.simulation?.narrative ||
    incident?.preprocessing?.original ||
    incident?.text ||
    'No incident narrative available.'
  );
}

function getIncidentKey(incident, index) {
  return (
    incident?.report_id ||
    incident?.simulation?.uuid ||
    incident?.id ||
    `sim-${index}`
  );
}

function StatCard({
  label,
  value,
  helper,
  color,
  soft,
  icon
}) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 17,
        padding: '15px 16px',
        boxShadow: '0 7px 25px rgba(15,23,42,0.035)',
        minWidth: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 10
        }}
      >
        <div
          style={{
            color: COLORS.muted,
            fontSize: '0.64rem',
            fontWeight: 850,
            textTransform: 'uppercase',
            letterSpacing: '0.045em'
          }}
        >
          {label}
        </div>

        <div
          style={{
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 9,
            background: soft,
            color,
            fontSize: '0.7rem',
            fontWeight: 900
          }}
        >
          {icon}
        </div>
      </div>

      <div
        style={{
          marginTop: 9,
          color,
          fontSize: '1.65rem',
          lineHeight: 1,
          fontWeight: 900,
          letterSpacing: '-0.045em'
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 6,
          color: COLORS.subtle,
          fontSize: '0.67rem',
          lineHeight: 1.35
        }}
      >
        {helper}
      </div>
    </div>
  );
}

function MetaChip({ label, value, tone = 'neutral' }) {
  const tones = {
    neutral: {
      background: COLORS.background,
      border: COLORS.border,
      color: COLORS.text
    },
    blue: {
      background: COLORS.blueSoft,
      border: COLORS.blueBorder,
      color: COLORS.blue
    },
    red: {
      background: COLORS.redSoft,
      border: COLORS.redBorder,
      color: COLORS.red
    },
    green: {
      background: COLORS.greenSoft,
      border: COLORS.greenBorder,
      color: COLORS.green
    },
    orange: {
      background: COLORS.orangeSoft,
      border: COLORS.orangeBorder,
      color: COLORS.orange
    }
  };

  const theme = tones[tone] || tones.neutral;

  if (!value) return null;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 8px',
        borderRadius: 8,
        background: theme.background,
        border: `1px solid ${theme.border}`,
        color: theme.color,
        fontSize: '0.64rem',
        lineHeight: 1.2,
        fontWeight: 700,
        maxWidth: '100%'
      }}
    >
      {label && (
        <span style={{ opacity: 0.65 }}>
          {label}
        </span>
      )}

      <strong
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {value}
      </strong>
    </span>
  );
}

export default function Simulator() {
  const navigate = useNavigate();

  const [streamActive, setStreamActive] = useState(false);
  const [intervalSec, setIntervalSec] = useState(3);
  const [severityFilter, setSeverityFilter] = useState('ANY');

  const [incidents, setIncidents] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    sifCount: 0,
    avgLatency: 12
  });

  const [modelStatus, setModelStatus] = useState(null);
  const [loadingStep, setLoadingStep] = useState(false);
  const [streamError, setStreamError] = useState('');

  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  /* =======================================================
     MODEL STATUS
     ======================================================= */

  const fetchModelStatus = useCallback(async () => {
    try {
      const response = await getModelStatus();

      if (mountedRef.current) {
        setModelStatus(response?.data || null);
      }
    } catch (_) {
      if (mountedRef.current) {
        setModelStatus(null);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    fetchModelStatus();

    return () => {
      mountedRef.current = false;

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [fetchModelStatus]);

  /* =======================================================
     FEED ONE INCIDENT
     ======================================================= */

  const feedNextIncident = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoadingStep(true);
      setStreamError('');

      const start = performance.now();

      const response = await feedSimulatedIncident(
        severityFilter
      );

      const latency = Math.round(
        performance.now() - start
      );

      if (!response?.data) {
        throw new Error('Simulator returned no data.');
      }

      const newEntry = {
        ...response.data,
        receivedAt: new Date().toLocaleTimeString(),
        clientLatency: latency
      };

      setIncidents((previous) => [
        newEntry,
        ...previous.slice(0, 24)
      ]);

      setStats((previous) => {
        const newTotal = previous.total + 1;

        const newSif =
          previous.sifCount +
          (response.data.classification?.sif_potential
            ? 1
            : 0);

        return {
          total: newTotal,
          sifCount: newSif,
          avgLatency: Math.round(
            (
              previous.avgLatency * previous.total +
              latency
            ) / newTotal
          )
        };
      });
    } catch (error) {
      console.error('Simulator feed error:', error);

      if (mountedRef.current) {
        setStreamError(
          'Unable to generate the simulated incident. Check that the backend is running.'
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoadingStep(false);
      }
    }
  }, [severityFilter]);

  /* =======================================================
     CONTINUOUS STREAM
     ======================================================= */

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!streamActive) {
      return undefined;
    }

    feedNextIncident();

    timerRef.current = setInterval(() => {
      feedNextIncident();
    }, intervalSec * 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    streamActive,
    intervalSec,
    feedNextIncident
  ]);

  /* =======================================================
     CONTROLS
     ======================================================= */

  const clearFeed = () => {
    setIncidents([]);

    setStats({
      total: 0,
      sifCount: 0,
      avgLatency: 12
    });

    setStreamError('');
  };

  const toggleStream = () => {
    setStreamActive((current) => !current);
  };

  const handleInspectInAnalyzer = (incident) => {
    const narrative =
      incident?.simulation?.narrative ||
      incident?.preprocessing?.original ||
      incident?.text ||
      '';

    navigate('/', {
      state: {
        preloadedText: narrative
      }
    });
  };

  const sifRatio =
    stats.total > 0
      ? Math.round(
          (stats.sifCount / stats.total) * 100
        )
      : 0;

  const iogpCount = incidents.filter(
    (incident) => {
      const rule = incident?.risk?.iogp_rule;

      return (
        rule &&
        !String(rule)
          .toLowerCase()
          .includes('general')
      );
    }
  ).length;

  const trainingRecords =
    modelStatus?.total_training_records ||
    105995;

  return (
    <div
      className="page-container animate-fade-in"
      style={{
        paddingBottom: '4rem',
        maxWidth: 1500,
        margin: '0 auto',
        color: COLORS.navy
      }}
    >
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <section
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 18,
          flexWrap: 'wrap',
          marginBottom: 22
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '6px 10px',
              marginBottom: 9,
              borderRadius: 999,
              background: COLORS.indigoSoft,
              border: `1px solid ${COLORS.indigoBorder}`,
              color: COLORS.indigo,
              fontSize: '0.67rem',
              fontWeight: 850,
              letterSpacing: '0.05em'
            }}
          >
            SCENARIO TESTING
          </div>

          <h1
            style={{
              margin: 0,
              color: COLORS.navy,
              fontSize: 'clamp(1.55rem, 3vw, 2.15rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              fontWeight: 900
            }}
          >
            Safety Scenario Simulator
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              maxWidth: 720,
              color: COLORS.muted,
              fontSize: '0.88rem',
              lineHeight: 1.55
            }}
          >
            Generate realistic workplace safety incidents and
            feed them through the SIF-Sense AI pipeline to test
            risk classification, SIF detection and safety rules.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: '9px 12px',
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            boxShadow: '0 5px 18px rgba(15,23,42,0.035)'
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: modelStatus
                ? COLORS.green
                : COLORS.subtle,
              boxShadow: modelStatus
                ? '0 0 0 4px #DCFCE7'
                : '0 0 0 4px #F1F5F9'
            }}
          />

          <div>
            <div
              style={{
                color: COLORS.subtle,
                fontSize: '0.57rem',
                fontWeight: 850,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              AI engine
            </div>

            <div
              style={{
                marginTop: 2,
                color: COLORS.text,
                fontSize: '0.7rem',
                fontWeight: 800
              }}
            >
              {modelStatus
                ? 'Model connected'
                : 'Checking model...'}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CONTROL CENTER
          ===================================================== */}

      <section
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 20,
          padding: 18,
          marginBottom: 18,
          boxShadow: '0 10px 34px rgba(15,23,42,0.055)'
        }}
      >
        {/* Control header */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 15,
            flexWrap: 'wrap',
            paddingBottom: 15,
            borderBottom: `1px solid #EEF2F6`
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 11
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 12,
                background: COLORS.indigoSoft,
                border: `1px solid ${COLORS.indigoBorder}`,
                color: COLORS.indigo,
                fontSize: '0.7rem',
                fontWeight: 900
              }}
            >
              SIM
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  flexWrap: 'wrap'
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    color: COLORS.navy,
                    fontSize: '0.98rem',
                    fontWeight: 850
                  }}
                >
                  Incident stream controls
                </h2>

                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: streamActive
                      ? COLORS.greenSoft
                      : COLORS.background,
                    border: `1px solid ${
                      streamActive
                        ? COLORS.greenBorder
                        : COLORS.border
                    }`,
                    color: streamActive
                      ? COLORS.green
                      : COLORS.muted,
                    fontSize: '0.6rem',
                    fontWeight: 850,
                    letterSpacing: '0.03em'
                  }}
                >
                  {streamActive
                    ? 'LIVE STREAM RUNNING'
                    : 'STREAM PAUSED'}
                </span>
              </div>

              <p
                style={{
                  margin: '5px 0 0',
                  color: COLORS.muted,
                  fontSize: '0.7rem',
                  lineHeight: 1.45
                }}
              >
                Generate one event at a time or continuously
                stream randomized incidents into the safety
                analysis pipeline.
              </p>
            </div>
          </div>

          {/* Model information */}

          <div
            style={{
              minWidth: 240,
              padding: '10px 12px',
              borderRadius: 12,
              background: COLORS.background,
              border: `1px solid ${COLORS.border}`
            }}
          >
            <div
              style={{
                color: COLORS.subtle,
                fontSize: '0.57rem',
                fontWeight: 850,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              Active ML engine
            </div>

            <div
              style={{
                marginTop: 4,
                color: COLORS.text,
                fontSize: '0.69rem',
                fontWeight: 800
              }}
            >
              OSHA 2015–2025 model
            </div>

            <div
              style={{
                marginTop: 3,
                color: COLORS.muted,
                fontSize: '0.62rem'
              }}
            >
              {formatNumber(trainingRecords)} training cases
            </div>

            <div
              style={{
                marginTop: 5,
                color: COLORS.green,
                fontSize: '0.61rem',
                fontWeight: 750
              }}
            >
              Accuracy 96.0% · SIF recall 97.5%
            </div>
          </div>
        </div>

        {/* Main controls */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 15,
            flexWrap: 'wrap',
            paddingTop: 15
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 7,
              flexWrap: 'wrap'
            }}
          >
            <button
              type="button"
              onClick={toggleStream}
              style={{
                ...primaryButton,
                background: streamActive
                  ? COLORS.red
                  : COLORS.blue,
                boxShadow: streamActive
                  ? '0 6px 16px rgba(220,38,38,0.18)'
                  : '0 6px 16px rgba(37,99,235,0.18)'
              }}
            >
              {streamActive
                ? 'Pause Live Stream'
                : 'Start Live Stream'}
            </button>

            <button
              type="button"
              onClick={feedNextIncident}
              disabled={loadingStep || streamActive}
              style={{
                ...secondaryButton,
                opacity:
                  loadingStep || streamActive ? 0.55 : 1,
                cursor:
                  loadingStep || streamActive
                    ? 'not-allowed'
                    : 'pointer'
              }}
            >
              {loadingStep
                ? 'Generating...'
                : 'Single Step'}
            </button>

            {incidents.length > 0 && (
              <button
                type="button"
                onClick={clearFeed}
                style={{
                  ...secondaryButton,
                  color: COLORS.red,
                  borderColor: COLORS.redBorder,
                  background: COLORS.redSoft
                }}
              >
                Clear Feed
              </button>
            )}
          </div>

          {/* Speed */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              flexWrap: 'wrap'
            }}
          >
            <span
              style={{
                color: COLORS.muted,
                fontSize: '0.67rem',
                fontWeight: 750
              }}
            >
              Stream interval
            </span>

            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: 3,
                borderRadius: 9,
                background: COLORS.background,
                border: `1px solid ${COLORS.border}`
              }}
            >
              {INTERVAL_OPTIONS.map((seconds) => {
                const selected =
                  intervalSec === seconds;

                return (
                  <button
                    key={seconds}
                    type="button"
                    onClick={() =>
                      setIntervalSec(seconds)
                    }
                    style={{
                      minWidth: 39,
                      height: 28,
                      border: 'none',
                      borderRadius: 7,
                      background: selected
                        ? COLORS.surface
                        : 'transparent',
                      color: selected
                        ? COLORS.blue
                        : COLORS.muted,
                      boxShadow: selected
                        ? '0 2px 7px rgba(15,23,42,0.08)'
                        : 'none',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {seconds}s
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Severity selector */}

        <div
          style={{
            marginTop: 15,
            paddingTop: 15,
            borderTop: `1px solid #EEF2F6`
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 8
            }}
          >
            <div>
              <div
                style={{
                  color: COLORS.text,
                  fontSize: '0.72rem',
                  fontWeight: 850
                }}
              >
                Scenario category
              </div>

              <div
                style={{
                  marginTop: 2,
                  color: COLORS.subtle,
                  fontSize: '0.62rem'
                }}
              >
                Choose the type of incident the generator
                should prioritize.
              </div>
            </div>

            <span
              style={{
                padding: '4px 8px',
                borderRadius: 7,
                background: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.muted,
                fontSize: '0.61rem',
                fontWeight: 700
              }}
            >
              Current:{' '}
              {
                SEVERITY_OPTIONS.find(
                  (option) =>
                    option.id === severityFilter
                )?.shortLabel
              }
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(145px, 1fr))',
              gap: 7
            }}
          >
            {SEVERITY_OPTIONS.map((option) => {
              const selected =
                severityFilter === option.id;

              const isCritical =
                option.id === 'CRITICAL_SIF';

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setSeverityFilter(option.id)
                  }
                  style={{
                    minHeight: 54,
                    padding: '9px 10px',
                    textAlign: 'left',
                    borderRadius: 10,
                    border: `1px solid ${
                      selected
                        ? isCritical
                          ? COLORS.redBorder
                          : COLORS.indigoBorder
                        : COLORS.border
                    }`,
                    background: selected
                      ? isCritical
                        ? COLORS.redSoft
                        : COLORS.indigoSoft
                      : COLORS.surface,
                    color: selected
                      ? isCritical
                        ? COLORS.red
                        : COLORS.indigo
                      : COLORS.text,
                    cursor: 'pointer',
                    transition:
                      'all .18s ease'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.69rem',
                      fontWeight: 850
                    }}
                  >
                    {option.label}
                  </div>

                  <div
                    style={{
                      marginTop: 3,
                      color: selected
                        ? isCritical
                          ? '#B91C1C'
                          : COLORS.indigo
                        : COLORS.subtle,
                      fontSize: '0.6rem',
                      lineHeight: 1.3
                    }}
                  >
                    {option.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {streamError && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 13,
            background: COLORS.redSoft,
            border: `1px solid ${COLORS.redBorder}`,
            color: '#B91C1C',
            fontSize: '0.72rem',
            lineHeight: 1.45
          }}
        >
          <div
            style={{
              width: 23,
              height: 23,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 7,
              background: '#FEE2E2',
              fontWeight: 900
            }}
          >
            !
          </div>

          <div style={{ flex: 1 }}>
            <strong>Simulator connection issue</strong>
            <div style={{ marginTop: 2 }}>
              {streamError}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStreamError('')}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#B91C1C',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 800
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* =====================================================
          TELEMETRY
          ===================================================== */}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 12,
          marginBottom: 23
        }}
      >
        <StatCard
          label="Events Generated"
          value={stats.total}
          helper="Incidents generated during this session"
          color={COLORS.blue}
          soft={COLORS.blueSoft}
          icon="01"
        />

        <StatCard
          label="SIF Ratio"
          value={`${sifRatio}%`}
          helper={`${stats.sifCount} simulated SIF-potential events`}
          color={COLORS.red}
          soft={COLORS.redSoft}
          icon="SIF"
        />

        <StatCard
          label="AI Latency"
          value={`~${stats.avgLatency} ms`}
          helper="Measured client-side round-trip latency"
          color={COLORS.green}
          soft={COLORS.greenSoft}
          icon="MS"
        />

        <StatCard
          label="Safety Rules"
          value={iogpCount}
          helper="IOGP rule mitigations triggered in visible feed"
          color={COLORS.orange}
          soft={COLORS.orangeSoft}
          icon="R"
        />
      </section>

      {/* =====================================================
          LIVE STREAM HEADER
          ===================================================== */}

      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 11
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  color: COLORS.navy,
                  fontSize: '1.05rem',
                  fontWeight: 850,
                  letterSpacing: '-0.02em'
                }}
              >
                Live simulated safety stream
              </h2>

              <span
                style={{
                  padding: '4px 7px',
                  borderRadius: 999,
                  background: COLORS.background,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.muted,
                  fontSize: '0.59rem',
                  fontWeight: 750
                }}
              >
                Latest {incidents.length} of 25
              </span>
            </div>

            <p
              style={{
                margin: '4px 0 0',
                color: COLORS.subtle,
                fontSize: '0.67rem'
              }}
            >
              Each event is generated and analyzed through
              the configured safety pipeline.
            </p>
          </div>

          {streamActive && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 9px',
                borderRadius: 9,
                background: COLORS.greenSoft,
                border: `1px solid ${COLORS.greenBorder}`,
                color: COLORS.green,
                fontSize: '0.64rem',
                fontWeight: 800
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: COLORS.green,
                  animation:
                    'sifSimulatorPulse 1.2s ease-in-out infinite'
                }}
              />

              New event every {intervalSec}s
            </div>
          )}
        </div>

        <style>
          {`
            @keyframes sifSimulatorPulse {
              0%, 100% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: .45;
                transform: scale(.8);
              }
            }

            @keyframes sifSimulatorSpin {
              to {
                transform: rotate(360deg);
              }
            }
          `}
        </style>

        {/* ===================================================
            EMPTY STATE
            =================================================== */}

        {incidents.length === 0 && (
          <div
            style={{
              background: COLORS.surface,
              border: `1px dashed ${COLORS.borderStrong}`,
              borderRadius: 19,
              padding: '4rem 1.5rem',
              textAlign: 'center',
              boxShadow:
                '0 7px 25px rgba(15,23,42,0.025)'
            }}
          >
            <div
              style={{
                width: 58,
                height: 58,
                margin: '0 auto 15px',
                display: 'grid',
                placeItems: 'center',
                borderRadius: 17,
                background: COLORS.indigoSoft,
                border: `1px solid ${COLORS.indigoBorder}`,
                color: COLORS.indigo,
                fontSize: '0.8rem',
                fontWeight: 900
              }}
            >
              SIM
            </div>

            <h3
              style={{
                margin: 0,
                color: COLORS.navy,
                fontSize: '1rem',
                fontWeight: 850
              }}
            >
              Simulator ready
            </h3>

            <p
              style={{
                maxWidth: 500,
                margin: '7px auto 17px',
                color: COLORS.muted,
                fontSize: '0.75rem',
                lineHeight: 1.55
              }}
            >
              Start the live stream to continuously generate
              randomized workplace incidents, or use Single
              Step to create one event for inspection.
            </p>

            <button
              type="button"
              onClick={feedNextIncident}
              disabled={loadingStep}
              style={{
                ...primaryButton,
                opacity: loadingStep ? 0.6 : 1
              }}
            >
              {loadingStep
                ? 'Generating first incident...'
                : 'Generate First Incident'}
            </button>
          </div>
        )}

        {/* ===================================================
            INCIDENT LIST
            =================================================== */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 11
          }}
        >
          <AnimatePresence initial={false}>
            {incidents.map((incident, index) => (
              <IncidentCard
                key={getIncidentKey(incident, index)}
                incident={incident}
                onInspect={() =>
                  handleInspectInAnalyzer(incident)
                }
              />
            ))}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   INCIDENT CARD
   ========================================================= */

function IncidentCard({
  incident,
  onInspect
}) {
  const sif = Boolean(
    incident?.classification?.sif_potential
  );

  const score = getScore(incident);
  const level = getLevel(incident);
  const risk = getRiskConfig(level);
  const simulation = incident?.simulation || {};

  const modelScore =
    incident?.classification?.model_score;

  const predictedNature =
    incident?.classification?.predicted_nature;

  const iogpRule =
    incident?.risk?.iogp_rule;

  const location =
    simulation?.site ||
    incident?.nlp?.location ||
    'Operational Facility';

  const shift =
    simulation?.shift || '';

  const industry =
    simulation?.industry || '';

  const eventDate =
    simulation?.event_date ||
    '';

  const activity =
    incident?.nlp?.activity ||
    '';

  const hazard =
    incident?.nlp?.hazard ||
    '';

  const barrier =
    incident?.nlp?.barrier_failure ||
    '';

  const receivedAt =
    incident?.receivedAt ||
    '';

  const clientLatency =
    incident?.clientLatency;

  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: -12,
        scale: 0.985
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1
      }}
      exit={{
        opacity: 0,
        scale: 0.97
      }}
      transition={{
        duration: 0.24
      }}
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${risk.color}`,
        borderRadius: 17,
        padding: '15px 17px',
        boxShadow: sif
          ? '0 9px 28px rgba(220,38,38,0.075)'
          : '0 6px 22px rgba(15,23,42,0.035)'
      }}
    >
      {/* Top row */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 11
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 6
          }}
        >
          {eventDate && (
            <MetaChip
              label="Date"
              value={eventDate}
              tone="blue"
            />
          )}

          <MetaChip
            label="Site"
            value={location}
          />

          {shift && (
            <MetaChip
              label="Shift"
              value={shift}
            />
          )}

          {industry && (
            <MetaChip
              value={industry}
            />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            flexWrap: 'wrap'
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 9px',
              borderRadius: 999,
              background: risk.soft,
              border: `1px solid ${risk.border}`,
              color: risk.color,
              fontSize: '0.65rem',
              fontWeight: 850
            }}
          >
            {risk.label} Risk
            <span style={{ opacity: 0.65 }}>
              {score}/100
            </span>
          </span>

          {sif && (
            <span
              style={{
                padding: '5px 9px',
                borderRadius: 999,
                background: COLORS.redSoft,
                border: `1px solid ${COLORS.redBorder}`,
                color: COLORS.red,
                fontSize: '0.64rem',
                fontWeight: 850
              }}
            >
              SIF Potential
            </span>
          )}

          <button
            type="button"
            onClick={onInspect}
            style={{
              height: 30,
              padding: '0 9px',
              borderRadius: 8,
              border: `1px solid ${COLORS.blueBorder}`,
              background: COLORS.blueSoft,
              color: COLORS.blue,
              fontSize: '0.62rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Inspect in Analyzer →
          </button>
        </div>
      </div>

      {/* Narrative */}

      <div
        style={{
          padding: '12px 13px',
          borderRadius: 12,
          background: COLORS.background,
          border: `1px solid ${COLORS.border}`,
          color: COLORS.text,
          fontSize: '0.79rem',
          lineHeight: 1.58,
          marginBottom: 11
        }}
      >
        {getIncidentNarrative(incident)}
      </div>

      {/* Extracted safety intelligence */}

      {(activity || hazard || barrier) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 7,
            marginBottom: 11
          }}
        >
          {activity && (
            <IntelligenceField
              label="Activity"
              value={activity}
            />
          )}

          {hazard && (
            <IntelligenceField
              label="Hazard"
              value={hazard}
              danger
            />
          )}

          {barrier && (
            <IntelligenceField
              label="Barrier Failure"
              value={barrier}
              danger
            />
          )}
        </div>
      )}

      {/* Intelligence footer */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          paddingTop: 10,
          borderTop: `1px solid #EEF2F6`
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap'
          }}
        >
          {modelScore !== undefined &&
            modelScore !== null && (
              <MetaChip
                label="OSHA ML"
                value={`${formatProbability(
                  modelScore
                )} SIF probability`}
                tone="blue"
              />
            )}

          {predictedNature && (
            <MetaChip
              label="Predicted injury"
              value={predictedNature}
            />
          )}

          {iogpRule && (
            <MetaChip
              label="Safety rule"
              value={iogpRule}
              tone="orange"
            />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            color: COLORS.subtle,
            fontSize: '0.61rem',
            fontWeight: 650
          }}
        >
          {receivedAt && (
            <span>
              Received {receivedAt}
            </span>
          )}

          {clientLatency !== undefined && (
            <span>
              {clientLatency} ms
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* =========================================================
   INTELLIGENCE FIELD
   ========================================================= */

function IntelligenceField({
  label,
  value,
  danger = false
}) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: '9px 10px',
        borderRadius: 10,
        background: danger
          ? COLORS.redSoft
          : COLORS.background,
        border: `1px solid ${
          danger
            ? COLORS.redBorder
            : COLORS.border
        }`
      }}
    >
      <div
        style={{
          color: COLORS.subtle,
          fontSize: '0.57rem',
          fontWeight: 850,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 4,
          color: danger
            ? '#B91C1C'
            : COLORS.text,
          fontSize: '0.68rem',
          lineHeight: 1.35,
          fontWeight: 750,
          overflowWrap: 'anywhere'
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   BUTTON STYLES
   ========================================================= */

const primaryButton = {
  minHeight: 40,
  padding: '0 15px',
  border: 'none',
  borderRadius: 10,
  background: COLORS.blue,
  color: '#FFFFFF',
  fontSize: '0.73rem',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 6px 16px rgba(37,99,235,0.18)'
};

const secondaryButton = {
  minHeight: 40,
  padding: '0 14px',
  border: `1px solid ${COLORS.borderStrong}`,
  borderRadius: 10,
  background: COLORS.surface,
  color: COLORS.text,
  fontSize: '0.73rem',
  fontWeight: 750,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(15,23,42,0.035)'
};