"""
SIF-Sense AI — FastAPI Main Application
All REST endpoints for the SIF pipeline.
"""

import os
import json
import logging
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from collections import Counter

from database import create_tables, get_db, Report, Alert
from mongo_manager import mongo_manager
from nlp.analyzer import analyze as nlp_analyze
from ai.preprocessor import get_preprocessed
from ai.classifier import classify, enable_dl_model
from risk.scorer import calculate_risk_score
from graph.builder import build_report_graph, build_pattern_graph

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("sif_sense")

# ─── APP SETUP ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="SIF-Sense AI API",
    description="Real-time SIF Early Warning Pipeline",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── SCHEMAS ─────────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    report: str

class ReviewRequest(BaseModel):
    action: str  # ACCEPT | REJECT | ESCALATE
    notes: Optional[str] = None


# ─── SAMPLE SEED DATA ────────────────────────────────────────────────────────

SEED_REPORTS = [
    "Worker entered Site A confined space without checking atmospheric gas levels. Entry permit was unavailable. No standby person present.",
    "Technician at Site B was working on energized electrical panel without lockout tagout. No PPE observed.",
    "Worker at Site A working at height without harness. Scaffold missing guardrails. Near miss incident reported.",
    "Crane operator at Site D lifted load over workers below. No exclusion zone established. Suspended load risk.",
    "Hot work commenced at Site C without valid hot work permit. Flammable materials present nearby.",
    "Confined space entry at Site B - gas testing not performed. Worker complained of dizziness. Possible H2S exposure.",
    "Worker at Site A fell from scaffold while working at height. No fall protection used. First aid required.",
    "Electrical isolation not applied before maintenance at Site B. Live circuit accessed. High voltage risk.",
    "Driver at Site D exceeded speed limit in facility zone. Near miss with pedestrian.",
    "Excavation at Site C without shoring. Unstable walls. Collapse risk identified.",
    "Worker at Site A working at height - harness not clipped to anchor point. Working at 6m elevation.",
    "Gas testing skipped at Site B confined space entry. Oxygen level not checked. Entry permit signed but gas test blank.",
    "No permit to work for hot work at Site C. Welding commenced in flammable atmosphere.",
    "Lifting operation at Site D - rigger not certified. Load slipped during lift. Near miss.",
    "Worker climbed ladder without maintaining 3-point contact. Working at height without fall protection.",
    "Confined space at Site A - entry made without supervisor. Lone worker inside tank. No communication.",
    "Arc flash risk at Site B - electrical cabinet opened without arc flash PPE. High voltage exposure.",
    "Working at height at Site C - temporary guardrail removed and not replaced. Open edge identified.",
    "Vehicle reversing at Site D without banksman. Near miss with stationary workers.",
    "Hot work at Site A - fire watch person absent. Combustible materials within 15 meters.",
]


@app.on_event("startup")
async def startup_event():
    """Initialize database and seed sample data."""
    create_tables()
    db = next(get_db())
    try:
        existing = db.query(Report).count()
        if existing == 0:
            logger.info("Seeding sample reports...")
            for report_text in SEED_REPORTS:
                _process_and_save_report(report_text, db)
            db.commit()
            logger.info(f"Seeded {len(SEED_REPORTS)} reports.")
    finally:
        db.close()
    # Enable DL model lazy loading AFTER seeding (rule-based used during seed)
    enable_dl_model()
    logger.info("DL model enabled for lazy loading on next classify request.")


# ─── HELPER: FULL ANALYSIS PIPELINE ─────────────────────────────────────────

