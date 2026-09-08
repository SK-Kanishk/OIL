import React, { useEffect, useMemo, useState } from 'react';
import {
  getModelMetrics,
  quickPredict,
  getOshaSamples
} from '../services/api';

/* =========================================================
   SIF-SENSE
   SAFETY KNOWLEDGE & EVIDENCE CENTER

   Purpose:
   - Help users understand hazards
   - Explain why a situation may be dangerous
   - Provide evidence from OSHA/model data
   - Allow live safety scenario testing
   - Keep technical ML details available without
     overwhelming normal HSE users
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

  orange: '#EA580C',
  orangeSoft: '#FFF7ED',
  orangeBorder: '#FED7AA',

  yellow: '#CA8A04',
  yellowSoft: '#FEFCE8',
  yellowBorder: '#FDE68A',

  green: '#16A34A',
  greenSoft: '#F0FDF4',
  greenBorder: '#BBF7D0',

  purple: '#7C3AED',
  purpleSoft: '#F5F3FF',
  purpleBorder: '#DDD6FE',

  cyan: '#0891B2',
  cyanSoft: '#ECFEFF',
  cyanBorder: '#A5F3FC'
};

/* =========================================================
   HAZARD KNOWLEDGE
   ========================================================= */

const HAZARDS = [
  {
    id: 'fall',
    name: 'Fall from Height',
    category: 'Working at Height',
    severity: 'Critical',
    description:
      'A fall from an elevated position can cause fatal or life-changing injuries, especially where fall protection or edge protection is missing.',
    whyDangerous:
      'Falls can produce high-energy impacts and may result in head injuries, spinal injuries, fractures or fatal trauma.',
    consequences: [
      'Fatal or severe trauma',
      'Head and spinal injuries',
      'Multiple fractures',
      'Dropped-object exposure to people below'
    ],
    controls: [
      'Use suitable fall protection',
      'Install guardrails or edge protection',
      'Inspect access equipment before use',
      'Control dropped-object hazards',
      'Use an approved work-at-height procedure'
    ],
    keywords: [
      'height',
      'ladder',
      'scaffold',
      'roof',
      'fall',
      'elevated',
      'platform'
    ]
  },

  {
    id: 'electrical',
    name: 'Electrical Exposure',
    category: 'Electrical Work',
    severity: 'Critical',
    description:
      'Contact with energized electrical equipment can result in electrocution, arc flash, severe burns and secondary falls.',
    whyDangerous:
      'Electrical energy can cause fatal injury very quickly. Arc-flash events can also produce extreme heat, pressure and flying material.',
    consequences: [
      'Electrocution',
      'Arc-flash burns',
      'Cardiac injury',
      'Secondary fall or blast injury'
    ],
    controls: [
      'De-energize where possible',
      'Apply lockout/tagout',
      'Verify absence of voltage',
      'Maintain safe approach distances',
      'Use appropriate electrical PPE'
    ],
    keywords: [
      'electric',
      'electrical',
      'energized',
      'voltage',
      'arc',
      '480v',
      'switchgear'
    ]
  },

  {
    id: 'confined-space',
    name: 'Confined Space',
    category: 'Confined Space Entry',
    severity: 'Critical',
    description:
      'Confined spaces may contain toxic gases, oxygen deficiency, engulfment hazards or other atmospheric and physical dangers.',
    whyDangerous:
      'A hazardous atmosphere can incapacitate a worker before they can escape. Rescue attempts can also expose additional workers.',
    consequences: [
      'Loss of consciousness',
      'Asphyxiation',
      'Toxic exposure',
      'Multiple-person incident'
    ],
    controls: [
      'Perform atmospheric testing',
      'Use an entry permit where required',
      'Provide continuous monitoring when appropriate',
      'Maintain an entry attendant',
      'Prepare and communicate a rescue plan'
    ],
    keywords: [
      'confined',
      'tank',
      'vessel',
      'manhole',
      'oxygen',
      'gas',
      'entry'
    ]
  },

  {
    id: 'line-of-fire',
    name: 'Line of Fire / Struck-By',
    category: 'Material Movement',
    severity: 'High',
    description:
      'A line-of-fire hazard exists when a person can be struck, crushed or caught by moving equipment, material or stored energy.',
    whyDangerous:
      'Workers positioned between moving objects or beneath suspended loads may have little or no opportunity to escape.',
    consequences: [
      'Crush injuries',
      'Amputation',
      'Blunt-force trauma',
      'Fatal struck-by event'
    ],
    controls: [
      'Establish exclusion zones',
      'Stay clear of suspended loads',
      'Use suitable barriers',
      'Control vehicle and pedestrian interfaces',
      'Maintain communication during movement'
    ],
    keywords: [
      'struck',
      'suspended',
      'load',
      'vehicle',
      'crush',
      'caught',
      'line of fire'
    ]
  },

  {
    id: 'machinery',
    name: 'Machine / Caught-In Hazard',
    category: 'Machinery',
    severity: 'Critical',
    description:
      'Moving machinery can trap, crush, shear or amputate body parts when guarding or energy isolation is inadequate.',
    whyDangerous:
      'Mechanical energy can be released suddenly and can overcome a worker before they can react.',
    consequences: [
      'Crushing',
      'Amputation',
      'Entanglement',
      'Fatal machinery injury'
    ],
    controls: [
      'Isolate hazardous energy',
      'Apply lockout/tagout',
      'Use machine guarding',
      'Never bypass safety devices',
      'Verify zero-energy state before intervention'
    ],
    keywords: [
      'machine',
      'press',
      'conveyor',
      'guard',
      'jam',
      'entangle',
      'rotating'
    ]
  },

  {
    id: 'lifting',
    name: 'Lifting / Suspended Load',
    category: 'Lifting Operations',
    severity: 'High',
    description:
      'Lifting operations can expose workers to dropped loads, crane movement, rigging failure and crush zones.',
    whyDangerous:
      'A suspended load contains significant stored potential energy and can cause catastrophic injury if released.',
    consequences: [
      'Fatal struck-by injury',
      'Crushing',
      'Equipment damage',
      'Multiple-person exposure'
    ],
    controls: [
      'Plan the lifting operation',
      'Inspect lifting accessories',
      'Use competent lifting personnel',
      'Control exclusion zones',
      'Never stand beneath suspended loads'
    ],
    keywords: [
      'crane',
      'lifting',
      'suspended',
      'rigging',
      'hook',
      'load',
      'hoist'
    ]
  },

  {
    id: 'fire-explosion',
    name: 'Fire / Explosion',
    category: 'Process Safety',
    severity: 'Critical',
    description:
      'Flammable materials, ignition sources and uncontrolled process conditions can create fire or explosion hazards.',
    whyDangerous:
      'Fire and explosion events can affect multiple workers simultaneously and can escalate rapidly.',
    consequences: [
      'Severe burns',
      'Blast injuries',
      'Smoke inhalation',
      'Multiple fatalities'
    ],
    controls: [
      'Control ignition sources',
      'Manage flammable materials',
      'Use hot-work controls',
      'Verify isolation',
      'Maintain suitable emergency controls'
    ],
    keywords: [
      'fire',
      'explosion',
      'flammable',
      'gas',
      'ignition',
      'hot work'
    ]
  },

  {
    id: 'chemical',
    name: 'Chemical Exposure',
    category: 'Chemical Safety',
    severity: 'High',
    description:
      'Chemical exposure may occur through inhalation, skin contact, ingestion or uncontrolled release.',
    whyDangerous:
      'Some chemicals can cause immediate toxic effects while others can create serious long-term health consequences.',
    consequences: [
      'Toxic exposure',
      'Chemical burns',
      'Respiratory injury',
      'Loss of consciousness'
    ],
    controls: [
      'Identify chemical hazards',
      'Use suitable containment',
      'Follow SDS requirements',
      'Use appropriate PPE',
      'Maintain emergency response controls'
    ],
    keywords: [
      'chemical',
      'toxic',
      'solvent',
      'acid',
      'chlorine',
      'exposure'
    ]
  },

  {
    id: 'excavation',
    name: 'Excavation / Collapse',
    category: 'Ground Disturbance',
    severity: 'Critical',
    description:
      'Excavation work can expose workers to trench collapse, falling material, underground services and equipment interaction.',
    whyDangerous:
      'A collapse can bury or crush a worker with little warning and can make rescue extremely difficult.',
    consequences: [
      'Burial',
      'Crushing',
      'Asphyxiation',
      'Fatal collapse'
    ],
    controls: [
      'Assess ground conditions',
      'Use appropriate protective systems',
      'Control equipment near edges',
      'Identify underground services',
      'Keep access and egress suitable'
    ],
    keywords: [
      'excavation',
      'trench',
      'collapse',
      'soil',
      'digging',
      'ground'
    ]
  },

  {
    id: 'pressure',
    name: 'Pressure / Stored Energy',
    category: 'Process Safety',
    severity: 'High',
    description:
      'Pressurized systems can release stored energy suddenly when isolation, containment or pressure verification fails.',
    whyDangerous:
      'Unexpected pressure release can propel equipment, release hazardous material or create blast and impact hazards.',
    consequences: [
      'Blast injury',
      'Struck-by injury',
      'Chemical release',
      'Fatal trauma'
    ],
    controls: [
      'Identify stored energy',
      'Isolate the system',
      'Depressurize before intervention',
      'Verify isolation',
      'Use appropriate engineering controls'
    ],
    keywords: [
      'pressure',
      'pressurized',
      'steam',
      'pipeline',
      'release',
      'valve'
    ]
  }
];

