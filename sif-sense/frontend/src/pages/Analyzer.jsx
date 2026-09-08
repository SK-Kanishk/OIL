import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  analyzeReport,
  getOshaSamples,
  generateSimulatedIncident,
  feedSimulatedIncident
} from '../services/api';
import PrecursorGraph from '../components/PrecursorGraph';

const PIPELINE_STEPS = [
  {
    id: 'nlp',
    label: 'Safety NLP',
    desc: 'Identifying hazards, activities and barriers'
  },
  {
    id: 'classify',
    label: 'OSHA AI Model',
    desc: 'Comparing against workplace injury patterns'
  },
  {
    id: 'risk',
    label: 'Risk Assessment',
    desc: 'Calculating SIF priority and required action'
  }
];

const SIMULATOR_OPTIONS = [
  { id: 'ANY', label: 'Random', description: 'Any scenario' },
  { id: 'CRITICAL_SIF', label: 'Critical SIF', description: 'Severe injury precursor' },
  { id: 'HIGH_RISK_NEAR_MISS', label: 'Near Miss', description: 'High-risk near miss' },
  { id: 'LOW_OBSERVATION', label: 'Low Risk', description: 'Routine observation' }
];

const RISK_CONFIG = {
  CRITICAL: {
    label: 'Critical',
    color: '#dc2626',
    soft: '#fef2f2',
    border: '#fecaca',
    icon: '!'
  },
  HIGH: {
    label: 'High',
    color: '#ea580c',
    soft: '#fff7ed',
    border: '#fed7aa',
    icon: '!'
  },
  MEDIUM: {
    label: 'Moderate',
    color: '#ca8a04',
    soft: '#fefce8',
    border: '#fde68a',
    icon: '~'
  },
  LOW: {
    label: 'Low',
    color: '#16a34a',
    soft: '#f0fdf4',
    border: '#bbf7d0',
    icon: '✓'
  }
};

function getRiskConfig(level) {
  return RISK_CONFIG[level] || RISK_CONFIG.LOW;
}

function formatDate(date) {
  if (!date) return '';
  try {
    return new Date(date).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return date;
  }
}

