from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, get_current_doctor
from app.models.user import User
from app.models.scan import Scan
from app.schemas.auth import UserResponse

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def get_all_patients(current_user: User = Depends(get_current_doctor), db: Session = Depends(get_db)):
    patients = db.query(User).filter(User.role == "patient").all()
    return patients

@router.get("/{patient_id}", response_model=UserResponse)
def get_patient(patient_id: int, current_user: User = Depends(get_current_doctor), db: Session = Depends(get_db)):
    patient = db.query(User).filter(User.id == patient_id, User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/{patient_id}/scans")
def get_patient_scans(patient_id: int, current_user: User = Depends(get_current_doctor), db: Session = Depends(get_db)):
    scans = db.query(Scan).filter(Scan.patient_id == patient_id).order_by(Scan.created_at.desc()).all()
    return scans
