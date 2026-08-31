import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class ReportModel(Base):
    __tablename__ = "reports"

    report_id = Column(String(64), primary_key=True, default=lambda: f"OIL-{uuid.uuid4().hex[:8].upper()}")
    external_ref = Column(String(64), unique=True, index=True)
    title = Column(String(255))
    report_type = Column(String(32), nullable=False)
    report_date = Column(String(32), nullable=False, index=True)
    site = Column(String(128), nullable=False, index=True)
    activity = Column(String(128), nullable=False, index=True)
    narrative_text = Column(Text, nullable=False)
    actual_severity = Column(String(32), default="NONE")
    contractor_involved = Column(Boolean, default=False)
    difficulty_category = Column(String(64), default="standard")
    
    # Store complete structured pipeline outputs as JSON for fast dashboard retrieval
    extraction_json = Column(JSON, nullable=True)
    assessment_json = Column(JSON, nullable=True)
    rule_mappings_json = Column(JSON, nullable=True)
    precursor_chain_json = Column(JSON, nullable=True)
    embedding_vector = Column(JSON, nullable=True)
    extracted_images = Column(JSON, default=list)
    version_tags = Column(JSON, nullable=True)

    # Review workflow fields
    review_status = Column(String(32), default="PENDING", index=True)
    reviewed_by = Column(String(128), nullable=True)
    review_decision = Column(String(32), nullable=True)
    review_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    audit_id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String(64), index=True)
    actor = Column(String(128), nullable=False)
    event_type = Column(String(64), nullable=False)
    payload = Column(JSON, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