/* =========================================================
   HELPERS
   ========================================================= */

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatNumber(value) {
  return safeNumber(value).toLocaleString();
}

function probability(value) {
  const n = safeNumber(value);

  if (n <= 1) {
    return `${(n * 100).toFixed(1)}%`;
  }

  return `${n.toFixed(1)}%`;
}

function getRiskStyle(severity) {
  switch (String(severity || '').toUpperCase()) {
    case 'CRITICAL':
      return {
        color: COLORS.red,
        soft: COLORS.redSoft,
        border: COLORS.redBorder
      };

    case 'HIGH':
      return {
        color: COLORS.orange,
        soft: COLORS.orangeSoft,
        border: COLORS.orangeBorder
      };

    case 'MEDIUM':
      return {
        color: COLORS.yellow,
        soft: COLORS.yellowSoft,
        border: COLORS.yellowBorder
      };

    default:
      return {
        color: COLORS.green,
        soft: COLORS.greenSoft,
        border: COLORS.greenBorder
      };
  }
}

function getSampleText(sample) {
  return (
    sample?.text ||
    sample?.description ||
    sample?.narrative ||
    sample?.incident_description ||
    sample?.preprocessing?.original ||
    ''
  );
}

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function ModelInsights() {
  const [metrics, setMetrics] = useState(null);
  const [oshaSamples, setOshaSamples] = useState([]);

  const [loading, setLoading] = useState(true);
  const [samplesLoading, setSamplesLoading] = useState(false);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [selectedHazard, setSelectedHazard] = useState(null);

  const [question, setQuestion] = useState('');
  const [answerMode, setAnswerMode] = useState(false);

  const [scenarioText, setScenarioText] = useState(
    'A worker was clearing a jam on a hydraulic press when the machine unexpectedly cycled and trapped the worker hand.'
  );

  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  const [showTechnical, setShowTechnical] = useState(false);

  /* =======================================================
     LOAD DATA
     ======================================================= */

  useEffect(() => {
    loadPage();
  }, []);

  const loadPage = async () => {
    setLoading(true);
    setError('');

    try {
      const metricsResponse = await getModelMetrics();

      setMetrics(metricsResponse?.data || null);

      loadOshaSamples();

      await runPrediction(
        'A worker was clearing a jam on a hydraulic press when the machine unexpectedly cycled and trapped the worker hand.'
      );
    } catch (err) {
      console.error(err);

      setError(
        'Unable to load safety intelligence. Please check the backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadOshaSamples = async () => {
    try {
      setSamplesLoading(true);

      const response = await getOshaSamples();

      const data = response?.data;

      if (Array.isArray(data)) {
        setOshaSamples(data);
      } else if (Array.isArray(data?.samples)) {
        setOshaSamples(data.samples);
      } else if (Array.isArray(data?.records)) {
        setOshaSamples(data.records);
      } else {
        setOshaSamples([]);
      }
    } catch (err) {
      console.warn(
        'Unable to load OSHA sample records:',
        err
      );

      setOshaSamples([]);
    } finally {
      setSamplesLoading(false);
    }
  };

  /* =======================================================
     LIVE PREDICTION
     ======================================================= */

  const runPrediction = async text => {
    if (!text?.trim()) return;

    try {
      setPredicting(true);

      const response = await quickPredict(text);

      setPrediction(response?.data || null);
    } catch (err) {
      console.error(
        'Prediction error:',
        err
      );
    } finally {
      setPredicting(false);
    }
  };

  const submitScenario = event => {
    event.preventDefault();

    runPrediction(scenarioText);
  };

  /* =======================================================
     HAZARD SEARCH
     ======================================================= */

  const filteredHazards = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    if (!q) {
      return HAZARDS;
    }

    return HAZARDS.filter(hazard => {
      const content = [
        hazard.name,
        hazard.category,
        hazard.description,
        ...hazard.keywords
      ]
        .join(' ')
        .toLowerCase();

      return content.includes(q);
    });
  }, [search]);

  /* =======================================================
     SIMPLE QUESTION MATCHING
     ======================================================= */

  const suggestedHazard = useMemo(() => {
    if (!question.trim()) {
      return null;
    }

    const q = question.toLowerCase();

    return (
      HAZARDS.find(hazard =>
        hazard.keywords.some(keyword =>
          q.includes(keyword.toLowerCase())
        )
      ) || null
    );
  }, [question]);

  const accuracy = safeNumber(
    metrics?.accuracy
  );

  const recall = safeNumber(
    metrics?.recall
  );

  const f1 = safeNumber(
    metrics?.f1_score
  );

  const rocAuc = safeNumber(
    metrics?.roc_auc
  );

  const totalRecords = safeNumber(
    metrics?.total_records,
    105996
  );

  const predictionClassification =
    prediction?.classification || {};

  const predictionSif = Boolean(
    predictionClassification.sif_potential
  );

  const predictionScore = safeNumber(
    predictionClassification.model_score
  );

  /* =======================================================
     LOADING
     ======================================================= */

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
              width: 42,
              height: 42,
              margin: '0 auto 14px',
              borderRadius: '50%',
              border: '3px solid #DBEAFE',
              borderTopColor: COLORS.blue,
              animation:
                'sifKnowledgeSpin .8s linear infinite'
            }}
          />

          <style>
            {`
              @keyframes sifKnowledgeSpin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>

          <div
            style={{
              color: COLORS.text,
              fontSize: '.85rem',
              fontWeight: 800
            }}
          >
            Preparing Safety Knowledge Center
          </div>

          <div
            style={{
              marginTop: 4,
              color: COLORS.subtle,
              fontSize: '.68rem'
            }}
          >
            Loading live model evidence and safety intelligence...
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     ERROR
     ======================================================= */

  if (error) {
    return (
      <div
        className="page-container"
        style={{
          paddingBottom: '4rem'
        }}
      >
        <div
          style={{
            padding: 18,
            borderRadius: 15,
            background: COLORS.redSoft,
            border:
              `1px solid ${COLORS.redBorder}`,
            color: '#B91C1C',
            fontSize: '.76rem',
            fontWeight: 700
          }}
        >
          {error}
        </div>
      </div>
    );
  }

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
          HERO
      ===================================================== */}

      <section
        style={{
          padding: '22px 22px 21px',
          borderRadius: 21,
          background:
            'linear-gradient(135deg, #FFFFFF 0%, #F5F9FF 100%)',
          border:
            `1px solid #DCE8F7`,
          boxShadow:
            '0 10px 35px rgba(37,99,235,.055)',
          marginBottom: 17
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 20,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ maxWidth: 780 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '5px 9px',
                borderRadius: 999,
                background: COLORS.blueSoft,
                border:
                  `1px solid ${COLORS.blueBorder}`,
                color: COLORS.blue,
                fontSize: '.61rem',
                fontWeight: 850,
                letterSpacing: '.05em',
                marginBottom: 10
              }}
            >
              SAFETY KNOWLEDGE & EVIDENCE
            </div>

            <h1
              style={{
                margin: 0,
                color: COLORS.navy,
                fontSize:
                  'clamp(1.55rem, 3vw, 2.2rem)',
                lineHeight: 1.08,
                fontWeight: 900,
                letterSpacing: '-.045em'
              }}
            >
              Understand the hazard.
              <br />
              <span
                style={{
                  color: COLORS.blue
                }}
              >
                Understand the risk.
              </span>
            </h1>

            <p
              style={{
                margin: '10px 0 0',
                color: COLORS.muted,
                fontSize: '.83rem',
                lineHeight: 1.65
              }}
            >
              Use SIF-Sense to understand workplace hazards,
              explore evidence from OSHA incident data and test
              real safety situations with the AI model.
            </p>
          </div>

          <div
            style={{
              minWidth: 190,
              padding: 13,
              borderRadius: 14,
              background: COLORS.surface,
              border:
                `1px solid ${COLORS.border}`,
              boxShadow:
                '0 5px 18px rgba(15,23,42,.035)'
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
                  background: COLORS.green
                }}
              />

              <span
                style={{
                  color: COLORS.green,
                  fontSize: '.61rem',
                  fontWeight: 850
                }}
              >
                LIVE AI ENGINE
              </span>
            </div>

            <div
              style={{
                marginTop: 8,
                color: COLORS.navy,
                fontSize: '.76rem',
                fontWeight: 800
              }}
            >
              OSHA-trained intelligence
            </div>

            <div
              style={{
                marginTop: 3,
                color: COLORS.subtle,
                fontSize: '.61rem'
              }}
            >
              {formatNumber(totalRecords)} severe injury records
            </div>
          </div>
        </div>

        {/* ===================================================
            QUICK QUESTIONS
        =================================================== */}

        <div
          style={{
            marginTop: 20,
            paddingTop: 17,
            borderTop:
              '1px solid #E7EEF7'
          }}
        >
          <div
            style={{
              marginBottom: 7,
              color: COLORS.text,
              fontSize: '.69rem',
              fontWeight: 850
            }}
          >
            Have a safety question?
          </div>

          <div
            style={{
              display: 'flex',
              gap: 7,
              flexWrap: 'wrap'
            }}
          >
            {[
              'Why is a fall dangerous?',
              'What makes electrical work high risk?',
              'Why is confined space dangerous?',
              'What is a line-of-fire hazard?'
            ].map(item => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setQuestion(item);
                  setAnswerMode(true);
                }}
                style={{
                  padding:
                    '7px 10px',
                  borderRadius: 9,
                  border:
                    `1px solid ${COLORS.border}`,
                  background: COLORS.surface,
                  color: COLORS.text,
                  cursor: 'pointer',
                  fontSize: '.64rem',
                  fontWeight: 700
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 9
            }}
          >
            <input
              value={question}
              onChange={event =>
                setQuestion(
                  event.target.value
                )
              }
              onKeyDown={event => {
                if (
                  event.key === 'Enter'
                ) {
                  setAnswerMode(true);
                }
              }}
              placeholder="Ask about a hazard, activity or unsafe condition..."
              style={{
                flex: 1,
                minWidth: 0,
                height: 42,
                padding:
                  '0 12px',
                border:
                  `1px solid ${COLORS.borderStrong}`,
                borderRadius: 10,
                background: COLORS.surface,
                color: COLORS.text,
                fontSize: '.7rem',
                outline: 'none'
              }}
            />

            <button
              type="button"
              onClick={() =>
                setAnswerMode(true)
              }
              style={{
                height: 42,
                padding:
                  '0 14px',
                border: 'none',
                borderRadius: 10,
                background: COLORS.blue,
                color: '#FFFFFF',
                fontSize: '.68rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow:
                  '0 5px 15px rgba(37,99,235,.18)'
              }}
            >
              Explain
            </button>
          </div>

          {/* ANSWER */}

          {answerMode && (
            <QuestionAnswer
              question={question}
              hazard={suggestedHazard}
              onClose={() =>
                setAnswerMode(false)
              }
            />
          )}
        </div>
      </section>

      {/* =====================================================
          HAZARD EXPLORER
      ===================================================== */}

      <section
        style={{
          background: COLORS.surface,
          border:
            `1px solid ${COLORS.border}`,
          borderRadius: 19,
          padding: 19,
          boxShadow:
            '0 8px 28px rgba(15,23,42,.04)',
          marginBottom: 14
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 15,
            flexWrap: 'wrap',
            marginBottom: 14
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: COLORS.navy,
                fontSize: '.99rem',
                fontWeight: 850
              }}
            >
              Hazard Explorer
            </h2>

            <p
              style={{
                margin: '5px 0 0',
                color: COLORS.subtle,
                fontSize: '.67rem'
              }}
            >
              Select a hazard to understand the danger, likely
              consequences and practical controls.
            </p>
          </div>

          <input
            value={search}
            onChange={event =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search hazards..."
            style={{
              width: 230,
              maxWidth: '100%',
              height: 37,
              padding: '0 10px',
              border:
                `1px solid ${COLORS.borderStrong}`,
              borderRadius: 9,
              background: COLORS.background,
              color: COLORS.text,
              fontSize: '.66rem',
              outline: 'none'
            }}
          />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(210px, 1fr))',
            gap: 9
          }}
        >
          {filteredHazards.map(hazard => {
            const risk =
              getRiskStyle(
                hazard.severity
              );

            return (
              <button
                key={hazard.id}
                type="button"
                onClick={() =>
                  setSelectedHazard(
                    hazard
                  )
                }
                style={{
                  minHeight: 125,
                  padding: 13,
                  textAlign: 'left',
                  border:
                    `1px solid ${COLORS.border}`,
                  borderTop:
                    `3px solid ${risk.color}`,
                  borderRadius: 13,
                  background:
                    COLORS.surface,
                  cursor: 'pointer',
                  transition:
                    'all .16s ease'
                }}
                onMouseEnter={event => {
                  event.currentTarget.style.transform =
                    'translateY(-2px)';
                  event.currentTarget.style.boxShadow =
                    '0 9px 25px rgba(15,23,42,.07)';
                }}
                onMouseLeave={event => {
                  event.currentTarget.style.transform =
                    'translateY(0)';
                  event.currentTarget.style.boxShadow =
                    'none';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    gap: 7
                  }}
                >
                  <span
                    style={{
                      color: COLORS.navy,
                      fontSize: '.74rem',
                      fontWeight: 850
                    }}
                  >
                    {hazard.name}
                  </span>

                  <span
                    style={{
                      padding:
                        '3px 6px',
                      borderRadius: 999,
                      background:
                        risk.soft,
                      border:
                        `1px solid ${risk.border}`,
                      color:
                        risk.color,
                      fontSize: '.53rem',
                      fontWeight: 850
                    }}
                  >
                    {hazard.severity}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 5,
                    color: COLORS.blue,
                    fontSize: '.58rem',
                    fontWeight: 700
                  }}
                >
                  {hazard.category}
                </div>

                <div
                  style={{
                    marginTop: 7,
                    color: COLORS.muted,
                    fontSize: '.62rem',
                    lineHeight: 1.45
                  }}
                >
                  {hazard.description}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    color: COLORS.blue,
                    fontSize: '.6rem',
                    fontWeight: 800
                  }}
                >
                  Understand this hazard →
                </div>
              </button>
            );
          })}
        </div>

        {filteredHazards.length === 0 && (
          <div
            style={{
              padding: 25,
              textAlign: 'center',
              color: COLORS.subtle,
              fontSize: '.7rem'
            }}
          >
            No hazards match your search.
          </div>
        )}
      </section>

      {/* =====================================================
          LIVE SCENARIO ANALYZER
      ===================================================== */}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'minmax(320px, 1fr) minmax(280px, .7fr)',
          gap: 14,
          marginBottom: 14
        }}
      >
        <div
          style={{
            background: COLORS.surface,
            border:
              `1px solid ${COLORS.border}`,
            borderRadius: 19,
            padding: 19,
            boxShadow:
              '0 8px 28px rgba(15,23,42,.04)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: 13
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  color: COLORS.navy,
                  fontSize: '.98rem',
                  fontWeight: 850
                }}
              >
                Try a Safety Scenario
              </h2>

              <p
                style={{
                  margin:
                    '5px 0 0',
                  color: COLORS.subtle,
                  fontSize: '.66rem',
                  lineHeight: 1.45
                }}
              >
                Describe what is happening and see how the
                SIF-Sense model interprets the situation.
              </p>
            </div>

            <span
              style={{
                padding:
                  '5px 8px',
                borderRadius: 999,
                background:
                  COLORS.greenSoft,
                border:
                  `1px solid ${COLORS.greenBorder}`,
                color:
                  COLORS.green,
                fontSize: '.56rem',
                fontWeight: 850
              }}
            >
              LIVE
            </span>
          </div>

          <form
            onSubmit={submitScenario}
          >
            <textarea
              value={scenarioText}
              onChange={event =>
                setScenarioText(
                  event.target.value
                )
              }
              placeholder="Describe the safety situation..."
              style={{
                width: '100%',
                minHeight: 125,
                resize: 'vertical',
                padding: 13,
                boxSizing: 'border-box',
                border:
                  `1px solid ${COLORS.borderStrong}`,
                borderRadius: 12,
                background:
                  COLORS.background,
                color: COLORS.text,
                fontFamily: 'inherit',
                fontSize: '.72rem',
                lineHeight: 1.55,
                outline: 'none'
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                gap: 10,
                marginTop: 9,
                flexWrap: 'wrap'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  flexWrap: 'wrap'
                }}
              >
                <ScenarioButton
                  text="Fall"
                  onClick={() =>
                    setScenarioText(
                      'A worker fell approximately 12 feet from an elevated platform without effective fall protection.'
                    )
                  }
                />

                <ScenarioButton
                  text="Electrical"
                  onClick={() =>
                    setScenarioText(
                      'An electrician contacted an energized 480V electrical busbar and suffered severe arc flash burns.'
                    )
                  }
                />

                <ScenarioButton
                  text="Confined Space"
                  onClick={() =>
                    setScenarioText(
                      'A worker entered a confined space without atmospheric testing and reported difficulty breathing.'
                    )
                  }
                />
              </div>

              <button
                type="submit"
                disabled={
                  predicting
                }
                style={{
                  height: 38,
                  padding:
                    '0 13px',
                  border: 'none',
                  borderRadius: 9,
                  background:
                    predicting
                      ? COLORS.subtle
                      : COLORS.blue,
                  color: '#FFFFFF',
                  fontSize: '.66rem',
                  fontWeight: 800,
                  cursor:
                    predicting
                      ? 'not-allowed'
                      : 'pointer'
                }}
              >
                {predicting
                  ? 'Analyzing...'
                  : 'Evaluate Scenario'}
              </button>
            </div>
          </form>

          {/* RESULT */}

          {prediction && (
            <PredictionResult
              prediction={
                prediction
              }
              sif={
                predictionSif
              }
              score={
                predictionScore
              }
            />
          )}
        </div>

        {/* HOW AI HELPS */}

        <div
          style={{
            background:
              'linear-gradient(145deg, #FFFFFF, #F8FAFC)',
            border:
              `1px solid ${COLORS.border}`,
            borderRadius: 19,
            padding: 19,
            boxShadow:
              '0 8px 28px rgba(15,23,42,.04)'
          }}
        >
          <h2
            style={{
              margin: 0,
              color: COLORS.navy,
              fontSize: '.98rem',
              fontWeight: 850
            }}
          >
            What the AI looks for
          </h2>

          <p
            style={{
              margin:
                '5px 0 14px',
              color: COLORS.subtle,
              fontSize: '.66rem',
              lineHeight: 1.5
            }}
          >
            The model does not simply look for one dangerous
            word. It evaluates combinations of safety signals.
          </p>

          {[
            [
              'Hazard',
              'What can physically harm the worker?',
              COLORS.red
            ],
            [
              'Activity',
              'What work is being performed?',
              COLORS.blue
            ],
            [
              'Unsafe Act',
              'What unsafe behavior occurred?',
              COLORS.orange
            ],
            [
              'Barrier Failure',
              'Which protection was missing or bypassed?',
              COLORS.purple
            ],
            [
              'Severity',
              'Could the event cause serious injury or death?',
              COLORS.red
            ]
          ].map(
            ([title, description, color], index) => (
              <div
                key={title}
                style={{
                  display: 'flex',
                  gap: 10,
                  marginBottom:
                    index === 4
                      ? 0
                      : 10
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems:
                      'center',
                    borderRadius: 8,
                    background:
                      `${color}12`,
                    color,
                    fontSize: '.61rem',
                    fontWeight: 900
                  }}
                >
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    '0'
                  )}
                </div>

                <div>
                  <div
                    style={{
                      color:
                        COLORS.text,
                      fontSize:
                        '.68rem',
                      fontWeight:
                        800
                    }}
                  >
                    {title}
                  </div>

                  <div
                    style={{
                      marginTop: 2,
                      color:
                        COLORS.muted,
                      fontSize:
                        '.61rem',
                      lineHeight:
                        1.4
                    }}
                  >
                    {description}
                  </div>
                </div>
              </div>
            )
          )}

          <div
            style={{
              marginTop: 15,
              padding: 11,
              borderRadius: 10,
              background:
                COLORS.blueSoft,
              border:
                `1px solid ${COLORS.blueBorder}`,
              color:
                '#1D4ED8',
              fontSize: '.62rem',
              lineHeight: 1.5
            }}
          >
            <strong>
              Important:
            </strong>{' '}
            AI output is a decision-support signal. HSE
            professionals remain responsible for verifying the
            actual site conditions and controls.
          </div>
        </div>
      </section>

      {/* =====================================================
          HISTORICAL OSHA EVIDENCE
      ===================================================== */}

      <section
        style={{
          background: COLORS.surface,
          border:
            `1px solid ${COLORS.border}`,
          borderRadius: 19,
          padding: 19,
          boxShadow:
            '0 8px 28px rgba(15,23,42,.04)',
          marginBottom: 14
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'flex-start',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 13
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                color: COLORS.navy,
                fontSize: '.98rem',
                fontWeight: 850
              }}
            >
              Historical OSHA Evidence
            </h2>

            <p
              style={{
                margin:
                  '5px 0 0',
                color: COLORS.subtle,
                fontSize: '.66rem',
                lineHeight: 1.5
              }}
            >
              Past incident records provide the evidence base
              behind the model's safety intelligence.
            </p>
          </div>

          <span
            style={{
              padding:
                '5px 8px',
              borderRadius: 999,
              background:
                COLORS.purpleSoft,
              border:
                `1px solid ${COLORS.purpleBorder}`,
              color:
                COLORS.purple,
              fontSize: '.57rem',
              fontWeight: 850
            }}
          >
            {formatNumber(
              totalRecords
            )}{' '}
            TRAINING RECORDS
          </span>
        </div>

        {samplesLoading ? (
          <div
            style={{
              padding: 25,
              textAlign:
                'center',
              color:
                COLORS.subtle,
              fontSize:
                '.68rem'
            }}
          >
            Loading historical OSHA examples...
          </div>
        ) : oshaSamples.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 9
            }}
          >
            {oshaSamples
              .slice(0, 6)
              .map(
                (
                  sample,
                  index
                ) => (
                  <HistoricalEvidence
                    key={
                      sample?.id ||
                      sample?._id ||
                      index
                    }
                    sample={
                      sample
                    }
                  />
                )
              )}
          </div>
        ) : (
          <div
            style={{
              padding: 17,
              borderRadius: 12,
              background:
                COLORS.background,
              border:
                `1px dashed ${COLORS.borderStrong}`,
              color:
                COLORS.muted,
              fontSize: '.66rem',
              lineHeight: 1.55
            }}
          >
            Historical examples are not currently available
            from the backend. The live model metrics are still
            shown below.
          </div>
        )}
      </section>

      {/* =====================================================
          MODEL EVIDENCE SUMMARY
      ===================================================== */}

      <section
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 10,
          marginBottom: 14
        }}
      >
        <EvidenceMetric
          label="Accuracy"
          value={`${(
            accuracy * 100
          ).toFixed(1)}%`}
          explanation="Overall classification correctness"
          color={COLORS.green}
        />

        <EvidenceMetric
          label="SIF Recall"
          value={`${(
            recall * 100
          ).toFixed(1)}%`}
          explanation="Share of severe cases successfully identified"
          color={COLORS.red}
        />

        <EvidenceMetric
          label="F1 Score"
          value={f1.toFixed(3)}
          explanation="Balance between precision and recall"
          color={COLORS.purple}
        />

        <EvidenceMetric
          label="ROC-AUC"
          value={rocAuc.toFixed(3)}
          explanation="Ability to separate risk classes"
          color={COLORS.blue}
        />
      </section>

      {/* =====================================================
          TECHNICAL DETAILS
      ===================================================== */}

      <section
        style={{
          background: COLORS.surface,
          border:
            `1px solid ${COLORS.border}`,
          borderRadius: 17,
          overflow: 'hidden',
          boxShadow:
            '0 6px 22px rgba(15,23,42,.03)'
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowTechnical(
              value => !value
            )
          }
          style={{
            width: '100%',
            padding:
              '14px 16px',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems:
              'center',
            gap: 10,
            border: 'none',
            background:
              COLORS.surface,
            color:
              COLORS.text,
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div>
            <div
              style={{
                color:
                  COLORS.text,
                fontSize:
                  '.73rem',
                fontWeight:
                  850
              }}
            >
              Technical AI Details
            </div>

            <div
              style={{
                marginTop: 3,
                color:
                  COLORS.subtle,
                fontSize:
                  '.61rem'
              }}
            >
              Model evaluation, learned risk indicators and
              confusion matrix
            </div>
          </div>

          <span
            style={{
              color:
                COLORS.blue,
              fontSize:
                '.8rem',
              fontWeight:
                900
            }}
          >
            {showTechnical
              ? '−'
              : '+'}
          </span>
        </button>

        {showTechnical && (
          <TechnicalDetails
            metrics={
              metrics
            }
          />
        )}
      </section>

      {/* =====================================================
          HAZARD DETAIL MODAL
      ===================================================== */}

      {selectedHazard && (
        <HazardModal
          hazard={
            selectedHazard
          }
          onClose={() =>
            setSelectedHazard(
              null
            )
          }
        />
      )}
    </div>
  );
}

/* =========================================================
   QUESTION ANSWER
   ========================================================= */

function QuestionAnswer({
  question,
  hazard,
  onClose
}) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: 15,
        borderRadius: 14,
        background:
          hazard
            ? COLORS.blueSoft
            : COLORS.background,
        border:
          `1px solid ${
            hazard
              ? COLORS.blueBorder
              : COLORS.border
          }`
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          gap: 10
        }}
      >
        <div
          style={{
            color:
              COLORS.subtle,
            fontSize:
              '.58rem',
            fontWeight:
              800,
            textTransform:
              'uppercase'
          }}
        >
          Safety explanation
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background:
              'transparent',
            color:
              COLORS.subtle,
            cursor:
              'pointer',
            fontSize:
              '.9rem'
          }}
        >
          ×
        </button>
      </div>

      <div
        style={{
          marginTop: 6,
          color:
            COLORS.text,
          fontSize:
            '.7rem',
          fontWeight:
            750
        }}
      >
        {question}
      </div>

      {hazard ? (
        <>
          <div
            style={{
              marginTop: 11,
              display: 'flex',
              alignItems:
                'center',
              gap: 7
            }}
          >
            <span
              style={{
                color:
                  COLORS.red,
                fontSize:
                  '.78rem',
                fontWeight:
                  900
              }}
            >
              {hazard.name}
            </span>

            <span
              style={{
                padding:
                  '4px 7px',
                borderRadius:
                  999,
                background:
                  getRiskStyle(
                    hazard.severity
                  ).soft,
                border:
                  `1px solid ${
                    getRiskStyle(
                      hazard.severity
                    ).border
                  }`,
                color:
                  getRiskStyle(
                    hazard.severity
                  ).color,
                fontSize:
                  '.55rem',
                fontWeight:
                  850
              }}
            >
              {hazard.severity}
            </span>
          </div>

          <p
            style={{
              margin:
                '8px 0 0',
              color:
                COLORS.muted,
              fontSize:
                '.67rem',
              lineHeight:
                1.55
            }}
          >
            {hazard.description}
          </p>

          <div
            style={{
              marginTop: 10,
              color:
                COLORS.text,
              fontSize:
                '.65rem',
              lineHeight:
                1.5
            }}
          >
            <strong>
              Why it matters:
            </strong>{' '}
            {hazard.whyDangerous}
          </div>
        </>
      ) : (
        <div
          style={{
            marginTop: 10,
            color:
              COLORS.muted,
            fontSize:
              '.67rem',
            lineHeight:
              1.55
          }}
        >
          I could not confidently match the question to one
          of the built-in hazard explanations. Try searching
          for a specific hazard such as{' '}
          <strong>
            fall, electrical, confined space, machinery,
            lifting or chemical exposure
          </strong>
          .
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SCENARIO BUTTON
   ========================================================= */

function ScenarioButton({
  text,
  onClick
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding:
          '6px 8px',
        borderRadius: 8,
        border:
          `1px solid ${COLORS.border}`,
        background:
          COLORS.background,
        color:
          COLORS.muted,
        fontSize:
          '.59rem',
        fontWeight:
          750,
        cursor:
          'pointer'
      }}
    >
      {text}
    </button>
  );
}

