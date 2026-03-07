from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # File info
    original_filename = Column(String, nullable=False)
    stored_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    result_image_path = Column(String, nullable=True)  # YOLO annotated image

    # Detection results
    status = Column(String, default="pending")  # pending, processing, completed, failed
    tumor_detected = Column(Boolean, nullable=True)
    tumor_type = Column(String, nullable=True)  # glioma, meningioma, pituitary, no_tumor
    confidence = Column(Float, nullable=True)
    bounding_boxes = Column(JSON, nullable=True)  # YOLO detection boxes
    
    # Doctor review
    doctor_notes = Column(Text, nullable=True)
    doctor_diagnosis = Column(Text, nullable=True)
    doctor_severity = Column(String, nullable=True)  # urgent | routine | follow_up
    is_reviewed = Column(Boolean, default=False)
    reviewed_at = Column(DateTime, nullable=True)

    # Report
    report_path = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("User", back_populates="scans", foreign_keys=[patient_id])
    doctor = relationship("User", back_populates="doctor_scans", foreign_keys=[doctor_id])
