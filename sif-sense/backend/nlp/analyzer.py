"""
SIF-Sense AI — NLP Safety Entity Extractor
Extracts: Location, Activity, Hazard, Unsafe Act, Unsafe Condition,
          Barrier Failure, Incident Type using spaCy + keyword rules.
"""

import re
from typing import Optional
from ai.preprocessor import preprocess


# ─── KEYWORD DICTIONARIES ────────────────────────────────────────────────────

ACTIVITY_PATTERNS = {
    "Confined Space Entry": [
        "confined space", "manhole", "tank entry", "vessel entry",
        "sump", "pit entry", "underground entry", "permit required space"
    ],
    "Working at Height": [
        "working at height", "roof work", "scaffold", "ladder", "elevated",
        "aerial platform", "fall from height", "working on top",
        "mewp", "elevated platform", "high level", "above ground"
    ],
    "Electrical Work": [
        "electrical", "high voltage", "live wire", "switchboard",
        "arc flash", "electrical isolation", "energized", "panel work",
        "lockout tagout", "circuit breaker"
    ],
    "Lifting Operations": [
        "lifting", "crane", "rigging", "suspended load", "hoisting",
        "overhead lift", "forklift", "slinging", "overhead crane"
    ],
    "Hot Work": [
        "hot work", "welding", "grinding", "cutting", "sparks",
        "flame", "open flame", "torch", "soldering"
    ],
    "Driving / Vehicle": [
        "driving", "vehicle", "forklift", "transport",
        "road risk", "speeding", "driving safety"
    ],
    "Excavation": [
        "excavation", "trenching", "digging", "underground utility",
        "collapse", "cave-in"
    ],
    "Pressure Systems": [
        "pressure", "pipeline", "valve", "pressurized",
        "relief valve", "pressure vessel", "blowout"
    ],
}

HAZARD_PATTERNS = {
    "Toxic Gas": [
        "toxic gas", "hydrogen sulfide", "h2s", "carbon monoxide",
        "gas exposure", "gas leak", "atmospheric hazard",
        "oxygen deficiency", "asphyxiation", "fumes"
    ],
    "Fall from Height": [
        "fall from height", "fall risk", "falling", "dropped",
        "slipped from", "fell off", "tripped"
    ],
    "Electrical Hazard": [
        "electric shock", "electrocution", "arc flash", "live electrical",
        "voltage", "shock hazard"
    ],
    "Caught in / Between": [
        "caught in", "caught between", "pinch point", "entanglement",
        "rotating equipment", "nip point"
    ],
    "Struck By": [
        "struck by", "hit by", "falling object", "dropped object",
        "projectile", "impact"
    ],
    "Fire / Explosion": [
        "fire", "explosion", "ignition", "flammable", "combustible",
        "flash fire", "deflagration"
    ],
    "Chemical Exposure": [
        "chemical", "acid", "caustic", "corrosive", "solvent",
        "toxic chemical", "chemical splash"
    ],
    "Crush / Collapse": [
        "crush", "collapse", "trench collapse", "wall collapse",
        "structure failure"
    ],
}

UNSAFE_ACT_PATTERNS = {
    "No Gas Testing": [
        "without gas testing", "no gas test", "without testing",
        "failed to test", "skipped gas check", "no atmospheric test"
    ],
    "No Fall Protection": [
        "no harness", "without harness", "no fall protection",
        "no safety belt", "missing fall arrest", "no anchor point",
        "without fall protection"
    ],
    "No Permit": [
        "no permit", "without permit", "permit not obtained",
        "no permit to work", "permit expired", "bypassed permit",
        "permit was unavailable", "permit not available", "permit unavailable",
        "no entry permit", "without entry permit"
    ],
    "Bypassed Safety Device": [
        "bypassed", "removed safety", "disabled alarm",
        "defeated interlock", "bypassed guard", "removed guard"
    ],
    "Unauthorized Entry": [
        "unauthorized entry", "entered without authorization",
        "no authorization", "entered without clearance"
    ],
    "Improper PPE": [
        "no ppe", "without ppe", "improper ppe", "missing helmet",
        "no safety glasses", "incorrect ppe"
    ],
    "No Isolation": [
        "no isolation", "without isolation", "not isolated",
        "live system", "energized without isolation"
    ],
}

