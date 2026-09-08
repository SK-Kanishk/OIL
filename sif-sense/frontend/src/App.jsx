import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useLocation
} from 'react-router-dom';

import Analyzer from './pages/Analyzer';
import Dashboard from './pages/Dashboard';
import AlertCenter from './pages/AlertCenter';
import HSEReview from './pages/HSEReview';
import Reports from './pages/Reports';
import ModelInsights from './pages/ModelInsights';
import Simulator from './pages/Simulator';

import {
  getAlerts,
  getDatabaseStatus,
  updateDatabaseConnection
} from './services/api';

/* =========================================================
   SIF-SENSE APPLICATION SHELL
   Premium Light UI
   ========================================================= */

const COLORS = {
  navy: '#0F172A',
  text: '#334155',
  muted: '#64748B',
  subtle: '#94A3B8',

  background: '#F8FAFC',
  surface: '#FFFFFF',

  border: '#E5EAF1',
  borderStrong: '#D7DEE8',

  blue: '#2563EB',
  blueSoft: '#EFF6FF',
  blueBorder: '#BFDBFE',

  red: '#DC2626',
  redSoft: '#FEF2F2',
  redBorder: '#FECACA',

  green: '#16A34A',
  greenSoft: '#F0FDF4',
  greenBorder: '#BBF7D0',

  orange: '#EA580C',
  orangeSoft: '#FFF7ED',
  orangeBorder: '#FED7AA',

  purple: '#7C3AED',
  purpleSoft: '#F5F3FF',
  purpleBorder: '#DDD6FE'
};

/* =========================================================
   NAVIGATION
   ========================================================= */

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      {
        path: '/',
        label: 'Overview',
        shortLabel: 'Overview',
        icon: '⌂',
        exact: true
      },
      {
        path: '/dashboard',
        label: 'Risk Trends',
        shortLabel: 'Trends',
        icon: '↗'
      },
      {
        path: '/reports',
        label: 'Incident History',
        shortLabel: 'History',
        icon: '▤'
      }
    ]
  },
  {
    label: 'Safety Operations',
    items: [
      {
        path: '/simulator',
        label: 'Scenario Simulator',
        shortLabel: 'Simulator',
        icon: '◇'
      },
      {
        path: '/alerts',
        label: 'Safety Alerts',
        shortLabel: 'Alerts',
        icon: '!'
      },
      {
        path: '/review',
        label: 'HSE Review',
        shortLabel: 'Review',
        icon: '✓'
      }
    ]
  },
  {
    label: 'Intelligence',
    items: [
      {
        path: '/model',
        label: 'AI Model',
        shortLabel: 'AI Model',
        icon: 'AI'
      }
    ]
  }
];

const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(
  group => group.items
);

const PAGE_META = {
  '/': {
    eyebrow: 'SAFETY INTELLIGENCE',
    title: 'SIF Analyzer',
    sub:
      'Evaluate workplace observations and identify serious injury and fatality potential.'
  },

  '/simulator': {
    eyebrow: 'SCENARIO TESTING',
    title: 'Safety Scenario Simulator',
    sub:
      'Generate realistic safety incidents and test the AI risk pipeline.'
  },

  '/dashboard': {
    eyebrow: 'RISK INTELLIGENCE',
    title: 'Safety Command Center',
    sub:
      'Understand risk patterns, precursor hotspots and emerging safety signals.'
  },

  '/model': {
    eyebrow: 'AI INTELLIGENCE',
    title: 'AI Model',
    sub:
      'Understand how the OSHA-trained model identifies high-risk safety conditions.'
  },

  '/alerts': {
    eyebrow: 'SAFETY OPERATIONS',
    title: 'Safety Alerts',
    sub:
      'Review active SIF early warnings and decide the appropriate response.'
  },

  '/review': {
    eyebrow: 'HSE GOVERNANCE',
    title: 'HSE Review',
    sub:
      'Review alert decisions, mitigation actions and the human oversight trail.'
  },

  '/reports': {
    eyebrow: 'INCIDENT HISTORY',
    title: 'Incident History',
    sub:
      'Search, inspect and export previously analyzed safety reports.'
  }
};

