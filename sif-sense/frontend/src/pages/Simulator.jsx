import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { feedSimulatedIncident, generateSimulatedIncident, getModelStatus } from '../services/api';

export default function Simulator() {
  const navigate = useNavigate();
  const [streamActive, setStreamActive] = useState(false);
  const [intervalSec, setIntervalSec] = useState(3);
  const [severityFilter, setSeverityFilter] = useState('ANY');
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({ total: 0, sifCount: 0, avgLatency: 12 });
  const [modelStatus, setModelStatus] = useState(null);
  const [loadingStep, setLoadingStep] = useState(false);
  
  const timerRef = useRef(null);

  useEffect(() => {
    fetchModelStatus();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchModelStatus = async () => {
    try {
      const res = await getModelStatus();
      setModelStatus(res.data);
    } catch (_) {}
  };

  const feedNextIncident = async () => {
    try {
      setLoadingStep(true);
      const start = performance.now();
      const res = await feedSimulatedIncident(severityFilter);
      const latency = Math.round(performance.now() - start);

      const newEntry = {
        ...res.data,
        receivedAt: new Date().toLocaleTimeString(),
        clientLatency: latency
      };

      setIncidents(prev => [newEntry, ...prev.slice(0, 24)]);
      setStats(prev => {
        const newTotal = prev.total + 1;
        const newSif = prev.sifCount + (res.data.classification?.sif_potential ? 1 : 0);
        return {
          total: newTotal,
          sifCount: newSif,
          avgLatency: Math.round((prev.avgLatency * prev.total + latency) / newTotal)
        };
      });
    } catch (err) {
      console.error('Simulator feed error:', err);
    } finally {
      setLoadingStep(false);
    }
  };

  // Handle continuous stream toggle
  useEffect(() => {
    if (streamActive) {
      // Feed first immediately
      feedNextIncident();
      timerRef.current = setInterval(() => {
        feedNextIncident();
      }, intervalSec * 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [streamActive, intervalSec, severityFilter]);

  const clearFeed = () => {
    setIncidents([]);
    setStats({ total: 0, sifCount: 0, avgLatency: 12 });
  };

  const handleInspectInAnalyzer = (incident) => {
    // Navigate to analyzer with preloaded state
    navigate('/', { state: { preloadedText: incident.simulation?.narrative || incident.preprocessing?.original } });
  };

  const sifRatio = stats.total > 0 ? Math.round((stats.sifCount / stats.total) * 100) : 0;

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '3.5rem' }}>
      {/* Hero Control Center */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        padding: '1.5rem',
        marginBottom: '1.25rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 220, height: 220,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{
                background: 'rgba(99, 102, 241, 0.2)',
                border: '1px solid rgba(99, 102, 241, 0.4)',
                color: '#818cf8',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: 20,
                letterSpacing: '0.05em'
              }}>
                🎮 INCIDENT STREAM SIMULATOR
              </span>
              <span style={{
                background: streamActive ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                border: `1px solid ${streamActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.3)'}`,
                color: streamActive ? '#34d399' : '#94a3b8',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: streamActive ? '#34d399' : '#94a3b8',
                  boxShadow: streamActive ? '0 0 8px #34d399' : 'none'
                }} />
                {streamActive ? 'LIVE STREAM RUNNING' : 'STREAM PAUSED'}
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#f8fafc', fontWeight: 800 }}>
              Real-Time Procedural Safety Incident Generator
            </h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
              Procedurally creates unique dates, operating sites, trades, and industrial narratives every cycle and feeds them through the trained OSHA ML model.
            </p>
          </div>

          {/* Model Status Pill */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '8px 12px',
            fontSize: '0.72rem',
            textAlign: 'right'
          }}>
            <div style={{ color: 'var(--text-muted)' }}>ACTIVE ML ENGINE:</div>
            <div style={{ color: '#38bdf8', fontWeight: 700 }}>
              OSHA 2015-2025 Model ({modelStatus?.total_training_records?.toLocaleString() || '105,995'} Cases)
            </div>
            <div style={{ color: '#34d399', fontSize: '0.68rem', marginTop: 2 }}>
              Accuracy: 96.0% • SIF Recall: 97.5%
            </div>
          </div>
        </div>

        {/* Stream Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          paddingTop: 12,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Main Action Buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn ${streamActive ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => setStreamActive(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {streamActive ? '⏸ Pause Live Stream' : '▶ Start Live Stream Feed'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={feedNextIncident}
              disabled={loadingStep || streamActive}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                fontSize: '0.85rem'
              }}
            >
              {loadingStep ? '⚡ Feeding...' : '🎲 Single Step (Feed 1)'}
            </button>

            {incidents.length > 0 && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={clearFeed}
                style={{ border: '1px solid var(--border)', padding: '0 12px' }}
              >
                Clear Feed
              </button>
            )}
          </div>

          {/* Configuration Options */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Speed Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Interval:</span>
              {[2, 4, 6].map(sec => (
                <button
                  key={sec}
                  onClick={() => setIntervalSec(sec)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: intervalSec === sec ? '#6366f1' : 'rgba(255,255,255,0.1)',
                    background: intervalSec === sec ? 'rgba(99,102,241,0.3)' : 'transparent',
                    color: intervalSec === sec ? '#fff' : '#94a3b8',
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                >
                  {sec}s
                </button>
              ))}
            </div>

            {/* Severity Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>Category:</span>
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              >
                <option value="ANY">Random (All Types)</option>
                <option value="CRITICAL_SIF">Critical SIF Precursor</option>
                <option value="HIGH_RISK_NEAR_MISS">High-Potential Near Miss</option>
                <option value="MEDIUM_PRECURSOR">Medium Operational Risk</option>
                <option value="LOW_OBSERVATION">Low Risk / Observation</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Counter Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 12,
        marginBottom: '1.25rem'
      }}>
        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid #6366f1' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Generated & Fed
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
            Real-time unique procedural events
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid #ef4444' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Critical SIF Ratio
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: 4 }}>
            {sifRatio}% <span style={{ fontSize: '0.85rem', color: '#fca5a5' }}>({stats.sifCount} cases)</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
            Flagged for immediate work stoppage
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid #10b981' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            AI Inference Latency
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', marginTop: 4 }}>
            ~{stats.avgLatency} ms
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
            Sub-millisecond TF-IDF vectorization
          </div>
        </div>

        <div className="card" style={{ padding: '1rem', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            IOGP Rules Triggered
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
            {incidents.filter(i => i.risk?.iogp_rule && !i.risk.iogp_rule.includes('General')).length}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
            Life-Saving Rule mitigations assigned
          </div>
        </div>
      </div>

      {/* Incident Stream Timeline Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f1f5f9', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚡ Live Simulated Safety Stream</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            (showing latest {incidents.length} events)
          </span>
        </h3>
        {streamActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#34d399' }}>
            <span className="spinner" style={{ width: 12, height: 12 }} />
            Streaming new event every {intervalSec}s...
          </div>
        )}
      </div>

      {/* Empty State */}
      {incidents.length === 0 && (
        <div className="card" style={{
          padding: '3.5rem 1.5rem',
          textAlign: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          border: '1px dashed var(--border-color)',
          borderRadius: 14
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🎮</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#f1f5f9' }}>
            Simulator Ready
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 16px 0', maxWidth: 460, marginInline: 'auto' }}>
            Click <strong>"Start Live Stream Feed"</strong> to continuously stream randomized safety incidents with dynamic dates, sites, and AI analysis, or click <strong>"Single Step"</strong> to generate one.
          </p>
          <button
            className="btn btn-primary"
            onClick={feedNextIncident}
            style={{ padding: '10px 20px', fontWeight: 700 }}
          >
            🎲 Generate First Simulated Incident
          </button>
        </div>
      )}

      {/* Incidents Stream Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AnimatePresence>
          {incidents.map((inc) => {
            const isSif = inc.classification?.sif_potential;
            const score = inc.risk?.risk_score || inc.risk?.score || 0;
            const level = inc.risk?.risk_level || inc.risk?.level || 'LOW';
            const sim = inc.simulation || {};

            const levelColors = {
              CRITICAL: '#ef4444',
              HIGH: '#f97316',
              MEDIUM: '#eab308',
              LOW: '#10b981'
            };
            const themeColor = levelColors[level] || '#6366f1';

            return (
              <motion.div
                key={inc.report_id || sim.uuid || Math.random()}
                initial={{ opacity: 0, y: -16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="card"
                style={{
                  padding: '1.1rem 1.25rem',
                  borderLeft: `4px solid ${themeColor}`,
                  background: isSif
                    ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.05) 0%, rgba(30, 41, 59, 0.5) 100%)'
                    : 'rgba(30, 41, 59, 0.45)',
                  boxShadow: isSif ? '0 4px 20px rgba(239, 68, 68, 0.12)' : 'none'
                }}
              >
                {/* Top Meta Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 10
                }}>
                  {/* Left: Date, Site, Shift */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, fontSize: '0.74rem' }}>
                    <span style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      color: '#38bdf8',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontWeight: 700
                    }}>
                      📅 {sim.event_date || 'Live Incident'}
                    </span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                      🏭 {sim.site || inc.nlp?.location || 'Operational Facility'}
                    </span>
                    <span style={{ color: '#94a3b8' }}>
                      ⏱️ {sim.shift}
                    </span>
                    {sim.industry && (
                      <span style={{ color: '#a78bfa', fontSize: '0.7rem' }}>
                        • {sim.industry}
                      </span>
                    )}
                  </div>

                  {/* Right: Risk Badge & Score Meter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: `${themeColor}22`,
                      border: `1px solid ${themeColor}66`,
                      color: themeColor
                    }}>
                      {level} RISK ({score}/100)
                    </span>
                    <button
                      onClick={() => handleInspectInAnalyzer(inc)}
                      className="btn btn-ghost btn-sm"
                      style={{
                        fontSize: '0.7rem',
                        padding: '3px 8px',
                        border: '1px solid var(--border)',
                        color: '#93c5fd'
                      }}
                      title="Inspect full graph and NLP entities in Analyzer"
                    >
                      Inspect in Analyzer ↗
                    </button>
                  </div>
                </div>

                {/* Narrative Text */}
                <div style={{
                  fontSize: '0.88rem',
                  lineHeight: 1.5,
                  color: '#f8fafc',
                  marginBottom: 10,
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.04)'
                }}>
                  {sim.narrative || inc.preprocessing?.original}
                </div>

                {/* Bottom Intelligence Badges */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                  fontSize: '0.72rem',
                  paddingTop: 8,
                  borderTop: '1px solid rgba(255,255,255,0.06)'
                }}>
                  {/* Left: ML model probability & trauma nature */}
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      ⚡ OSHA ML: <strong>{((inc.classification?.model_score || 0) * 100).toFixed(1)}% SIF Prob</strong>
                    </span>
                    {inc.classification?.predicted_nature && (
                      <span style={{ color: '#cbd5e1' }}>
                        🩺 Trauma: <strong style={{ color: '#fff' }}>{inc.classification.predicted_nature}</strong>
                      </span>
                    )}
                    {inc.risk?.iogp_rule && (
                      <span style={{ color: '#93c5fd' }}>
                        🛡️ {inc.risk.iogp_rule}
                      </span>
                    )}
                  </div>

                  {/* Right: Trigger words tokens */}
                  {inc.classification?.risk_tokens && inc.classification.risk_tokens.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Triggers:</span>
                      {inc.classification.risk_tokens.slice(0, 3).map((tok, i) => (
                        <span
                          key={i}
                          style={{
                            background: tok.weight > 10 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                            color: tok.weight > 10 ? '#fca5a5' : '#fde68a',
                            padding: '1px 5px',
                            borderRadius: 4,
                            fontSize: '0.66rem',
                            fontWeight: 600
                          }}
                        >
                          {tok.word} +{tok.weight}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
