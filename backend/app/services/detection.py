import os
import uuid
import shutil
import logging
from pathlib import Path
from typing import Optional, Tuple
from app.core.config import settings

logger = logging.getLogger(__name__)

def _patch_torch_load():
    """Patch torch.load for compatibility with YOLOv10 custom weights on PyTorch 2.6+."""
    try:
        import torch
        _original_load = torch.load
        def _patched_load(*args, **kwargs):
            kwargs.setdefault('weights_only', False)
            return _original_load(*args, **kwargs)
        torch.load = _patched_load
        logger.info("Patched torch.load with weights_only=False for YOLOv10 compat")
    except Exception as e:
        logger.warning(f"Could not patch torch.load: {e}")

# Apply patch once at import time
_patch_torch_load()

def run_yolo_detection(image_path: str) -> dict:
    """
    Run YOLO model on the given image path.
    Returns detection results including tumor type, confidence, and bounding boxes.
    """
    try:
        # Import YOLOv10 from THU-MIG package (installed via git+https://github.com/THU-MIG/yolov10.git)
        from ultralytics import YOLOv10
        import cv2
        import numpy as np

        logger.info(f"Loading YOLOv10 model from {settings.MODEL_PATH}")
        model = YOLOv10(settings.MODEL_PATH)
        logger.info(f"Running inference on {image_path}")
        results = model.predict(image_path, imgsz=640, conf=settings.CONFIDENCE_THRESHOLD)

        detections = []
        tumor_detected = False
        tumor_type = "no_tumor"
        confidence = 0.0

        # Class names mapping — best2.pt has 2 classes: Brain-Tumor and eye
        class_names = {
            0: "brain_tumor",
            1: "eye",
        }

        for result in results:
            boxes = result.boxes
            if boxes is not None and len(boxes) > 0:
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    bbox = box.xyxy[0].tolist()
                    
                    detected_class = class_names.get(cls_id, "unknown")
                    
                    detections.append({
                        "class": detected_class,
                        "confidence": conf,
                        "bbox": bbox
                    })

                    # Only count brain_tumor as a positive detection (ignore eye)
                    if detected_class == "brain_tumor" and conf > confidence:
                        tumor_detected = True
                        tumor_type = "brain_tumor"
                        confidence = conf

        # Save annotated result image
        result_filename = f"result_{uuid.uuid4().hex}.jpg"
        result_path = os.path.join(settings.UPLOAD_DIR, "results", result_filename)
        os.makedirs(os.path.dirname(result_path), exist_ok=True)
        
        if results and len(results) > 0:
            annotated = results[0].plot()
            import cv2
            cv2.imwrite(result_path, annotated)

        return {
            "success": True,
            "tumor_detected": tumor_detected,
            "tumor_type": tumor_type,
            "confidence": confidence,
            "bounding_boxes": detections,
            "result_image_path": result_path if os.path.exists(result_path) else None
        }

    except ImportError as e:
        logger.warning(f"YOLO/ultralytics not installed, using mock detection: {e}")
        return _mock_detection(image_path)
    except Exception as e:
        logger.error(f"YOLO detection failed: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "tumor_detected": False,
            "tumor_type": "unknown",
            "confidence": 0.0,
            "bounding_boxes": [],
            "result_image_path": None
        }

def _mock_detection(image_path: str) -> dict:
    """Mock detection for development without YOLO installed."""
    import random
    import shutil
    
    tumor_types = ["glioma", "meningioma", "pituitary", "no_tumor"]
    detected_type = random.choice(tumor_types)
    tumor_detected = detected_type != "no_tumor"
    confidence = random.uniform(0.72, 0.98) if tumor_detected else random.uniform(0.85, 0.99)
    
    # Copy original as "result" for mock
    result_filename = f"result_{uuid.uuid4().hex}.jpg"
    result_path = os.path.join(settings.UPLOAD_DIR, "results", result_filename)
    os.makedirs(os.path.dirname(result_path), exist_ok=True)
    
    try:
        shutil.copy2(image_path, result_path)
    except Exception:
        result_path = image_path

    return {
        "success": True,
        "tumor_detected": tumor_detected,
        "tumor_type": detected_type,
        "confidence": round(confidence, 4),
        "bounding_boxes": [
            {
                "class": detected_type,
                "confidence": round(confidence, 4),
                "bbox": [120, 80, 340, 300]
            }
        ] if tumor_detected else [],
        "result_image_path": result_path
    }

def save_upload_file(upload_file, destination: str) -> str:
    """Save an uploaded file to disk."""
    os.makedirs(os.path.dirname(destination), exist_ok=True)
    with open(destination, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return destination
