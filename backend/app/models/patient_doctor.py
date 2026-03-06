from sqlalchemy import Column, Integer, ForeignKey, DateTime
from datetime import datetime
from app.core.database import Base

class PatientDoctor(Base):
    __tablename__ = "patient_doctor"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
