"""
SIF-Sense AI — OSHA 2015–2025 Severe Injury Model Training Pipeline
Trains calibrated NLP ML models on the OSHA Severe Injury dataset (106k reports).
Outputs:
  - backend/ai/models/sif_osha_model.joblib
  - backend/ai/models/model_metrics.json
  - backend/ai/models/sample_cases.json
"""

import os
import re
import json
import time
import logging
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score, precision_recall_fscore_support,
    roc_auc_score, confusion_matrix
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("osha_train")

DATASET_PATH = "/Users/mr.tom/Downloads/January2015toNovember2025.csv"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(OUTPUT_DIR, exist_ok=True)

MODEL_FILE = os.path.join(OUTPUT_DIR, "sif_osha_model.joblib")
METRICS_FILE = os.path.join(OUTPUT_DIR, "model_metrics.json")
SAMPLES_FILE = os.path.join(OUTPUT_DIR, "sample_cases.json")


def clean_text(text: str) -> str:
    """Normalize incident narrative text."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"[^\w\s\-]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def map_injury_nature(nature: str) -> str:
    """Group granular OSHA NatureTitle into core industrial injury categories."""
    if not isinstance(nature, str):
        return "Other Trauma"
    n_low = nature.lower()
    if "amputat" in n_low or "enucleat" in n_low or "avuls" in n_low:
        return "Amputation"
    elif "fractur" in n_low or "broken" in n_low:
        return "Fracture"
    elif "crush" in n_low:
        return "Crushing Injury"
    elif "burn" in n_low or "scald" in n_low:
        return "Thermal / Chemical Burn"
    elif "intracranial" in n_low or "concussion" in n_low or "brain" in n_low:
        return "Head / Brain Trauma"
    elif "electrocution" in n_low or "shock" in n_low:
        return "Electrical Trauma"
    elif "cut" in n_low or "lacerat" in n_low or "puncture" in n_low:
        return "Laceration / Puncture"
    elif "sprain" in n_low or "strain" in n_low or "soreness" in n_low:
        return "Sprain / Strain / Soft Tissue"
    else:
        return "Other Trauma"


def load_and_prepare_data(path: str):
    logger.info(f"Loading OSHA dataset from {path}...")
    df = pd.read_csv(
        path,
        usecols=[
            "ID", "EventDate", "Employer", "City", "State",
            "Hospitalized", "Amputation", "Loss of Eye",
            "Final Narrative", "NatureTitle", "EventTitle", "Part of Body Title"
        ],
        low_memory=False
    )
    logger.info(f"Loaded {len(df):,} total rows.")

    df = df.dropna(subset=["Final Narrative"]).copy()
    df["Final Narrative"] = df["Final Narrative"].astype(str)
    df["cleaned_text"] = df["Final Narrative"].apply(clean_text)
    df = df[df["cleaned_text"].str.len() > 10].copy()

    df["Hospitalized"] = pd.to_numeric(df["Hospitalized"], errors="coerce").fillna(0)
    df["Amputation"] = pd.to_numeric(df["Amputation"], errors="coerce").fillna(0)
    df["Loss of Eye"] = pd.to_numeric(df["Loss of Eye"], errors="coerce").fillna(0)

    severe_natures = {
        "Amputation", "Head / Brain Trauma", "Crushing Injury",
        "Electrical Trauma", "Thermal / Chemical Burn", "Fracture"
    }
    df["injury_category"] = df["NatureTitle"].apply(map_injury_nature)

    is_severe_nature = df["injury_category"].isin(severe_natures)
    is_amputation_or_eye = (df["Amputation"] > 0) | (df["Loss of Eye"] > 0)
    is_multi_hosp = df["Hospitalized"] > 1
    is_severe_hosp = (df["Hospitalized"] >= 1) & is_severe_nature

    df["sif_target"] = (is_amputation_or_eye | is_multi_hosp | is_severe_hosp).astype(int)

    logger.info(f"SIF Class Distribution:\n{df['sif_target'].value_counts(normalize=True)}")
    logger.info(f"Top Injury Categories:\n{df['injury_category'].value_counts().head(8)}")

    return df


def train_models():
    start_time = time.time()
    df = load_and_prepare_data(DATASET_PATH)

    train_df, test_df = train_test_split(
        df,
        test_size=0.20,
        random_state=42,
        stratify=df["sif_target"]
    )
    logger.info(f"Training set: {len(train_df):,} | Testing set: {len(test_df):,}")

    logger.info("Fitting TF-IDF Vectorizer (1-3 ngrams, sublinear tf)...")
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 3),
        max_features=25000,
        sublinear_tf=True,
        min_df=3,
        max_df=0.85,
        stop_words="english"
    )
    X_train = vectorizer.fit_transform(train_df["cleaned_text"])
    X_test = vectorizer.transform(test_df["cleaned_text"])
    y_train = train_df["sif_target"].values
    y_test = test_df["sif_target"].values

    logger.info("Training SIF Calibrated Classifier...")
    base_clf = SGDClassifier(
        loss="log_loss",
        penalty="l2",
        alpha=1e-5,
        max_iter=1000,
        random_state=42,
        class_weight="balanced"
    )
    clf = CalibratedClassifierCV(estimator=base_clf, method="sigmoid", cv=3)
    clf.fit(X_train, y_train)

    logger.info("Training Multi-Class Injury Category Classifier...")
    cat_train_mask = train_df["injury_category"].isin([
        "Amputation", "Fracture", "Crushing Injury", "Thermal / Chemical Burn",
        "Head / Brain Trauma", "Electrical Trauma", "Laceration / Puncture",
        "Sprain / Strain / Soft Tissue"
    ])
    cat_vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=15000,
        sublinear_tf=True,
        min_df=3,
        stop_words="english"
    )
    X_train_cat = cat_vectorizer.fit_transform(train_df.loc[cat_train_mask, "cleaned_text"])
    y_train_cat = train_df.loc[cat_train_mask, "injury_category"]
    cat_clf = LogisticRegression(max_iter=500, C=1.0, class_weight="balanced", random_state=42)
    cat_clf.fit(X_train_cat, y_train_cat)

    logger.info("Evaluating SIF Classifier on test set...")
    y_pred = clf.predict(X_test)
    y_probs = clf.predict_proba(X_test)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec, rec, f1, _ = precision_recall_fscore_support(y_test, y_pred, average="binary")
    roc_auc = roc_auc_score(y_test, y_probs)
    cm = confusion_matrix(y_test, y_pred).tolist()

    logger.info(f"Test Accuracy: {acc:.4f} | F1: {f1:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | ROC-AUC: {roc_auc:.4f}")
    logger.info(f"Confusion Matrix: {cm}")

    feature_names = np.array(vectorizer.get_feature_names_out())
    weights = np.zeros(len(feature_names))
    for cal_clf in clf.calibrated_classifiers_:
        if hasattr(cal_clf.estimator, "coef_"):
            weights += cal_clf.estimator.coef_[0]
    weights /= len(clf.calibrated_classifiers_)

    top_risk_indices = np.argsort(weights)[-100:][::-1]
    top_protective_indices = np.argsort(weights)[:50]

    top_risk_terms = [
        {"term": str(feature_names[i]), "weight": float(round(weights[i], 4))}
        for i in top_risk_indices
    ]
    top_protective_terms = [
        {"term": str(feature_names[i]), "weight": float(round(weights[i], 4))}
        for i in top_protective_indices
    ]

    model_bundle = {
        "vectorizer": vectorizer,
        "classifier": clf,
        "cat_vectorizer": cat_vectorizer,
        "cat_classifier": cat_clf,
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "dataset_rows": len(df),
        "test_accuracy": round(float(acc), 4),
        "test_f1": round(float(f1), 4),
    }
    joblib.dump(model_bundle, MODEL_FILE, compress=3)
    logger.info(f"Saved model bundle to {MODEL_FILE}")

    metrics_data = {
        "dataset_name": "OSHA Severe Injury Reports (2015–2025)",
        "total_records": int(len(df)),
        "train_samples": int(len(train_df)),
        "test_samples": int(len(test_df)),
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "confusion_matrix": {
            "true_negative": cm[0][0],
            "false_positive": cm[0][1],
            "false_negative": cm[1][0],
            "true_positive": cm[1][1],
        },
        "top_sif_risk_terms": top_risk_terms,
        "top_non_sif_terms": top_protective_terms,
        "training_duration_seconds": round(time.time() - start_time, 2),
        "last_trained": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())
    }
    with open(METRICS_FILE, "w") as f:
        json.dump(metrics_data, f, indent=2)
    logger.info(f"Saved metrics to {METRICS_FILE}")

    sample_cases = [
        {
            "id": "osha-amp-01",
            "category": "Machinery Entanglement & Amputation",
            "severity": "CRITICAL SIF",
            "badge": "CRITICAL SIF",
            "employer": "Industrial Manufacturing Plant",
            "narrative": "An employee operating a conveyor belt reached to clear jammed material while the system was still energized. The employee's right hand was caught in the rotating nip points, resulting in traumatic amputation of two fingers.",
            "actual_nature": "Amputation",
            "actual_outcome": "Amputation: 1, Hospitalized: 1",
            "expected_sif": True
        },
        {
            "id": "osha-fall-02",
            "category": "Fall from Height / Scaffolding",
            "severity": "CRITICAL SIF",
            "badge": "CRITICAL SIF",
            "employer": "Commercial Construction LLC",
            "narrative": "A carpenter was installing exterior siding from a mobile scaffold at an elevation of 18 feet. The scaffold lacked complete guardrails and the worker was not wearing a fall arrest harness. The worker lost balance and fell to the concrete slab below, sustaining severe cranial trauma and multiple fractured ribs.",
            "actual_nature": "Fracture / Brain Trauma",
            "actual_outcome": "Hospitalized: 1, Severe Trauma",
            "expected_sif": True
        },
        {
            "id": "osha-elec-03",
            "category": "Electrical Arc Flash / Energized Work",
            "severity": "CRITICAL SIF",
            "badge": "CRITICAL SIF",
            "employer": "Power & Utility Contracting",
            "narrative": "An electrician was troubleshooting a 480-volt distribution switchgear without de-energizing or performing Lockout/Tagout. A tool slipped causing an electrical arc flash explosion. The employee sustained second and third-degree thermal burns to the face, neck, and upper torso.",
            "actual_nature": "Thermal / Chemical Burn",
            "actual_outcome": "Hospitalized: 1, Inpatient Burn ICU",
            "expected_sif": True
        },
        {
            "id": "osha-crane-04",
            "category": "Suspended Load / Crush Hazard",
            "severity": "HIGH RISK SIF",
            "badge": "HIGH RISK",
            "employer": "Steel Logistics & Distribution",
            "narrative": "During an overhead crane lift of a 3-ton bundle of steel pipes, the synthetic rigging sling failed. The suspended bundle dropped into the staging bay, striking a ground rigger on the lower extremities and pinning the worker against a stanchion.",
            "actual_nature": "Crushing Injury",
            "actual_outcome": "Hospitalized: 1, Crush Trauma",
            "expected_sif": True
        },
        {
            "id": "osha-gas-05",
            "category": "Confined Space / Toxic Gas",
            "severity": "HIGH RISK SIF",
            "badge": "HIGH RISK",
            "employer": "Petrochemical Terminal Services",
            "narrative": "Two technicians entered a storage vessel to conduct internal weld inspections without atmospheric gas testing or ventilation. Both workers were overcome by nitrogen vapor displacement and oxygen deficiency, experiencing loss of consciousness before being rescued.",
            "actual_nature": "Chemical / Gas Inhalation",
            "actual_outcome": "Hospitalized: 2, Acute Respiratory Distress",
            "expected_sif": True
        },
        {
            "id": "osha-minor-06",
            "category": "Minor Scratch / First Aid",
            "severity": "LOW RISK",
            "badge": "LOW RISK",
            "employer": "Corporate Facility Office",
            "narrative": "An administrative staff member was moving empty cardboard boxes in the office supply room and sustained a minor paper cut to the index finger. Cleaned wound with first aid antiseptic wipe, no medical treatment or lost work time required.",
            "actual_nature": "Minor Scratch",
            "actual_outcome": "Hospitalized: 0, Amputation: 0, First Aid Only",
            "expected_sif": False
        }
    ]
    with open(SAMPLES_FILE, "w") as f:
        json.dump(sample_cases, f, indent=2)
    logger.info(f"Saved benchmark cases to {SAMPLES_FILE}")

    logger.info(f"OSHA model training pipeline complete in {time.time() - start_time:.2f}s!")


if __name__ == "__main__":
    train_models()
