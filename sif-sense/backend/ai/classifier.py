"""
SIF-Sense AI — OSHA 2015-2025 Calibrated ML/DL SIF Classifier
Trained on 106,488 OSHA Severe Injury incidents (2015-2025).
Features:
  - Calibrated SIF probability score (0.00 – 1.00)
  - Sub-10ms real-time inference
  - Word-level risk feature attribution (highlighting critical risk tokens)
  - Multi-class predicted injury nature (Amputation, Fracture, Crushing, etc.)
  - Rule-based safety guardrail fallback
"""

import os
import re
import joblib
import logging
import numpy as np
from typing import Optional, List, Dict, Any

logger = logging.getLogger("sif_sense.classifier")

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "sif_osha_model.joblib")

_model_bundle = None
_model_loaded = False


# ─── RULE-BASED SIF KEYWORDS (Safety Guardrails) ──────────────────────────────

SIF_STRONG_INDICATORS = [
    "confined space", "working at height", "hydrogen sulfide", "h2s",
    "toxic gas", "gas exposure", "no gas test", "no harness", "fall from height",
    "electrocution", "arc flash", "high voltage", "live wire",
    "no permit", "unauthorized entry", "suspended load", "overhead lift",
    "hot work without permit", "explosion", "fire hazard", "asphyxiation",
    "oxygen deficiency", "no fall protection", "struck by", "caught in",
    "crush", "collapse", "pressure vessel", "blowout", "lockout tagout",
    "not isolated", "energized", "fatal", "life threatening", "critical",
    "amputation", "amputated", "fracture", "fractured", "pinned", "severed"
]

SIF_MODERATE_INDICATORS = [
    "without", "no ppe", "missing", "failed to", "bypassed", "skipped",
    "absent", "not worn", "not tested", "not obtained", "improper",
    "defective", "damaged", "near miss", "close call", "almost",
    "barrier failure", "non-compliance", "violation", "conveyor", "blade"
]

NON_SIF_INDICATORS = [
    "housekeeping", "paperwork", "documentation error", "minor scratch",
    "late start", "parking", "office", "meeting room", "canteen", "paper cut",
    "empty cardboard"
]


def load_osha_model():
    """Load the trained OSHA 2015-2025 model bundle."""
    global _model_bundle, _model_loaded
    if _model_loaded:
        return _model_bundle

    if os.path.exists(MODEL_PATH):
        try:
            logger.info(f"Loading OSHA ML model from {MODEL_PATH}...")
            _model_bundle = joblib.load(MODEL_PATH)
            
            # Precompute coefficients once on load for sub-millisecond inference
            vec = _model_bundle.get("vectorizer")
            clf = _model_bundle.get("classifier")
            if vec and clf and hasattr(clf, "calibrated_classifiers_"):
                feature_names = vec.get_feature_names_out()
                coefs = np.zeros(len(feature_names))
                total = 0
                for cc in clf.calibrated_classifiers_:
                    if hasattr(cc.estimator, "coef_"):
                        coefs += cc.estimator.coef_[0]
                        total += 1
                if total > 0:
                    coefs /= total
                _model_bundle["precomputed_coefs"] = coefs
                _model_bundle["vocab"] = vec.vocabulary_

            _model_loaded = True
            logger.info("OSHA 2015-2025 ML model loaded and optimized for instant inference.")
        except Exception as e:
            logger.error(f"Failed to load OSHA model: {e}")
            _model_bundle = None
            _model_loaded = False
    else:
        logger.warning(f"OSHA model file not found at {MODEL_PATH}")
        _model_bundle = None
        _model_loaded = False

    return _model_bundle


def enable_dl_model():
    """Ensure model is loaded."""
    load_osha_model()


def extract_risk_tokens(text: str, bundle, top_n: int = 8) -> List[Dict[str, Any]]:
    """Instant lookup of top risk tokens using precomputed coefficients."""
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    vocab = bundle.get("vocab")
    coefs = bundle.get("precomputed_coefs")
    if not words or vocab is None or coefs is None:
        return []

    matched = {}
    for w in set(words):
        idx = vocab.get(w)
        if idx is not None:
            weight = float(coefs[idx])
            if weight > 0:
                matched[w] = weight

    if not matched:
        return []

    sorted_tokens = sorted(matched.items(), key=lambda x: x[1], reverse=True)[:top_n]
    return [{"word": item[0], "weight": round(item[1], 3)} for item in sorted_tokens]


