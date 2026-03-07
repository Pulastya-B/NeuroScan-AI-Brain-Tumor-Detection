import os
import uuid
import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, WebSocket, WebSocketDisconnect, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.core.security import get_current_user, get_current_doctor
from app.models.user import User
from app.models.scan import Scan
from app.models.notification import Notification
from app.schemas.scan import ScanResponse, DoctorReview, ScanStats
from app.services.detection import run_yolo_detection, save_upload_file
from app.core.config import settings
from app.api.ws import ws_manager

router = APIRouter()

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "dcm"}

def get_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

def process_scan_background(scan_id: int, image_path: str, db_url: str, event_loop=None):
    """Background task to run YOLO detection."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    engine = create_engine(db_url, connect_args=connect_args)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return
        
        scan.status = "processing"
        db.commit()
        if event_loop:
            ws_manager.notify_from_thread(scan_id, {"scan_id": scan_id, "status": "processing"}, event_loop)

        logger.info(f"Starting YOLO detection for scan {scan_id}, image: {image_path}")
        result = run_yolo_detection(image_path)
        logger.info(f"Detection result for scan {scan_id}: success={result.get('success')}, tumor={result.get('tumor_type')}, error={result.get('error', 'none')}")

        scan.status = "completed" if result["success"] else "failed"
        scan.tumor_detected = result.get("tumor_detected")
        scan.tumor_type = result.get("tumor_type")
        scan.confidence = result.get("confidence")
        scan.bounding_boxes = result.get("bounding_boxes")
        scan.result_image_path = result.get("result_image_path")
        db.commit()
        if event_loop:
            ws_manager.notify_from_thread(scan_id, {
                "scan_id": scan_id,
                "status": scan.status,
                "tumor_detected": scan.tumor_detected,
                "tumor_type": scan.tumor_type,
                "confidence": scan.confidence,
            }, event_loop)

        # Notify patient
        tumor_detected = result.get("tumor_detected", False)
        notif = Notification(
            user_id=scan.patient_id,
            title="Scan Analysis Complete",
            message=f"Your MRI scan has been analyzed. {'A tumor was detected. Please consult your doctor.' if tumor_detected else 'No tumor detected. Results look normal.'}",
            type="alert" if tumor_detected else "success",
            related_scan_id=scan_id
        )
        db.add(notif)

        # Notify assigned doctor if any
        if scan.doctor_id:
            doc_notif = Notification(
                user_id=scan.doctor_id,
                title="New Scan Ready for Review",
                message=f"A patient scan has been processed. {'Tumor detected - requires urgent review.' if tumor_detected else 'No tumor detected - please review results.'}",
                type="alert" if tumor_detected else "info",
                related_scan_id=scan_id
            )
            db.add(doc_notif)
        
        db.commit()
    except Exception as e:
        logger.error(f"Background scan processing failed for scan {scan_id}: {e}", exc_info=True)
        try:
            scan = db.query(Scan).filter(Scan.id == scan_id).first()
            if scan:
                scan.status = "failed"
                db.commit()
        except:
            pass
    finally:
        db.close()

@router.post("/upload", response_model=ScanResponse)
async def upload_scan(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    doctor_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ext = get_extension(file.filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Use: {', '.join(ALLOWED_EXTENSIONS)}")
    
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    unique_name = f"{uuid.uuid4().hex}.{ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, "scans", unique_name)
    os.makedirs(os.path.dirname(upload_path), exist_ok=True)
    
    save_upload_file(file, upload_path)

    scan = Scan(
        patient_id=current_user.id if current_user.role == "patient" else current_user.id,
        doctor_id=doctor_id,
        original_filename=file.filename,
        stored_filename=unique_name,
        file_path=upload_path,
        status="pending"
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    background_tasks.add_task(
        process_scan_background,
        scan.id,
        upload_path,
        settings.DATABASE_URL,
        getattr(request.app.state, 'event_loop', None)
    )

    return _enrich_scan(scan, db)

@router.get("/", response_model=List[ScanResponse])
def get_scans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "patient":
        scans = db.query(Scan).filter(Scan.patient_id == current_user.id).order_by(Scan.created_at.desc()).all()
    else:
        scans = db.query(Scan).filter(Scan.doctor_id == current_user.id).order_by(Scan.created_at.desc()).all()
    return [_enrich_scan(s, db) for s in scans]

@router.get("/all", response_model=List[ScanResponse])
def get_all_scans(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Doctors can see all scans."""
    scans = db.query(Scan).order_by(Scan.created_at.desc()).all()
    return [_enrich_scan(s, db) for s in scans]

