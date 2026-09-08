import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { getReports } from '../services/api';

/* =========================================================
   SIF-SENSE — PREMIUM LIGHT REPORT HISTORY
   ---------------------------------------------------------
   Features preserved:
   ✓ Load reports from backend
   ✓ SIF-only filter
   ✓ Search
   ✓ Pagination
   ✓ Page size
   ✓ CSV export
   ✓ JSON export
   ✓ Risk score / level
   ✓ Location / activity / hazard
   ✓ Barrier failure
   ✓ Detailed inspection modal
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
  greenBorder: '#BBF7D0',
};

function getRiskConfig(level) {
  switch (String(level || '').toUpperCase()) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        color: COLORS.red,
        soft: COLORS.redSoft,
        border: COLORS.redBorder,
      };

    case 'HIGH':
      return {
        label: 'High',
        color: COLORS.orange,
        soft: COLORS.orangeSoft,
        border: COLORS.orangeBorder,
      };

    case 'MEDIUM':
    case 'MODERATE':
      return {
        label: 'Moderate',
        color: COLORS.yellow,
        soft: COLORS.yellowSoft,
        border: COLORS.yellowBorder,
      };

    default:
      return {
        label: 'Low',
        color: COLORS.green,
        soft: COLORS.greenSoft,
        border: COLORS.greenBorder,
      };
  }
}

function formatDate(dateValue, includeTime = false) {
  if (!dateValue) return 'Date unavailable';

  try {
    return new Date(dateValue).toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
          }
        : {}),
    });
  } catch {
    return String(dateValue);
  }
}

function getReportId(report) {
  return report?.id ?? report?._id ?? '—';
}

function getRiskScore(report) {
  const value = Number(report?.risk_score);
  return Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : 0;
}

function isSif(report) {
  return Boolean(
    report?.sif_potential === true ||
      report?.sif_potential === 1 ||
      String(report?.sif_potential).toLowerCase() === 'true' ||
      String(report?.sif_potential).toLowerCase() === 'yes'
  );
}

function normalizeReportData(response) {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.reports)) {
    return data.reports;
  }

  return [];
}

function escapeCsv(value) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [sifOnly, setSifOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getReports(sifOnly);
      setReports(normalizeReportData(response));
    } catch (err) {
      console.error('Unable to load reports:', err);
      setReports([]);
      setError(
        err?.response?.data?.detail ||
          'Unable to load the report history. Please check the backend connection.'
      );
    } finally {
      setLoading(false);
    }
  }, [sifOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return reports;
    }

    return reports.filter((report) => {
      const searchableFields = [
        report?.id,
        report?._id,
        report?.text,
        report?.location,
        report?.activity,
        report?.hazard,
        report?.barrier_failure,
        report?.risk_level,
        report?.incident_type,
      ];

      return searchableFields.some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(query)
      );
    });
  }, [reports, search]);

  const summary = useMemo(() => {
    const critical = filtered.filter(
      (report) =>
        String(report?.risk_level || '').toUpperCase() === 'CRITICAL'
    ).length;

    const high = filtered.filter(
      (report) =>
        String(report?.risk_level || '').toUpperCase() === 'HIGH'
    ).length;

    const sif = filtered.filter(isSif).length;

    const averageScore =
      filtered.length > 0
        ? Math.round(
            filtered.reduce(
              (total, report) => total + getRiskScore(report),
              0
            ) / filtered.length
          )
        : 0;

    return {
      total: filtered.length,
      sif,
      critical,
      high,
      averageScore,
    };
  }, [filtered]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedReports = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
      ),
    [filtered, currentPage, pageSize]
  );

  const exportCSV = () => {
    if (!filtered.length) return;

    const headers = [
      'ID',
      'Created At',
      'Location',
      'Activity',
      'Hazard',
      'Barrier Failure',
      'SIF Potential',
      'Risk Score',
      'Risk Level',
      'Text',
    ];

    const rows = filtered.map((report) => [
      escapeCsv(getReportId(report)),
      escapeCsv(report?.created_at),
      escapeCsv(report?.location),
      escapeCsv(report?.activity),
      escapeCsv(report?.hazard),
      escapeCsv(report?.barrier_failure),
      escapeCsv(isSif(report) ? 'YES' : 'NO'),
      escapeCsv(report?.risk_score),
      escapeCsv(report?.risk_level),
      escapeCsv(report?.text),
    ]);

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `sif_safety_reports_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    if (!filtered.length) return;

    const blob = new Blob(
      [JSON.stringify(filtered, null, 2)],
      { type: 'application/json;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `sif_safety_reports_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const clearSearch = () => {
    setSearch('');
    setCurrentPage(1);
  };

  return (
    <div
      className="page-container animate-fade-in"
      style={{
        paddingBottom: '4rem',
        maxWidth: 1500,
        margin: '0 auto',
        color: COLORS.navy,
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
          gap: 20,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 11px',
              borderRadius: 999,
              background: COLORS.blueSoft,
              border: `1px solid ${COLORS.blueBorder}`,
              color: COLORS.blue,
              fontSize: '0.68rem',
              fontWeight: 850,
              letterSpacing: '0.045em',
              marginBottom: 10,
            }}
          >
            INCIDENT HISTORY
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(1.55rem, 3vw, 2.15rem)',
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              fontWeight: 850,
              color: COLORS.navy,
            }}
          >
            Safety Report History
          </h1>

          <p
            style={{
              margin: '8px 0 0',
              color: COLORS.muted,
              fontSize: '0.88rem',
              lineHeight: 1.55,
              maxWidth: 700,
            }}
          >
            Review previously analyzed safety observations, identify
            recurring risk signals and inspect individual reports in
            detail.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={secondaryButtonStyle}
        >
          <span style={{ fontSize: '1rem' }}>↻</span>
          {loading ? 'Refreshing...' : 'Refresh reports'}
        </button>
      </section>

      {/* =====================================================
          SUMMARY
          ===================================================== */}

      {!loading && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <SummaryCard
            label="Reports"
            value={summary.total}
            helper="Current selection"
            color={COLORS.blue}
            background={COLORS.blueSoft}
          />

          <SummaryCard
            label="SIF Precursors"
            value={summary.sif}
            helper="Flagged as SIF potential"
            color={COLORS.red}
            background={COLORS.redSoft}
          />

          <SummaryCard
            label="Critical"
            value={summary.critical}
            helper="Requires immediate attention"
            color={COLORS.red}
            background={COLORS.redSoft}
          />

          <SummaryCard
            label="High Risk"
            value={summary.high}
            helper="Priority safety concerns"
            color={COLORS.orange}
            background={COLORS.orangeSoft}
          />

          <SummaryCard
            label="Avg. Risk"
            value={summary.averageScore}
            helper="Score out of 100"
            color={COLORS.yellow}
            background={COLORS.yellowSoft}
          />
        </div>
      )}

      {/* =====================================================
          FILTER TOOLBAR
          ===================================================== */}

      <section
        style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 18,
          padding: 10,
          marginBottom: 18,
          boxShadow: '0 8px 30px rgba(15,23,42,0.045)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}

          <div
            style={{
              position: 'relative',
              flex: '1 1 280px',
              maxWidth: 430,
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 13,
                top: '50%',
                transform: 'translateY(-50%)',
                color: COLORS.subtle,
                fontSize: '1rem',
                pointerEvents: 'none',
              }}
            >
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search report, site, activity or hazard..."
              style={{
                width: '100%',
                height: 42,
                boxSizing: 'border-box',
                borderRadius: 11,
                border: `1px solid ${COLORS.borderStrong}`,
                background: COLORS.background,
                color: COLORS.navy,
                outline: 'none',
                padding: '0 38px',
                fontSize: '0.78rem',
              }}
            />

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: 9,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 25,
                  height: 25,
                  border: 'none',
                  borderRadius: 7,
                  background: '#E2E8F0',
                  color: COLORS.text,
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Filters + exports */}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setSifOnly(false);
                setCurrentPage(1);
              }}
              style={{
                ...filterButtonStyle,
                background: !sifOnly
                  ? COLORS.blue
                  : COLORS.background,
                color: !sifOnly
                  ? '#FFFFFF'
                  : COLORS.muted,
                borderColor: !sifOnly
                  ? COLORS.blue
                  : COLORS.borderStrong,
              }}
            >
              All Reports
            </button>

            <button
              type="button"
              onClick={() => {
                setSifOnly(true);
                setCurrentPage(1);
              }}
              style={{
                ...filterButtonStyle,
                background: sifOnly
                  ? COLORS.redSoft
                  : COLORS.background,
                color: sifOnly
                  ? COLORS.red
                  : COLORS.muted,
                borderColor: sifOnly
                  ? COLORS.redBorder
                  : COLORS.borderStrong,
              }}
            >
              SIF Only
            </button>

            <div
              style={{
                width: 1,
                height: 26,
                background: COLORS.border,
                margin: '0 3px',
              }}
            />

            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
              style={{
                height: 36,
                borderRadius: 9,
                border: `1px solid ${COLORS.borderStrong}`,
                background: COLORS.surface,
                color: COLORS.text,
                padding: '0 9px',
                fontSize: '0.73rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>

            <button
              type="button"
              onClick={exportCSV}
              disabled={!filtered.length}
              style={{
                ...exportButtonStyle,
                opacity: filtered.length ? 1 : 0.5,
              }}
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={exportJSON}
              disabled={!filtered.length}
              style={{
                ...exportButtonStyle,
                opacity: filtered.length ? 1 : 0.5,
              }}
            >
              Export JSON
            </button>
          </div>
        </div>

        {/* Active search/filter indicator */}

        {(search || sifOnly) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              flexWrap: 'wrap',
              padding: '9px 5px 2px',
              color: COLORS.muted,
              fontSize: '0.69rem',
            }}
          >
            <span style={{ fontWeight: 700 }}>
              Showing {filtered.length} matching report
              {filtered.length === 1 ? '' : 's'}
            </span>

            {sifOnly && (
              <span style={filterPillStyle}>
                SIF Only
                <button
                  type="button"
                  onClick={() => {
                    setSifOnly(false);
                    setCurrentPage(1);
                  }}
                  style={pillCloseStyle}
                >
                  ×
                </button>
              </span>
            )}

            {search && (
              <span style={filterPillStyle}>
                Search: "{search}"
                <button
                  type="button"
                  onClick={clearSearch}
                  style={pillCloseStyle}
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '13px 15px',
            marginBottom: 18,
            borderRadius: 14,
            background: COLORS.redSoft,
            border: `1px solid ${COLORS.redBorder}`,
            color: '#B91C1C',
            fontSize: '0.76rem',
            lineHeight: 1.5,
          }}
        >
          <span
            style={{
              width: 23,
              height: 23,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 7,
              background: '#FEE2E2',
              fontWeight: 900,
            }}
          >
            !
          </span>

          <div>
            <strong>Report history unavailable</strong>
            <div style={{ marginTop: 2 }}>{error}</div>
          </div>

          <button
            type="button"
            onClick={load}
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'transparent',
              color: '#B91C1C',
              fontWeight: 800,
              cursor: 'pointer',
              fontSize: '0.72rem',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          CONTENT
          ===================================================== */}

      {loading ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <EmptyState
          search={search}
          sifOnly={sifOnly}
          clearSearch={clearSearch}
          clearFilter={() => {
            setSifOnly(false);
            setCurrentPage(1);
          }}
        />
      ) : (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {paginatedReports.map((report) => (
              <ReportCard
                key={getReportId(report)}
                report={report}
                onClick={() => setSelectedReport(report)}
              />
            ))}
          </div>

          {/* =================================================
              PAGINATION
              ================================================= */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginTop: 18,
              padding: '11px 14px',
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 14,
            }}
          >
            <span
              style={{
                color: COLORS.muted,
                fontSize: '0.72rem',
              }}
            >
              Showing{' '}
              <strong style={{ color: COLORS.text }}>
                {(currentPage - 1) * pageSize + 1}
              </strong>{' '}
              –{' '}
              <strong style={{ color: COLORS.text }}>
                {Math.min(currentPage * pageSize, filtered.length)}
              </strong>{' '}
              of{' '}
              <strong style={{ color: COLORS.text }}>
                {filtered.length}
              </strong>{' '}
              reports
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() =>
                  setCurrentPage((page) => Math.max(1, page - 1))
                }
                style={paginationButtonStyle(
                  currentPage !== 1
                )}
              >
                ← Previous
              </button>

              <div
                style={{
                  minWidth: 92,
                  textAlign: 'center',
                  color: COLORS.text,
                  fontSize: '0.73rem',
                  fontWeight: 750,
                }}
              >
                Page {currentPage} of {totalPages}
              </div>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) =>
                    Math.min(totalPages, page + 1)
                  )
                }
                style={paginationButtonStyle(
                  currentPage < totalPages
                )}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* =====================================================
          DETAIL MODAL
          ===================================================== */}

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
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
  color,
  background,
}) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 17,
        padding: '15px 16px',
        boxShadow: '0 7px 25px rgba(15,23,42,0.035)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 43,
          height: 43,
          flex: '0 0 43px',
          display: 'grid',
          placeItems: 'center',
          borderRadius: 12,
          background,
          color,
          fontSize: '1.05rem',
          fontWeight: 900,
        }}
      >
        {value}
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            color: COLORS.navy,
            fontSize: '0.8rem',
            fontWeight: 800,
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: 3,
            color: COLORS.subtle,
            fontSize: '0.67rem',
            lineHeight: 1.35,
          }}
        >
          {helper}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   REPORT CARD
   ========================================================= */