/* =========================================================
   SMALL ICON
   ========================================================= */

function AppIcon({ type, active = false }) {
  return (
    <span
      style={{
        width: 32,
        height: 32,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 9,
        background: active
          ? COLORS.blueSoft
          : 'transparent',
        border: active
          ? `1px solid ${COLORS.blueBorder}`
          : '1px solid transparent',
        color: active
          ? COLORS.blue
          : COLORS.muted,
        fontSize: type === 'AI' ? '0.62rem' : '0.95rem',
        fontWeight: 900,
        letterSpacing:
          type === 'AI' ? '-0.02em' : 'normal'
      }}
    >
      {type}
    </span>
  );
}

/* =========================================================
   BRAND
   ========================================================= */

function Brand() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 12,
          background:
            'linear-gradient(145deg, #2563EB, #1D4ED8)',
          color: '#FFFFFF',
          boxShadow:
            '0 7px 18px rgba(37,99,235,0.2)',
          fontSize: '1rem',
          fontWeight: 950
        }}
      >
        S
      </div>

      <div>
        <div
          style={{
            color: COLORS.navy,
            fontSize: '0.91rem',
            fontWeight: 900,
            letterSpacing: '-0.025em',
            lineHeight: 1.1
          }}
        >
          SIF-Sense
        </div>

        <div
          style={{
            marginTop: 3,
            color: COLORS.subtle,
            fontSize: '0.57rem',
            fontWeight: 750,
            letterSpacing: '0.035em'
          }}
        >
          AI SAFETY INTELLIGENCE
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   TOPBAR
   ========================================================= */