def _process_and_save_report(text: str, db: Session) -> Report:
    """Run the full SIF analysis pipeline and persist to DB."""

    # Stage 1: Preprocess
    pre = get_preprocessed(text)

    # Stage 2: NLP
    nlp_result = nlp_analyze(text)

    # Stage 3: Find similar reports before classification
    similar_count = _count_similar_reports(
        db,
        location=nlp_result.get("location"),
        activity=nlp_result.get("activity"),
    )

    # Stage 4: Classify
    classification = classify(pre["cleaned"], nlp_result)

    # Stage 5: Risk Score
    risk_result = calculate_risk_score(nlp_result, classification, similar_count)

    # Stage 6: Save Report
    report = Report(
        text=text,
        location=nlp_result.get("location"),
        activity=nlp_result.get("activity"),
        hazard=nlp_result.get("hazard"),
        unsafe_act=nlp_result.get("unsafe_act"),
        unsafe_condition=nlp_result.get("unsafe_condition"),
        barrier_failure=nlp_result.get("barrier_failure"),
        incident_type=nlp_result.get("incident_type"),
        sif_potential=classification["sif_potential"],
        model_score=classification["model_score"],
        model_confidence=classification["model_confidence"],
        classification_method=classification["classification_method"],
        risk_score=risk_result["risk_score"],
        risk_level=risk_result["risk_level"],
        score_severity=risk_result["breakdown"]["severity"],
        score_exposure=risk_result["breakdown"]["exposure"],
        score_barrier=risk_result["breakdown"]["barrier_failure"],
        score_pattern=risk_result["breakdown"]["repeated_pattern"],
        score_indicators=risk_result["breakdown"]["sif_indicators"],
        iogp_rule=risk_result["iogp_rule"],
        evidence=risk_result["evidence"],
    )
    db.add(report)
    db.flush()

    # Stage 7: Create Alert if high-risk
    if risk_result["risk_score"] >= 80:
        alert = Alert(
            report_id=report.id,
            title=f"SIF Early Warning — {nlp_result.get('activity', 'Unknown Activity')}",
            location=nlp_result.get("location"),
            activity=nlp_result.get("activity"),
            barrier_failure=nlp_result.get("barrier_failure"),
            risk_score=risk_result["risk_score"],
            risk_level=risk_result["risk_level"],
            related_reports_count=similar_count,
            status="PENDING",
            ai_recommendation=risk_result["ai_recommendation"],
        )
        db.add(alert)
        mongo_manager.save_alert({
            "title": alert.title,
            "location": alert.location,
            "activity": alert.activity,
            "risk_score": alert.risk_score,
            "risk_level": alert.risk_level,
            "status": alert.status,
            "ai_recommendation": alert.ai_recommendation,
        })

    mongo_manager.save_report({
        "text": text,
        "location": report.location,
        "activity": report.activity,
        "sif_potential": report.sif_potential,
        "model_score": report.model_score,
        "risk_score": report.risk_score,
        "risk_level": report.risk_level,
        "iogp_rule": report.iogp_rule,
    })

    return report


def _count_similar_reports(db: Session, location: str, activity: str) -> int:
    """Count reports with same location AND activity in last 50 reports."""
    if not location or not activity:
        return 0
    return db.query(Report).filter(
        Report.location == location,
        Report.activity == activity,
    ).count()


# ─── ENDPOINTS ───────────────────────────────────────────────────────────────