BARRIER_FAILURE_PATTERNS = {
    "Atmospheric Testing Missing": [
        "no gas test", "gas testing missing", "atmospheric testing missing",
        "no air monitoring", "without testing atmosphere",
        "without checking gas", "without checking atmospheric"
    ],
    "Fall Protection System Absent": [
        "no fall protection", "fall arrest missing", "no harness",
        "guardrail missing", "no safety net", "handrail absent"
    ],
    "Permit-to-Work Not Followed": [
        "permit not followed", "no permit to work", "permit missing",
        "work order absent", "permit expired",
        "permit was unavailable", "permit not available", "permit unavailable",
        "no entry permit", "without entry permit"
    ],
    "Isolation Not Applied": [
        "no lockout", "not locked out", "isolation not applied",
        "energy not isolated", "not de-energized"
    ],
    "No Entry Supervisor": [
        "no supervisor", "unsupervised entry", "without entry attendant",
        "no attendant", "no standby person"
    ],
    "PPE Non-Compliance": [
        "ppe not worn", "no ppe", "ppe missing",
        "ppe non-compliance", "ppe not used"
    ],
    "No Communication": [
        "no communication", "no radio", "no check-in",
        "no emergency communication", "contact lost"
    ],
}

INCIDENT_TYPE_PATTERNS = {
    "Near Miss": [
        "near miss", "close call", "almost", "narrowly avoided",
        "near-miss", "near accident", "potential incident"
    ],
    "First Aid": [
        "first aid", "minor injury", "cut", "bruise", "abrasion"
    ],
    "Unsafe Condition": [
        "unsafe condition", "hazardous condition", "dangerous situation",
        "poor condition", "defective equipment"
    ],
    "Unsafe Act": [
        "unsafe act", "unsafe behavior", "violation", "non-compliance",
        "unsafe practice"
    ],
    "Observation": [
        "observation", "safety observation", "reported",
        "noticed", "spotted"
    ],
}

LOCATION_PATTERNS = [
    r"\bsite\s*[a-zA-Z0-9]+\b",
    r"\bblock\s*[a-zA-Z0-9]+\b",
    r"\bunit\s*[a-zA-Z0-9]+\b",
    r"\bplatform\s*[a-zA-Z0-9]*\b",
    r"\bplant\s*[a-zA-Z0-9]*\b",
    r"\bwarehouse\s*[a-zA-Z0-9]*\b",
    r"\boffshore\b",
    r"\bonshore\b",
    r"\brefinery\b",
    r"\bdrilling\b",
    r"\bwell\s*[a-zA-Z0-9]+\b",
    r"\bfacility\b",
    r"\bprocess\s*area\b",
    r"\butility\s*area\b",
    r"\bcontrol\s*room\b",
]


# ─── MAIN ANALYZER ───────────────────────────────────────────────────────────

def _find_best_match(text: str, pattern_dict: dict) -> Optional[str]:
    """Return the first matching category from a keyword dictionary."""
    for category, keywords in pattern_dict.items():
        for kw in keywords:
            if kw.lower() in text:
                return category
    return None


def _extract_location(text: str) -> str:
    """Extract location using regex patterns."""
    for pattern in LOCATION_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(0).strip().title()
    # Fallback: look for explicit mentions
    if "confined space" in text:
        return "Confined Space Area"
    if "roof" in text:
        return "Rooftop Area"
    if "basement" in text:
        return "Basement Level"
    return "Unspecified Location"


def analyze(text: str) -> dict:
    """
    Main NLP analysis function.
    Returns extracted safety entities from the report.
    """
    cleaned = preprocess(text)

    activity = _find_best_match(cleaned, ACTIVITY_PATTERNS)
    hazard = _find_best_match(cleaned, HAZARD_PATTERNS)
    unsafe_act = _find_best_match(cleaned, UNSAFE_ACT_PATTERNS)
    barrier_failure = _find_best_match(cleaned, BARRIER_FAILURE_PATTERNS)
    incident_type = _find_best_match(cleaned, INCIDENT_TYPE_PATTERNS)
    location = _extract_location(cleaned)

    # Derive unsafe condition from activity/hazard context
    unsafe_condition = None
    if hazard and activity:
        unsafe_condition = f"{hazard} present during {activity}"
    elif hazard:
        unsafe_condition = f"{hazard} exposure risk"

    # Count matched indicators for confidence
    matched = sum(1 for x in [activity, hazard, unsafe_act, barrier_failure] if x)

    return {
        "location": location,
        "activity": activity or "General Work Activity",
        "hazard": hazard or "Unspecified Hazard",
        "unsafe_act": unsafe_act,
        "unsafe_condition": unsafe_condition,
        "barrier_failure": barrier_failure,
        "incident_type": incident_type or "Observation",
        "matched_indicators": matched,
        "cleaned_text": cleaned,
    }
