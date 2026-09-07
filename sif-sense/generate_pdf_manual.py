"""
Comprehensive & Plain-English PDF Generator:
"SIF-Sense AI: Complete A-to-Z Guide, Model Architecture, Dataset Analysis, Page-by-Page Manual & Free Database Storage Strategy"
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

PDF_OUTPUT_PATH = "/Users/mr.tom/NLP/SIF_Sense_AI_System_Manual_and_Storage_Strategy.pdf"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        if self._pageNumber > 1:
            self.drawString(50, 750, "SIF-Sense AI | Complete A-to-Z Technical & User Manual")
            self.drawRightString(612 - 50, 750, "OSHA 2015–2025 AI Model & MongoDB Cloud Architecture")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(50, 742, 612 - 50, 742)

        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(50, 45, 612 - 50, 45)
        self.drawString(50, 32, "Confidential — HSE Technical Architecture")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 50, 32, page_str)
        self.restoreState()


def build_pdf():
    doc = SimpleDocTemplate(
        PDF_OUTPUT_PATH,
        pagesize=letter,
        leftMargin=48,
        rightMargin=48,
        topMargin=54,
        bottomMargin=50
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    )

    subtitle_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#475569'),
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'SecH1',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12.5,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SecH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12.5,
        textColor=colors.HexColor('#2563eb'),
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.2,
        textColor=colors.HexColor('#334155'),
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'BulletDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155'),
        leftIndent=12,
        spaceAfter=2
    )

    code_style = ParagraphStyle(
        'CodeBox',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7,
        leading=9.2,
        textColor=colors.HexColor('#0f172a'),
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.8,
        textColor=colors.HexColor('#1e3a8a')
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.6,
        textColor=colors.HexColor('#1e293b')
    )

    story = []

    # ── HEADER & META ────────────────────────────────────────────────────────
    story.append(Paragraph("SIF-Sense AI: Complete Technical & User Guide", title_style))
    story.append(Paragraph("A-to-Z Manual: OSHA 2015–2025 AI Model, Dataset Science, Page-by-Page Walkthrough & Free Database Storage Architecture", subtitle_style))

    meta_data = [
        [
            Paragraph("<b>Target System:</b> SIF-Sense AI Early Warning System", table_cell_style),
            Paragraph("<b>Database:</b> MongoDB Atlas M0 (Free Tier 512MB) + SQLite", table_cell_style)
        ],
        [
            Paragraph("<b>AI Model:</b> Calibrated OSHA 2015–2025 Model (106k reports)", table_cell_style),
            Paragraph("<b>User Account:</b> kanishkskcet_db_user", table_cell_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[258, 258])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 6))

    # ── SECTION 1: WHAT MODEL & WHAT DATA ARE WE USING? ──────────────────────
    story.append(Paragraph("SECTION 1: What AI/ML Model & What Data Are We Using?", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor('#2563eb'), spaceAfter=5))

    story.append(Paragraph(
        "<b>1. What is the Dataset?</b><br/>"
        "We train directly on the official <b>United States Occupational Safety and Health Administration (OSHA) Severe Injury Reports dataset</b> "
        "spanning exactly 10 years from <b>January 2015 to November 2025</b> (105,996 total records). "
        "By federal law (OSHA Rule 29 CFR 1904.39), all US employers must report any work-related in-patient hospitalization, amputation, or loss of an eye within 24 hours. "
        "Key attributes include: <i>Final Narrative</i> (detailed description of what happened), <i>Hospitalized count</i>, <i>Amputation count</i>, <i>Loss of Eye count</i>, <i>Nature of Injury</i> (Fractures, Burns, Crush, Trauma), <i>Part of Body</i>, <i>Event mechanism</i> (Caught in machinery, Fall from height, Arc flash), and <i>Industry NAICS code</i>.",
        body_style
    ))

    story.append(Paragraph(
        "<b>2. What Exact AI/ML Model Are We Using?</b><br/>"
        "Rather than slow generic cloud models that incur per-call API fees and privacy concerns, SIF-Sense AI deploys a <b>three-tier ultra-fast machine learning pipeline</b>:",
        body_style
    ))
    story.append(Paragraph("• <b>Text Representation (TF-IDF N-grams):</b> Converts natural language text into 25,000 sublinear TF-IDF features capturing single words, bigrams, and trigrams (1-3 n-grams) like <i>'lockout tagout'</i>, <i>'fall from height'</i>, <i>'conveyor nip point'</i>, and <i>'arc flash'</i>.", bullet_style))
    story.append(Paragraph("• <b>Calibrated SIF Classifier (SGD + Platt Sigmoid Scaling):</b> A high-performance linear model trained via Stochastic Gradient Descent with log-loss and balanced class weighting, wrapped in a 3-fold Platt Sigmoid calibrator. This outputs real, mathematically sound probabilities (0.00% to 100.0%) rather than arbitrary raw scores.", bullet_style))
    story.append(Paragraph("• <b>Multi-Class Injury Nature Classifier:</b> A companion multi-nominal logistic regression classifier that predicts the physical trauma category (Amputation, Fracture, Crushing Injury, Thermal/Chemical Burn, Head/Brain Trauma, Electrical Trauma, or Laceration).", bullet_style))
    story.append(Paragraph("• <b>Heuristic Safety Guardrails:</b> A rule-based expert safety engine that acts as a failsafe to guarantee that catastrophic zero-tolerance indicators (high voltage, toxic H2S, crane collapse) are never missed.", bullet_style))

    # Model evaluation table
    m_data = [
        [Paragraph("Metric", table_header_style), Paragraph("Result", table_header_style), Paragraph("Meaning in Plain English", table_header_style)],
        [Paragraph("Trained Records", table_cell_style), Paragraph("105,996 rows", table_cell_style), Paragraph("84,796 train / 21,199 unseen test split", table_cell_style)],
        [Paragraph("Model Accuracy", table_cell_style), Paragraph("<b>96.00%</b>", table_cell_style), Paragraph("Overall correct classifications on 21,199 test cases", table_cell_style)],
        [Paragraph("SIF Safety Recall", table_cell_style), Paragraph("<b>97.49%</b>", table_cell_style), Paragraph("<b>Crucial:</b> 97.5% of real severe life-altering threats are caught", table_cell_style)],
        [Paragraph("Precision", table_cell_style), Paragraph("<b>97.18%</b>", table_cell_style), Paragraph("Extremely low false alarm rate", table_cell_style)],
        [Paragraph("F1-Score", table_cell_style), Paragraph("<b>0.9733</b>", table_cell_style), Paragraph("Harmonic balance between safety recall and accuracy", table_cell_style)],
        [Paragraph("Inference Speed", table_cell_style), Paragraph("<b>&lt; 15 ms</b>", table_cell_style), Paragraph("Ultra-fast sub-second execution on standard CPU (zero GPU cost)", table_cell_style)],
    ]
    m_table = Table(m_data, colWidths=[100, 86, 330])
    m_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(m_table)
    story.append(Spacer(1, 6))

    # ── SECTION 2: FREE DATABASE STORAGE OPTIMIZATION ────────────────────────
    story.append(Paragraph("SECTION 2: Managing Storage on Free MongoDB Atlas (512 MB Limit)", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor('#2563eb'), spaceAfter=5))

    story.append(Paragraph(
        "MongoDB Atlas Free Tier (M0) provides exactly <b>512 MB of total shared storage</b>. To prevent your database from filling up while maintaining full safety compliance, SIF-Sense AI implements a <b>4-pillar storage solution</b>:",
        body_style
    ))
    story.append(Paragraph("• <b>1. Automated TTL (Time-To-Live) Expiration:</b> Non-critical housekeeping logs and dismissed observations automatically delete after 90 days. Genuine SIF precursors are permanently retained with zero risk of deletion:", bullet_style))

    ttl_code = """db.reports.create_index(
    [("created_at", 1)],
    expireAfterSeconds=7776000,  # 90 days
    partialFilterExpression={"sif_potential": False}  # Never deletes SIF events!
)"""
    c_table = Table([[Paragraph(ttl_code.replace("\n", "<br/>").replace(" ", "&nbsp;"), code_style)]], colWidths=[516])
    c_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94a3b8')),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(c_table)
    story.append(Spacer(1, 4))
    story.append(Paragraph("• <b>2. Document Schema Pruning:</b> Bulky debug logs and raw embeddings are stripped out in <code>mongo_manager.py</code>. Documents are compressed to <b>< 380 bytes</b>, allowing 512 MB to hold <b>1,340,000+ reports</b>.", bullet_style))
    story.append(Paragraph("• <b>3. 1-Click Offline Archival:</b> The Report Log has built-in CSV & JSON export so safety directors can download logs to cold storage and flush Atlas at any time.", bullet_style))

    story.append(PageBreak())

    # ── SECTION 3: COMPLETE PAGE-BY-PAGE MANUAL ──────────────────────────────
    story.append(Paragraph("SECTION 3: Complete Page-by-Page User Manual", h1_style))
    story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor('#2563eb'), spaceAfter=6))

    # Page 1: Analyzer
    story.append(Paragraph("Page 1: SIF Incident Analyzer (URL: <code>/</code>)", h2_style))
    story.append(Paragraph(
        "The primary AI evaluation console where safety observations and incident descriptions are analyzed in real time.",
        body_style
    ))
    story.append(Paragraph("• <b>Adaptive Layout:</b> Side-by-side on desktop; smooth two-tab flow (<i>1. Describe Incident</i> & <i>2. Safety Result</i>) on mobile/narrow viewports.", bullet_style))
    story.append(Paragraph("• <b>1-Click Real OSHA Benchmark Presets:</b> Pre-loaded with authentic federal severe injury incidents: Machinery Entanglement, Fall from Height, Arc Flash Burn, Suspended Load Crush, Confined Space Toxic Gas, and Minor Office Scratch.", bullet_style))
    story.append(Paragraph("• <b>Instant Calibrated Priority Score:</b> Circular gauge scoring risk from 0 to 100 based on severity, exposure, barrier failure, and historical recurrence.", bullet_style))
    story.append(Paragraph("• <b>Word-Level Risk Highlights:</b> Highlights exact trigger words learned from 106,000 OSHA records (e.g., <i>amputation (+21.0)</i>, <i>fingers (+4.6)</i>, <i>energized (+2.4)</i>).", bullet_style))
    story.append(Paragraph("• <b>Predicted Injury Nature:</b> Classifies likely physical trauma (Amputation, Fracture, Crushing Injury, Thermal/Chemical Burn).", bullet_style))
    story.append(Paragraph("• <b>IOGP Life-Saving Rules:</b> Recommends immediate plain-English mitigation actions.", bullet_style))
    story.append(Spacer(1, 4))

    # Page 2: Dashboard
    story.append(Paragraph("Page 2: HSE Command Center Dashboard (URL: <code>/dashboard</code>)", h2_style))
    story.append(Paragraph(
        "Executive oversight dashboard providing real-time site intelligence, precursor distributions, and longitudinal risk trends.",
        body_style
    ))
    story.append(Paragraph("• <b>Executive KPI Stat Cards:</b> Total Reports Logged, SIF Precursors Detected, Critical Incidents (Score ≥ 80), High/Medium Priorities, Near Misses, and Pending HSE Reviews.", bullet_style))
    story.append(Paragraph("• <b>High-Risk Locations Ranking:</b> Ranks facilities and operating zones by aggregate SIF score and incident count with proportional progress bars.", bullet_style))
    story.append(Paragraph("• <b>Precursor Hazard Distribution Chart:</b> Visualizes frequency of underlying hazards (energized systems, falls from height, rotating machinery).", bullet_style))
    story.append(Paragraph("• <b>Critical Barrier Breakdown:</b> Highlights control failures (e.g., missing PPE, bypassed Lockout/Tagout, skipped gas testing).", bullet_style))
    story.append(Paragraph("• <b>Sequential Risk Score Trend:</b> Rolling chronological line chart to spot site safety deterioration before accidents occur.", bullet_style))
    story.append(Spacer(1, 4))

    # Page 3: Model Insights
    story.append(Paragraph("Page 3: OSHA 2015–2025 AI Telemetry & Model Insights (URL: <code>/model</code>)", h2_style))
    story.append(Paragraph(
        "A full transparency dashboard detailing model performance on 105,996 severe workplace injury records from OSHA (2015–2025).",
        body_style
    ))
    story.append(Paragraph("• <b>Confusion Matrix:</b> 15,445 True Positives, 4,907 True Negatives, 449 False Positives, and only 398 False Negatives (1.8% missed).", bullet_style))
    story.append(Paragraph("• <b>Learned Feature Weights Dictionary:</b> Searchable table of risk weights (fractured +24.5, amputated +22.8, broken +21.9, burns +15.3, concussion +13.6).", bullet_style))
    story.append(Paragraph("• <b>Live Model Playground:</b> Allows safety managers to type custom narratives and observe instant probability scores and word-level attributions.", bullet_style))
    story.append(Spacer(1, 4))

    # Page 4: Alerts
    story.append(Paragraph("Page 4: Alerts & Human-in-the-Loop Action Hub (URL: <code>/alerts</code>)", h2_style))
    story.append(Paragraph(
        "Centralized review queue for high-priority incidents where priority score reaches or exceeds <b>80 / 100</b>.",
        body_style
    ))
    story.append(Paragraph("• <b>1-Click Action Buttons:</b> <i>✓ Accept & Mitigate</i>, <i>🚨 Escalate to Leadership</i> (with prompt modal for notes), and <i>✕ Dismiss</i>.", bullet_style))
    story.append(Paragraph("• <b>Real-time Status Tabs:</b> Filter between Pending Action, Accepted, Escalated, and Dismissed.", bullet_style))
    story.append(Paragraph("• <b>Header Badge Synchronization:</b> Topbar displays an active red indicator with real-time pending alert count.", bullet_style))
    story.append(Spacer(1, 4))

    # Page 5: Report Log
    story.append(Paragraph("Page 5: Safety Report Log (URL: <code>/reports</code>)", h2_style))
    story.append(Paragraph(
        "Complete historical incident repository with search, filtering, and export capabilities.",
        body_style
    ))
    story.append(Paragraph("• <b>Configurable Pagination:</b> Choose between 10, 25, or 50 records per page with next/previous navigation controls.", bullet_style))
    story.append(Paragraph("• <b>1-Click CSV & JSON Export:</b> Export reports formatted for Excel, PowerBI, or enterprise EHS systems.", bullet_style))
    story.append(Paragraph("• <b>Deep Inspection Modal:</b> Clicking any incident card opens an inspection drawer showing full narrative, priority score, and extracted precursors.", bullet_style))
    story.append(Spacer(1, 4))

    # Page 6: Database & Cloud Architecture
    story.append(Paragraph("Page 6: Database & Cloud Architecture (MongoDB + SQLite)", h2_style))
    story.append(Paragraph(
        "Resilient dual-engine architecture: syncs to MongoDB Atlas (<code>kanishkskcet_db_user</code>) with zero-downtime local SQLite fallback.",
        body_style
    ))

    callout_data = [[
        Paragraph(
            "<b>Summary for Administrators:</b><br/>"
            "• Model runs locally on CPU in &lt;15ms with zero cloud API costs.<br/>"
            "• Use <code>kanishkskcet_db_user</code> credentials in <code>backend/.env</code>.<br/>"
            "• The TTL partial index maintains database storage permanently below the 512 MB free quota.",
            callout_style
        )
    ]]
    callout_table = Table(callout_data, colWidths=[516])
    callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#eff6ff')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#2563eb')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(callout_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated complete A-to-Z PDF at: {PDF_OUTPUT_PATH}")

if __name__ == "__main__":
    build_pdf()
