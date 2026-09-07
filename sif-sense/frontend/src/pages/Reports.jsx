import React, { useEffect, useState, useCallback } from 'react';
import { getReports } from '../services/api';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [sifOnly, setSifOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedReport, setSelectedReport] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getReports(sifOnly);
      setReports(res.data);
    } catch (_) {}
    setLoading(false);
  }, [sifOnly]);

  useEffect(() => { load(); }, [load]);

  const filtered = reports.filter(r =>
    !search ||
    r.text?.toLowerCase().includes(search.toLowerCase()) ||
    r.location?.toLowerCase().includes(search.toLowerCase()) ||
    r.activity?.toLowerCase().includes(search.toLowerCase()) ||
    r.hazard?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedReports = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["ID", "Created At", "Location", "Activity", "Hazard", "Barrier Failure", "SIF Potential", "Risk Score", "Risk Level", "Text"];
    const rows = filtered.map(r => [
      r.id,
      r.created_at,
      `"${(r.location || '').replace(/"/g, '""')}"`,
      `"${(r.activity || '').replace(/"/g, '""')}"`,
      `"${(r.hazard || '').replace(/"/g, '""')}"`,
      `"${(r.barrier_failure || '').replace(/"/g, '""')}"`,
      r.sif_potential ? "YES" : "NO",
      r.risk_score,
      r.risk_level,
      `"${(r.text || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sif_safety_reports_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    if (!filtered.length) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", `sif_safety_reports_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-container animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: '1.25rem',
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        padding: '12px 16px'
      }}>
        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search report text, site, hazard..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="input-field"
            style={{ width: 260, fontSize: '0.8rem', padding: '6px 12px' }}
          />

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className={`btn btn-sm ${!sifOnly ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setSifOnly(false); setCurrentPage(1); }}
              style={{ fontSize: '0.78rem' }}
            >
              All Reports ({reports.length})
            </button>
            <button
              className={`btn btn-sm ${sifOnly ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setSifOnly(true); setCurrentPage(1); }}
              style={{ fontSize: '0.78rem' }}
            >
              ⚡ SIF Only
            </button>
          </div>
        </div>

        {/* Exports & Page Size */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              borderRadius: 6,
              padding: '5px 8px',
              fontSize: '0.78rem',
              outline: 'none'
            }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>

          <button
            className="btn btn-secondary btn-sm"
            onClick={exportCSV}
            style={{ fontSize: '0.75rem', padding: '5px 10px' }}
          >
            📥 Export CSV
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={exportJSON}
            style={{ fontSize: '0.75rem', padding: '5px 10px' }}
          >
            📄 JSON
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spinner" style={{ width: 36, height: 36, margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--text-muted)' }}>Loading report log...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📄</div>
          <h3 style={{ margin: '0 0 6px 0', color: '#f1f5f9' }}>No Reports Match Filter</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Try adjusting your search keywords or switching between "All Reports" and "SIF Only".
          </p>
        </div>
      ) : (
        <>
          {/* Reports List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {paginatedReports.map((r) => (
              <div
                key={r.id}
                className="card"
                style={{
                  padding: '14px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  borderLeft: `4px solid ${r.risk_level === 'CRITICAL' ? '#ef4444' : r.risk_level === 'HIGH' ? '#f97316' : '#22c55e'}`
                }}
                onClick={() => setSelectedReport(r)}
              >
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  {/* Score */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 10,
                      background: r.risk_level === 'CRITICAL' ? 'rgba(239,68,68,0.15)' :
                        r.risk_level === 'HIGH' ? 'rgba(249,115,22,0.15)' :
                        r.risk_level === 'MEDIUM' ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.1)',
                      border: `1px solid ${r.risk_level === 'CRITICAL' ? 'rgba(239,68,68,0.3)' :
                        r.risk_level === 'HIGH' ? 'rgba(249,115,22,0.3)' : 'rgba(34,197,94,0.2)'}`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        fontSize: '1.05rem', fontWeight: 900,
                        color: r.risk_level === 'CRITICAL' ? '#f87171' :
                          r.risk_level === 'HIGH' ? '#fb923c' :
                          r.risk_level === 'MEDIUM' ? '#facc15' : '#4ade80',
                      }}>
                        {r.risk_score}
                      </div>
                    </div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: 4 }}>#{r.id}</div>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      {r.sif_potential && (
                        <span className="risk-badge CRITICAL" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                          ⚡ SIF PRECURSOR
                        </span>
                      )}
                      <span className={`risk-badge ${r.risk_level}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                        {r.risk_level}
                      </span>
                      {r.location && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {r.location}</span>}
                      {r.activity && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⚙️ {r.activity}</span>}
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                      {r.text}
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      {r.barrier_failure && (
                        <span style={{
                          fontSize: '0.72rem',
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: '#fca5a5',
                          borderRadius: 4,
                          padding: '2px 8px'
                        }}>
                          🚫 {r.barrier_failure}
                        </span>
                      )}
                      {r.hazard && (
                        <span style={{
                          fontSize: '0.72rem',
                          background: 'rgba(255,255,255,0.04)',
                          color: 'var(--text-muted)',
                          borderRadius: 4,
                          padding: '2px 8px'
                        }}>
                          ⚠️ {r.hazard}
                        </span>
                      )}
                      <span style={{ fontSize: '0.72rem', color: '#818cf8', marginLeft: 'auto' }}>
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '1.25rem',
            padding: '10px 14px',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: 10,
            border: '1px solid var(--border-color)',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Showing {((currentPage - 1) * pageSize) + 1} – {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} reports
            </span>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button
                className="btn btn-ghost btn-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ fontSize: '0.78rem' }}
              >
                ← Previous
              </button>
              <span style={{ fontSize: '0.78rem', padding: '0 8px', color: '#f8fafc', fontWeight: 600 }}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ fontSize: '0.78rem' }}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* Deep Inspection Drawer / Modal */}
      {selectedReport && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: 20
        }}>
          <div className="card" style={{ maxWidth: 560, width: '100%', padding: '1.75rem', background: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#818cf8',
                  background: 'rgba(99, 102, 241, 0.15)',
                  padding: '3px 8px',
                  borderRadius: 4
                }}>
                  REPORT #{selectedReport.id}
                </span>
                <h3 style={{ margin: '6px 0 0 0', fontSize: '1.15rem', color: '#f8fafc' }}>
                  Safety Incident Inspection
                </h3>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedReport(null)}
                style={{ fontSize: '1.1rem', padding: '2px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              padding: '12px',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              color: '#e2e8f0',
              marginBottom: 14
            }}>
              "{selectedReport.text}"
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 6 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>SIF POTENTIAL</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedReport.sif_potential ? '#f87171' : '#34d399', marginTop: 2 }}>
                  {selectedReport.sif_potential ? '⚡ YES (High Risk)' : '○ NO (Low Risk)'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 6 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>PRIORITY SCORE</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc', marginTop: 2 }}>
                  {selectedReport.risk_score} / 100 ({selectedReport.risk_level})
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 6 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>LOCATION</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: 2 }}>
                  📍 {selectedReport.location || 'Not specified'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: 6 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>ACTIVITY</div>
                <div style={{ fontSize: '0.85rem', color: '#e2e8f0', marginTop: 2 }}>
                  ⚙️ {selectedReport.activity || 'Not specified'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
