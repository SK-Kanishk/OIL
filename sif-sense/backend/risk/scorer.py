"""
SIF-Sense AI — Explainable Risk Scoring Engine
Calculates a 0-100 SIF Priority Score with full breakdown.

Score Components:
  Severity          25pts  — SIF category + hazard type
  Exposure          20pts  — People at risk + location
  Barrier Failure   25pts  — Number of missing barriers
  Repeated Pattern  15pts  — Same location+activity in DB
  SIF Indicators    10pts  — IOGP life-saving rule matches
  DL Confidence      5pts  — Model confidence boost
"""

from typing import Optional

# ─── IOGP LIFE-SAVING RULES MAPPING ─────────────────────────────────────────

IOGP_RULES = {
    "Confined Space Entry": {
        "rule": "IOGP LSR-04: Confined Space",
        "description": "Obtain authorization before entering a confined space"
    },
    "Working at Height": {
        "rule": "IOGP LSR-06: Work at Height",
        "description": "Protect yourself against a fall when working at height"
    },
    "Electrical Work": {
        "rule": "IOGP LSR-12: Electrical Safety",
        "description": "Obtain authorization before overriding or disabling safety systems"
    },
    "Lifting Operations": {
        "rule": "IOGP LSR-09: Lifting Operations",
        "description": "Never stand or work under a suspended load"
    },
    "Hot Work": {
        "rule": "IOGP LSR-03: Hot Work",
        "description": "Obtain authorization before undertaking hot work"
    },
    "Driving / Vehicle": {
        "rule": "IOGP LSR-01: Driving",
        "description": "Follow safe driving rules",
    },
    "Excavation": {
        "rule": "IOGP LSR-08: Excavation",
        "description": "Obtain authorization before excavating"
    },
    "Pressure Systems": {
        "rule": "IOGP LSR-11: Pressure Systems",
        "description": "Verify isolation and zero energy before work begins"
    },
}

# ─── HAZARD SEVERITY MAP ─────────────────────────────────────────────────────
HAZARD_SEVERITY = {
    "Toxic Gas": 25,
    "Fall from Height": 22,
    "Electrical Hazard": 20,
    "Fire / Explosion": 23,
    "Crush / Collapse": 18,
    "Struck By": 15,
    "Caught in / Between": 16,
    "Chemical Exposure": 14,
}

# ─── BARRIER FAILURE SEVERITY ─────────────────────────────────────────────────
BARRIER_SEVERITY = {
    "Atmospheric Testing Missing": 25,
    "Fall Protection System Absent": 25,
    "Permit-to-Work Not Followed": 22,
    "Isolation Not Applied": 23,
    "No Entry Supervisor": 18,
    "PPE Non-Compliance": 12,
    "No Communication": 15,
}

# ─── ACTIVITY EXPOSURE MAP ───────────────────────────────────────────────────
ACTIVITY_EXPOSURE = {
    "Confined Space Entry": 20,
    "Working at Height": 18,
    "Electrical Work": 17,
    "Lifting Operations": 15,
    "Hot Work": 14,
    "Pressure Systems": 16,
    "Excavation": 13,
    "Driving / Vehicle": 12,
}


