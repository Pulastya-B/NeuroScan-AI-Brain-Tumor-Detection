from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None

class DoctorRegister(UserBase):
    password: str
    role: str = "doctor"
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    hospital: Optional[str] = None

class PatientRegister(UserBase):
    password: str
    role: str = "patient"
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    medical_history: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    full_name: str

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime
    specialization: Optional[str] = None
    license_number: Optional[str] = None
    hospital: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    medical_history: Optional[str] = None

    class Config:
        from_attributes = True
