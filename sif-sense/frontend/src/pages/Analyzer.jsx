import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { analyzeReport, getOshaSamples } from '../services/api';
import PrecursorGraph from '../components/PrecursorGraph';

const PIPELINE_STEPS = [
  { id: 'nlp', label: 'Safety NLP', icon: '🧠', desc: 'Extracting location, activity, & barriers' },
  { id: 'classify', label: 'OSHA AI Model', icon: '⚡', desc: '106k OSHA calibrated classification' },
  { id: 'risk', label: 'Risk & IOGP', icon: '🔥', desc: 'Calculating SIF priority score' },
];

function ScoreRing({ score, level }) {
  const radius = 44;
  const circ = 2 * Math.PI * radius;
  const fill = (score / 100) * circ;
  const colorMap = { CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e' };
  const color = colorMap[level] || '#6366f1';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
      <div className="score-ring-container" style={{ width: 110, height: 110, flexShrink: 0 }}>
        <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
          <circle
            cx="55" cy="55" r={radius} fill="none"
            stroke={color} strokeWidth="9"
            strokeDasharray={`${fill} ${circ - fill}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s ease-out', filter: `drop-shadow(0 0 8px ${color}66)` }}
          />
        </svg>
        <div className="score-text-center">
          <div className="score-number" style={{ color, fontSize: '1.6rem' }}>{score}</div>
          <div className="score-label" style={{ fontSize: '0.62rem' }}>/ 100</div>
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          SIF Priority
        </div>
        <div className={`risk-badge ${level}`} style={{ fontSize: '0.8rem', padding: '4px 12px', marginTop: 4 }}>
          {level} RISK
        </div>
      </div>
    </div>
  );
}

export default function Analyzer({ onNewAlert }) {
  const [reportText, setReportText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [oshaSamples, setOshaSamples] = useState([]);
  const [activeTab, setActiveTab] = useState('input'); // 'input' | 'result'
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  // Load benchmark OSHA samples
  useEffect(() => {
    const fetchSamples = async () => {
      try {
        const res = await getOshaSamples();
        setOshaSamples(res.data);
      } catch (_) {}
    };
    fetchSamples();
  }, []);

  const runAnalysis = useCallback(async (customText) => {
    const textToRun = typeof customText === 'string' ? customText : reportText;
    if (!textToRun.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await analyzeReport(textToRun);
      setResult(res.data);
      setActiveTab('result');
      if (res.data.risk?.score >= 80 && onNewAlert) onNewAlert();
    } catch (e) {
      setError('Analysis failed. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [reportText, onNewAlert]);

  const handleCopySummary = () => {
    if (!result) return;
    const summary = `SIF-Sense AI Incident Assessment:
Priority Score: ${result.risk?.score}/100 (${result.risk?.level})
SIF Precursor: ${result.classification?.sif_potential ? 'YES (Critical Warning)' : 'NO (Minor Concern)'}
Predicted Injury: ${result.classification?.predicted_nature}
Required Action: ${result.risk?.ai_recommendation}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '3.5rem' }}>
      {/* Mobile / Narrow Screen Tab Switcher */}
      <div className="analyzer-tab-bar" style={{
        display: 'flex',
        gap: 6,
        background: 'rgba(15, 23, 42, 0.7)',
        padding: 4,
        borderRadius: 12,
        marginBottom: '1rem',
        border: '1px solid var(--border-color)'
      }}>
        <button
          onClick={() => setActiveTab('input')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'input' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'input' ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.2s'
          }}
        >
          📝 1. Describe Incident
        </button>
        <button
          onClick={() => setActiveTab('result')}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            borderRadius: 8,
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'result' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'result' ? '#fff' : 'var(--text-secondary)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          🎯 2. Safety Result
          {result && (
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: result.classification?.sif_potential ? '#ef4444' : '#10b981'
            }} />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="analyzer-grid-desktop">
        {/* TAB 1: INPUT VIEW */}
        <div className={`analyzer-col ${activeTab === 'input' ? 'active-col' : ''}`}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ padding: '1.25rem', marginBottom: '0.5rem' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f1f5f9' }}>
                Safety Incident / Observation Text
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {reportText.length} chars
              </span>
            </div>

            <textarea
              className="textarea-report"
              style={{
                width: '100%',
                minHeight: 110,
                resize: 'vertical',
                padding: '0.75rem',
                fontSize: '0.9rem',
                lineHeight: 1.45,
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                color: '#f8fafc',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              placeholder="Describe what happened, or tap a sample below...&#10;&#10;e.g. Worker was clearing jammed conveyor without lockout tagout and hand was caught."
            />

            {/* Tap-to-Test Real OSHA Benchmark Cases */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                ⚡ Quick Presets (106k OSHA Dataset):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {oshaSamples.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{
                      fontSize: '0.72rem',
                      padding: '4px 8px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 6,
                      color: sample.badge === 'CRITICAL SIF' ? '#fca5a5' : sample.badge === 'HIGH RISK' ? '#fde68a' : '#93c5fd'
                    }}
                    onClick={() => {
                      setReportText(sample.narrative);
                      setError(null);
                      runAnalysis(sample.narrative);
                    }}
                  >
                    {sample.category}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                className="btn btn-primary"
                onClick={() => runAnalysis()}
                disabled={loading || !reportText.trim()}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                    Analyzing with OSHA Model...
                  </>
                ) : (
                  '🚀 Analyze Incident'
                )}
              </button>

              {reportText && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setReportText('');
                    setResult(null);
                    setError(null);
                  }}
                  style={{ border: '1px solid var(--border)', padding: '0 12px' }}
                >
                  Clear
                </button>
              )}
            </div>

            {error && (
              <div style={{
                marginTop: 10,
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 8,
                fontSize: '0.78rem',
                color: '#f87171'
              }}>
                ⚠️ {error}
              </div>
            )}
          </motion.div>
        </div>

        {/* TAB 2: RESULTS VIEW */}
        <div className={`analyzer-col ${activeTab === 'result' ? 'active-col' : ''}`}>
          <AnimatePresence>
            {!result && !loading ? (
              <div className="card" style={{
                padding: '2.5rem 1.5rem',
                textAlign: 'center',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px dashed var(--border-color)',
                borderRadius: 14
              }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔍</div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#f1f5f9' }}>
                  No Analysis Yet
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0 0 12px 0' }}>
                  Type an incident or tap one of the OSHA presets above to run the AI model.
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('input')}
                >
                  ← Go to Incident Input
                </button>
              </div>
            ) : result ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}
              >
                {/* Clean Status Banner */}
                <div style={{
                  background: result.classification?.sif_potential
                    ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(30, 41, 59, 0.7) 100%)'
                    : 'linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(30, 41, 59, 0.7) 100%)',
                  border: `1px solid ${result.classification?.sif_potential ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.3)'}`,
                  borderRadius: 12,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <span style={{ fontSize: '1.6rem' }}>
                    {result.classification?.sif_potential ? '🚨' : '✅'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      color: result.classification?.sif_potential ? '#f87171' : '#34d399'
                    }}>
                      {result.classification?.sif_potential
                        ? 'SERIOUS INJURY PRECURSOR (SIF)'
                        : 'LOW SIF RISK / MINOR EVENT'}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      OSHA Probability: <strong>{(result.classification?.model_score * 100).toFixed(1)}%</strong>
                      {result.classification?.predicted_nature && (
                        <span> · Nature: <strong style={{ color: '#fff' }}>{result.classification.predicted_nature}</strong></span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleCopySummary}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.72rem', border: '1px solid var(--border)', padding: '4px 8px' }}
                  >
                    {copied ? '✓' : '📋'}
                  </button>
                </div>

                {/* Score + 3 Clean Plain-English Cards */}
                <div className="card" style={{ padding: '1rem 1.25rem' }}>
                  <ScoreRing score={result.risk?.score || 0} level={result.risk?.level || 'LOW'} />
                </div>

                {/* 3 Plain-English Takeaway Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>PREDICTED INJURY</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                      ⚡ {result.classification?.predicted_nature || 'Industrial Trauma'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>CRITICAL BARRIER</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fca5a5', marginTop: 2 }}>
                      🚫 {result.nlp?.barrier_failure || 'Control Bypassed'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SAFETY RULE</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#93c5fd', marginTop: 2 }}>
                      🛡️ {result.risk?.iogp_rule || 'Life-Saving Rule'}
                    </div>
                  </div>
                </div>

                {/* Word Highlights Tag Cloud */}
                {result.classification?.risk_tokens && result.classification.risk_tokens.length > 0 && (
                  <div className="card" style={{ padding: '1rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>
                      🔍 Trigger Words Detected by OSHA Model:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {result.classification.risk_tokens.map((tok, i) => (
                        <span
                          key={i}
                          style={{
                            background: tok.weight > 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                            border: `1px solid ${tok.weight > 10 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.25)'}`,
                            color: tok.weight > 10 ? '#fca5a5' : '#fde68a',
                            borderRadius: 6,
                            padding: '2px 7px',
                            fontSize: '0.74rem',
                            fontWeight: 600
                          }}
                        >
                          {tok.word} <span style={{ opacity: 0.65 }}>+{tok.weight}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Advice */}
                {result.risk?.ai_recommendation && (
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: '0.82rem',
                    color: '#e0e7ff',
                    lineHeight: 1.45
                  }}>
                    💡 <strong>Immediate Required Action:</strong> {result.risk.ai_recommendation}
                  </div>
                )}

                {/* Collapsible Advanced Technical Section */}
                <div style={{ marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      fontSize: '0.76rem',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)'
                    }}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? '▲ Hide Advanced Technical Details' : '▼ Show Causality Graph & Score Breakdown'}
                  </button>

                  {showAdvanced && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}
                    >
                      {/* Causality Graph */}
                      {result.graph && (
                        <div className="card" style={{ padding: '1rem' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 6 }}>
                            Precursor Causality Graph
                          </div>
                          <PrecursorGraph graphData={result.graph} height={200} />
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