def calculate_risk_score(
    nlp_result: dict,
    classification: dict,
    similar_report_count: int = 0
) -> dict:
    """
    Calculate explainable SIF Priority Score (0-100).

    Returns:
        score: int (0-100)
        risk_level: str (LOW / MEDIUM / HIGH / CRITICAL)
        breakdown: dict with individual component scores
        iogp_rule: str
        evidence: list of strings
        ai_recommendation: str
    """
    activity = nlp_result.get("activity", "")
    hazard = nlp_result.get("hazard", "")
    barrier = nlp_result.get("barrier_failure", "")
    unsafe_act = nlp_result.get("unsafe_act", "")
    model_score = classification.get("model_score", 0.0)
    sif_potential = classification.get("sif_potential", False)

    evidence = []

    # ── 1. SEVERITY (max 25) ────────────────────────────────────────────────
    severity = HAZARD_SEVERITY.get(hazard, 10)
    if sif_potential:
        severity = min(25, severity + 3)
    if hazard and hazard != "Unspecified Hazard":
        evidence.append(f"⚠️ Hazard identified: {hazard}")

    # ── 2. EXPOSURE (max 20) ────────────────────────────────────────────────
    exposure = ACTIVITY_EXPOSURE.get(activity, 10)
    if unsafe_act:
        exposure = min(20, exposure + 2)
        evidence.append(f"🚫 Unsafe act detected: {unsafe_act}")

    # ── 3. BARRIER FAILURE (max 25) ─────────────────────────────────────────
    barrier_score = BARRIER_SEVERITY.get(barrier, 0)
    if barrier:
        evidence.append(f"🔴 Barrier failure: {barrier}")
    elif unsafe_act:
        barrier_score = 12  # implicit barrier failure from unsafe act

    # ── 4. REPEATED PATTERN (max 15) ────────────────────────────────────────
    if similar_report_count >= 5:
        pattern_score = 15
    elif similar_report_count >= 3:
        pattern_score = 10
    elif similar_report_count >= 1:
        pattern_score = 5
    else:
        pattern_score = 0

    if similar_report_count > 0:
        evidence.append(f"🔁 {similar_report_count} similar report(s) found — recurring pattern")

    # ── 5. SIF INDICATORS (max 10) ──────────────────────────────────────────
    matched = nlp_result.get("matched_indicators", 0)
    indicators_score = min(10, matched * 3)
    if matched >= 3:
        evidence.append(f"🧠 {matched} SIF indicators matched")

    # ── 6. DL CONFIDENCE BOOST (max 5) ──────────────────────────────────────
    dl_boost = round(model_score * 5) if sif_potential else 0

    # ── TOTAL ────────────────────────────────────────────────────────────────
    total = severity + exposure + barrier_score + pattern_score + indicators_score + dl_boost
    total = min(100, total)

    # ── RISK LEVEL ───────────────────────────────────────────────────────────
    if total >= 80:
        risk_level = "CRITICAL"
    elif total >= 60:
        risk_level = "HIGH"
    elif total >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # ── IOGP RULE ────────────────────────────────────────────────────────────
    iogp_info = IOGP_RULES.get(activity, {
        "rule": "IOGP LSR General",
        "description": "Follow all life-saving rules applicable to this task"
    })

    # ── AI RECOMMENDATION ────────────────────────────────────────────────────
    if total >= 80:
        ai_recommendation = (
            f"🚨 IMMEDIATE HSE REVIEW REQUIRED. Risk score {total}/100 ({risk_level}). "
            f"Barrier failure detected: {barrier or 'see evidence'}. "
            f"Escalate to HSE Manager immediately."
        )
    elif total >= 60:
        ai_recommendation = (
            f"⚠️ HIGH PRIORITY — Schedule HSE inspection within 24 hours. "
            f"Risk score {total}/100. Address identified barrier failures."
        )
    elif total >= 40:
        ai_recommendation = (
            f"🟡 MONITOR CLOSELY — Review within 48 hours. "
            f"Risk score {total}/100. Implement corrective measures."
        )
    else:
        ai_recommendation = (
            f"✅ LOW RISK — Log for record and periodic review. "
            f"Risk score {total}/100."
        )

    return {
        "risk_score": total,
        "risk_level": risk_level,
        "breakdown": {
            "severity": severity,
            "exposure": exposure,
            "barrier_failure": barrier_score,
            "repeated_pattern": pattern_score,
            "sif_indicators": indicators_score,
            "dl_confidence": dl_boost,
        },
        "iogp_rule": iogp_info["rule"],
        "iogp_description": iogp_info["description"],
        "evidence": evidence,
        "ai_recommendation": ai_recommendation,
    }