function Topbar({
  onMenuClick,
  pendingAlerts,
  dbStatus,
  onOpenDbModal
}) {
  const location = useLocation();
  const [downloadOpen, setDownloadOpen] =
    useState(false);

  const meta =
    PAGE_META[location.pathname] ||
    PAGE_META['/'];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 900,
        minHeight: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 18,
        padding: '12px 26px',
        background:
          'rgba(255,255,255,0.94)',
        borderBottom:
          `1px solid ${COLORS.border}`,
        backdropFilter: 'blur(14px)'
      }}
    >
      {/* LEFT */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          minWidth: 0
        }}
      >
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          style={{
            display: 'none',
            width: 38,
            height: 38,
            placeItems: 'center',
            borderRadius: 10,
            border:
              `1px solid ${COLORS.borderStrong}`,
            background: COLORS.surface,
            color: COLORS.text,
            cursor: 'pointer',
            fontSize: '1.05rem',
            fontWeight: 800
          }}
          className="sif-menu-button"
        >
          ☰
        </button>

        <div style={{ minWidth: 0 }}>
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
                color: COLORS.blue,
                fontSize: '0.58rem',
                fontWeight: 900,
                letterSpacing: '0.06em'
              }}
            >
              {meta.eyebrow}
            </span>

            {pendingAlerts > 0 && (
              <NavLink
                to="/alerts"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 7px',
                  borderRadius: 999,
                  background: COLORS.redSoft,
                  border:
                    `1px solid ${COLORS.redBorder}`,
                  color: COLORS.red,
                  textDecoration: 'none',
                  fontSize: '0.59rem',
                  fontWeight: 850
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: COLORS.red
                  }}
                />
                {pendingAlerts} pending
              </NavLink>
            )}
          </div>

          <h1
            style={{
              margin: '3px 0 0',
              color: COLORS.navy,
              fontSize:
                'clamp(1rem, 2vw, 1.24rem)',
              lineHeight: 1.2,
              fontWeight: 850,
              letterSpacing: '-0.025em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {meta.title}
          </h1>

          <p
            style={{
              margin: '3px 0 0',
              color: COLORS.muted,
              fontSize: '0.66rem',
              lineHeight: 1.4,
              maxWidth: 650,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {meta.sub}
          </p>
        </div>
      </div>

      {/* RIGHT */}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0
        }}
      >
        {/* Download */}

        <div
          style={{
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={() =>
              setDownloadOpen(value => !value)
            }
            style={{
              height: 36,
              padding: '0 11px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              borderRadius: 9,
              border:
                `1px solid ${COLORS.borderStrong}`,
              background: COLORS.surface,
              color: COLORS.text,
              cursor: 'pointer',
              fontSize: '0.66rem',
              fontWeight: 750
            }}
          >
            <span
              style={{
                color: COLORS.blue,
                fontWeight: 900
              }}
            >
              ↓
            </span>
            Downloads
          </button>

          {downloadOpen && (
            <DownloadMenu
              onClose={() => setDownloadOpen(false)}
            />
          )}
        </div>

        {/* Database */}

        <button
          type="button"
          onClick={onOpenDbModal}
          style={{
            height: 36,
            padding: '0 10px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            borderRadius: 9,
            border:
              `1px solid ${
                dbStatus?.connected
                  ? COLORS.greenBorder
                  : COLORS.borderStrong
              }`,
            background:
              dbStatus?.connected
                ? COLORS.greenSoft
                : COLORS.surface,
            color:
              dbStatus?.connected
                ? COLORS.green
                : COLORS.muted,
            cursor: 'pointer',
            fontSize: '0.64rem',
            fontWeight: 800
          }}
          title="View or configure database connection"
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background:
                dbStatus?.connected
                  ? COLORS.green
                  : COLORS.subtle
            }}
          />

          {dbStatus?.connected
            ? 'MongoDB connected'
            : 'Database'}
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   DOWNLOAD MENU
   ========================================================= */

function DownloadMenu({ onClose }) {
  return (
    <div
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 8px)',
        width: 285,
        padding: 9,
        background: COLORS.surface,
        border:
          `1px solid ${COLORS.border}`,
        borderRadius: 14,
        boxShadow:
          '0 18px 45px rgba(15,23,42,0.13)',
        zIndex: 9999
      }}
    >
      <div
        style={{
          padding: '5px 7px 8px',
          color: COLORS.subtle,
          fontSize: '0.58rem',
          fontWeight: 850,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        Project resources
      </div>

      <DownloadItem
        href="http://localhost:8000/api/download/project-zip"
        download="SIF_Sense_AI_Project_Bundle.zip"
        icon="ZIP"
        title="Full Project"
        description="Complete source code and trained ML"
        tone="blue"
        onClick={onClose}
      />

      <DownloadItem
        href="http://localhost:8000/api/download/technical-pdf"
        download="SIF_Sense_AI_Technical_Deep_Dive_and_Storage_Architecture.pdf"
        icon="PDF"
        title="Architecture & Storage"
        description="Technical architecture and OSHA strategy"
        tone="purple"
        onClick={onClose}
      />

      <DownloadItem
        href="http://localhost:8000/api/download/user-guide-pdf"
        download="SIF_Sense_AI_Complete_User_and_Operation_Guide.pdf"
        icon="PDF"
        title="User Operation Guide"
        description="Complete page-by-page system guide"
        tone="green"
        onClick={onClose}
      />
    </div>
  );
}

function DownloadItem({
  href,
  download,
  icon,
  title,
  description,
  tone,
  onClick
}) {
  const theme = {
    blue: {
      bg: COLORS.blueSoft,
      border: COLORS.blueBorder,
      color: COLORS.blue
    },
    purple: {
      bg: COLORS.purpleSoft,
      border: COLORS.purpleBorder,
      color: COLORS.purple
    },
    green: {
      bg: COLORS.greenSoft,
      border: COLORS.greenBorder,
      color: COLORS.green
    }
  }[tone];

  return (
    <a
      href={href}
      download={download}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 8px',
        marginBottom: 4,
        borderRadius: 10,
        background: COLORS.surface,
        color: COLORS.text,
        textDecoration: 'none',
        transition: 'background .15s ease'
      }}
      onMouseEnter={event => {
        event.currentTarget.style.background =
          COLORS.background;
      }}
      onMouseLeave={event => {
        event.currentTarget.style.background =
          COLORS.surface;
      }}
    >
      <span
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          borderRadius: 9,
          background: theme.bg,
          border:
            `1px solid ${theme.border}`,
          color: theme.color,
          fontSize: '0.54rem',
          fontWeight: 900
        }}
      >
        {icon}
      </span>

      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            color: COLORS.text,
            fontSize: '0.68rem',
            fontWeight: 800
          }}
        >
          {title}
        </span>

        <span
          style={{
            display: 'block',
            marginTop: 2,
            color: COLORS.subtle,
            fontSize: '0.58rem',
            lineHeight: 1.35
          }}
        >
          {description}
        </span>
      </span>
    </a>
  );
}

