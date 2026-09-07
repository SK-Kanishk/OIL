"""
Generates Two Comprehensive PDFs:
1. SIF_Sense_AI_Technical_Deep_Dive_and_Storage_Architecture.pdf
2. SIF_Sense_AI_Complete_User_and_Operation_Guide.pdf
Copies them to Desktop, Downloads, and Project directories.
"""

import os
import shutil
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

BASE_DIR = "/Users/mr.tom/NLP"
PDF1_PATH = os.path.join(BASE_DIR, "SIF_Sense_AI_Technical_Deep_Dive_and_Storage_Architecture.pdf")
PDF2_PATH = os.path.join(BASE_DIR, "SIF_Sense_AI_Complete_User_and_Operation_Guide.pdf")

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

        doc_title = getattr(self, "doc_title", "SIF-Sense AI Documentation")
        if self._pageNumber > 1:
            self.drawString(48, 750, doc_title)
            self.drawRightString(612 - 48, 750, "OSHA 2015–2025 AI Engine & MongoDB Architecture")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(48, 742, 612 - 48, 742)

        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(48, 44, 612 - 48, 44)
        self.drawString(48, 32, "Confidential — Industrial HSE Early Warning System")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(612 - 48, 32, page_str)
        self.restoreState()


def get_styles():
    styles = getSampleStyleSheet()
    return {
        'title': ParagraphStyle('T', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=20, leading=24, textColor=colors.HexColor('#0f172a'), spaceAfter=4),
        'sub': ParagraphStyle('S', parent=styles['Normal'], fontName='Helvetica', fontSize=9.5, leading=13.5, textColor=colors.HexColor('#475569'), spaceAfter=10),
        'h1': ParagraphStyle('H1', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=colors.HexColor('#1e293b'), spaceBefore=9, spaceAfter=4, keepWithNext=True),
        'h2': ParagraphStyle('H2', parent=styles['Heading2'], fontName='Helvetica-Bold', fontSize=9.5, leading=12.5, textColor=colors.HexColor('#2563eb'), spaceBefore=7, spaceAfter=3, keepWithNext=True),
        'body': ParagraphStyle('B', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#334155'), spaceAfter=4),
        'bullet': ParagraphStyle('BL', parent=styles['Normal'], fontName='Helvetica', fontSize=7.8, leading=10.8, textColor=colors.HexColor('#334155'), leftIndent=12, spaceAfter=2),
        'code': ParagraphStyle('C', parent=styles['Normal'], fontName='Courier', fontSize=6.8, leading=8.8, textColor=colors.HexColor('#0f172a')),
        'callout': ParagraphStyle('CL', parent=styles['Normal'], fontName='Helvetica', fontSize=7.6, leading=10.5, textColor=colors.HexColor('#1e3a8a')),
        'th': ParagraphStyle('TH', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.6, leading=9.6, textColor=colors.white),
        'td': ParagraphStyle('TD', parent=styles['Normal'], fontName='Helvetica', fontSize=7.2, leading=9.2, textColor=colors.HexColor('#1e293b')),
    }


# ══════════════════════════════════════════════════════════════════════════════
# 1. BUILD TECHNICAL DEEP DIVE & STORAGE SPECIFICATION PDF
# ══════════════════════════════════════════════════════════════════════════════
def build_tech_pdf():
    doc = SimpleDocTemplate(PDF1_PATH, pagesize=letter, leftMargin=48, rightMargin=48, topMargin=52, bottomMargin=48)
    st = get_styles()
    story = []

    # Title & Metadata
    story.append(Paragraph("SIF-Sense AI: Technical Architecture & Storage Specification", st['title']))
    story.append(Paragraph("A-to-Z Technical Deep Dive: OSHA 2015–2025 ML Model, Dataset Science, Full Tech Stack & Free MongoDB Optimization", st['sub']))

    meta = [
        [Paragraph("<b>Primary Backend:</b> Python FastAPI (Asynchronous REST)", st['td']), Paragraph("<b>Frontend:</b> React 19 + Vite + Recharts + ReactFlow", st['td'])],
        [Paragraph("<b>ML Framework:</b> Scikit-Learn + PyTorch (Calibrated SGD)", st['td']), Paragraph("<b>Database:</b> MongoDB Atlas M0 (512MB) + SQLite Fallback", st['td'])],
        [Paragraph("<b>Dataset:</b> 105,996 federal OSHA severe injury records", st['td']), Paragraph("<b>Configured DB User:</b> kanishkskcet_db_user", st['td'])]
    ]
    t_meta = Table(meta, colWidths=[258, 258])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 3), ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6), ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 6))

    # SECTION 1: THE DATASET SCIENCE
    story.append(Paragraph("1. The Dataset Science: OSHA Severe Injury Archive (2015–2025)", st['h1']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#2563eb'), spaceAfter=4))
    story.append(Paragraph(
        "SIF-Sense AI is trained directly on the official <b>United States Occupational Safety and Health Administration (OSHA) Severe Injury Reports dataset</b>. "
        "Under federal reporting regulation 29 CFR 1904.39, all covered industrial employers in the United States must report any work-related amputation, in-patient hospitalization, or loss of an eye. "
        "The dataset contains <b>105,996 severe workplace trauma records</b> from January 1, 2015 through November 30, 2025 across all 50 US states.",
        st['body']
    ))
    story.append(Paragraph("• <b>Key Data Columns:</b> <i>Final Narrative</i> (unstructured free-text description of the incident sequence), <i>Hospitalized count</i>, <i>Amputation count</i>, <i>Loss of Eye count</i>, <i>NatureTitle</i> (e.g. Fractures, Amputations, Burns, Crushing injuries), <i>Part of Body Title</i>, <i>EventTitle</i> (incident mechanics), and <i>Primary NAICS</i> (industry classification).", st['bullet']))
    story.append(Paragraph("• <b>Ground Truth SIF Labeling:</b> Incidents are mathematically labeled as Serious Injury or Fatality (SIF) Precursors if they resulted in: (1) Amputation &ge; 1, (2) Loss of Eye &ge; 1, (3) In-patient Hospitalization &gt; 1, or (4) Hospitalization with high-severity life-altering trauma (skull fractures, intracranial hemorrhage, electrical arc flash, chemical/thermal burns, or severe crushing).", st['bullet']))
    story.append(Paragraph("• <b>Dataset Partitioning:</b> 80% Stratified Training Set (84,796 records) and 20% Unseen Testing Evaluation Set (21,199 records).", st['bullet']))

    # SECTION 2: THE AI/ML/DL MODEL ARCHITECTURE
    story.append(Paragraph("2. AI / ML / DL Model Architecture & Training Pipeline", st['h1']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#2563eb'), spaceAfter=4))
    story.append(Paragraph(
        "Rather than relying on slow, costly, and non-deterministic cloud LLMs that charge per token, SIF-Sense AI utilizes an ultra-fast, locally deployed, calibrated NLP machine learning pipeline:",
        st['body']
    ))
    story.append(Paragraph("• <b>Feature Extraction (TF-IDF N-grams):</b> Converts natural language incident text into 25,000 sublinear TF-IDF features capturing single words, bigrams, and trigrams (1-3 n-grams) such as <i>'lockout tagout'</i>, <i>'fall from scaffold'</i>, <i>'amputated two fingers'</i>, and <i>'arc flash burns'</i>.", st['bullet']))
    story.append(Paragraph("• <b>Calibrated SIF Probability Classifier:</b> Uses Stochastic Gradient Descent (SGD) with log-loss and balanced class weighting, wrapped in a 3-fold Platt Sigmoid calibrator. This outputs calibrated probabilities (0.00% to 100.0%) rather than uncalibrated margins.", st['bullet']))
    story.append(Paragraph("• <b>Multi-Class Injury Nature Predictor:</b> Companion multi-nominal logistic regression classifier predicting 8 trauma categories (Amputation, Fracture, Crushing Injury, Thermal/Chemical Burn, Head/Brain Trauma, Electrical Trauma, Laceration, and Sprain/Strain).", st['bullet']))
    story.append(Paragraph("• <b>Precomputed Feature Attribution Engine:</b> Feature coefficient matrices are precomputed into memory at startup. When an incident is analyzed, word-level risk weights are extracted in <b>0.05 milliseconds</b> via direct dictionary lookups.", st['bullet']))

    m_data = [
        [Paragraph("Model Metric", st['th']), Paragraph("Evaluation Score", st['th']), Paragraph("Technical Significance", st['th'])],
        [Paragraph("Training Set", st['td']), Paragraph("84,796 records", st['td']), Paragraph("80% stratified representation across all 50 states", st['td'])],
        [Paragraph("Test Set (Unseen)", st['td']), Paragraph("21,199 records", st['td']), Paragraph("Rigorous out-of-sample statistical validation", st['td'])],
        [Paragraph("Test Accuracy", st['td']), Paragraph("<b>96.00%</b>", st['td']), Paragraph("Correct classifications across all incident types", st['td'])],
        [Paragraph("SIF Safety Recall", st['td']), Paragraph("<b>97.49%</b>", st['td']), Paragraph("<b>Zero-tolerance safety:</b> 97.5% of genuine threats caught", st['td'])],
        [Paragraph("Precision", st['td']), Paragraph("<b>97.18%</b>", st['td']), Paragraph("Extremely low false alarm / false positive rate", st['td'])],
        [Paragraph("F1-Score", st['td']), Paragraph("<b>0.9733</b>", st['td']), Paragraph("Harmonic mean of precision and safety recall", st['td'])],
        [Paragraph("ROC-AUC", st['td']), Paragraph("<b>0.9876</b>", st['td']), Paragraph("Superb threshold-independent discrimination", st['td'])],
        [Paragraph("Inference Latency", st['td']), Paragraph("<b>&lt; 15 ms</b>", st['td']), Paragraph("Sub-second CPU execution with zero GPU dependency", st['td'])],
    ]
    t_m = Table(m_data, colWidths=[90, 80, 346])
    t_m.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5), ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_m)

    story.append(PageBreak())

    # SECTION 3: FREE MONGODB ATLAS STORAGE ARCHITECTURE
    story.append(Paragraph("3. Free Database (MongoDB Atlas M0 512MB) Storage Architecture", st['h1']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#2563eb'), spaceAfter=4))
    story.append(Paragraph(
        "MongoDB Atlas M0 provides a hard <b>512 MB ceiling</b>. SIF-Sense AI implements a 4-tier lifecycle manager to ensure capacity never runs out:",
        st['body']
    ))
    story.append(Paragraph("• <b>Tier 1: Automated TTL (Time-To-Live) Partial Index:</b> Purges low-risk non-SIF observations after 90 days, while keeping confirmed SIF precursors indefinitely:", st['bullet']))

    ttl_code = """# MongoDB TTL Indexing in Python / PyMongo:
db.reports.create_index(
    [("created_at", 1)],
    expireAfterSeconds=7776000,  # Exactly 90 days
    partialFilterExpression={"sif_potential": False}  # NEVER purges genuine SIF precursors!
)"""
    t_code = Table([[Paragraph(ttl_code.replace("\n", "<br/>").replace(" ", "&nbsp;"), st['code'])]], colWidths=[516])
    t_code.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#94a3b8')),
        ('TOPPADDING', (0,0), (-1,-1), 3), ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_code)
    story.append(Spacer(1, 4))
    story.append(Paragraph("• <b>Tier 2: Schema Pruning:</b> Strips unnecessary embeddings and logs in <code>mongo_manager.py</code>. Documents are compressed to <b>< 380 bytes</b>, allowing 512 MB to hold <b>1,340,000+ reports</b>.", st['bullet']))
    story.append(Paragraph("• <b>Tier 3: Capped Ephemeral Collections:</b> Rolling audit logs are capped at 20 MB with FIFO eviction.", st['bullet']))
    story.append(Paragraph("• <b>Tier 4: Offline Cold Storage Export:</b> Built-in CSV & JSON export allows safety directors to archive older logs locally.", st['bullet']))

    # SECTION 4: COMPLETE REST API SPECIFICATION
    story.append(Paragraph("4. Backend REST API Specification & Endpoints", st['h1']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#2563eb'), spaceAfter=4))

    api_data = [
        [Paragraph("Endpoint", st['th']), Paragraph("Method", st['th']), Paragraph("Description & Output", st['th'])],
        [Paragraph("<code>/api/analyze</code>", st['td']), Paragraph("POST", st['td']), Paragraph("Full pipeline: NLP entity extraction, OSHA model inference, SIF scoring, and graph generation.", st['td'])],
        [Paragraph("<code>/api/model/metrics</code>", st['td']), Paragraph("GET", st['td']), Paragraph("Returns model metrics (96% accuracy, 97.5% recall), confusion matrix, and top learned risk terms.", st['td'])],
        [Paragraph("<code>/api/model/predict</code>", st['td']), Paragraph("POST", st['td']), Paragraph("Lightweight instant inference playground (<15ms) with word-level risk token weights.", st['td'])],
        [Paragraph("<code>/api/osha/samples</code>", st['td']), Paragraph("GET", st['td']), Paragraph("Curated real-world OSHA 2015–2025 benchmark test incidents across major industries.", st['td'])],
        [Paragraph("<code>/api/database/status</code>", st['td']), Paragraph("GET", st['td']), Paragraph("Returns active connection status (MongoDB Atlas vs SQLite fallback), active user, and errors.", st['td'])],
        [Paragraph("<code>/api/database/connect</code>", st['td']), Paragraph("POST", st['td']), Paragraph("Tests and updates MongoDB Atlas cluster hostname or URI dynamically without server restart.", st['td'])],
        [Paragraph("<code>/api/reports</code>", st['td']), Paragraph("GET", st['td']), Paragraph("Lists analyzed reports with pagination (10/25/50 per page), search, and SIF-only filter.", st['td'])],
        [Paragraph("<code>/api/alerts</code>", st['td']), Paragraph("GET", st['td']), Paragraph("Retrieves early warning alerts filtered by status (PENDING, ACCEPTED, ESCALATED, REJECTED).", st['td'])],
        [Paragraph("<code>/api/alerts/{id}/review</code>", st['td']), Paragraph("PATCH", st['td']), Paragraph("Human-in-the-loop action: ACCEPT, REJECT, or ESCALATE with mandatory HSE audit notes.", st['td'])],
    ]
    t_api = Table(api_data, colWidths=[120, 50, 346])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0f172a')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#f8fafc')]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5), ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_api)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated Tech PDF: {PDF1_PATH}")


# ══════════════════════════════════════════════════════════════════════════════
# 2. BUILD COMPLETE USER & OPERATION GUIDE PDF
# ══════════════════════════════════════════════════════════════════════════════
def build_user_pdf():
    doc = SimpleDocTemplate(PDF2_PATH, pagesize=letter, leftMargin=48, rightMargin=48, topMargin=52, bottomMargin=48)
    st = get_styles()
    story = []

    # Title & Metadata
    story.append(Paragraph("SIF-Sense AI: Complete User & Operation Guide", st['title']))
    story.append(Paragraph("A-to-Z Operational Manual: Step-by-Step Walkthrough of All Application Pages, Features, Buttons & Actions", st['sub']))

    meta = [
        [Paragraph("<b>Web Interface:</b> http://localhost:5173", st['td']), Paragraph("<b>Primary Users:</b> Safety Managers, HSE Officers, Supervisors", st['td'])],
        [Paragraph("<b>Key Workflow:</b> Real-time Incident Analysis & Early Warning", st['td']), Paragraph("<b>Data Cloud:</b> MongoDB Atlas (kanishkskcet_db_user)", st['td'])]
    ]
    t_meta = Table(meta, colWidths=[258, 258])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 3), ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6), ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 6))

    # SECTION 1: SYSTEM OVERVIEW
    story.append(Paragraph("1. System Overview: What is SIF-Sense AI?", st['h1']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#2563eb'), spaceAfter=4))
    story.append(Paragraph(
        "<b>SIF-Sense AI</b> is an intelligent industrial safety platform designed to identify <b>Serious Injury or Fatality (SIF) Precursors</b> "
        "before accidents occur. In traditional safety, 80% of minor incidents have zero potential for fatality, while 20% contain latent precursor conditions "
        "(such as working at height without harnesses, unverified confined space gas testing, or bypassed lockout tagout). "
        "SIF-Sense AI automatically ingests text observations, classifies their severity using a model trained on 105,996 federal OSHA severe incidents, "
        "and triggers human-in-the-loop early warning mitigation.",
        st['body']
    ))

    # SECTION 2: PAGE-BY-PAGE OPERATIONAL WALKTHROUGH
    story.append(Paragraph("2. Page-by-Page Operational Walkthrough", st['h1']))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#2563eb'), spaceAfter=4))

    # Page 1: Analyzer
    story.append(Paragraph("Page 1: SIF Incident Analyzer (Route: <code>/</code>)", st['h2']))
    story.append(Paragraph(
        "The Analyzer is where users submit, paste, or test safety observations in real time.",
        st['body']
    ))
    story.append(Paragraph("• <b>Dual-Mode Layout:</b> On desktop, you see the input box on the left and the live safety result on the right. On mobile or narrow viewports (&le; 860px), you see smooth tabs: <i>'1. Describe Incident'</i> and <i>'2. Safety Result'</i>. As soon as you tap 'Analyze Incident', the app automatically flips to Tab 2 to show your result.", st['bullet']))
    story.append(Paragraph("• <b>Quick OSHA Presets:</b> Tap any of the pre-loaded real OSHA incident buttons (e.g. <i>Machinery Entanglement</i>, <i>Fall from Height</i>, <i>Arc Flash Burn</i>, <i>Confined Space Gas</i>) to populate and evaluate real-world cases instantly.", st['bullet']))
    story.append(Paragraph("• <b>Reading the Results:</b>", st['bullet']))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;1. <b>SIF Status Pill:</b> Glowing RED indicates a confirmed SIF Precursor; glowing GREEN indicates a low-risk routine observation.", st['bullet']))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;2. <b>Priority Gauge:</b> Shows an overall risk score from 0 to 100. Scores &ge; 80 automatically escalate to the Alerts Hub.", st['bullet']))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;3. <b>Three Key Takeaways:</b> Highlights <i>Predicted Injury Nature</i> (e.g., Amputation, Fracture, Burn), <i>Critical Barrier Failure</i>, and <i>IOGP Safety Rule</i>.", st['bullet']))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;4. <b>Word Highlights Cloud:</b> Shows which exact words triggered the high score with their statistical weights (e.g., <i>amputation (+21.0)</i>, <i>fingers (+4.6)</i>).", st['bullet']))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;5. <b>Required Action:</b> Clear plain-English instruction on what site supervisors must do immediately.", st['bullet']))
    story.append(Spacer(1, 4))

    # Page 2: Dashboard
    story.append(Paragraph("Page 2: HSE Command Center Dashboard (Route: <code>/dashboard</code>)", st['h2']))
    story.append(Paragraph(
        "Provides facility-wide intelligence for HSE directors and executives:",
        st['body']
    ))
    story.append(Paragraph("• <b>Top Metric Cards:</b> Total Reports, SIF Precursors Detected, Critical Incidents, High/Medium Priorities, Near Misses, and Pending Reviews.", st['bullet']))
    story.append(Paragraph("• <b>High-Risk Locations:</b> Ranks facilities and operating zones by aggregate danger score with proportional progress bars.", st['bullet']))
    story.append(Paragraph("• <b>Hazard Distribution:</b> Interactive bar chart breaking down recurring hazards (e.g., energized work, falls, rotating equipment).", st['bullet']))
    story.append(Paragraph("• <b>Critical Barrier Breakdown:</b> Tracks control breakdowns (missing PPE, missing permits, bypassed locks).", st['bullet']))
    story.append(Paragraph("• <b>Sequential Risk Score Trend:</b> Rolling chronological line chart to spot site safety deterioration before accidents occur.", st['bullet']))

    story.append(PageBreak())

    # Page 3: Model Insights
    story.append(Paragraph("Page 3: OSHA Model Telemetry & Playground (Route: <code>/model</code>)", st['h2']))
    story.append(Paragraph(
        "A full transparency console explaining how the AI model works and allowing interactive testing:",
        st['body']
    ))
    story.append(Paragraph("• <b>Model Scorecards:</b> Accuracy (96.00%), SIF Recall (97.49%), Precision (97.18%), F1-Score (0.9733), ROC-AUC (0.9876), and Sub-15ms Latency.", st['bullet']))
    story.append(Paragraph("• <b>Test Set Confusion Matrix:</b> Displays exact counts of 15,445 True Positives, 4,907 True Negatives, 449 False Positives, and only 398 False Negatives (1.8% missed).", st['bullet']))
    story.append(Paragraph("• <b>Searchable Risk Dictionary:</b> Interactive dictionary of top risk tokens (fractured +24.5, amputated +22.8, broken +21.9, burns +15.3, concussion +13.6).", st['bullet']))
    story.append(Paragraph("• <b>Live Interactive Playground:</b> Type any custom text sentence and watch the model calculate probability and highlight words in under 15 milliseconds.", st['bullet']))
    story.append(Spacer(1, 4))

    # Page 4: Alerts & Review
    story.append(Paragraph("Page 4: Alerts & Human-in-the-Loop Review Hub (Route: <code>/alerts</code>)", st['h2']))
    story.append(Paragraph(
        "When an incident scores &ge; 80 / 100, it automatically triggers an active SIF Early Warning. The Alerts Hub is where safety managers take action:",
        st['body']
    ))
    story.append(Paragraph("• <b>1-Click Direct Actions:</b>", st['bullet']))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;✓ <b>Accept & Mitigate:</b> Acknowledges the hazard and applies recommended controls.", st['bullet']))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;🚨 <b>Escalate to Leadership:</b> Opens a modal to input immediate work stoppage orders, notifications to site leadership, and re-inspection directives.", st['bullet']))
    story.append(Paragraph("&nbsp;&nbsp;&nbsp;&nbsp;✕ <b>Dismiss:</b> Flags the observation as low-risk or false alarm with audit trail logging.", bullet_style := st['bullet']))
    story.append(Paragraph("• <b>Status Filter Tabs:</b> Filter between <i>Pending Action</i>, <i>Accepted</i>, <i>Escalated</i>, and <i>Dismissed</i>.", st['bullet']))
    story.append(Paragraph("• <b>Dynamic Header Counter:</b> Topbar displays an active red pill with the number of pending alerts.", st['bullet']))
    story.append(Spacer(1, 4))

    # Page 5: Report Log
    story.append(Paragraph("Page 5: Safety Report Log (Route: <code>/reports</code>)", st['h2']))
    story.append(Paragraph(
        "Historical incident repository with search, filtering, and export capabilities:",
        st['body']
    ))
    story.append(Paragraph("• <b>Configurable Pagination:</b> Toggle between 10, 25, or 50 records per page with next/previous controls.", st['bullet']))
    story.append(Paragraph("• <b>1-Click Export to CSV & JSON:</b> Export data formatted for Excel, PowerBI, or corporate EHS compliance software.", st['bullet']))
    story.append(Paragraph("• <b>Deep Inspection Modal:</b> Click any report card to open a full inspection drawer showing unedited incident text, priority scores, and extracted precursors.", st['bullet']))
    story.append(Paragraph("• <b>Instant Search & Filter:</b> Filter specifically for SIF-only incidents or search by facility name, hazard, or activity.", st['bullet']))
    story.append(Spacer(1, 4))

    # Page 6: Database Setup
    story.append(Paragraph("Page 6: Database Cloud Configuration (MongoDB Atlas)", st['h2']))
    story.append(Paragraph(
        "SIF-Sense AI supports multi-user cloud synchronization to MongoDB Atlas with an automatic SQLite fallback.",
        st['body']
    ))
    story.append(Paragraph("• <b>Topbar Button (<code>🍃 DB Ready</code>):</b> Click this button in the top navigation bar at any time to open the Database Cloud Modal.", st['bullet']))
    story.append(Paragraph("• <b>Live Status:</b> Displays your configured user (<code>kanishkskcet_db_user</code>), database name (<code>sif_sense</code>), and connection health.", st['bullet']))
    story.append(Paragraph("• <b>1-Click Test & Connect:</b> Enter your MongoDB Atlas cluster hostname (e.g. <code>cluster0.abcde.mongodb.net</code>) and click 'Test & Connect' to synchronize immediately without restarting the app.", st['bullet']))

    callout_data = [[
        Paragraph(
            "<b>Quick Reference Checklist for Operators:</b><br/>"
            "1. Enter incident in <b>Analyzer</b> &rarr; Check SIF status and immediate required action.<br/>"
            "2. If Priority &ge; 80, go to <b>Alerts Hub</b> &rarr; Click <i>Accept & Mitigate</i> or <i>Escalate</i>.<br/>"
            "3. Review site-wide trends in <b>Command Center</b> &rarr; Identify deteriorating locations before accidents happen.<br/>"
            "4. Export logs in <b>Report Log</b> &rarr; Download CSV/JSON for enterprise regulatory compliance.",
            st['callout']
        )
    ]]
    t_c = Table(callout_data, colWidths=[516])
    t_c.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#2563eb')),
        ('TOPPADDING', (0,0), (-1,-1), 5), ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8), ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_c)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated User Guide PDF: {PDF2_PATH}")


def copy_to_accessible_locations():
    destinations = [
        "/Users/mr.tom/Desktop",
        "/Users/mr.tom/Downloads"
    ]
    for src in [PDF1_PATH, PDF2_PATH]:
        filename = os.path.basename(src)
        for dest_dir in destinations:
            if os.path.exists(dest_dir):
                target = os.path.join(dest_dir, filename)
                try:
                    shutil.copy2(src, target)
                    print(f"Copied {filename} -> {target}")
                except Exception as e:
                    print(f"Could not copy to {target}: {e}")

if __name__ == "__main__":
    build_tech_pdf()
    build_user_pdf()
    copy_to_accessible_locations()