@app.post("/api/analyze")
async def analyze_report(req: ReportRequest, db: Session = Depends(get_db)):
    """
    Main pipeline: Text → NLP → DL → Risk Score → Graph → Response
    """
    if not req.report.strip():
        raise HTTPException(status_code=400, detail="Report text cannot be empty")

    pre = get_preprocessed(req.report)
    nlp_result = nlp_analyze(req.report)
    similar_count = _count_similar_reports(db, nlp_result.get("location"), nlp_result.get("activity"))
    classification = classify(pre["cleaned"], nlp_result)
    risk_result = calculate_risk_score(nlp_result, classification, similar_count)

    # Save to DB
    report = _process_and_save_report(req.report, db)
    db.commit()
    db.refresh(report)

    # Build intelligence graph
    graph_data = build_report_graph({
        **nlp_result,
        "risk_score": risk_result["risk_score"],
        "sif_potential": classification["sif_potential"],
        "similar_report_count": similar_count,
    })

    return {
        "report_id": report.id,
        "preprocessing": {
            "original": req.report,
            "cleaned": pre["cleaned"],
            "token_count": pre["token_count"],
        },
        "nlp": {
            "location": nlp_result.get("location"),
            "activity": nlp_result.get("activity"),
            "hazard": nlp_result.get("hazard"),
            "unsafe_act": nlp_result.get("unsafe_act"),
            "unsafe_condition": nlp_result.get("unsafe_condition"),
            "barrier_failure": nlp_result.get("barrier_failure"),
            "incident_type": nlp_result.get("incident_type"),
        },
        "classification": {
            "sif_potential": classification["sif_potential"],
            "model_score": classification["model_score"],
            "model_confidence": classification["model_confidence"],
            "method": classification["classification_method"],
            "predicted_nature": classification.get("predicted_nature", "Industrial Incident"),
            "risk_tokens": classification.get("risk_tokens", []),
        },
        "risk": {
            "score": risk_result["risk_score"],
            "level": risk_result["risk_level"],
            "breakdown": risk_result["breakdown"],
            "iogp_rule": risk_result["iogp_rule"],
            "iogp_description": risk_result["iogp_description"],
            "evidence": risk_result["evidence"],
            "ai_recommendation": risk_result["ai_recommendation"],
        },
        "pattern": {
            "similar_report_count": similar_count,
            "is_recurring": similar_count >= 3,
        },
        "graph": graph_data,
    }


@app.get("/api/reports")
async def get_reports(
    limit: int = 50,
    sif_only: bool = False,
    db: Session = Depends(get_db)
):
    """List all reports, newest first."""
    q = db.query(Report).order_by(Report.created_at.desc())
    if sif_only:
        q = q.filter(Report.sif_potential == True)
    reports = q.limit(limit).all()

    return [
        {
            "id": r.id,
            "text": r.text[:200] + "..." if len(r.text) > 200 else r.text,
            "created_at": r.created_at.isoformat(),
            "location": r.location,
            "activity": r.activity,
            "hazard": r.hazard,
            "barrier_failure": r.barrier_failure,
            "sif_potential": r.sif_potential,
            "risk_score": r.risk_score,
            "risk_level": r.risk_level,
            "incident_type": r.incident_type,
        }
        for r in reports
    ]


@app.get("/api/graph/{report_id}")
async def get_report_graph(report_id: int, db: Session = Depends(get_db)):
    """Get SIF Precursor Intelligence Graph for a specific report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    similar_count = _count_similar_reports(db, report.location, report.activity)
    graph_data = build_report_graph({
        "location": report.location,
        "activity": report.activity,
        "hazard": report.hazard,
        "barrier_failure": report.barrier_failure,
        "risk_score": report.risk_score,
        "sif_potential": report.sif_potential,
        "similar_report_count": similar_count,
    })
    return graph_data


@app.get("/api/graph/pattern/all")
async def get_pattern_graph(db: Session = Depends(get_db)):
    """Get multi-report pattern graph for SIF dashboard."""
    reports = db.query(Report).filter(Report.sif_potential == True).limit(20).all()
    report_dicts = [
        {
            "id": r.id,
            "location": r.location,
            "activity": r.activity,
            "hazard": r.hazard,
            "barrier_failure": r.barrier_failure,
        }
        for r in reports
    ]
    return build_pattern_graph(report_dicts)


@app.get("/api/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Summary statistics for the HSE Command Center dashboard."""
    total = db.query(Report).count()
    sif_count = db.query(Report).filter(Report.sif_potential == True).count()
    high_risk = db.query(Report).filter(Report.risk_level.in_(["HIGH", "CRITICAL"])).count()
    near_miss = db.query(Report).filter(Report.incident_type == "Near Miss").count()
    critical = db.query(Report).filter(Report.risk_level == "CRITICAL").count()
    pending_alerts = db.query(Alert).filter(Alert.status == "PENDING").count()

    return {
        "total_reports": total,
        "sif_potential": sif_count,
        "high_priority": high_risk,
        "near_misses": near_miss,
        "critical": critical,
        "pending_alerts": pending_alerts,
    }


