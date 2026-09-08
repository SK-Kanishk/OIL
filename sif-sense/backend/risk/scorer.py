"""
SIF-Sense AI — Explainable Risk Scoring Engine
Calculates a 0-100 SIF Priority Score with full breakdown.

Score Components:
  OSHA ML Model Signal   40pts  — Calibrated probability from 106k OSHA Severe Injury Model
  Severity & Trauma      25pts  — Identified hazard + predicted injury nature (amputation, fracture, etc.)
  Exposure & Activity    15pts  — High-risk operating tasks (confined space, height, machinery)
  Barrier Failure        15pts  — Failed / bypassed safety controls (LOTO, gas test, PPE, harness)
  Repeated Pattern       10pts  — Same location + activity recurrence in safety logs
"""

from typing import Optional

# ─── IOGP LIFE-SAVING RULES MAPPING ─────────────────────────────────────────

IOGP_RULES = {
    "Confined Space Entry": {
        "rule": "IOGP LSR-04: Confined Space",
        "description": "Obtain authorization before entering a confined space and verify atmospheric gas"
    },
    "Working at Height": {
        "rule": "IOGP LSR-06: Work at Height",
        "description": "Protect yourself against a fall when working at height with 100% tie-off"
    },
    "Electrical Work": {
        "rule": "IOGP LSR-12: Energy Isolation",
        "description": "Verify zero electrical energy and Lockout/Tagout before commencing work"
    },
    "Machinery / Equipment Operation": {
        "rule": "IOGP LSR-12: Energy Isolation & Guarding",
        "description": "Never bypass machine guards or clear jams while equipment is energized"
    },
    "Lifting Operations": {
        "rule": "IOGP LSR-09: Lifting Operations",
        "description": "Never stand or work under a suspended load or within crane radius"
    },
    "Hot Work": {
        "rule": "IOGP LSR-03: Hot Work",
        "description": "Obtain hot work permit and clear combustible hazards within 15m"
    },
    "Driving / Vehicle": {
        "rule": "IOGP LSR-01: Safe Driving",
        "description": "Follow site speed limits and enforce exclusion zones around mobile plant",
    },
    "Excavation": {
        "rule": "IOGP LSR-08: Excavation",
        "description": "Verify trench shoring and underground utility clearance before digging"
    },
    "Pressure Systems": {
        "rule": "IOGP LSR-11: Pressure Systems",
        "description": "Verify depressurization, isolation, and zero stored energy before maintenance"
    },
}

# ─── HAZARD SEVERITY MAP ─────────────────────────────────────────────────────
HAZARD_SEVERITY = {
    "Toxic Gas": 25,
    "Fall from Height": 24,
    "Electrical Hazard": 24,
    "Fire / Explosion": 24,
    "Machinery Entanglement": 23,
    "Caught in / Between": 22,
    "Crush / Collapse": 22,
    "Suspended Load": 20,
    "Struck By": 18,
    "Chemical Exposure": 18,
}

# ─── INJURY NATURE SEVERITY MAP ──────────────────────────────────────────────
NATURE_SEVERITY = {
    "Amputation": 25,
    "Head / Brain Trauma": 25,
    "Electrical Trauma": 24,
    "Thermal / Chemical Burn": 23,
    "Crushing Injury": 23,
    "Fracture": 20,
    "Laceration / Puncture": 14,
    "Sprain / Strain / Soft Tissue": 8,
    "Minor Cut / Scratch": 4,
    "Other Trauma": 12,
}

# ─── BARRIER FAILURE SEVERITY ─────────────────────────────────────────────────
BARRIER_SEVERITY = {
    "Atmospheric Testing Missing": 15,
    "Fall Protection System Absent": 15,
    "Lockout / Tagout Bypassed": 15,
    "Isolation Not Applied": 15,
    "Permit-to-Work Not Followed": 13,
    "Machine Guarding Missing / Defeated": 14,
    "No Entry Supervisor": 11,
    "PPE Non-Compliance": 9,
    "No Communication": 8,
}

# ─── ACTIVITY EXPOSURE MAP ───────────────────────────────────────────────────
ACTIVITY_EXPOSURE = {
    "Confined Space Entry": 15,
    "Working at Height": 15,
    "Electrical Work": 14,
    "Machinery / Equipment Operation": 14,
    "Lifting Operations": 13,
    "Hot Work": 12,
    "Pressure Systems": 12,
    "Excavation": 11,
    "Driving / Vehicle": 10,
}