function ReportCard({ report, onClick }) {
  const score = getRiskScore(report);
  const risk = getRiskConfig(report?.risk_level);
  const sif = isSif(report);

  return (
    <article
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      style={{
        position: 'relative',
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${risk.color}`,
        borderRadius: 17,
        padding: '16px 18px',
        cursor: 'pointer',
        boxShadow: '0 7px 25px rgba(15,23,42,0.035)',
        transition:
          'transform .18s ease, box-shadow .18s ease, border-color .18s ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform =
          'translateY(-2px)';
        event.currentTarget.style.boxShadow =
          '0 14px 32px rgba(15,23,42,0.08)';
        event.currentTarget.style.borderColor =
          COLORS.borderStrong;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.boxShadow =
          '0 7px 25px rgba(15,23,42,0.035)';
        event.currentTarget.style.borderColor = COLORS.border;
        event.currentTarget.style.borderLeftColor = risk.color;
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '72px minmax(0, 1fr) auto',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* SCORE */}

        <div
          style={{
            width: 68,
            minHeight: 68,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 15,
            background: risk.soft,
            border: `1px solid ${risk.border}`,
          }}
        >
          <div
            style={{
              color: risk.color,
              fontSize: '1.4rem',
              lineHeight: 1,
              fontWeight: 900,
              letterSpacing: '-0.04em',
            }}
          >
            {score}
          </div>

          <div
            style={{
              marginTop: 4,
              color: COLORS.muted,
              fontSize: '0.58rem',
              fontWeight: 800,
              textTransform: 'uppercase',
            }}
          >
            / 100
          </div>
        </div>

        {/* MAIN CONTENT */}

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 7,
              marginBottom: 7,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderRadius: 999,
                background: risk.soft,
                border: `1px solid ${risk.border}`,
                color: risk.color,
                fontSize: '0.64rem',
                fontWeight: 850,
              }}
            >
              {risk.label} Risk
            </span>

            {sif && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  borderRadius: 999,
                  background: COLORS.redSoft,
                  border: `1px solid ${COLORS.redBorder}`,
                  color: COLORS.red,
                  fontSize: '0.64rem',
                  fontWeight: 850,
                }}
              >
                SIF Potential
              </span>
            )}

            <span
              style={{
                color: COLORS.subtle,
                fontSize: '0.64rem',
                fontWeight: 650,
              }}
            >
              Report #{getReportId(report)}
            </span>
          </div>

          <div
            style={{
              color: COLORS.navy,
              fontSize: '0.92rem',
              lineHeight: 1.45,
              fontWeight: 800,
              marginBottom: 7,
            }}
          >
            {report?.text
              ? truncateText(report.text, 190)
              : 'Safety report'}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              color: COLORS.muted,
              fontSize: '0.7rem',
            }}
          >
            {report?.location && (
              <ContextItem
                label="Location"
                value={report.location}
              />
            )}

            {report?.activity && (
              <ContextItem
                label="Activity"
                value={report.activity}
              />
            )}

            {report?.hazard && (
              <ContextItem
                label="Hazard"
                value={report.hazard}
              />
            )}

            <span style={{ color: COLORS.subtle }}>
              {formatDate(report?.created_at)}
            </span>
          </div>
        </div>

        {/* OPEN */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 10,
            background: COLORS.background,
            border: `1px solid ${COLORS.border}`,
            color: COLORS.muted,
            fontSize: '0.95rem',
            fontWeight: 700,
          }}
        >
          →
        </div>
      </div>

      {/* BOTTOM CONTEXT */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          marginTop: 13,
          paddingTop: 11,
          borderTop: `1px solid #F0F2F5`,
        }}
      >
        {report?.barrier_failure && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              maxWidth: '100%',
              padding: '5px 9px',
              borderRadius: 8,
              background: COLORS.redSoft,
              border: `1px solid ${COLORS.redBorder}`,
              color: '#B91C1C',
              fontSize: '0.65rem',
              fontWeight: 700,
            }}
          >
            Barrier failure: {report.barrier_failure}
          </span>
        )}

        {report?.incident_type && (
          <span
            style={{
              padding: '5px 9px',
              borderRadius: 8,
              background: COLORS.background,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.muted,
              fontSize: '0.65rem',
              fontWeight: 700,
            }}
          >
            {report.incident_type}
          </span>
        )}

        <span
          style={{
            marginLeft: 'auto',
            color: COLORS.blue,
            fontSize: '0.66rem',
            fontWeight: 800,
          }}
        >
          View full inspection →
        </span>
      </div>
    </article>
  );
}

