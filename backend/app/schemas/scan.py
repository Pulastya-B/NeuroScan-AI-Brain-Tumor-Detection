from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ScanCreate(BaseModel):
    doctor_id: Optional[int] = None

class ScanResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: Optional[int] = None
    original_filename: str
    file_path: str
    result_image_path: Optional[str] = None
    status: str
    tumor_detected: Optional[bool] = None
    tumor_type: Optional[str] = None
    confidence: Optional[float] = None
    bounding_boxes: Optional[Any] = None
    doctor_notes: Optional[str] = None
    doctor_diagnosis: Optional[str] = None
    is_reviewed: bool
    reviewed_at: Optional[datetime] = None
    report_path: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None

    class Config:
        from_attributes = True

class DoctorReview(BaseModel):
    doctor_notes: str
    doctor_diagnosis: str

class ScanStats(BaseModel):
    total_scans: int
    tumor_detected: int
    no_tumor: int
    pending: int
    reviewed: int