function ScoreRing({ score = 0, level = 'LOW' }) {
  const radius = 58;
  const size = 148;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.max(0, Math.min(100, Number(score) || 0));
  const progress = (safeScore / 100) * circumference;
  const risk = getRiskConfig(level);

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0
      }}
      aria-label={`Risk score ${safeScore} out of 100`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={stroke}
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={risk.color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${progress} ${circumference}` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            fontSize: '2rem',
            lineHeight: 1,
            fontWeight: 800,
            color: '#111827',
            letterSpacing: '-0.04em'
          }}
        >
          {safeScore}
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: '0.7rem',
            color: '#6b7280',
            fontWeight: 600
          }}
        >
          OUT OF 100
        </div>
      </div>
    </div>
  );
}

function RiskBadge({ level }) {
  const risk = getRiskConfig(level);

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 10px',
        borderRadius: 999,
        background: risk.soft,
        border: `1px solid ${risk.border}`,
        color: risk.color,
        fontSize: '0.72rem',
        fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: risk.color
        }}
      />
      {risk.label} Risk
    </span>
  );
}

function InfoCard({ label, value, icon, danger = false }) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: '13px 14px',
        borderRadius: 12,
        background: danger ? '#fff7f7' : '#f8fafc',
        border: danger ? '1px solid #fee2e2' : '1px solid #e5e7eb'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 6,
          color: '#64748b',
          fontSize: '0.68rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.045em'
        }}
      >
        <span>{icon}</span>
        {label}
      </div>

      <div
        style={{
          color: danger ? '#b91c1c' : '#1e293b',
          fontSize: '0.86rem',
          fontWeight: 700,
          lineHeight: 1.35,
          overflowWrap: 'anywhere'
        }}
      >
        {value || 'Not identified'}
      </div>
    </div>
  );
}

function EmptyResult() {
  return (
    <div
      style={{
        minHeight: 390,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
        border: '1px dashed #cbd5e1',
        borderRadius: 18,
        background: '#ffffff'
      }}
    >
      <div style={{ maxWidth: 390 }}>
        <div
          style={{
            width: 58,
            height: 58,
            margin: '0 auto 16px',
            borderRadius: 16,
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.35rem',
            fontWeight: 800
          }}
        >
          AI
        </div>

        <h3
          style={{
            margin: '0 0 7px',
            color: '#0f172a',
            fontSize: '1.05rem',
            fontWeight: 800
          }}
        >
          Ready to assess your report
        </h3>

        <p
          style={{
            margin: 0,
            color: '#64748b',
            fontSize: '0.84rem',
            lineHeight: 1.55
          }}
        >
          Describe a workplace incident or observation on the left.
          SIF-Sense will identify risk indicators and provide a clear
          safety priority.
        </p>
      </div>
    </div>
  );
}

export default function Analyzer({ onNewAlert }) {
  const location = useLocation();

  const [reportText, setReportText] = useState(
    location.state?.preloadedText || ''
  );

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [oshaSamples, setOshaSamples] = useState([]);
  const [activeTab, setActiveTab] = useState('input');

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  const [simulatedMeta, setSimulatedMeta] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simSeverity, setSimSeverity] = useState('ANY');

  const handleSimulate = async (autoFeed = false) => {
    try {
      setSimulating(true);
      setError(null);

      if (autoFeed) {
        setLoading(true);

        const res = await feedSimulatedIncident(simSeverity);

        setSimulatedMeta(res.data.simulation);
        setReportText(res.data.simulation.narrative);
        setResult(res.data);
        setActiveTab('result');

        if (res.data.risk?.score >= 80 && onNewAlert) {
          onNewAlert();
        }
      } else {
        const res = await generateSimulatedIncident(simSeverity);

        setSimulatedMeta(res.data);
        setReportText(res.data.narrative);
        setResult(null);
        setActiveTab('input');
      }
    } catch (err) {
      console.error(err);
      setError('Unable to connect to the simulator service.');
    } finally {
      setSimulating(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const res = await getOshaSamples();
        setOshaSamples(res.data);
      } catch (_) {
        // Keep presets optional if the backend is unavailable.
      }
    };

    fetchSamples();
  }, []);

  const runAnalysis = useCallback(
    async (customText) => {
      const textToRun =
        typeof customText === 'string' ? customText : reportText;

      if (!textToRun.trim()) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await analyzeReport(textToRun);

        setResult(res.data);
        setActiveTab('result');

        if (res.data.risk?.score >= 80 && onNewAlert) {
          onNewAlert();
        }
      } catch (e) {
        console.error(e);
        setError('Analysis failed. Please check the backend connection.');
      } finally {
        setLoading(false);
      }
    },
    [reportText, onNewAlert]
  );

  useEffect(() => {
    if (location.state?.preloadedText) {
      setReportText(location.state.preloadedText);
      runAnalysis(location.state.preloadedText);
    }
  }, [location.state, runAnalysis]);

  const handleCopySummary = async () => {
    if (!result) return;

    const summary = `SIF-Sense AI Incident Assessment:
Priority Score: ${result.risk?.score}/100 (${result.risk?.level})
SIF Precursor: ${
      result.classification?.sif_potential
        ? 'YES (Critical Warning)'
        : 'NO (Minor Concern)'
    }
Predicted Injury: ${result.classification?.predicted_nature}
Required Action: ${result.risk?.ai_recommendation}`;

    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      setError('Could not copy the assessment summary.');
    }
  };

  const clearReport = () => {
    setReportText('');
    setResult(null);
    setError(null);
    setSimulatedMeta(null);
    setShowAdvanced(false);
  };

  const riskLevel = result?.risk?.level || 'LOW';
  const risk = getRiskConfig(riskLevel);
  const sifPotential = Boolean(result?.classification?.sif_potential);

  return (
    <div
      className="page-container animate-fade-in"
      style={{
        paddingBottom: '3.5rem',
        color: '#0f172a'
      }}
    >
      {/* PAGE HEADER */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 18,
          marginBottom: 20,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 9px',
              marginBottom: 8,
              borderRadius: 999,
              background: '#eff6ff',
              color: '#2563eb',
              fontSize: '0.68rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            AI Safety Assessment
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(1.45rem, 3vw, 2rem)',
              lineHeight: 1.15,
              letterSpacing: '-0.035em',
              color: '#0f172a',
              fontWeight: 850
            }}
          >
            Analyze a Safety Report
          </h1>

          <p
            style={{
              margin: '7px 0 0',
              color: '#64748b',
              fontSize: '0.88rem',
              lineHeight: 1.5,
              maxWidth: 650
            }}
          >
            Turn a workplace observation into a clear risk assessment,
            SIF warning and recommended safety action.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 11px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            color: '#64748b',
            fontSize: '0.72rem',
            fontWeight: 600
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 0 3px #dcfce7'
            }}
          />
          AI analysis ready
        </div>
      </div>

      {/* MOBILE WORKFLOW */}
      <div
        className="analyzer-tab-bar"
        style={{
          display: 'flex',
          gap: 5,
          padding: 4,
          marginBottom: 14,
          background: '#f1f5f9',
          border: '1px solid #e2e8f0',
          borderRadius: 12
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('input')}
          style={{
            flex: 1,
            minHeight: 40,
            border: 'none',
            borderRadius: 9,
            background: activeTab === 'input' ? '#ffffff' : 'transparent',
            color: activeTab === 'input' ? '#0f172a' : '#64748b',
            boxShadow:
              activeTab === 'input'
                ? '0 1px 4px rgba(15,23,42,0.10)'
                : 'none',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          1. Incident
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('result')}
          style={{
            flex: 1,
            minHeight: 40,
            border: 'none',
            borderRadius: 9,
            background: activeTab === 'result' ? '#ffffff' : 'transparent',
            color: activeTab === 'result' ? '#0f172a' : '#64748b',
            boxShadow:
              activeTab === 'result'
                ? '0 1px 4px rgba(15,23,42,0.10)'
                : 'none',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          2. Safety Result

          {result && (
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 10,
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: sifPotential ? '#ef4444' : '#22c55e'
              }}
            />
          )}
        </button>
      </div>

      {/* MAIN WORKSPACE */}
      <div
        className="analyzer-grid-desktop"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
          gap: 18,
          alignItems: 'start'
        }}
      >
        {/* ============================================================
            INPUT
        ============================================================ */}
        <div
          className={`analyzer-col ${
            activeTab === 'input' ? 'active-col' : ''
          }`}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{
              padding: 18,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 18,
              boxShadow: '0 8px 30px rgba(15,23,42,0.06)'
            }}
          >
            {/* SIMULATOR */}
            <div
              style={{
                padding: 15,
                marginBottom: 17,
                borderRadius: 14,
                background: '#f8fafc',
                border: '1px solid #e2e8f0'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 12,
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 9,
                        background: '#e0e7ff',
                        color: '#4338ca',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 900
                      }}
                    >
                      SIM
                    </div>

                    <div>
                      <div
                        style={{
                          color: '#0f172a',
                          fontSize: '0.84rem',
                          fontWeight: 800
                        }}
                      >
                        Safety Scenario Simulator
                      </div>

                      <div
                        style={{
                          color: '#64748b',
                          fontSize: '0.7rem',
                          marginTop: 2
                        }}
                      >
                        Generate realistic test scenarios for the AI
                      </div>
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: 999,
                    background: '#eef2ff',
                    color: '#4f46e5',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}
                >
                  Dynamic
                </span>
              </div>

              {/* SEVERITY */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(125px, 1fr))',
                  gap: 7,
                  marginBottom: 10
                }}
              >
                {SIMULATOR_OPTIONS.map((option) => {
                  const selected = simSeverity === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSimSeverity(option.id)}
                      style={{
                        padding: '9px 9px',
                        textAlign: 'left',
                        borderRadius: 9,
                        border: selected
                          ? '1px solid #6366f1'
                          : '1px solid #e2e8f0',
                        background: selected ? '#eef2ff' : '#ffffff',
                        color: selected ? '#3730a3' : '#475569',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800
                        }}
                      >
                        {option.label}
                      </div>

                      <div
                        style={{
                          marginTop: 2,
                          fontSize: '0.61rem',
                          color: selected ? '#6366f1' : '#94a3b8'
                        }}
                      >
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* SIMULATOR BUTTONS */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: 8
                }}
              >
                <button
                  type="button"
                  onClick={() => handleSimulate(false)}
                  disabled={simulating || loading}
                  style={{
                    minHeight: 40,
                    border: '1px solid #c7d2fe',
                    borderRadius: 9,
                    background: '#ffffff',
                    color: '#4338ca',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor:
                      simulating || loading ? 'not-allowed' : 'pointer',
                    opacity: simulating || loading ? 0.6 : 1
                  }}
                >
                  {simulating
                    ? 'Generating scenario...'
                    : 'Generate Test Scenario'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulate(true)}
                  disabled={simulating || loading}
                  style={{
                    minHeight: 40,
                    border: 'none',
                    borderRadius: 9,
                    background: '#2563eb',
                    color: '#ffffff',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor:
                      simulating || loading ? 'not-allowed' : 'pointer',
                    opacity: simulating || loading ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.18)'
                  }}
                >
                  {simulating
                    ? 'Processing...'
                    : 'Generate & Analyze'}
                </button>
              </div>

              {/* SIMULATION META */}
              {simulatedMeta && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 7,
                    marginTop: 10
                  }}
                >
                  {simulatedMeta.event_date && (
                    <span className="analyzer-meta-chip">
                      Date: {formatDate(simulatedMeta.event_date)}
                    </span>
                  )}

                  {simulatedMeta.site && (
                    <span className="analyzer-meta-chip">
                      Site: {simulatedMeta.site}
                    </span>
                  )}

                  {simulatedMeta.shift && (
                    <span className="analyzer-meta-chip">
                      Shift: {simulatedMeta.shift.split(' ')[0]}
                    </span>
                  )}

                  {simulatedMeta.category && (
                    <span
                      className="analyzer-meta-chip"
                      style={{
                        color: simulatedMeta.expected_sif
                          ? '#b91c1c'
                          : '#166534',
                        background: simulatedMeta.expected_sif
                          ? '#fef2f2'
                          : '#f0fdf4',
                        borderColor: simulatedMeta.expected_sif
                          ? '#fecaca'
                          : '#bbf7d0'
                      }}
                    >
                      {simulatedMeta.category}
                    </span>
                  )}
                </motion.div>
              )}
            </div>

            {/* INPUT TITLE */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8
              }}
            >
              <div>
                <label
                  htmlFor="incident-report"
                  style={{
                    display: 'block',
                    color: '#0f172a',
                    fontSize: '0.88rem',
                    fontWeight: 800
                  }}
                >
                  Describe the incident
                </label>

                <div
                  style={{
                    marginTop: 2,
                    color: '#64748b',
                    fontSize: '0.7rem'
                  }}
                >
                  Include what happened, where it happened and what
                  control may have failed.
                </div>
              </div>

              <span
                style={{
                  padding: '4px 7px',
                  borderRadius: 6,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '0.65rem',
                  fontWeight: 700
                }}
              >
                {reportText.length} chars
              </span>
            </div>

            {/* TEXTAREA */}
            <textarea
              id="incident-report"
              className="textarea-report"
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder={`Example:
Worker was clearing a jammed conveyor without lockout/tagout. His hand entered the moving equipment and was nearly caught.

Tip: Mention the activity, hazard, unsafe act or condition and missing safety barrier.`}
              style={{
                width: '100%',
                minHeight: 190,
                resize: 'vertical',
                boxSizing: 'border-box',
                padding: 14,
                border: '1px solid #cbd5e1',
                borderRadius: 12,
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.86rem',
                lineHeight: 1.6,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />

            {/* OSHA PRESETS */}
            <div style={{ marginTop: 14 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 7
                }}
              >
                <div
                  style={{
                    color: '#334155',
                    fontSize: '0.74rem',
                    fontWeight: 800
                  }}
                >
                  Quick test cases
                </div>

                <span
                  style={{
                    color: '#94a3b8',
                    fontSize: '0.63rem'
                  }}
                >
                  OSHA benchmark dataset
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6
                }}
              >
                {oshaSamples.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      setReportText(sample.narrative);
                      setError(null);
                      runAnalysis(sample.narrative);
                    }}
                    style={{
                      padding: '6px 9px',
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      color:
                        sample.badge === 'CRITICAL SIF'
                          ? '#b91c1c'
                          : sample.badge === 'HIGH RISK'
                          ? '#c2410c'
                          : '#2563eb',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {sample.category}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTIONS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: reportText
                  ? '1fr auto'
                  : '1fr',
                gap: 8,
                marginTop: 17
              }}
            >
              <button
                type="button"
                onClick={() => runAnalysis()}
                disabled={loading || !reportText.trim()}
                style={{
                  minHeight: 46,
                  border: 'none',
                  borderRadius: 10,
                  background:
                    loading || !reportText.trim()
                      ? '#cbd5e1'
                      : '#2563eb',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor:
                    loading || !reportText.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  boxShadow:
                    loading || !reportText.trim()
                      ? 'none'
                      : '0 5px 14px rgba(37,99,235,0.20)'
                }}
              >
                {loading ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <span className="spinner" />
                    Analyzing report...
                  </span>
                ) : (
                  'Analyze Safety Report'
                )}
              </button>

              {reportText && (
                <button
                  type="button"
                  onClick={clearReport}
                  style={{
                    minHeight: 46,
                    padding: '0 15px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 10,
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* ERROR */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 9,
                  marginTop: 12,
                  padding: '11px 12px',
                  borderRadius: 10,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#b91c1c',
                  fontSize: '0.75rem',
                  lineHeight: 1.45
                }}
              >
                <strong>!</strong>
                <span>{error}</span>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* ============================================================
            RESULTS
        ============================================================ */}
        <div
          className={`analyzer-col ${
            activeTab === 'result' ? 'active-col' : ''
          }`}
        >
          <AnimatePresence mode="wait">
            {!result && !loading ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <EmptyResult />
              </motion.div>
            ) : loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  padding: 24,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 18,
                  boxShadow: '0 8px 30px rgba(15,23,42,0.05)'
                }}
              >
                <div
                  style={{
                    marginBottom: 22
                  }}
                >
                  <div
                    style={{
                      color: '#0f172a',
                      fontSize: '1rem',
                      fontWeight: 800
                    }}
                  >
                    Assessing safety risk
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      color: '#64748b',
                      fontSize: '0.75rem'
                    }}
                  >
                    The AI is processing the incident through the
                    safety assessment pipeline.
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}
                >
                  {PIPELINE_STEPS.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        delay: index * 0.25
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        padding: 12,
                        borderRadius: 11,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: '#eff6ff',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.72rem',
                          fontWeight: 900
                        }}
                      >
                        {index + 1}
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: '#1e293b',
                            fontWeight: 800
                          }}
                        >
                          {step.label}
                        </div>

                        <div
                          style={{
                            marginTop: 2,
                            fontSize: '0.67rem',
                            color: '#64748b'
                          }}
                        >
                          {step.desc}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12
                }}
              >
                {/* STATUS */}
                <div
                  style={{
                    padding: 15,
                    borderRadius: 15,
                    background: sifPotential
                      ? '#fff7f7'
                      : '#f0fdf4',
                    border: sifPotential
                      ? '1px solid #fecaca'
                      : '1px solid #bbf7d0'
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
                        width: 38,
                        height: 38,
                        flexShrink: 0,
                        borderRadius: 11,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: sifPotential
                          ? '#fee2e2'
                          : '#dcfce7',
                        color: sifPotential
                          ? '#dc2626'
                          : '#16a34a',
                        fontSize: '1rem',
                        fontWeight: 900
                      }}
                    >
                      {sifPotential ? '!' : '✓'}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          color: sifPotential
                            ? '#991b1b'
                            : '#166534',
                          fontSize: '0.88rem',
                          fontWeight: 850
                        }}
                      >
                        {sifPotential
                          ? 'Serious Injury / Fatality precursor detected'
                          : 'No immediate SIF precursor detected'}
                      </div>

                      <div
                        style={{
                          marginTop: 5,
                          color: '#64748b',
                          fontSize: '0.72rem',
                          lineHeight: 1.45
                        }}
                      >
                        OSHA model confidence:{' '}
                        <strong style={{ color: '#334155' }}>
                          {(
                            (result.classification?.model_score || 0) *
                            100
                          ).toFixed(1)}
                          %
                        </strong>

                        {result.classification?.predicted_nature && (
                          <>
                            {' · '}
                            Predicted injury:{' '}
                            <strong style={{ color: '#334155' }}>
                              {result.classification.predicted_nature}
                            </strong>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopySummary}
                      title="Copy assessment summary"
                      style={{
                        flexShrink: 0,
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        color: '#475569',
                        cursor: 'pointer',
                        fontSize: '0.72rem',
                        fontWeight: 800
                      }}
                    >
                      {copied ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* SCORE */}
                <div
                  style={{
                    padding: 18,
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 16,
                    boxShadow: '0 5px 18px rgba(15,23,42,0.04)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 15,
                      flexWrap: 'wrap'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: '#64748b',
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        SIF Priority Score
                      </div>

                      <div
                        style={{
                          marginTop: 7,
                          fontSize: '1.35rem',
                          color: '#0f172a',
                          fontWeight: 850,
                          letterSpacing: '-0.025em'
                        }}
                      >
                        {risk.label} priority
                      </div>

                      <div style={{ marginTop: 7 }}>
                        <RiskBadge level={riskLevel} />
                      </div>
                    </div>

                    <ScoreRing
                      score={result.risk?.score || 0}
                      level={riskLevel}
                    />
                  </div>

                  {/* SCORE BAR */}
                  <div style={{ marginTop: 14 }}>
                    <div
                      style={{
                        height: 7,
                        background: '#e2e8f0',
                        borderRadius: 999,
                        overflow: 'hidden'
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(
                            100,
                            Math.max(0, result.risk?.score || 0)
                          )}%`
                        }}
                        transition={{
                          duration: 0.9,
                          ease: 'easeOut'
                        }}
                        style={{
                          height: '100%',
                          background: risk.color,
                          borderRadius: 999
                        }}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 5,
                        color: '#94a3b8',
                        fontSize: '0.61rem',
                        fontWeight: 600
                      }}
                    >
                      <span>Low</span>
                      <span>Moderate</span>
                      <span>High</span>
                      <span>Critical</span>
                    </div>
                  </div>
                </div>

                {/* KEY FINDINGS */}
                <div>
                  <div
                    style={{
                      marginBottom: 8,
                      color: '#334155',
                      fontSize: '0.76rem',
                      fontWeight: 850
                    }}
                  >
                    What the AI found
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(145px, 1fr))',
                      gap: 8
                    }}
                  >
                    <InfoCard
                      label="Predicted injury"
                      value={
                        result.classification?.predicted_nature ||
                        'Industrial trauma'
                      }
                      icon="INJ"
                    />

                    <InfoCard
                      label="Critical barrier"
                      value={
                        result.nlp?.barrier_failure ||
                        'Control not identified'
                      }
                      icon="BAR"
                      danger={Boolean(result.nlp?.barrier_failure)}
                    />

                    <InfoCard
                      label="Safety rule"
                      value={
                        result.risk?.iogp_rule ||
                        'Life-Saving Rule'
                      }
                      icon="RULE"
                    />
                  </div>
                </div>

                {/* NLP CONTEXT */}
                {result.nlp && (
                  <div
                    style={{
                      padding: 15,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 15
                    }}
                  >
                    <div
                      style={{
                        marginBottom: 10,
                        color: '#334155',
                        fontSize: '0.76rem',
                        fontWeight: 850
                      }}
                    >
                      Incident context
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(auto-fit, minmax(135px, 1fr))',
                        gap: 7
                      }}
                    >
                      <InfoCard
                        label="Location"
                        value={result.nlp.location}
                        icon="LOC"
                      />

                      <InfoCard
                        label="Activity"
                        value={result.nlp.activity}
                        icon="ACT"
                      />

                      <InfoCard
                        label="Hazard"
                        value={result.nlp.hazard}
                        icon="HAZ"
                        danger={Boolean(result.nlp.hazard)}
                      />

                      <InfoCard
                        label="Unsafe act"
                        value={result.nlp.unsafe_act}
                        icon="ACT"
                      />

                      <InfoCard
                        label="Unsafe condition"
                        value={result.nlp.unsafe_condition}
                        icon="COND"
                      />

                      <InfoCard
                        label="Barrier failure"
                        value={result.nlp.barrier_failure}
                        icon="BAR"
                        danger={Boolean(result.nlp.barrier_failure)}
                      />
                    </div>
                  </div>
                )}

                {/* TRIGGER WORDS */}
                {result.classification?.risk_tokens?.length > 0 && (
                  <div
                    style={{
                      padding: 15,
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: 15
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 9
                      }}
                    >
                      <div
                        style={{
                          color: '#334155',
                          fontSize: '0.76rem',
                          fontWeight: 850
                        }}
                      >
                        Risk indicators detected
                      </div>

                      <span
                        style={{
                          color: '#94a3b8',
                          fontSize: '0.63rem'
                        }}
                      >
                        Model signals
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6
                      }}
                    >
                      {result.classification.risk_tokens.map(
                        (token, index) => {
                          const strong = Number(token.weight) > 10;

                          return (
                            <span
                              key={`${token.word}-${index}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '5px 8px',
                                borderRadius: 7,
                                background: strong
                                  ? '#fef2f2'
                                  : '#fff7ed',
                                border: strong
                                  ? '1px solid #fecaca'
                                  : '1px solid #fed7aa',
                                color: strong
                                  ? '#b91c1c'
                                  : '#c2410c',
                                fontSize: '0.68rem',
                                fontWeight: 700
                              }}
                            >
                              {token.word}
                              <span
                                style={{
                                  opacity: 0.6,
                                  fontSize: '0.6rem'
                                }}
                              >
                                +{token.weight}
                              </span>
                            </span>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* RECOMMENDATION */}
                {result.risk?.ai_recommendation && (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 15,
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          flexShrink: 0,
                          borderRadius: 9,
                          background: '#dbeafe',
                          color: '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 900
                        }}
                      >
                        →
                      </div>

                      <div>
                        <div
                          style={{
                            color: '#1e40af',
                            fontSize: '0.76rem',
                            fontWeight: 850
                          }}
                        >
                          Recommended safety action
                        </div>

                        <div
                          style={{
                            marginTop: 5,
                            color: '#334155',
                            fontSize: '0.78rem',
                            lineHeight: 1.55
                          }}
                        >
                          {result.risk.ai_recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADVANCED */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((value) => !value)}
                    style={{
                      width: '100%',
                      minHeight: 40,
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '0.72rem',
                      fontWeight: 750,
                      cursor: 'pointer'
                    }}
                  >
                    {showAdvanced
                      ? 'Hide technical analysis'
                      : 'View technical analysis & causality graph'}
                  </button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: 1,
                          height: 'auto'
                        }}
                        exit={{
                          opacity: 0,
                          height: 0
                        }}
                        style={{
                          overflow: 'hidden',
                          marginTop: 10
                        }}
                      >
                        <div
                          style={{
                            padding: 15,
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 15
                          }}
                        >
                          <div
                            style={{
                              marginBottom: 9,
                              color: '#334155',
                              fontSize: '0.76rem',
                              fontWeight: 850
                            }}
                          >
                            Precursor causality graph
                          </div>

                          {result.graph ? (
                            <PrecursorGraph
                              graphData={result.graph}
                              height={230}
                            />
                          ) : (
                            <div
                              style={{
                                padding: 20,
                                textAlign: 'center',
                                color: '#94a3b8',
                                fontSize: '0.72rem'
                              }}
                            >
                              No causality graph is available for this
                              assessment.
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}