/* =========================================================
   PREDICTION RESULT
   ========================================================= */

function PredictionResult({
  prediction,
  sif,
  score
}) {
  const risk = sif
    ? {
        color:
          COLORS.red,
        soft:
          COLORS.redSoft,
        border:
          COLORS.redBorder
      }
    : {
        color:
          COLORS.green,
        soft:
          COLORS.greenSoft,
        border:
          COLORS.greenBorder
      };

  const classification =
    prediction?.classification ||
    {};

  const tokens =
    classification.risk_tokens ||
    [];

  return (
    <div
      style={{
        marginTop: 15,
        padding: 14,
        borderRadius: 14,
        background:
          COLORS.background,
        border:
          `1px solid ${COLORS.border}`
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent:
            'space-between',
          alignItems:
            'center',
          gap: 10,
          flexWrap:
            'wrap'
        }}
      >
        <div>
          <div
            style={{
              color:
                COLORS.subtle,
              fontSize:
                '.56rem',
              fontWeight:
                850,
              textTransform:
                'uppercase',
              letterSpacing:
                '.04em'
            }}
          >
            AI Assessment
          </div>

          <div
            style={{
              marginTop: 5,
              color:
                risk.color,
              fontSize:
                '.82rem',
              fontWeight:
                900
            }}
          >
            {sif
              ? 'SIF potential detected'
              : 'No SIF potential detected'}
          </div>
        </div>

        <div
          style={{
            padding:
              '7px 9px',
            borderRadius:
              9,
            background:
              risk.soft,
            border:
              `1px solid ${risk.border}`,
            color:
              risk.color,
            fontSize:
              '.67rem',
            fontWeight:
              850
          }}
        >
          {probability(
            score
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          height: 7,
          background:
            '#E2E8F0',
          borderRadius:
            999,
          overflow:
            'hidden'
        }}
      >
        <div
          style={{
            width: `${Math.min(
              100,
              Math.max(
                0,
                score <= 1
                  ? score * 100
                  : score
              )
            )}%`,
            height: '100%',
            background:
              risk.color,
            borderRadius:
              999
          }}
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 7,
          marginTop: 11
        }}
      >
        <ResultField
          label="Predicted injury"
          value={
            classification.predicted_nature ||
            'Not identified'
          }
        />

        <ResultField
          label="Model score"
          value={probability(
            score
          )}
        />

        <ResultField
          label="Risk signals"
          value={`${tokens.length} detected`}
        />
      </div>

      {tokens.length >
        0 && (
        <div
          style={{
            display:
              'flex',
            flexWrap:
              'wrap',
            gap: 5,
            marginTop:
              10
          }}
        >
          {tokens
            .slice(
              0,
              10
            )
            .map(
              (
                token,
                index
              ) => (
                <span
                  key={`${token.word}-${index}`}
                  style={{
                    padding:
                      '4px 7px',
                    borderRadius:
                      999,
                    background:
                      COLORS.redSoft,
                    border:
                      `1px solid ${COLORS.redBorder}`,
                    color:
                      COLORS.red,
                    fontSize:
                      '.58rem',
                    fontWeight:
                      750
                  }}
                >
                  {token.word}
                </span>
              )
            )}
        </div>
      )}
    </div>
  );
}

