from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.auth import UserResponse

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def get_all_doctors(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doctors = db.query(User).filter(User.role == "doctor").all()
    return doctors