def _rule_based_classify(text: str, nlp_result: dict) -> dict:
    """Rule-based safety fallback engine."""
    text_lower = text.lower()

    non_sif_count = sum(1 for kw in NON_SIF_INDICATORS if kw in text_lower)
    if non_sif_count >= 2:
        return {
            "sif_potential": False,
            "model_score": 0.12,
            "model_confidence": 0.88,
            "classification_method": "rule_based_guardrail",
            "predicted_nature": "Low Risk / Observation",
            "risk_tokens": []
        }

    strong_count = sum(1 for kw in SIF_STRONG_INDICATORS if kw in text_lower)
    moderate_count = sum(1 for kw in SIF_MODERATE_INDICATORS if kw in text_lower)

    nlp_boost = 0
    if nlp_result.get("barrier_failure"):
        nlp_boost += 2
    if nlp_result.get("unsafe_act"):
        nlp_boost += 1
    if nlp_result.get("matched_indicators", 0) >= 3:
        nlp_boost += 1

    total_signal = strong_count * 3 + moderate_count + nlp_boost

    if strong_count >= 1 or total_signal >= 4:
        sif_potential = True
        raw_score = min(0.98, 0.60 + (strong_count * 0.12) + (moderate_count * 0.04) + (nlp_boost * 0.05))
    elif total_signal >= 2:
        sif_potential = True
        raw_score = min(0.75, 0.45 + total_signal * 0.05)
    else:
        sif_potential = False
        raw_score = max(0.10, 0.35 - total_signal * 0.05)

    return {
        "sif_potential": sif_potential,
        "model_score": round(raw_score, 4),
        "model_confidence": round(min(0.95, 0.70 + strong_count * 0.05), 4),
        "classification_method": "rule_based_guardrail",
        "predicted_nature": "Industrial Trauma" if sif_potential else "Minor Safety Concern",
        "risk_tokens": [{"word": kw, "weight": 5.0} for kw in SIF_STRONG_INDICATORS if kw in text_lower][:5]
    }


def classify(text: str, nlp_result: dict) -> dict:
    """
    Primary SIF Classification Engine.
    Uses trained OSHA 2015-2025 Calibrated ML Model + Rule-based Safety Guardrail.
    """
    bundle = load_osha_model()

    if bundle is not None:
        try:
            vec = bundle["vectorizer"]
            clf = bundle["classifier"]
            cat_vec = bundle.get("cat_vectorizer")
            cat_clf = bundle.get("cat_classifier")

            # Fast TF-IDF transform
            x = vec.transform([text])
            # Calibrated probability
            probs = clf.predict_proba(x)[0]
            sif_prob = float(probs[1])
            is_sif = sif_prob >= 0.50

            confidence = round(float(sif_prob if is_sif else (1.0 - sif_prob)), 4)

            # Predict injury category
            predicted_nature = "Industrial Trauma"
            if cat_vec is not None and cat_clf is not None:
                x_cat = cat_vec.transform([text])
                predicted_nature = str(cat_clf.predict(x_cat)[0])

            # Extract top contributing words instantaneously
            risk_tokens = extract_risk_tokens(text, bundle)

            # Safety guardrail check: if text mentions unmistakable life-threatening conditions
            text_low = text.lower()
            if any(term in text_low for term in ["amputat", "loss of eye", "crushed between", "electrocution", "fatal"]):
                if sif_prob < 0.65:
                    sif_prob = max(sif_prob, 0.88)
                    is_sif = True
                    confidence = 0.95

            # Non-SIF check: if clearly minor office / paperwork
            if any(term in text_low for term in ["minor paper cut", "empty cardboard", "parking pass", "meeting room"]):
                if sif_prob > 0.40:
                    sif_prob = min(sif_prob, 0.15)
                    is_sif = False
                    confidence = 0.90
                    predicted_nature = "Minor Cut / Scratch"

            return {
                "sif_potential": is_sif,
                "model_score": round(sif_prob, 4),
                "model_confidence": confidence,
                "classification_method": "osha_2015_2025_ml_model",
                "predicted_nature": predicted_nature,
                "risk_tokens": risk_tokens
            }
        except Exception as e:
            logger.error(f"Inference error in OSHA model: {e}. Falling back to rule engine.")

    # Fallback to rule engine
    return _rule_based_classify(text, nlp_result)
