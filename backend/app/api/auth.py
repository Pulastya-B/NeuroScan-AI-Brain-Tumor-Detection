from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token, get_current_user
)
from app.models.user import User
from app.schemas.auth import DoctorRegister, PatientRegister, Token, UserResponse
from app.core.config import settings

router = APIRouter()

@router.post("/register/doctor", response_model=UserResponse, status_code=201)
def register_doctor(data: DoctorRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role="doctor",
        phone=data.phone,
        specialization=data.specialization,
        license_number=data.license_number,
        hospital=data.hospital
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/register/patient", response_model=UserResponse, status_code=201)
def register_patient(data: PatientRegister, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role="patient",
        phone=data.phone,
        age=data.age,
        gender=data.gender,
        blood_group=data.blood_group,
        medical_history=data.medical_history
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "full_name": user.full_name
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_profile(updates: dict, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    allowed = ["full_name", "phone", "specialization", "hospital", "age", "gender", "blood_group", "medical_history"]
    for key, value in updates.items():
        if key in allowed:
            setattr(current_user, key, value)
    db.commit()
    db.refresh(current_user)
    return current_user