/* =========================================================
   CONTEXT ITEM
   ========================================================= */

function ContextItem({ label, value }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
      }}
    >
      <strong
        style={{
          color: COLORS.text,
          fontWeight: 750,
        }}
      >
        {label}:
      </strong>

      <span
        style={{
          maxWidth: 170,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </span>
    </span>
  );
}

/* =========================================================
   DETAIL MODAL
   ========================================================= */

function ReportDetailModal({ report, onClose }) {
  const risk = getRiskConfig(report?.risk_level);
  const score = getRiskScore(report);
  const sif = isSif(report);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Safety report details"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(15,23,42,0.38)',
        backdropFilter: 'blur(7px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: 'calc(100vh - 40px)',
          overflowY: 'auto',
          background: COLORS.surface,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 22,
          boxShadow: '0 30px 80px rgba(15,23,42,0.22)',
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 15,
            padding: '20px 22px 17px',
            borderBottom: `1px solid #EEF2F6`,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                flexWrap: 'wrap',
                marginBottom: 9,
              }}
            >
              <span
                style={{
                  padding: '5px 9px',
                  borderRadius: 999,
                  background: risk.soft,
                  border: `1px solid ${risk.border}`,
                  color: risk.color,
                  fontSize: '0.66rem',
                  fontWeight: 850,
                }}
              >
                {risk.label} Risk
              </span>

              {sif && (
                <span
                  style={{
                    padding: '5px 9px',
                    borderRadius: 999,
                    background: COLORS.redSoft,
                    border: `1px solid ${COLORS.redBorder}`,
                    color: COLORS.red,
                    fontSize: '0.66rem',
                    fontWeight: 850,
                  }}
                >
                  SIF Potential
                </span>
              )}
            </div>

            <h2
              style={{
                margin: 0,
                color: COLORS.navy,
                fontSize: '1.2rem',
                letterSpacing: '-0.025em',
                fontWeight: 850,
              }}
            >
              Safety Report Inspection
            </h2>

            <div
              style={{
                marginTop: 5,
                color: COLORS.subtle,
                fontSize: '0.69rem',
              }}
            >
              Report #{getReportId(report)} ·{' '}
              {formatDate(report?.created_at, true)}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close report details"
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              background: COLORS.background,
              color: COLORS.muted,
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 700,
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: 22 }}>
          {/* SCORE */}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(120px, 0.4fr) minmax(0, 1fr)',
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                padding: 18,
                borderRadius: 16,
                background: risk.soft,
                border: `1px solid ${risk.border}`,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  color: risk.color,
                  fontSize: '2.25rem',
                  lineHeight: 1,
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                }}
              >
                {score}
              </div>

              <div
                style={{
                  marginTop: 7,
                  color: COLORS.muted,
                  fontSize: '0.63rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Priority Score / 100
              </div>
            </div>

            <div
              style={{
                padding: 18,
                borderRadius: 16,
                background: COLORS.background,
                border: `1px solid ${COLORS.border}`,
              }}
            >
              <div
                style={{
                  color: COLORS.subtle,
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                SIF Assessment
              </div>

              <div
                style={{
                  marginTop: 7,
                  color: sif ? COLORS.red : COLORS.green,
                  fontSize: '1rem',
                  fontWeight: 850,
                }}
              >
                {sif
                  ? 'SIF potential detected'
                  : 'No SIF potential detected'}
              </div>

              <div
                style={{
                  marginTop: 5,
                  color: COLORS.muted,
                  fontSize: '0.7rem',
                  lineHeight: 1.45,
                }}
              >
                Risk classification: {risk.label}
              </div>
            </div>
          </div>

          {/* ORIGINAL REPORT */}

          <DetailSection title="Original safety report">
            <div
              style={{
                padding: 15,
                borderRadius: 13,
                background: COLORS.background,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                fontSize: '0.82rem',
                lineHeight: 1.65,
              }}
            >
              {report?.text || 'No report narrative available.'}
            </div>
          </DetailSection>

          {/* CONTEXT */}

          <DetailSection title="Incident context">
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(190px, 1fr))',
                gap: 9,
              }}
            >
              <DetailField
                label="Location"
                value={report?.location}
              />

              <DetailField
                label="Activity"
                value={report?.activity}
              />

              <DetailField
                label="Hazard"
                value={report?.hazard}
                danger={Boolean(report?.hazard)}
              />

              <DetailField
                label="Barrier failure"
                value={report?.barrier_failure}
                danger={Boolean(report?.barrier_failure)}
              />

              <DetailField
                label="Incident type"
                value={report?.incident_type}
              />

              <DetailField
                label="Risk level"
                value={report?.risk_level || risk.label}
              />
            </div>
          </DetailSection>

          {/* OPTIONAL SAFETY FIELDS */}

          {(report?.unsafe_act ||
            report?.unsafe_condition ||
            report?.predicted_nature) && (
            <DetailSection title="Additional safety signals">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(190px, 1fr))',
                  gap: 9,
                }}
              >
                <DetailField
                  label="Unsafe act"
                  value={report?.unsafe_act}
                />

                <DetailField
                  label="Unsafe condition"
                  value={report?.unsafe_condition}
                />

                <DetailField
                  label="Predicted injury"
                  value={report?.predicted_nature}
                />
              </div>
            </DetailSection>
          )}

          {/* FOOTER */}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              paddingTop: 5,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 40,
                padding: '0 16px',
                borderRadius: 10,
                border: `1px solid ${COLORS.borderStrong}`,
                background: COLORS.surface,
                color: COLORS.text,
                cursor: 'pointer',
                fontSize: '0.74rem',
                fontWeight: 750,
              }}
            >
              Close inspection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL HELPERS
   ========================================================= */