@app.get("/api/dashboard/hotspots")
async def get_hotspots(db: Session = Depends(get_db)):
    """Top high-risk locations."""
    reports = db.query(Report).filter(Report.sif_potential == True).all()
    location_scores: dict = {}
    location_counts: dict = {}

    for r in reports:
        loc = r.location or "Unknown"
        location_scores[loc] = location_scores.get(loc, 0) + r.risk_score
        location_counts[loc] = location_counts.get(loc, 0) + 1

    hotspots = [
        {
            "location": loc,
            "count": location_counts[loc],
            "avg_score": round(location_scores[loc] / location_counts[loc]),
            "total_score": location_scores[loc],
        }
        for loc in location_counts
    ]
    return sorted(hotspots, key=lambda x: x["total_score"], reverse=True)[:10]


@app.get("/api/dashboard/hazards")
async def get_top_hazards(db: Session = Depends(get_db)):
    """Top SIF precursor hazard types."""
    reports = db.query(Report).all()
    counts = Counter(r.hazard for r in reports if r.hazard)
    return [{"hazard": h, "count": c} for h, c in counts.most_common(10)]


@app.get("/api/dashboard/barriers")
async def get_barrier_failures(db: Session = Depends(get_db)):
    """Top barrier failures."""
    reports = db.query(Report).all()
    counts = Counter(r.barrier_failure for r in reports if r.barrier_failure)
    return [{"barrier": b, "count": c} for b, c in counts.most_common(10)]


@app.get("/api/dashboard/patterns")
async def get_recurring_patterns(db: Session = Depends(get_db)):
    """Identify recurring location + activity patterns."""
    reports = db.query(Report).all()
    pattern_counts: dict = {}

    for r in reports:
        if r.location and r.activity:
            key = f"{r.location} + {r.activity}"
            pattern_counts[key] = pattern_counts.get(key, 0) + 1

    patterns = [
        {"pattern": k, "count": v}
        for k, v in pattern_counts.items()
        if v >= 2
    ]
    return sorted(patterns, key=lambda x: x["count"], reverse=True)[:10]


@app.get("/api/dashboard/trend")
async def get_risk_trend(db: Session = Depends(get_db)):
    """Risk score trend over last N reports."""
    reports = db.query(Report).order_by(Report.created_at.asc()).limit(50).all()
    return [
        {
            "id": r.id,
            "date": r.created_at.strftime("%b %d"),
            "risk_score": r.risk_score,
            "sif_potential": r.sif_potential,
        }
        for r in reports
    ]


@app.get("/api/alerts")
async def get_alerts(status: Optional[str] = None, db: Session = Depends(get_db)):
    """List all SIF alerts."""
    q = db.query(Alert).order_by(Alert.created_at.desc())
    if status:
        q = q.filter(Alert.status == status)
    alerts = q.limit(100).all()

    return [
        {
            "id": a.id,
            "report_id": a.report_id,
            "created_at": a.created_at.isoformat(),
            "title": a.title,
            "location": a.location,
            "activity": a.activity,
            "barrier_failure": a.barrier_failure,
            "risk_score": a.risk_score,
            "risk_level": a.risk_level,
            "related_reports_count": a.related_reports_count,
            "status": a.status,
            "hse_notes": a.hse_notes,
            "reviewed_at": a.reviewed_at.isoformat() if a.reviewed_at else None,
            "ai_recommendation": a.ai_recommendation,
        }
        for a in alerts
    ]