@router.get("/stats", response_model=ScanStats)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Scan)
    if current_user.role == "patient":
        query = query.filter(Scan.patient_id == current_user.id)
    
    scans = query.all()
    return ScanStats(
        total_scans=len(scans),
        tumor_detected=sum(1 for s in scans if s.tumor_detected),
        no_tumor=sum(1 for s in scans if s.tumor_detected == False),
        pending=sum(1 for s in scans if s.status == "pending"),
        reviewed=sum(1 for s in scans if s.is_reviewed)
    )

@router.get("/analytics")
def get_analytics(
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    """Detailed analytics for doctors — weekly trends, detection rates, type breakdown."""
    from datetime import timedelta
    all_scans = db.query(Scan).order_by(Scan.created_at.asc()).all()
    now = datetime.utcnow()

    # Last 8 weeks of scan activity
    weekly_data = []
    for i in range(7, -1, -1):
        week_start = now - timedelta(weeks=i + 1)
        week_end = now - timedelta(weeks=i)
        week_scans = [s for s in all_scans if week_start <= s.created_at < week_end]
        weekly_data.append({
            "week": week_start.strftime("%b %d"),
            "scans": len(week_scans),
            "tumors": sum(1 for s in week_scans if s.tumor_detected),
        })

    # Tumor type distribution
    type_counts: dict = {}
    for s in all_scans:
        if s.tumor_type:
            label = s.tumor_type.replace("_", " ").title()
            type_counts[label] = type_counts.get(label, 0) + 1
    type_distribution = [{"name": k, "value": v} for k, v in type_counts.items()]

    # Aggregate stats
    completed = [s for s in all_scans if s.status == "completed"]
    total_completed = len(completed)
    positive = [s for s in completed if s.tumor_detected]
    detection_rate = round(len(positive) / total_completed * 100, 1) if total_completed else 0.0
    conf_values = [s.confidence for s in completed if s.confidence is not None]
    avg_confidence = round(sum(conf_values) / len(conf_values) * 100, 1) if conf_values else 0.0
    reviewed = [s for s in completed if s.is_reviewed]
    review_rate = round(len(reviewed) / total_completed * 100, 1) if total_completed else 0.0
    total_patients = db.query(User).filter(User.role == "patient").count()

    return {
        "weekly_scans": weekly_data,
        "type_distribution": type_distribution,
        "detection_rate": detection_rate,
        "avg_confidence": avg_confidence,
        "review_rate": review_rate,
        "total_patients": total_patients,
        "total_scans": len(all_scans),
        "total_positive": len(positive),
    }


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(
    scan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    if current_user.role == "patient" and scan.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return _enrich_scan(scan, db)

@router.put("/{scan_id}/review", response_model=ScanResponse)
def review_scan(
    scan_id: int,
    review: DoctorReview,
    current_user: User = Depends(get_current_doctor),
    db: Session = Depends(get_db)
):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    scan.doctor_id = current_user.id
    scan.doctor_notes = review.doctor_notes
    scan.doctor_diagnosis = review.doctor_diagnosis
    scan.doctor_severity = review.doctor_severity
    scan.is_reviewed = True
    scan.reviewed_at = datetime.utcnow()
    db.commit()

    # Notify patient
    notif = Notification(
        user_id=scan.patient_id,
        title="Doctor Has Reviewed Your Scan",
        message=f"Dr. {current_user.full_name} has reviewed your MRI scan and added their diagnosis. Check your scan results for details.",
        type="info",
        related_scan_id=scan_id
    )
    db.add(notif)
    db.commit()
    db.refresh(scan)
    return _enrich_scan(scan, db)

@router.websocket("/{scan_id}/ws")
async def scan_status_websocket(scan_id: int, websocket: WebSocket, db: Session = Depends(get_db)):
    """Real-time scan status updates via WebSocket."""
    await ws_manager.connect(scan_id, websocket)
    try:
        # Push current state immediately on connect
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            await websocket.send_json({
                "scan_id": scan_id,
                "status": scan.status,
                "tumor_detected": scan.tumor_detected,
                "tumor_type": scan.tumor_type,
                "confidence": scan.confidence,
            })
        # Keep alive — ping every 25s, exit on client disconnect
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=25.0)
            except asyncio.TimeoutError:
                await websocket.send_json({"ping": True})
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        ws_manager.disconnect(scan_id, websocket)


def _enrich_scan(scan: Scan, db: Session) -> dict:
    data = {c.name: getattr(scan, c.name) for c in scan.__table__.columns}
    patient = db.query(User).filter(User.id == scan.patient_id).first()
    doctor = db.query(User).filter(User.id == scan.doctor_id).first() if scan.doctor_id else None
    data["patient_name"] = patient.full_name if patient else None
    data["doctor_name"] = doctor.full_name if doctor else None
    return data
