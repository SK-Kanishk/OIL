# SIF-Sense AI — Industrial Safety & Early Warning System

> **Real-Time Serious Injury & Fatality (SIF) Precursor Identification Engine**  
> Powered by an NLP Machine Learning Model trained on **105,996 federal OSHA Severe Injury Reports (2015–2025)** with **96.0% Accuracy** and **97.5% SIF Safety Recall**.

---

## ⚡ Highlights & Key Capabilities

- **10-Year OSHA 2015–2025 ML Model**: Trained on 105,996 severe workplace incident reports across 50 US states.
- **Ultra-Fast Real-Time Inference**: Sub-15ms inference latency on standard CPU with zero cloud API token costs.
- **Word-Level Risk Attributions**: Directly identifies and highlights high-risk trigger tokens (`amputation +21.0`, `fingers +4.6`, `energized +2.4`).
- **Multi-Class Trauma Prediction**: Classifies likely physical injury nature (*Amputation*, *Fracture*, *Crushing*, *Thermal/Chemical Burn*, *Head Trauma*).
- **International Safety Standards**: Automatically maps incident precursors to **IOGP Life-Saving Rules** and outputs immediate required mitigations.
- **Dual Cloud/Local Database**: Supports **MongoDB Atlas** (`kanishkskcet_db_user`) with zero-downtime **SQLite local fallback**.
- **Free Tier Storage Optimization**: Includes automated MongoDB TTL partial indexes (preserves SIF cases permanently, expires minor observations after 90 days).
- **Adaptive UI**: Responsive design with side-by-side desktop view and an intuitive 2-tab mobile flow (`1. Describe Incident` ↔ `2. Safety Result`).

---

## 📊 Model Performance Telemetry

Evaluated on an independent, unseen test set of **21,199 OSHA severe injury records**:

| Metric | Score | Operational Relevance |
|---|---|---|
| **Training Records** | **84,796** | 80% stratified training split |
| **Test Records** | **21,199** | 20% independent evaluation split |
| **Model Accuracy** | **96.00%** | Overall correct classification rate |
| **SIF Safety Recall** | **97.49%** | **Zero-tolerance safety:** 97.5% of real severe threats caught |
| **Precision** | **97.18%** | Extremely low false alarm rate |
| **F1-Score** | **0.9733** | Harmonic mean of precision and recall |
| **ROC-AUC** | **0.9876** | Superb discrimination across all operating thresholds |
| **Inference Latency** | **< 15 ms** | Real-time interactive CPU execution |

---

## 📑 Included PDF Documentation

Two comprehensive, professionally compiled manuals are included in the repository:
1. **[SIF_Sense_AI_Technical_Deep_Dive_and_Storage_Architecture.pdf](./SIF_Sense_AI_Technical_Deep_Dive_and_Storage_Architecture.pdf)**  
   *Covers OSHA dataset science, ML model mathematics, SGD Platt calibration, REST API schemas, and MongoDB M0 512MB storage lifecycle.*
2. **[SIF_Sense_AI_Complete_User_and_Operation_Guide.pdf](./SIF_Sense_AI_Complete_User_and_Operation_Guide.pdf)**  
   *A complete step-by-step user manual explaining all 5 pages, buttons, score gauges, review workflows, and CSV/JSON exports.*

---

## 🏗️ Architecture & Tech Stack

```
Incident Text Report (Web or API)
       │
       ▼
 🧹 Preprocessing & Normalization
       │
       ▼
 🧠 Safety NLP Engine (Location, Activity, Hazard, Barrier Extraction)
       │
       ▼
 ⚡ OSHA 2015–2025 ML Classifier (Sublinear TF-IDF + Platt-Calibrated SGD)
       │
       ▼
 🔥 IOGP Risk Scorer & Causality Graph Engine (ReactFlow)
       │
       ▼
 🍃 Hybrid Persistence: MongoDB Atlas (kanishkskcet_db_user) + SQLite Fallback
```

- **Backend**: Python 3.13, FastAPI, Uvicorn, Scikit-Learn, PyTorch, PyMongo, SQLAlchemy.
- **Frontend**: React 19, Vite, Recharts, ReactFlow, Framer Motion, Vanilla CSS.
- **Database**: MongoDB Atlas M0 (512MB) + SQLite embedded edge database.

---

## 🚀 Quick Start

### 1. Backend Service
```bash
cd sif-sense/backend
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --port 8000
```
Backend API will be running at `http://localhost:8000` with Swagger documentation at `http://localhost:8000/docs`.

### 2. Frontend Web Application
```bash
cd sif-sense/frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 👥 Contributors & License

- **Author**: SK-Kanishk ([@SK-Kanishk](https://github.com/SK-Kanishk))
- **Project**: SIF-Sense AI Early Warning System
- **License**: MIT
# NLP
# OIL