@app.patch("/api/alerts/{alert_id}/review")
async def review_alert(
    alert_id: int,
    req: ReviewRequest,
    db: Session = Depends(get_db)
):
    """HSE human-in-the-loop review: Accept / Reject / Escalate."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    valid_actions = ["ACCEPT", "REJECT", "ESCALATE"]
    if req.action not in valid_actions:
        raise HTTPException(status_code=400, detail=f"Action must be one of {valid_actions}")

    alert.status = req.action + "ED" if req.action != "ESCALATE" else "ESCALATED"
    alert.hse_notes = req.notes
    alert.reviewed_at = datetime.utcnow()
    db.commit()

    return {"success": True, "alert_id": alert_id, "status": alert.status}


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "SIF-Sense AI", "version": "1.0.0"}


@app.get("/api/model/metrics")
async def get_model_metrics():
    """Return trained OSHA model evaluation metrics and learned feature weights."""
    metrics_path = os.path.join(os.path.dirname(__file__), "ai", "models", "model_metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Model metrics file not found. Please train model first.")
    with open(metrics_path, "r") as f:
        return json.load(f)


@app.get("/api/osha/samples")
async def get_osha_samples():
    """Return realistic OSHA benchmark test cases (2015-2025)."""
    samples_path = os.path.join(os.path.dirname(__file__), "ai", "models", "sample_cases.json")
    if not os.path.exists(samples_path):
        raise HTTPException(status_code=404, detail="OSHA sample cases not found.")
    with open(samples_path, "r") as f:
        return json.load(f)


class QuickPredictRequest(BaseModel):
    text: str


@app.post("/api/model/predict")
async def quick_model_predict(req: QuickPredictRequest):
    """Lightweight direct model inference with word-level attributions."""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    pre = get_preprocessed(req.text)
    nlp_res = nlp_analyze(req.text)
    classification = classify(pre["cleaned"], nlp_res)
    return {
        "text": req.text,
        "classification": classification,
        "nlp": nlp_res
    }


class DatabaseConfigRequest(BaseModel):
    uri: Optional[str] = None
    host: Optional[str] = None


@app.get("/api/database/status")
async def get_database_status():
    """Return MongoDB / SQLite connectivity status."""
    return mongo_manager.get_status()


@app.post("/api/database/connect")
async def update_database_connection(req: DatabaseConfigRequest):
    """Test and update MongoDB connection."""
    if req.uri:
        success, msg = mongo_manager.connect(req.uri)
    elif req.host:
        user = mongo_manager.user
        pwd = mongo_manager.password
        db = mongo_manager.dbname
        uri = f"mongodb+srv://{user}:{pwd}@{req.host}/{db}?retryWrites=true&w=majority"
        success, msg = mongo_manager.connect(uri)
    else:
        success, msg = mongo_manager.connect()
    
    return {
        "success": success,
        "message": msg,
        "status": mongo_manager.get_status()
    }


@app.get("/api/download/project-zip")
async def download_project_zip():
    zip_path = "/Users/mr.tom/Desktop/SIF_Sense_AI_Project_Bundle.zip"
    if not os.path.exists(zip_path):
        zip_path = "/Users/mr.tom/NLP/SIF_Sense_AI_Project_Bundle.zip"
    if not os.path.exists(zip_path):
        raise HTTPException(status_code=404, detail="Zip file not found")
    return FileResponse(
        path=zip_path,
        filename="SIF_Sense_AI_Project_Bundle.zip",
        media_type="application/zip"
    )


@app.get("/api/download/technical-pdf")
async def download_technical_pdf():
    pdf_path = "/Users/mr.tom/Desktop/SIF_Sense_AI_Technical_Deep_Dive_and_Storage_Architecture.pdf"
    if not os.path.exists(pdf_path):
        pdf_path = "/Users/mr.tom/NLP/SIF_Sense_AI_Technical_Deep_Dive_and_Storage_Architecture.pdf"
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Technical PDF not found")
    return FileResponse(
        path=pdf_path,
        filename="SIF_Sense_AI_Technical_Deep_Dive_and_Storage_Architecture.pdf",
        media_type="application/pdf"
    )


@app.get("/api/download/user-guide-pdf")
async def download_user_guide_pdf():
    pdf_path = "/Users/mr.tom/Desktop/SIF_Sense_AI_Complete_User_and_Operation_Guide.pdf"
    if not os.path.exists(pdf_path):
        pdf_path = "/Users/mr.tom/NLP/SIF_Sense_AI_Complete_User_and_Operation_Guide.pdf"
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="User guide PDF not found")
    return FileResponse(
        path=pdf_path,
        filename="SIF_Sense_AI_Complete_User_and_Operation_Guide.pdf",
        media_type="application/pdf"
    )



