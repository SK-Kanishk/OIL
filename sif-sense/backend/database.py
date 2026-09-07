"""
SIF-Sense AI — Database Models & Setup
SQLAlchemy ORM with SQLite
"""

from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Boolean,
    DateTime, Text, JSON, ForeignKey
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

DATABASE_URL = "sqlite:///./sif_sense.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # NLP Extraction
    location = Column(String(200), nullable=True)
    activity = Column(String(200), nullable=True)
    hazard = Column(String(200), nullable=True)
    unsafe_act = Column(String(300), nullable=True)
    unsafe_condition = Column(String(300), nullable=True)
    barrier_failure = Column(String(300), nullable=True)
    incident_type = Column(String(100), nullable=True)

    # AI Classification
    sif_potential = Column(Boolean, default=False)
    model_score = Column(Float, default=0.0)
    model_confidence = Column(Float, default=0.0)
    classification_method = Column(String(50), default="rule_based")

    # Risk Score
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="LOW")
    score_severity = Column(Integer, default=0)
    score_exposure = Column(Integer, default=0)
    score_barrier = Column(Integer, default=0)
    score_pattern = Column(Integer, default=0)
    score_indicators = Column(Integer, default=0)

    # Metadata
    iogp_rule = Column(String(200), nullable=True)
    evidence = Column(JSON, nullable=True)

    # Relationships
    alert = relationship("Alert", back_populates="report", uselist=False)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    title = Column(String(300), nullable=False)
    location = Column(String(200), nullable=True)
    activity = Column(String(200), nullable=True)
    barrier_failure = Column(String(300), nullable=True)
    risk_score = Column(Integer, default=0)
    risk_level = Column(String(20), default="HIGH")
    related_reports_count = Column(Integer, default=0)
    status = Column(String(30), default="PENDING")  # PENDING, ACCEPTED, REJECTED, ESCALATED
    hse_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    ai_recommendation = Column(Text, nullable=True)

    report = relationship("Report", back_populates="alert")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)