function DetailSection({ title, children }) {
  return (
    <section style={{ marginBottom: 17 }}>
      <div
        style={{
          marginBottom: 8,
          color: COLORS.text,
          fontSize: '0.74rem',
          fontWeight: 850,
        }}
      >
        {title}
      </div>

      {children}
    </section>
  );
}

function DetailField({ label, value, danger = false }) {
  return (
    <div
      style={{
        minWidth: 0,
        padding: '11px 12px',
        borderRadius: 12,
        background: danger ? COLORS.redSoft : COLORS.background,
        border: `1px solid ${
          danger ? COLORS.redBorder : COLORS.border
        }`,
      }}
    >
      <div
        style={{
          color: COLORS.subtle,
          fontSize: '0.6rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 5,
          color: danger ? '#B91C1C' : COLORS.text,
          fontSize: '0.75rem',
          lineHeight: 1.4,
          fontWeight: 700,
          overflowWrap: 'anywhere',
        }}
      >
        {value || 'Not specified'}
      </div>
    </div>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function LoadingState() {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: '4rem 2rem',
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(15,23,42,0.035)',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          margin: '0 auto 14px',
          borderRadius: '50%',
          border: '3px solid #DBEAFE',
          borderTopColor: COLORS.blue,
          animation: 'sifReportsSpin .8s linear infinite',
        }}
      />

      <style>
        {`
          @keyframes sifReportsSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>

      <div
        style={{
          color: COLORS.text,
          fontSize: '0.84rem',
          fontWeight: 750,
        }}
      >
        Loading report history
      </div>

      <div
        style={{
          marginTop: 4,
          color: COLORS.subtle,
          fontSize: '0.7rem',
        }}
      >
        Retrieving analyzed safety reports...
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyState({
  search,
  sifOnly,
  clearSearch,
  clearFilter,
}) {
  return (
    <div
      style={{
        background: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 20,
        padding: '4rem 2rem',
        textAlign: 'center',
        boxShadow: '0 8px 30px rgba(15,23,42,0.035)',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          margin: '0 auto 14px',
          display: 'grid',
          placeItems: 'center',
          borderRadius: 16,
          background: COLORS.blueSoft,
          border: `1px solid ${COLORS.blueBorder}`,
          color: COLORS.blue,
          fontSize: '1.2rem',
          fontWeight: 900,
        }}
      >
        —
      </div>

      <h3
        style={{
          margin: 0,
          color: COLORS.navy,
          fontSize: '1rem',
          fontWeight: 850,
        }}
      >
        No reports found
      </h3>

      <p
        style={{
          maxWidth: 480,
          margin: '7px auto 0',
          color: COLORS.muted,
          fontSize: '0.76rem',
          lineHeight: 1.55,
        }}
      >
        {search || sifOnly
          ? 'No reports match the current search or filter. Try broadening your selection.'
          : 'No safety reports have been logged yet.'}
      </p>

      {(search || sifOnly) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginTop: 16,
          }}
        >
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              style={secondaryButtonStyle}
            >
              Clear search
            </button>
          )}

          {sifOnly && (
            <button
              type="button"
              onClick={clearFilter}
              style={primaryButtonStyle}
            >
              Show all reports
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const primaryButtonStyle = {
  height: 40,
  padding: '0 15px',
  border: 'none',
  borderRadius: 10,
  background: COLORS.blue,
  color: '#FFFFFF',
  fontSize: '0.73rem',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 6px 16px rgba(37,99,235,0.18)',
};

const secondaryButtonStyle = {
  height: 40,
  padding: '0 14px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  border: `1px solid ${COLORS.borderStrong}`,
  borderRadius: 10,
  background: COLORS.surface,
  color: COLORS.text,
  fontSize: '0.73rem',
  fontWeight: 750,
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(15,23,42,0.035)',
};

const filterButtonStyle = {
  height: 36,
  padding: '0 12px',
  borderRadius: 9,
  border: '1px solid',
  fontSize: '0.7rem',
  fontWeight: 800,
  cursor: 'pointer',
};

const exportButtonStyle = {
  height: 36,
  padding: '0 11px',
  borderRadius: 9,
  border: `1px solid ${COLORS.borderStrong}`,
  background: COLORS.surface,
  color: COLORS.text,
  fontSize: '0.69rem',
  fontWeight: 750,
  cursor: 'pointer',
};

const filterPillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 7px 4px 9px',
  borderRadius: 999,
  background: COLORS.blueSoft,
  border: `1px solid ${COLORS.blueBorder}`,
  color: COLORS.blue,
  fontWeight: 750,
};

const pillCloseStyle = {
  width: 17,
  height: 17,
  padding: 0,
  border: 'none',
  borderRadius: '50%',
  background: 'rgba(37,99,235,0.12)',
  color: COLORS.blue,
  cursor: 'pointer',
  fontSize: '0.72rem',
  lineHeight: 1,
  fontWeight: 900,
};

function paginationButtonStyle(enabled) {
  return {
    height: 34,
    padding: '0 10px',
    borderRadius: 9,
    border: `1px solid ${
      enabled ? COLORS.borderStrong : COLORS.border
    }`,
    background: enabled ? COLORS.surface : COLORS.background,
    color: enabled ? COLORS.text : COLORS.subtle,
    fontSize: '0.68rem',
    fontWeight: 750,
    cursor: enabled ? 'pointer' : 'default',
  };
}

function truncateText(text, maxLength) {
  const value = String(text || '');

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}…`;
}