function ResultField({
  label,
  value
}) {
  return (
    <div
      style={{
        padding:
          '8px 9px',
        borderRadius:
          9,
        background:
          COLORS.surface,
        border:
          `1px solid ${COLORS.border}`
      }}
    >
      <div
        style={{
          color:
            COLORS.subtle,
          fontSize:
            '.53rem',
          fontWeight:
            850,
          textTransform:
            'uppercase'
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            3,
          color:
            COLORS.text,
          fontSize:
            '.61rem',
          fontWeight:
            750
        }}
      >
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   HISTORICAL EVIDENCE
   ========================================================= */

function HistoricalEvidence({
  sample
}) {
  const text =
    getSampleText(
      sample
    );

  const sif = Boolean(
    sample?.sif_potential ||
      sample?.classification
        ?.sif_potential
  );

  const risk =
    getRiskStyle(
      sif
        ? 'CRITICAL'
        : 'LOW'
    );

  return (
    <div
      style={{
        padding:
          13,
        borderRadius:
          13,
        background:
          COLORS.background,
        border:
          `1px solid ${COLORS.border}`
      }}
    >
      <div
        style={{
          display:
            'flex',
          justifyContent:
            'space-between',
          gap: 8
        }}
      >
        <span
          style={{
            color:
              COLORS.subtle,
            fontSize:
              '.55rem',
            fontWeight:
              800,
            textTransform:
              'uppercase'
          }}
        >
          Historical record
        </span>

        <span
          style={{
            padding:
              '3px 6px',
            borderRadius:
              999,
            background:
              risk.soft,
            border:
              `1px solid ${risk.border}`,
            color:
              risk.color,
            fontSize:
              '.51rem',
            fontWeight:
              850
          }}
        >
          {sif
            ? 'SIF'
            : 'NON-SIF'}
        </span>
      </div>

      <div
        style={{
          marginTop:
            8,
          color:
            COLORS.text,
          fontSize:
            '.66rem',
          lineHeight:
            1.5
        }}
      >
        {text ||
          'Historical OSHA record available from the backend.'}
      </div>

      {(sample?.industry ||
        sample?.location ||
        sample?.event_date) && (
        <div
          style={{
            display:
              'flex',
            gap: 5,
            flexWrap:
              'wrap',
            marginTop:
              9
          }}
        >
          {sample?.industry && (
            <MetaTag
              value={
                sample.industry
              }
            />
          )}

          {sample?.location && (
            <MetaTag
              value={
                sample.location
              }
            />
          )}

          {sample?.event_date && (
            <MetaTag
              value={
                sample.event_date
              }
            />
          )}
        </div>
      )}
    </div>
  );
}

function MetaTag({
  value
}) {
  return (
    <span
      style={{
        padding:
          '4px 6px',
        borderRadius:
          7,
        background:
          COLORS.surface,
        border:
          `1px solid ${COLORS.border}`,
        color:
          COLORS.muted,
        fontSize:
          '.53rem',
        fontWeight:
          700
      }}
    >
      {value}
    </span>
  );
}

/* =========================================================
   EVIDENCE METRIC
   ========================================================= */

function EvidenceMetric({
  label,
  value,
  explanation,
  color
}) {
  return (
    <div
      style={{
        padding:
          '14px 15px',
        background:
          COLORS.surface,
        border:
          `1px solid ${COLORS.border}`,
        borderRadius:
          14,
        boxShadow:
          '0 5px 18px rgba(15,23,42,.03)'
      }}
    >
      <div
        style={{
          color:
            COLORS.subtle,
          fontSize:
            '.57rem',
          fontWeight:
            850,
          textTransform:
            'uppercase',
          letterSpacing:
            '.04em'
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            7,
          color,
          fontSize:
            '1.35rem',
          lineHeight:
            1,
          fontWeight:
            900
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop:
            6,
          color:
            COLORS.subtle,
          fontSize:
            '.59rem',
          lineHeight:
            1.4
        }}
      >
        {explanation}
      </div>
    </div>
  );
}

/* =========================================================
   HAZARD MODAL
   ========================================================= */

function HazardModal({
  hazard,
  onClose
}) {
  const risk =
    getRiskStyle(
      hazard.severity
    );

  return (
    <div
      role="dialog"
      aria-modal="true"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
      style={{
        position:
          'fixed',
        inset: 0,
        zIndex: 3000,
        display:
          'flex',
        alignItems:
          'center',
        justifyContent:
          'center',
        padding: 18,
        background:
          'rgba(15,23,42,.42)',
        backdropFilter:
          'blur(7px)'
      }}
    >
      <div
        style={{
          width:
            '100%',
          maxWidth:
            680,
          maxHeight:
            'calc(100vh - 36px)',
          overflowY:
            'auto',
          background:
            COLORS.surface,
          border:
            `1px solid ${COLORS.border}`,
          borderRadius:
            21,
          boxShadow:
            '0 30px 80px rgba(15,23,42,.22)'
        }}
      >
        <div
          style={{
            padding:
              '20px 21px 16px',
            borderBottom:
              `1px solid ${COLORS.border}`,
            display:
              'flex',
            justifyContent:
              'space-between',
            gap: 12
          }}
        >
          <div>
            <span
              style={{
                display:
                  'inline-flex',
                padding:
                  '5px 8px',
                borderRadius:
                  999,
                background:
                  risk.soft,
                border:
                  `1px solid ${risk.border}`,
                color:
                  risk.color,
                fontSize:
                  '.57rem',
                fontWeight:
                  850
              }}
            >
              {hazard.severity} RISK
            </span>

            <h2
              style={{
                margin:
                  '8px 0 0',
                color:
                  COLORS.navy,
                fontSize:
                  '1.18rem',
                fontWeight:
                  900,
                letterSpacing:
                  '-.025em'
              }}
            >
              {hazard.name}
            </h2>

            <div
              style={{
                marginTop:
                  4,
                color:
                  COLORS.blue,
                fontSize:
                  '.63rem',
                fontWeight:
                  750
              }}
            >
              {hazard.category}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width:
                35,
              height:
                35,
              border:
                `1px solid ${COLORS.border}`,
              borderRadius:
                9,
              background:
                COLORS.background,
              color:
                COLORS.muted,
              cursor:
                'pointer',
              fontSize:
                '1rem'
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding:
              21
          }}
        >
          <InfoBlock
            title="What is it?"
            text={
              hazard.description
            }
          />

          <InfoBlock
            title="Why is it dangerous?"
            text={
              hazard.whyDangerous
            }
          />

          <ListBlock
            title="Possible consequences"
            items={
              hazard.consequences
            }
            color={
              COLORS.red
            }
            background={
              COLORS.redSoft
          }
          />

          <ListBlock
            title="Recommended controls"
            items={
              hazard.controls
            }
            color={
              COLORS.green
            }
            background={
              COLORS.greenSoft
            }
          />

          <div
            style={{
              marginTop:
                15,
              padding:
                12,
              borderRadius:
                11,
              background:
                COLORS.blueSoft,
              border:
                `1px solid ${COLORS.blueBorder}`,
              color:
                '#1D4ED8',
              fontSize:
                '.63rem',
              lineHeight:
                1.5
            }}
          >
            <strong>
              SIF-Sense perspective:
            </strong>{' '}
            A hazard becomes especially important when
            high-energy exposure is combined with failed or
            missing protective barriers.
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({
  title,
  text
}) {
  return (
    <div
      style={{
        marginBottom:
          14
      }}
    >
      <div
        style={{
          marginBottom:
            5,
          color:
            COLORS.text,
          fontSize:
            '.7rem',
          fontWeight:
            850
        }}
      >
        {title}
      </div>

      <div
        style={{
          color:
            COLORS.muted,
          fontSize:
            '.68rem',
          lineHeight:
            1.6
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ListBlock({
  title,
  items,
  color,
  background
}) {
  return (
    <div
      style={{
        marginBottom:
          14
      }}
    >
      <div
        style={{
          marginBottom:
            7,
          color:
            COLORS.text,
          fontSize:
            '.7rem',
          fontWeight:
            850
        }}
      >
        {title}
      </div>

      <div
        style={{
          display:
            'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(230px, 1fr))',
          gap:
            6
        }}
      >
        {items.map(
          (
            item,
            index
          ) => (
            <div
              key={
                `${item}-${index}`
              }
              style={{
                padding:
                  '8px 9px',
                borderRadius:
                  9,
                background,
                border:
                  `1px solid ${color}25`,
                color,
                fontSize:
                  '.62rem',
                lineHeight:
                  1.4,
                fontWeight:
                  700
              }}
            >
              {index +
                1}
              . {item}
            </div>
          )
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TECHNICAL DETAILS
   ========================================================= */

function TechnicalDetails({
  metrics
}) {
  const cm =
    metrics?.confusion_matrix ||
    {};

  const terms =
    metrics?.top_sif_risk_terms ||
    [];

  return (
    <div
      style={{
        padding:
          '0 16px 17px'
      }}
    >
      <div
        style={{
          display:
            'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(150px, 1fr))',
          gap:
            7
        }}
      >
        <TechnicalCell
          label="True negatives"
          value={
            cm.true_negative
          }
        />

        <TechnicalCell
          label="False positives"
          value={
            cm.false_positive
          }
        />

        <TechnicalCell
          label="False negatives"
          value={
            cm.false_negative
          }
        />

        <TechnicalCell
          label="True positives"
          value={
            cm.true_positive
          }
        />
      </div>

      <div
        style={{
          marginTop:
            12,
          color:
            COLORS.subtle,
          fontSize:
            '.59rem',
          fontWeight:
            850,
          textTransform:
            'uppercase',
          letterSpacing:
            '.04em'
        }}
      >
        Learned SIF risk terms
      </div>

      <div
        style={{
          display:
            'flex',
          flexWrap:
            'wrap',
          gap:
            5,
          marginTop:
            7
        }}
      >
        {terms
          .slice(
            0,
            30
          )
          .map(
            (
              term,
              index
            ) => (
              <span
                key={
                  `${term.term}-${index}`
                }
                style={{
                  padding:
                    '4px 7px',
                  borderRadius:
                    999,
                  background:
                    COLORS.background,
                  border:
                    `1px solid ${COLORS.border}`,
                  color:
                    COLORS.text,
                  fontSize:
                    '.57rem',
                  fontWeight:
                    700
                }}
              >
                {term.term ||
                  term.word ||
                  'signal'}
              </span>
            )
          )}
      </div>
    </div>
  );
}

function TechnicalCell({
  label,
  value
}) {
  return (
    <div
      style={{
        padding:
          9,
        borderRadius:
          9,
        background:
          COLORS.background,
        border:
          `1px solid ${COLORS.border}`
      }}
    >
      <div
        style={{
          color:
            COLORS.subtle,
          fontSize:
            '.53rem',
          fontWeight:
            800
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop:
            4,
          color:
            COLORS.text,
          fontSize:
            '.82rem',
          fontWeight:
            900
        }}
      >
        {formatNumber(
          value
        )}
      </div>
    </div>
  );
}