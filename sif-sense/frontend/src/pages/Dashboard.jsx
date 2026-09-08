import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import {
  getDashboardStats,
  getHotspots,
  getHazards,
  getBarriers,
  getPatterns,
  getRiskTrend,
  getModelMetrics
} from '../services/api';

/*
=========================================================
 SIF-SENSE — PREMIUM LIGHT DASHBOARD (REFRESHED)
 --------------------------------------------------------
 ✓ Chart-first layout — visualizations are the hero
 ✓ Gradient area chart for risk trend
 ✓ Custom donut with center stat
 ✓ Gradient bar chart for hazard frequency
 ✓ Premium glassy cards with subtle gradients
 ✓ Refined typography & spacing
 ✓ All existing functionality preserved
=========================================================
*/

const CHART_COLORS = [
  '#2563EB',
  '#7C3AED',
  '#0891B2',
  '#EA580C',
  '#CA8A04',
  '#16A34A',
  '#DB2777',
  '#475569'
];

const RISK_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#EA580C',
  MEDIUM: '#CA8A04',
  MODERATE: '#CA8A04',
  LOW: '#16A34A'
};

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value) {
  return number(value).toLocaleString();
}

function riskColor(level) {
  return RISK_COLORS[String(level || '').toUpperCase()] || '#2563EB';
}

/* =========================================================
   KPI CARD
========================================================= */

function StatCard({
  icon,
  value,
  label,
  helper,
  accent = '#2563EB',
  delay = 0
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      style={{
        position: 'relative',
        background:
          'linear-gradient(180deg, #FFFFFF 0%, #FBFCFE 100%)',
        border: '1px solid #E5EAF1',
        borderRadius: 18,
        padding: '18px 19px',
        minHeight: 118,
        overflow: 'hidden',
        boxShadow:
          '0 1px 0 rgba(255,255,255,1) inset, 0 8px 26px rgba(15, 23, 42, 0.045)'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accent}, ${accent}99)`,
          opacity: 0.9
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accent}10 0%, transparent 70%)`,
          pointerEvents: 'none'
        }}
      />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          position: 'relative'
        }}
      >
        <div>
          <div
            style={{
              color: '#64748B',
              fontSize: '0.7rem',
              fontWeight: 750,
              textTransform: 'uppercase',
              letterSpacing: '0.045em'
            }}
          >
            {label}
          </div>

          <div
            style={{
              marginTop: 8,
              color: '#0F172A',
              fontSize: '1.7rem',
              lineHeight: 1,
              fontWeight: 850,
              letterSpacing: '-0.04em'
            }}
          >
            {value}
          </div>

          <div
            style={{
              marginTop: 10,
              color: '#94A3B8',
              fontSize: '0.68rem',
              lineHeight: 1.35
            }}
          >
            {helper}
          </div>
        </div>

        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 13,
            background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
            border: `1px solid ${accent}22`,
            color: accent,
            display: 'grid',
            placeItems: 'center',
            fontSize: '1.15rem',
            fontWeight: 800,
            flexShrink: 0
          }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================
   SECTION CARD
========================================================= */