/* =========================================================
   SIDEBAR
   ========================================================= */

function Sidebar({
  open,
  onClose,
  dbStatus,
  onOpenDbModal
}) {
  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(15,23,42,0.25)',
          backdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .2s ease'
        }}
        className="sif-sidebar-overlay"
      />

      <aside
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 1100,
          width: 244,
          display: 'flex',
          flexDirection: 'column',
          background: COLORS.surface,
          borderRight:
            `1px solid ${COLORS.border}`,
          boxShadow:
            open
              ? '10px 0 40px rgba(15,23,42,0.12)'
              : 'none',
          transform:
            open
              ? 'translateX(0)'
              : undefined
        }}
        className="sif-sidebar"
      >
        {/* Brand */}

        <div
          style={{
            padding: '19px 17px 16px',
            borderBottom:
              `1px solid ${COLORS.border}`
          }}
        >
          <Brand />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              marginTop: 14,
              padding: '7px 9px',
              borderRadius: 9,
              background: dbStatus?.connected
                ? COLORS.greenSoft
                : COLORS.blueSoft,
              border:
                `1px solid ${
                  dbStatus?.connected
                    ? COLORS.greenBorder
                    : COLORS.blueBorder
                }`
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                flexShrink: 0,
                borderRadius: '50%',
                background:
                  dbStatus?.connected
                    ? COLORS.green
                    : COLORS.blue
              }}
            />

            <span
              style={{
                color:
                  dbStatus?.connected
                    ? COLORS.green
                    : COLORS.blue,
                fontSize: '0.57rem',
                fontWeight: 850,
                letterSpacing: '0.03em'
              }}
            >
              {dbStatus?.connected
                ? 'MONGODB CONNECTED'
                : 'SAFETY ENGINE READY'}
            </span>
          </div>
        </div>

        {/* Navigation */}

        <nav
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 10px'
          }}
        >
          {NAV_GROUPS.map(group => (
            <div
              key={group.label}
              style={{
                marginBottom: 17
              }}
            >
              <div
                style={{
                  padding:
                    '0 9px 6px',
                  color: COLORS.subtle,
                  fontSize: '0.56rem',
                  fontWeight: 850,
                  textTransform: 'uppercase',
                  letterSpacing: '0.055em'
                }}
              >
                {group.label}
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.exact}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      minHeight: 42,
                      padding:
                        '4px 7px',
                      borderRadius: 10,
                      color: isActive
                        ? COLORS.blue
                        : COLORS.text,
                      background:
                        isActive
                          ? COLORS.blueSoft
                          : 'transparent',
                      border:
                        `1px solid ${
                          isActive
                            ? COLORS.blueBorder
                            : 'transparent'
                        }`,
                      textDecoration: 'none',
                      fontSize: '0.7rem',
                      fontWeight:
                        isActive
                          ? 800
                          : 650,
                      transition:
                        'all .15s ease'
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <AppIcon
                          type={item.icon}
                          active={isActive}
                        />

                        <span
                          style={{
                            flex: 1
                          }}
                        >
                          {item.label}
                        </span>

                        {item.path ===
                          '/alerts' &&
                          pendingAlertIndicator(
                            dbStatus
                          )}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}

        <div
          style={{
            padding: 10,
            borderTop:
              `1px solid ${COLORS.border}`
          }}
        >
          <button
            type="button"
            onClick={onOpenDbModal}
            style={{
              width: '100%',
              padding: '10px',
              textAlign: 'left',
              borderRadius: 11,
              border:
                `1px solid ${COLORS.border}`,
              background: COLORS.background,
              color: COLORS.text,
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between'
              }}
            >
              <span
                style={{
                  color: COLORS.subtle,
                  fontSize: '0.56rem',
                  fontWeight: 850,
                  textTransform:
                    'uppercase',
                  letterSpacing:
                    '0.04em'
                }}
              >
                Data storage
              </span>

              <span
                style={{
                  color:
                    dbStatus?.connected
                      ? COLORS.green
                      : COLORS.muted,
                  fontSize: '0.56rem',
                  fontWeight: 850
                }}
              >
                {dbStatus?.connected
                  ? 'ONLINE'
                  : 'LOCAL'}
              </span>
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: '0.65rem',
                fontWeight: 750
              }}
            >
              {dbStatus?.connected
                ? 'MongoDB Atlas'
                : 'Local database'}
            </div>

            <div
              style={{
                marginTop: 2,
                color: COLORS.subtle,
                fontSize: '0.56rem'
              }}
            >
              Configure connection →
            </div>
          </button>

          <div
            style={{
              marginTop: 9,
              color: COLORS.subtle,
              textAlign: 'center',
              fontSize: '0.53rem',
              lineHeight: 1.4
            }}
          >
            SIF-Sense AI · OSHA intelligence
          </div>
        </div>
      </aside>
    </>
  );
}

