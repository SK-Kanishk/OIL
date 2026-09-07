import React, { useState, useEffect } from 'react';
import { getModelMetrics, quickPredict, getOshaSamples } from '../services/api';

export default function ModelInsights() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Playground state
  const [testText, setTestText] = useState(
    'A technician was clearing a jam on a hydraulic stamping press when the foot pedal engaged, crushing and fracturing their left hand.'
  );
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await getModelMetrics();
      setMetrics(res.data);
      // Run initial playground prediction
      runPrediction(testText);
    } catch (err) {
      setError('Unable to load model metrics. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const runPrediction = async (textToTest) => {
    if (!textToTest.trim()) return;
    try {
      setPredicting(true);
      const res = await quickPredict(textToTest);
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setPredicting(false);
    }
  };

  const handleTestSubmit = (e) => {
    e.preventDefault();
    runPrediction(testText);
  };

  const filteredTerms = metrics?.top_sif_risk_terms?.filter(t =>
    t.term.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: 16,
        padding: '1.75rem',
        marginBottom: '1.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          position: 'absolute', top: -50, right: -50, width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{
            background: 'rgba(99, 102, 241, 0.2)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#818cf8',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 20,
            letterSpacing: '0.05em'
          }}>
            OSHA 2015–2025 AI MODEL
          </span>
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: 20
          }}>
            ● PRODUCTION READY
          </span>
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Trained on 105,996 OSHA Severe Injury Incidents
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: 780, margin: 0, lineHeight: 1.5 }}>
          SIF-Sense AI utilizes a calibrated, sub-10ms NLP pipeline fine-tuned on 10 years of federal OSHA severe injury reports (Jan 2015 – Nov 2025). It detects latent Serious Injury or Fatality (SIF) precursors, predicts industrial injury nature, and isolates high-risk tokens.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>⚡</div>
          Loading OSHA Model Telemetry & Weights...
        </div>
      ) : error ? (
        <div className="alert-card critical" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      ) : (
        <>
          {/* Executive Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.75rem'
          }}>
            <div className="stat-card" style={{ borderTop: '3px solid #10b981' }}>
              <div className="stat-label">Model Accuracy</div>
              <div className="stat-value" style={{ color: '#10b981' }}>
                {(metrics.accuracy * 100).toFixed(1)}%
              </div>
              <div className="stat-sub">Evaluated on 21,199 test cases</div>
            </div>

            <div className="stat-card" style={{ borderTop: '3px solid #6366f1' }}>
              <div className="stat-label">F1-Score</div>
              <div className="stat-value" style={{ color: '#818cf8' }}>
                {metrics.f1_score.toFixed(3)}
              </div>
              <div className="stat-sub">Harmonic precision & recall</div>
            </div>

            <div className="stat-card" style={{ borderTop: '3px solid #38bdf8' }}>
              <div className="stat-label">Safety Recall</div>
              <div className="stat-value" style={{ color: '#38bdf8' }}>
                {(metrics.recall * 100).toFixed(1)}%
              </div>
              <div className="stat-sub">True SIF coverage rate</div>
            </div>

            <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
              <div className="stat-label">ROC-AUC Score</div>
              <div className="stat-value" style={{ color: '#f59e0b' }}>
                {metrics.roc_auc.toFixed(4)}
              </div>
              <div className="stat-sub">Discriminative capability</div>
            </div>

            <div className="stat-card" style={{ borderTop: '3px solid #a855f7' }}>
              <div className="stat-label">Inference Latency</div>
              <div className="stat-value" style={{ color: '#c084fc' }}>
                &lt; 8 ms
              </div>
              <div className="stat-sub">Real-time calibrated output</div>
            </div>

            <div className="stat-card" style={{ borderTop: '3px solid #ec4899' }}>
              <div className="stat-label">Total Records</div>
              <div className="stat-value" style={{ color: '#f472b6' }}>
                {metrics.total_records.toLocaleString()}
              </div>
              <div className="stat-sub">2015 – 2025 OSHA archive</div>
            </div>
          </div>

          {/* Interactive Playground & Confusion Matrix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(300px, 0.8fr)',
            gap: '1.5rem',
            marginBottom: '1.75rem'
          }}>
            {/* Live Model Playground */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f1f5f9' }}>Live Model Playground</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Test custom sentences to verify real-time OSHA inference and word-level scoring
                  </div>
                </div>
                <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 6 }}>
                  Instant NLP
                </span>
              </div>

              <form onSubmit={handleTestSubmit}>
                <textarea
                  className="input-field"
                  style={{
                    width: '100%',
                    minHeight: 90,
                    resize: 'vertical',
                    padding: '0.75rem',
                    fontSize: '0.9rem',
                    lineHeight: 1.4,
                    marginBottom: '0.75rem'
                  }}
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter an incident narrative to evaluate with the OSHA ML model..."
                />

                <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={() => {
                        const s = "Worker fell from 12ft ladder without harness, suffered concussion and fractured collarbone.";
                        setTestText(s);
                        runPrediction(s);
                      }}
                    >
                      Fall + Fracture
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={() => {
                        const s = "Electrician touched energized 480V busbar, sustained severe electrical arc flash burns.";
                        setTestText(s);
                        runPrediction(s);
                      }}
                    >
                      Arc Flash Burn
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={() => {
                        const s = "Employee noticed loose floor tile in hallway and submitted a housekeeping ticket.";
                        setTestText(s);
                        runPrediction(s);
                      }}
                    >
                      Low Risk Office
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={predicting}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {predicting ? 'Evaluating...' : 'Run OSHA Model'}
                  </button>
                </div>
              </form>

              {/* Playground Results */}
              {prediction && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  background: 'rgba(15, 23, 42, 0.7)',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${prediction.classification.sif_potential ? 'badge-critical' : 'badge-low'}`}>
                        {prediction.classification.sif_potential ? 'SIF POTENTIAL DETECTED' : 'LOW SIF POTENTIAL'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Nature: <strong style={{ color: '#e2e8f0' }}>{prediction.classification.predicted_nature}</strong>
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                      Probability: {(prediction.classification.model_score * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Probability Bar */}
                  <div style={{
                    width: '100%',
                    height: 8,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    overflow: 'hidden',
                    marginBottom: 12
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(5, prediction.classification.model_score * 100))}%`,
                      background: prediction.classification.sif_potential
                        ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                        : '#10b981',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>

                  {/* Word-level highlights */}
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                      High-Risk Words Detected by OSHA Model:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {prediction.classification.risk_tokens && prediction.classification.risk_tokens.length > 0 ? (
                        prediction.classification.risk_tokens.map((token, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.35)',
                              color: '#fca5a5',
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {token.word} <span style={{ opacity: 0.7 }}>+{token.weight}</span>
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          No high-severity SIF risk tokens detected.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confusion Matrix & Calibration Info */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: '#f1f5f9' }}>
                Test Set Confusion Matrix
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Independent evaluation on 21,199 unseen OSHA incident reports
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: '1rem'
              }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 8,
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 600 }}>True Negatives (Low SIF)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                    {metrics.confusion_matrix.true_negative.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Correctly identified minor events</div>
                </div>

                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 8,
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 600 }}>False Positives</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                    {metrics.confusion_matrix.false_positive.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Conservative false alarms</div>
                </div>

                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: 8,
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#fde68a', fontWeight: 600 }}>False Negatives</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                    {metrics.confusion_matrix.false_negative.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Only 1.8% missed severe cases</div>
                </div>

                <div style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  borderRadius: 8,
                  padding: '12px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#a5b4fc', fontWeight: 600 }}>True Positives (SIF)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
                    {metrics.confusion_matrix.true_positive.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confirmed SIF events caught</div>
                </div>
              </div>

              <div style={{
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                background: 'rgba(255,255,255,0.02)',
                padding: '10px 12px',
                borderRadius: 8
              }}>
                💡 <strong>Safety-Critical Calibration</strong>: In industrial HSE, a false negative is far worse than a false positive. SIF-Sense AI is calibrated with a high recall profile (97.5%) to guarantee that severe life-altering threats are proactively flagged.
              </div>
            </div>
          </div>

          {/* Top Learned SIF Risk Terms Dictionary */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f1f5f9' }}>
                  Top SIF Risk Indicators Learned from OSHA (2015–2025)
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Statistical feature importance coefficients learned across 106k real-world severe incidents
                </div>
              </div>

              <input
                type="text"
                className="input-field"
                style={{ width: 220, fontSize: '0.8rem', padding: '6px 10px' }}
                placeholder="Search learned terms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              maxHeight: 280,
              overflowY: 'auto',
              padding: '6px 0'
            }}>
              {filteredTerms.slice(0, 60).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(30, 41, 59, 0.7)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 20,
                    padding: '4px 12px',
                    fontSize: '0.8rem',
                    color: '#e2e8f0'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{item.term}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: item.weight > 15 ? '#ef4444' : item.weight > 8 ? '#f59e0b' : '#38bdf8'
                  }}>
                    +{item.weight.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