function SectionCard({
  title,
  subtitle,
  children,
  action,
  style: extraStyle
}) {
  return (
    <section
      style={{
        background:
          'linear-gradient(180deg, #FFFFFF 0%, #FBFCFE 100%)',
        border: '1px solid #E5EAF1',
        borderRadius: 20,
        padding: '20px',
        boxShadow:
          '0 1px 0 rgba(255,255,255,1) inset, 0 8px 28px rgba(15, 23, 42, 0.045)',
        minWidth: 0,
        ...extraStyle
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 15,
          marginBottom: 18
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              color: '#0F172A',
              fontSize: '0.98rem',
              fontWeight: 800,
              letterSpacing: '-0.01em'
            }}
          >
            {title}
          </h3>

          {subtitle && (
            <p
              style={{
                margin: '5px 0 0',
                color: '#94A3B8',
                fontSize: '0.72rem',
                lineHeight: 1.45
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {action}
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   TOOLTIP
========================================================= */

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow:
          '0 12px 32px rgba(15, 23, 42, 0.14), 0 2px 6px rgba(15,23,42,.04)'
      }}
    >
      <div
        style={{
          color: '#64748B',
          fontSize: '0.68rem',
          marginBottom: 6,
          fontWeight: 600
        }}
      >
        {label}
      </div>

      {payload.map((item, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#0F172A',
            fontSize: '0.78rem',
            fontWeight: 800,
            marginTop: index > 0 ? 4 : 0
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: item.color || '#2563EB',
              boxShadow: `0 0 0 3px ${item.color || '#2563EB'}22`
            }}
          />
          <span style={{ color: '#64748B', fontWeight: 600 }}>
            {item.name}:
          </span>
          <span>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function EmptyBlock({ message }) {
  return (
    <div
      style={{
        minHeight: 160,
        display: 'grid',
        placeItems: 'center',
        textAlign: 'center',
        border: '1px dashed #D8E0EA',
        borderRadius: 14,
        background:
          'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)',
        color: '#94A3B8',
        fontSize: '0.78rem',
        padding: 20
      }}
    >
      {message}
    </div>
  );
}

/* =========================================================
   RANKED ROW
========================================================= */

function RankedRow({
  rank,
  label,
  count,
  score,
  accent = '#2563EB',
  icon
}) {
  const safeCount = number(count);
  const safeScore = number(score);
  const pct = Math.min(100, Math.max(5, safeScore || safeCount));

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '11px 12px',
        borderRadius: 12,
        background: '#F8FAFC',
        border: '1px solid #EDF1F5',
        transition: 'all .2s ease'
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 9,
          background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
          color: accent,
          display: 'grid',
          placeItems: 'center',
          fontSize: '0.72rem',
          fontWeight: 850,
          flexShrink: 0
        }}
      >
        {icon || rank}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: '#334155',
            fontSize: '0.78rem',
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {label || 'Not identified'}
        </div>

        <div
          style={{
            height: 5,
            marginTop: 7,
            background: '#E8EDF3',
            borderRadius: 999,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${accent}, ${accent}AA)`,
              borderRadius: 999,
              transition: 'width .6s ease'
            }}
          />
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div
          style={{
            color: '#0F172A',
            fontSize: '0.82rem',
            fontWeight: 850
          }}
        >
          {safeCount}
        </div>
        <div
          style={{
            color: '#94A3B8',
            fontSize: '0.6rem'
          }}
        >
          cases
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PATTERN ROW
========================================================= */

function PatternRow({ pattern, index }) {
  const label =
    pattern?.pattern ||
    pattern?.title ||
    pattern?.description ||
    pattern?.location ||
    'Recurring safety pattern';

  const count =
    pattern?.count ??
    pattern?.reports ??
    pattern?.related_reports_count ??
    0;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '13px 0',
        borderBottom:
          index === undefined ? 'none' : '1px solid #EEF2F6'
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          background:
            'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
          border: '1px solid #FED7AA',
          color: '#EA580C',
          display: 'grid',
          placeItems: 'center',
          fontSize: '0.74rem',
          fontWeight: 850,
          flexShrink: 0
        }}
      >
        {index + 1}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            color: '#334155',
            fontSize: '0.8rem',
            fontWeight: 750,
            lineHeight: 1.4
          }}
        >
          {label}
        </div>

        <div
          style={{
            marginTop: 5,
            color: '#94A3B8',
            fontSize: '0.68rem'
          }}
        >
          {number(count)} related reports
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOM PIE CENTER LABEL
========================================================= */

function PieCenterLabel({ total, label }) {
  return (
    <g>
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '1.55rem',
          fontWeight: 850,
          fill: '#0F172A',
          letterSpacing: '-0.03em'
        }}
      >
        {total}
      </text>
      <text
        x="50%"
        y="60%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          fill: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}
      >
        {label}
      </text>
    </g>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [hotspots, setHotspots] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [barriers, setBarriers] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [trend, setTrend] = useState([]);
  const [modelMetrics, setModelMetrics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const [
        statsRes,
        hotspotsRes,
        hazardsRes,
        barriersRes,
        patternsRes,
        trendRes,
        metricsRes
      ] = await Promise.all([
        getDashboardStats(),
        getHotspots(),
        getHazards(),
        getBarriers(),
        getPatterns(),
        getRiskTrend(),
        getModelMetrics()
      ]);

      setStats(statsRes?.data || null);
      setHotspots(Array.isArray(hotspotsRes?.data) ? hotspotsRes.data : []);
      setHazards(Array.isArray(hazardsRes?.data) ? hazardsRes.data : []);
      setBarriers(Array.isArray(barriersRes?.data) ? barriersRes.data : []);
      setPatterns(Array.isArray(patternsRes?.data) ? patternsRes.data : []);
      setTrend(Array.isArray(trendRes?.data) ? trendRes.data : []);
      setModelMetrics(metricsRes?.data || null);
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError(
        'Unable to load dashboard telemetry. Please check the backend connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div
        className="page-container"
        style={{
          minHeight: '65vh',
          display: 'grid',
          placeItems: 'center'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              margin: '0 auto 16px',
              borderRadius: '50%',
              border: '3px solid #DBEAFE',
              borderTopColor: '#2563EB',
              animation: 'sifDashboardSpin .8s linear infinite'
            }}
          />

          <style>
            {`
              @keyframes sifDashboardSpin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>

          <div
            style={{
              color: '#334155',
              fontWeight: 750,
              fontSize: '0.88rem'
            }}
          >
            Loading safety intelligence
          </div>

          <div
            style={{
              color: '#94A3B8',
              fontSize: '0.72rem',
              marginTop: 5
            }}
          >
            Collecting current risk telemetry...
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     SAFE VALUES
  ========================================================= */

  const totalReports = number(stats?.total_reports);
  const sifPotential = number(stats?.sif_potential);
  const critical = number(stats?.critical);
  const highPriority = number(stats?.high_priority);
  const nearMisses = number(stats?.near_misses);
  const pendingAlerts = number(stats?.pending_alerts);

  const accuracy =
    modelMetrics?.accuracy !== undefined
      ? `${(number(modelMetrics.accuracy) * 100).toFixed(1)}%`
      : '96.0%';

  const recall =
    modelMetrics?.recall !== undefined
      ? `${(number(modelMetrics.recall) * 100).toFixed(1)}%`
      : '97.5%';

  const trainingRecords = number(
    modelMetrics?.total_records,
    105996
  );

  const sifRate =
    totalReports > 0
      ? Math.round((sifPotential / totalReports) * 100)
      : 0;

  const pieData = [
    { name: 'Critical', value: critical, color: '#DC2626' },
    {
      name: 'High',
      value: Math.max(0, highPriority - critical),
      color: '#EA580C'
    },
    { name: 'Near Miss', value: nearMisses, color: '#CA8A04' },
    {
      name: 'Other',
      value: Math.max(
        0,
        totalReports -
          critical -
          Math.max(0, highPriority - critical) -
          nearMisses
      ),
      color: '#16A34A'
    }
  ].filter((item) => item.value > 0);

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="page-container animate-fade-in"
      style={{
        paddingBottom: '4rem',
        maxWidth: 1500,
        margin: '0 auto'
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
          marginBottom: 24
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 11px',
              borderRadius: 999,
              background:
                'linear-gradient(135deg, #EFF6FF, #EEF2FF)',
              border: '1px solid #DBEAFE',
              color: '#2563EB',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: 11
            }}
          >
            Safety Intelligence Overview
          </div>

          <h1
            style={{
              margin: 0,
              color: '#0F172A',
              fontSize: 'clamp(1.65rem, 3vw, 2.2rem)',
              lineHeight: 1.1,
              fontWeight: 850,
              letterSpacing: '-0.04em'
            }}
          >
            Safety Command Center
          </h1>

          <p
            style={{
              margin: '9px 0 0',
              color: '#64748B',
              fontSize: '0.9rem',
              lineHeight: 1.55,
              maxWidth: 700
            }}
          >
            A live view of SIF precursors, risk hotspots, recurring
            hazards and HSE actions across your safety reports.
          </p>
        </div>

        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          style={{
            height: 42,
            padding: '0 16px',
            borderRadius: 12,
            background:
              'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: '1px solid #DDE4ED',
            color: '#334155',
            fontSize: '0.78rem',
            fontWeight: 750,
            cursor: refreshing ? 'default' : 'pointer',
            boxShadow:
              '0 1px 0 rgba(255,255,255,1) inset, 0 5px 15px rgba(15,23,42,.05)'
          }}
        >
          {refreshing ? 'Refreshing...' : '↻ Refresh data'}
        </button>
      </section>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          style={{
            marginBottom: 18,
            padding: '12px 15px',
            borderRadius: 13,
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            color: '#B91C1C',
            fontSize: '0.78rem',
            fontWeight: 650
          }}
        >
          {error}
        </div>
      )}

      {/* =====================================================
          MODEL STATUS
      ===================================================== */}

      <section
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 18,
          flexWrap: 'wrap',
          background:
            'linear-gradient(135deg, #FFFFFF 0%, #F8FBFF 100%)',
          border: '1px solid #DCE8F7',
          borderRadius: 18,
          padding: '16px 19px',
          marginBottom: 20,
          boxShadow:
            '0 1px 0 rgba(255,255,255,1) inset, 0 7px 24px rgba(37,99,235,.05)'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 13
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              background:
                'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              border: '1px solid #BFDBFE',
              color: '#2563EB',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 900,
              fontSize: '0.9rem'
            }}
          >
            AI
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap'
              }}
            >
              <span
                style={{
                  color: '#0F172A',
                  fontSize: '0.84rem',
                  fontWeight: 800
                }}
              >
                OSHA AI Safety Model
              </span>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 9px',
                  borderRadius: 999,
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#047857',
                  fontSize: '0.61rem',
                  fontWeight: 800
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 0 3px #10B98133'
                  }}
                />
                ACTIVE
              </span>
            </div>

            <div
              style={{
                marginTop: 4,
                color: '#64748B',
                fontSize: '0.7rem'
              }}
            >
              {formatNumber(trainingRecords)} OSHA severe injury
              records · Accuracy {accuracy} · SIF recall {recall}
            </div>
          </div>
        </div>

        <Link to="/model" style={{ textDecoration: 'none' }}>
          <button
            type="button"
            style={{
              height: 38,
              padding: '0 14px',
              borderRadius: 10,
              border: '1px solid #BFDBFE',
              background:
                'linear-gradient(180deg, #FFFFFF, #F0F7FF)',
              color: '#2563EB',
              fontSize: '0.72rem',
              fontWeight: 750,
              cursor: 'pointer'
            }}
          >
            View AI Model →
          </button>
        </Link>
      </section>

      {/* =====================================================
          KPI GRID
      ===================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(175px, 1fr))',
          gap: 12,
          marginBottom: 22
        }}
      >
        <StatCard
          icon="▤"
          value={formatNumber(totalReports)}
          label="Reports Logged"
          helper="Safety observations & reports"
          accent="#2563EB"
          delay={0}
        />

        <StatCard
          icon="!"
          value={formatNumber(sifPotential)}
          label="SIF Precursors"
          helper={`${sifRate}% of reported events`}
          accent="#7C3AED"
          delay={0.04}
        />

        <StatCard
          icon="!"
          value={formatNumber(critical)}
          label="Critical Risk"
          helper="Score ≥ 80 requires action"
          accent="#DC2626"
          delay={0.08}
        />

        <StatCard
          icon="△"
          value={formatNumber(highPriority)}
          label="High / Medium"
          helper="Active control monitoring"
          accent="#EA580C"
          delay={0.12}
        />

        <StatCard
          icon="○"
          value={formatNumber(nearMisses)}
          label="Near Misses"
          helper="Leading safety indicators"
          accent="#CA8A04"
          delay={0.16}
        />

        <StatCard
          icon="!"
          value={formatNumber(pendingAlerts)}
          label="Pending HSE"
          helper="Awaiting human review"
          accent="#DC2626"
          delay={0.2}
        />
      </div>

      {/* =====================================================
          ★ CHART HERO SECTION (TOP VIEW) ★
      ===================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(320px, 1.55fr) minmax(280px, .85fr)',
          gap: 14,
          marginBottom: 14
        }}
      >
        {/* RISK TREND — AREA CHART */}

        <SectionCard
          title="Risk Trend"
          subtitle="Chronological risk scores across analyzed reports"
          action={
            trend.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
              >
                <span
                  style={{
                    padding: '5px 10px',
                    borderRadius: 999,
                    background: '#EFF6FF',
                    border: '1px solid #DBEAFE',
                    color: '#2563EB',
                    fontSize: '0.64rem',
                    fontWeight: 800
                  }}
                >
                  {trend.length} data points
                </span>
              </div>
            ) : null
          }
        >
          {trend.length === 0 ? (
            <EmptyBlock message="Insufficient trend data." />
          ) : (
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{
                    top: 12,
                    right: 15,
                    left: -20,
                    bottom: 5
                  }}
                >
                  <defs>
                    <linearGradient
                      id="riskGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#2563EB"
                        stopOpacity={0.38}
                      />
                      <stop
                        offset="50%"
                        stopColor="#2563EB"
                        stopOpacity={0.12}
                      />
                      <stop
                        offset="100%"
                        stopColor="#2563EB"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                    <linearGradient
                      id="riskStroke"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop
                        offset="0%"
                        stopColor="#2563EB"
                      />
                      <stop
                        offset="100%"
                        stopColor="#7C3AED"
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#EEF2F6"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="id"
                    stroke="#94A3B8"
                    fontSize={10}
                    tickFormatter={(value) => `#${value}`}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="risk_score"
                    name="Risk Score"
                    stroke="url(#riskStroke)"
                    strokeWidth={2.8}
                    fill="url(#riskGradient)"
                    dot={{
                      r: 3.5,
                      fill: '#FFFFFF',
                      stroke: '#2563EB',
                      strokeWidth: 2
                    }}
                    activeDot={{
                      r: 6,
                      fill: '#2563EB',
                      stroke: '#FFFFFF',
                      strokeWidth: 3
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* RISK DISTRIBUTION — DONUT WITH CENTER */}

        <SectionCard
          title="Risk Distribution"
          subtitle="Current report severity profile"
        >
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={92}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>

                <Tooltip content={<CustomTooltip />} />

                {/* Center label */}
                <text
                  x="50%"
                  y="46%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: '1.6rem',
                    fontWeight: 850,
                    fill: '#0F172A',
                    letterSpacing: '-0.03em'
                  }}
                >
                  {formatNumber(totalReports)}
                </text>
                <text
                  x="50%"
                  y="60%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    fill: '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em'
                  }}
                >
                  Total Reports
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend list */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginTop: 4
            }}
          >
            {pieData.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 9px',
                  borderRadius: 9,
                  background: '#F8FAFC',
                  border: '1px solid #EDF1F5'
                }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: item.color,
                    boxShadow: `0 0 0 3px ${item.color}22`
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    color: '#475569',
                    fontSize: '0.7rem',
                    fontWeight: 650
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    color: '#0F172A',
                    fontSize: '0.74rem',
                    fontWeight: 800
                  }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* SECONDARY CHART — HAZARD FREQUENCY */}

      <div style={{ marginBottom: 14 }}>
        <SectionCard
          title="Hazard Frequency"
          subtitle="Most frequently detected hazard categories"
          action={
            hazards.length > 0 ? (
              <span
                style={{
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: '#F5F3FF',
                  border: '1px solid #E9D5FF',
                  color: '#7C3AED',
                  fontSize: '0.64rem',
                  fontWeight: 800
                }}
              >
                {hazards.length} categories
              </span>
            ) : null
          }
        >
          {hazards.length === 0 ? (
            <EmptyBlock message="No hazard data available." />
          ) : (
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hazards.slice(0, 8)}
                  layout="vertical"
                  margin={{
                    top: 10,
                    right: 20,
                    left: 40,
                    bottom: 5
                  }}
                >
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop
                        offset="0%"
                        stopColor="#2563EB"
                      />
                      <stop
                        offset="100%"
                        stopColor="#7C3AED"
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#EEF2F6"
                    horizontal={false}
                  />

                  <XAxis
                    type="number"
                    stroke="#94A3B8"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />

                  <YAxis
                    type="category"
                    dataKey="hazard"
                    stroke="#64748B"
                    fontSize={10}
                    width={120}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="count"
                    name="Cases"
                    fill="url(#barGradient)"
                    radius={[0, 8, 8, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>
      </div>

      {/* =====================================================
          RANKED ROWS
      ===================================================== */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(300px, 1fr) minmax(300px, 1fr)',
          gap: 14,
          marginBottom: 14
        }}
      >
        {/* HOTSPOTS */}

        <SectionCard
          title="High-Risk Locations"
          subtitle="Locations ranked by reported safety risk"
        >
          {hotspots.length === 0 ? (
            <EmptyBlock message="No location data available yet." />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              {hotspots.slice(0, 6).map((item, index) => (
                <RankedRow
                  key={item.location || index}
                  rank={index + 1}
                  label={item.location}
                  count={item.count}
                  score={
                    number(item.avg_score) ||
                    Math.min(100, number(item.count) * 10)
                  }
                  accent={
                    index === 0
                      ? '#DC2626'
                      : index === 1
                        ? '#EA580C'
                        : '#2563EB'
                  }
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* HAZARDS */}

        <SectionCard
          title="Top SIF-Precursor Hazards"
          subtitle="Hazards appearing most frequently in analyzed reports"
        >
          {hazards.length === 0 ? (
            <EmptyBlock message="No hazard data available yet." />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              {hazards.slice(0, 6).map((item, index) => (
                <RankedRow
                  key={item.hazard || index}
                  rank={index + 1}
                  label={item.hazard}
                  count={item.count}
                  score={Math.min(100, number(item.count) * 12)}
                  accent={
                    index < 2 ? '#DC2626' : '#EA580C'
                  }
                  icon="!"
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* =====================================================
          BARRIERS
      ===================================================== */}

      <div style={{ marginBottom: 14 }}>
        <SectionCard
          title="Safety Barrier Failures"
          subtitle="Controls most frequently identified as absent or failed"
          action={
            barriers.length > 0 ? (
              <span
                style={{
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#B91C1C',
                  fontSize: '0.64rem',
                  fontWeight: 800
                }}
              >
                {barriers.length} failures
              </span>
            ) : null
          }
        >
          {barriers.length === 0 ? (
            <EmptyBlock message="No barrier failures detected." />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 9
              }}
            >
              {barriers.slice(0, 6).map((item, index) => (
                <div
                  key={item.barrier || index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '11px 12px',
                    borderRadius: 12,
                    background:
                      'linear-gradient(180deg, #FFF8F8, #FFFFFF)',
                    border: '1px solid #FEE2E2'
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      background:
                        'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                      color: '#DC2626',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 900,
                      flexShrink: 0,
                      fontSize: '0.9rem'
                    }}
                  >
                    ×
                  </div>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                      color: '#334155',
                      fontSize: '0.78rem',
                      fontWeight: 700
                    }}
                  >
                    {item.barrier || 'Control not identified'}
                  </div>

                  <span
                    style={{
                      padding: '4px 9px',
                      borderRadius: 999,
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#B91C1C',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {number(item.count)} cases
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* =====================================================
          PATTERNS
      ===================================================== */}

      <div style={{ marginBottom: 14 }}>
        <SectionCard
          title="Recurring Safety Patterns"
          subtitle="Repeated combinations of conditions that may require deeper HSE investigation"
          action={
            patterns.length > 0 ? (
              <span
                style={{
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  color: '#C2410C',
                  fontSize: '0.64rem',
                  fontWeight: 800
                }}
              >
                {patterns.length} detected
              </span>
            ) : null
          }
        >
          {patterns.length === 0 ? (
            <EmptyBlock message="No recurring patterns detected yet." />
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(260px, 1fr))',
                columnGap: 25
              }}
            >
              {patterns.slice(0, 8).map((pattern, index) => (
                <PatternRow
                  key={
                    pattern?.id ||
                    pattern?.pattern ||
                    index
                  }
                  pattern={pattern}
                  index={index}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* =====================================================
          BOTTOM ACTION AREA
      ===================================================== */}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}
      >
        <Link to="/" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            style={{
              background:
                'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',
              color: '#FFFFFF',
              borderRadius: 16,
              padding: '16px 18px',
              boxShadow:
                '0 10px 28px rgba(37,99,235,.22), 0 2px 6px rgba(37,99,235,.12)'
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 850
              }}
            >
              Analyze a Safety Report →
            </div>
            <div
              style={{
                marginTop: 5,
                fontSize: '0.67rem',
                opacity: 0.88
              }}
            >
              Assess SIF potential and risk priority.
            </div>
          </motion.div>
        </Link>

        <Link to="/alerts" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            style={{
              background:
                'linear-gradient(180deg, #FFFFFF 0%, #FBFCFE 100%)',
              color: '#0F172A',
              border: '1px solid #E5EAF1',
              borderRadius: 16,
              padding: '16px 18px',
              boxShadow:
                '0 1px 0 rgba(255,255,255,1) inset, 0 8px 22px rgba(15,23,42,.05)'
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 850
              }}
            >
              Review Safety Alerts →
            </div>
            <div
              style={{
                marginTop: 5,
                color: '#94A3B8',
                fontSize: '0.67rem'
              }}
            >
              {pendingAlerts} alerts currently need HSE attention.
            </div>
          </motion.div>
        </Link>

        <Link to="/reports" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            style={{
              background:
                'linear-gradient(180deg, #FFFFFF 0%, #FBFCFE 100%)',
              color: '#0F172A',
              border: '1px solid #E5EAF1',
              borderRadius: 16,
              padding: '16px 18px',
              boxShadow:
                '0 1px 0 rgba(255,255,255,1) inset, 0 8px 22px rgba(15,23,42,.05)'
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 850
              }}
            >
              Browse Incident History →
            </div>
            <div
              style={{
                marginTop: 5,
                color: '#94A3B8',
                fontSize: '0.67rem'
              }}
            >
              Explore all {formatNumber(totalReports)} analyzed reports.
            </div>
          </motion.div>
        </Link>
      </section>
    </div>
  );
}