/*
 * Kept intentionally subtle in the sidebar.
 * The actual alert count is shown in the topbar.
 */
function pendingAlertIndicator(dbStatus) {
  return null;
}

/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function BottomNav() {
  const location = useLocation();

  const mobileItems = [
    ALL_NAV_ITEMS.find(
      item => item.path === '/'
    ),
    ALL_NAV_ITEMS.find(
      item => item.path === '/dashboard'
    ),
    ALL_NAV_ITEMS.find(
      item => item.path === '/alerts'
    ),
    ALL_NAV_ITEMS.find(
      item => item.path === '/reports'
    ),
    ALL_NAV_ITEMS.find(
      item => item.path === '/model'
    )
  ].filter(Boolean);

  return (
    <nav
      style={{
        display: 'none',
        position: 'fixed',
        left: 10,
        right: 10,
        bottom: 10,
        zIndex: 950,
        gridTemplateColumns:
          'repeat(5, 1fr)',
        padding: 5,
        background:
          'rgba(255,255,255,0.96)',
        border:
          `1px solid ${COLORS.border}`,
        borderRadius: 15,
        boxShadow:
          '0 12px 35px rgba(15,23,42,0.13)',
        backdropFilter: 'blur(14px)'
      }}
      className="sif-bottom-nav"
      aria-label="Mobile navigation"
    >
      {mobileItems.map(item => {
        const active = item.exact
          ? location.pathname ===
            item.path
          : location.pathname.startsWith(
              item.path
            );

        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            style={{
              minWidth: 0,
              minHeight: 49,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent:
                'center',
              gap: 2,
              borderRadius: 10,
              color: active
                ? COLORS.blue
                : COLORS.muted,
              background: active
                ? COLORS.blueSoft
                : 'transparent',
              textDecoration: 'none',
              fontSize: '0.52rem',
              fontWeight: active
                ? 850
                : 650
            }}
          >
            <AppIcon
              type={item.icon}
              active={active}
            />

            <span
              style={{
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow:
                  'ellipsis',
                whiteSpace:
                  'nowrap'
              }}
            >
              {item.shortLabel}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

/* =========================================================
   DATABASE MODAL
   ========================================================= */

function DatabaseModal({
  open,
  onClose,
  dbStatus,
  onRefresh
}) {
  const [host, setHost] =
    useState(
      dbStatus?.active_host ||
        'cluster0.mongodb.net'
    );

  const [customUri, setCustomUri] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState(null);

  useEffect(() => {
    if (open) {
      setHost(
        dbStatus?.active_host ||
          'cluster0.mongodb.net'
      );
      setMessage(null);
    }
  }, [
    open,
    dbStatus?.active_host
  ]);

  if (!open) return null;

  const handleConnect = async event => {
    event.preventDefault();

    setLoading(true);
    setMessage(null);

    try {
      const response =
        await updateDatabaseConnection({
          host:
            host.trim() ||
            undefined,
          uri:
            customUri.trim() ||
            undefined
        });

      setMessage({
        success:
          response?.data?.success,
        text:
          response?.data?.success
            ? 'MongoDB Atlas connection verified successfully.'
            : `Status: ${
                response?.data?.message ||
                'Connection was not established.'
              }`
      });

      await onRefresh();
    } catch (error) {
      setMessage({
        success: false,
        text:
          error?.response?.data
            ?.detail ||
          'Connection request failed. Please verify the cluster host and credentials.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Database configuration"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        background:
          'rgba(15,23,42,0.42)',
        backdropFilter:
          'blur(7px)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          maxHeight:
            'calc(100vh - 36px)',
          overflowY: 'auto',
          background: COLORS.surface,
          border:
            `1px solid ${COLORS.border}`,
          borderRadius: 21,
          boxShadow:
            '0 30px 80px rgba(15,23,42,0.2)'
        }}
      >
        {/* Header */}

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent:
              'space-between',
            gap: 14,
            padding:
              '20px 21px 16px',
            borderBottom:
              `1px solid ${COLORS.border}`
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 12,
                background:
                  COLORS.greenSoft,
                border:
                  `1px solid ${COLORS.greenBorder}`,
                color: COLORS.green,
                fontSize: '0.62rem',
                fontWeight: 900
              }}
            >
              DB
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  color: COLORS.navy,
                  fontSize: '1rem',
                  fontWeight: 850,
                  letterSpacing:
                    '-0.02em'
                }}
              >
                Database Configuration
              </h2>

              <p
                style={{
                  margin:
                    '4px 0 0',
                  color: COLORS.subtle,
                  fontSize:
                    '0.64rem'
                }}
              >
                MongoDB Atlas connection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34,
              height: 34,
              border:
                `1px solid ${COLORS.border}`,
              borderRadius: 9,
              background:
                COLORS.background,
              color: COLORS.muted,
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 700
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: 21
          }}
        >
          {/* Status */}

          <div
            style={{
              padding: 13,
              marginBottom: 17,
              borderRadius: 13,
              background:
                dbStatus?.connected
                  ? COLORS.greenSoft
                  : COLORS.background,
              border:
                `1px solid ${
                  dbStatus?.connected
                    ? COLORS.greenBorder
                    : COLORS.border
                }`
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background:
                    dbStatus?.connected
                      ? COLORS.green
                      : COLORS.subtle
                }}
              />

              <strong
                style={{
                  color:
                    dbStatus?.connected
                      ? COLORS.green
                      : COLORS.text,
                  fontSize:
                    '0.72rem'
                }}
              >
                {dbStatus?.connected
                  ? 'MongoDB Atlas connected'
                  : 'Local database active'}
              </strong>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'auto 1fr',
                gap: '4px 12px',
                marginTop: 10,
                color: COLORS.muted,
                fontSize:
                  '0.63rem'
              }}
            >
              <span>Database</span>
              <strong
                style={{
                  color: COLORS.text
                }}
              >
                sif_sense
              </strong>

              <span>Storage</span>
              <strong
                style={{
                  color: COLORS.text
                }}
              >
                {dbStatus?.connected
                  ? 'MongoDB Atlas'
                  : 'Local SQLite'}
              </strong>
            </div>
          </div>

          <form
            onSubmit={handleConnect}
          >
            <FormField
              label="MongoDB Atlas Cluster Host"
              hint="Example: cluster0.abcde.mongodb.net"
            >
              <input
                type="text"
                value={host}
                onChange={event =>
                  setHost(
                    event.target.value
                  )
                }
                placeholder="cluster0.mongodb.net"
                style={
                  inputStyle
                }
              />
            </FormField>

            <FormField
              label="Full MongoDB URI"
              hint="Optional — use this when you already have a complete connection string."
            >
              <input
                type="text"
                value={customUri}
                onChange={event =>
                  setCustomUri(
                    event.target.value
                  )
                }
                placeholder="mongodb+srv://..."
                style={
                  inputStyle
                }
              />
            </FormField>

            {message && (
              <div
                style={{
                  marginBottom: 15,
                  padding: 11,
                  borderRadius: 10,
                  background:
                    message.success
                      ? COLORS.greenSoft
                      : COLORS.redSoft,
                  border:
                    `1px solid ${
                      message.success
                        ? COLORS.greenBorder
                        : COLORS.redBorder
                    }`,
                  color:
                    message.success
                      ? COLORS.green
                      : COLORS.red,
                  fontSize:
                    '0.68rem',
                  lineHeight: 1.45,
                  fontWeight: 700
                }}
              >
                {message.text}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: 8,
                paddingTop: 4
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={
                  secondaryButton
                }
              >
                Close
              </button>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...primaryButton,
                  opacity: loading
                    ? 0.6
                    : 1,
                  cursor: loading
                    ? 'not-allowed'
                    : 'pointer'
                }}
              >
                {loading
                  ? 'Testing...'
                  : 'Test & Connect'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FORM FIELD
   ========================================================= */

function FormField({
  label,
  hint,
  children
}) {
  return (
    <div
      style={{
        marginBottom: 15
      }}
    >
      <label
        style={{
          display: 'block',
          marginBottom: 6,
          color: COLORS.text,
          fontSize: '0.68rem',
          fontWeight: 800
        }}
      >
        {label}
      </label>

      {children}

      <div
        style={{
          marginTop: 5,
          color: COLORS.subtle,
          fontSize: '0.58rem',
          lineHeight: 1.4
        }}
      >
        {hint}
      </div>
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

export default function App() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const [pendingAlerts, setPendingAlerts] =
    useState(0);

  const [dbStatus, setDbStatus] =
    useState(null);

  const [dbModalOpen, setDbModalOpen] =
    useState(false);

  const refreshStatus =
    async () => {
      try {
        const [
          alertsResponse,
          databaseResponse
        ] = await Promise.all([
          getAlerts('PENDING'),
          getDatabaseStatus()
        ]);

        const alertData =
          alertsResponse?.data;

        const alertCount =
          Array.isArray(alertData)
            ? alertData.length
            : Array.isArray(
                alertData?.alerts
              )
            ? alertData.alerts.length
            : 0;

        setPendingAlerts(
          alertCount
        );

        setDbStatus(
          databaseResponse?.data ||
            null
        );
      } catch (error) {
        console.warn(
          'Unable to refresh application status:',
          error
        );
      }
    };

  useEffect(() => {
    refreshStatus();

    const interval =
      setInterval(
        refreshStatus,
        20000
      );

    return () =>
      clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <AppStyles />

      <div
        style={{
          minHeight: '100vh',
          background:
            COLORS.background
        }}
      >
        <Sidebar
          open={sidebarOpen}
          onClose={() =>
            setSidebarOpen(false)
          }
          dbStatus={dbStatus}
          onOpenDbModal={() =>
            setDbModalOpen(true)
          }
        />

        <main
          style={{
            minHeight: '100vh',
            marginLeft: 244
          }}
          className="sif-main"
        >
          <Topbar
            onMenuClick={() =>
              setSidebarOpen(
                value => !value
              )
            }
            pendingAlerts={
              pendingAlerts
            }
            dbStatus={dbStatus}
            onOpenDbModal={() =>
              setDbModalOpen(true)
            }
          />

          <div
            style={{
              minHeight:
                'calc(100vh - 72px)',
              padding:
                '22px 25px 45px'
            }}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <Analyzer
                    onNewAlert={() =>
                      setPendingAlerts(
                        value =>
                          value + 1
                      )
                    }
                  />
                }
              />

              <Route
                path="/simulator"
                element={<Simulator />}
              />

              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/model"
                element={
                  <ModelInsights />
                }
              />

              <Route
                path="/alerts"
                element={
                  <AlertCenter />
                }
              />

              <Route
                path="/review"
                element={
                  <HSEReview />
                }
              />

              <Route
                path="/reports"
                element={<Reports />}
              />
            </Routes>
          </div>
        </main>

        <BottomNav />

        <DatabaseModal
          open={dbModalOpen}
          onClose={() =>
            setDbModalOpen(false)
          }
          dbStatus={dbStatus}
          onRefresh={refreshStatus}
        />
      </div>
    </BrowserRouter>
  );
}

/* =========================================================
   GLOBAL APP-SHELL STYLES
   ========================================================= */

function AppStyles() {
  return (
    <style>
      {`
        * {
          box-sizing: border-box;
        }

        html {
          background: #F8FAFC;
        }

        body {
          margin: 0;
          background: #F8FAFC;
          color: #0F172A;
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button:focus-visible,
        a:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 3px solid rgba(37, 99, 235, 0.18);
          outline-offset: 2px;
        }

        ::selection {
          background: #DBEAFE;
          color: #1E3A8A;
        }

        .sif-sidebar {
          transition:
            transform 0.22s ease,
            box-shadow 0.22s ease;
        }

        .sif-menu-button {
          display: none !important;
        }

        .sif-bottom-nav {
          display: none !important;
        }

        @media (max-width: 900px) {
          .sif-main {
            margin-left: 0 !important;
          }

          .sif-sidebar {
            transform: translateX(-100%);
          }

          .sif-sidebar-overlay {
            display: block;
          }

          .sif-menu-button {
            display: grid !important;
          }
        }

        @media (min-width: 901px) {
          .sif-sidebar-overlay {
            display: none !important;
          }
        }

        @media (max-width: 640px) {
          .sif-main {
            padding-bottom: 75px;
          }

          .sif-bottom-nav {
            display: grid !important;
          }

          .sif-sidebar {
            width: min(285px, 88vw);
          }

          .sif-menu-button {
            width: 36px !important;
            height: 36px !important;
          }
        }

        @media (max-width: 720px) {
          .sif-main > header {
            padding-left: 14px !important;
            padding-right: 14px !important;
          }

          .sif-main > div {
            padding-left: 13px !important;
            padding-right: 13px !important;
          }
        }

        @media (max-width: 560px) {
          .sif-main > header {
            min-height: 64px !important;
          }

          .sif-main > header p {
            display: none;
          }

          .sif-main > header > div:last-child {
            gap: 5px !important;
          }

          .sif-main > header button {
            height: 34px !important;
          }

          .sif-main > div {
            padding-top: 15px !important;
          }
        }
      `}
    </style>
  );
}

/* =========================================================
   SHARED BUTTONS / INPUTS
   ========================================================= */

const primaryButton = {
  height: 40,
  padding: '0 15px',
  border: 'none',
  borderRadius: 10,
  background: COLORS.blue,
  color: '#FFFFFF',
  fontSize: '0.71rem',
  fontWeight: 800,
  boxShadow:
    '0 6px 16px rgba(37,99,235,0.18)'
};

const secondaryButton = {
  height: 40,
  padding: '0 14px',
  border:
    `1px solid ${COLORS.borderStrong}`,
  borderRadius: 10,
  background: COLORS.surface,
  color: COLORS.text,
  fontSize: '0.71rem',
  fontWeight: 750,
  cursor: 'pointer'
};

const inputStyle = {
  width: '100%',
  height: 40,
  padding: '0 11px',
  border:
    `1px solid ${COLORS.borderStrong}`,
  borderRadius: 9,
  background: COLORS.background,
  color: COLORS.text,
  fontSize: '0.7rem',
  outline: 'none'
};