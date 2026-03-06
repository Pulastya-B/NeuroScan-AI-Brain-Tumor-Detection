from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base

class UserRole(str, enum.Enum):
    doctor = "doctor"
    patient = "patient"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'doctor' or 'patient'
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Doctor-specific
    specialization = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    hospital = Column(String, nullable=True)

    # Patient-specific
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    medical_history = Column(String, nullable=True)

    # Relationships
    scans = relationship("Scan", back_populates="patient", foreign_keys="Scan.patient_id")
    doctor_scans = relationship("Scan", back_populates="doctor", foreign_keys="Scan.doctor_id")
    notifications = relationship("Notification", back_populates="user", foreign_keys="Notification.user_id")