def calculate_risk_score(
    nlp_result: dict,
    classification: dict,
    similar_report_count: int = 0
) -> dict:
    """
    Calculate explainable SIF Priority Score (0-100).
    Directly incorporates calibrated OSHA ML Model predictions as the primary driver.
    """
    activity = nlp_result.get("activity", "")
    hazard = nlp_result.get("hazard", "")
    barrier = nlp_result.get("barrier_failure", "")
    unsafe_act = nlp_result.get("unsafe_act", "")
    predicted_nature = classification.get("predicted_nature", "")
    model_score = float(classification.get("model_score", 0.0))
    sif_potential = bool(classification.get("sif_potential", False))

    evidence = []

    # ── 1. OSHA ML MODEL SIGNAL (max 40 pts) ─────────────────────────────────
    # Directly scales with calibrated OSHA 2015-2025 machine learning model probability
    if sif_potential:
        ml_score = round(model_score * 40)
        ml_score = max(24, min(40, ml_score))
        evidence.append(f"⚡ OSHA ML Model: {round(model_score * 100, 1)}% SIF precursor probability (+{ml_score} pts)")
    else:
        ml_score = round(model_score * 20)
        ml_score = min(12, ml_score)

    # ── 2. SEVERITY & TRAUMA (max 25 pts) ───────────────────────────────────
    hazard_score = HAZARD_SEVERITY.get(hazard, 10 if sif_potential else 5)
    nature_score = NATURE_SEVERITY.get(predicted_nature, 10 if sif_potential else 4)
    # Weighted combination of hazard type and predicted bodily trauma
    severity = min(25, max(hazard_score, nature_score))
    
    if predicted_nature and predicted_nature not in ["Other Trauma", "Minor Cut / Scratch"]:
        evidence.append(f"🩺 Predicted Trauma: {predicted_nature}")
    if hazard and hazard != "Unspecified Hazard":
        evidence.append(f"⚠️ Hazard identified: {hazard}")

    # ── 3. EXPOSURE & ACTIVITY (max 15 pts) ──────────────────────────────────
    exposure = ACTIVITY_EXPOSURE.get(activity, 8 if sif_potential else 4)
    if unsafe_act:
        exposure = min(15, exposure + 2)
        evidence.append(f"🚫 Unsafe act detected: {unsafe_act}")

    # ── 4. BARRIER FAILURE (max 15 pts) ─────────────────────────────────────
    barrier_score = BARRIER_SEVERITY.get(barrier, 0)
    if barrier:
        evidence.append(f"🔴 Barrier failure: {barrier}")
    elif unsafe_act:
        barrier_score = 8  # implicit barrier breakdown from unsafe act

    # ── 5. REPEATED PATTERN (max 10 pts) ────────────────────────────────────
    if similar_report_count >= 5:
        pattern_score = 10
    elif similar_report_count >= 3:
        pattern_score = 7
    elif similar_report_count >= 1:
        pattern_score = 4
    else:
        pattern_score = 0

    if similar_report_count > 0:
        evidence.append(f"🔁 {similar_report_count} similar report(s) found in facility history")

    # ── RAW SUM ─────────────────────────────────────────────────────────────
    raw_total = ml_score + severity + exposure + barrier_score + pattern_score

    # ── SAFETY GUARDRAILS & CALIBRATED FLOORS ───────────────────────────────
    # If the OSHA ML model flags high-confidence SIF, it MUST reflect as High/Critical Priority
    if sif_potential:
        if model_score >= 0.85:
            # High-confidence SIF (Amputation, crushing, arc flash, fall, toxic gas)
            total = max(80, min(99, raw_total))
        elif model_score >= 0.65:
            total = max(68, min(89, raw_total))
        else:
            total = max(55, min(75, raw_total))
    else:
        # Non-SIF negative control cases (minor cuts, paperwork, housekeeping)
        if model_score <= 0.20:
            total = min(25, max(8, raw_total // 2))
        else:
            total = min(39, raw_total)

    total = int(min(100, max(5, total)))

    # ── RISK LEVEL CATEGORIZATION ───────────────────────────────────────────
    if total >= 80:
        risk_level = "CRITICAL"
    elif total >= 60:
        risk_level = "HIGH"
    elif total >= 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # ── IOGP RULE RESOLUTION ────────────────────────────────────────────────
    iogp_info = IOGP_RULES.get(activity, {
        "rule": "IOGP LSR General: Life-Saving Rules",
        "description": "Comply with core industrial safety controls and stop unsafe work"
    })

    # ── AI RECOMMENDATION GENERATION ────────────────────────────────────────
    if total >= 80:
        ai_recommendation = (
            f"🚨 CRITICAL SIF ALERT (Score {total}/100). High probability of fatal or permanent disabling injury. "
            f"Mandatory immediate work stoppage. Verify: {barrier or 'all safety barriers'}. "
            f"HSE Director notification and root cause investigation required."
        )
    elif total >= 60:
        ai_recommendation = (
            f"⚠️ HIGH SIF PRECURSOR (Score {total}/100). Significant energy exposure without complete barriers. "
            f"HSE inspection required within 12 hours. Enforce {iogp_info['rule']}."
        )
    elif total >= 40:
        ai_recommendation = (
            f"🟡 MEDIUM OPERATIONAL RISK (Score {total}/100). Implement localized corrective actions and audit work permits within 48 hours."
        )
    else:
        ai_recommendation = (
            f"✅ LOW RISK / OBSERVATION (Score {total}/100). Log into safety database for routine trend tracking."
        )

    return {
        "risk_score": total,
        "risk_level": risk_level,
        "breakdown": {
            "severity": severity,
            "exposure": exposure,
            "barrier_failure": barrier_score,
            "repeated_pattern": pattern_score,
            "sif_indicators": ml_score,  # Reflects OSHA ML model signal points
            "dl_confidence": ml_score,
        },
        "iogp_rule": iogp_info["rule"],
        "iogp_description": iogp_info["description"],
        "evidence": evidence,
        "ai_recommendation": ai_recommendation,
    }
