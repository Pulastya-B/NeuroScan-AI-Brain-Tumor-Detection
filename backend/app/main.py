from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from pathlib import Path

from app.api import auth, patients, scans, notifications, doctors
from app.core.database import engine
from app.models import base

# Create tables
base.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="NeuroScan AI - Brain Tumor Detection",
    description="AI-powered brain tumor detection platform for doctors and patients",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for scan uploads
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(doctors.router, prefix="/api/doctors", tags=["Doctors"])
app.include_router(scans.router, prefix="/api/scans", tags=["Scans"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

# ---------- Serve built React frontend ----------
# The Dockerfile builds the frontend into /app/static
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

if STATIC_DIR.is_dir():
    # Serve JS/CSS/assets
    app.mount("/assets", StaticFiles(directory=str(STATIC_DIR / "assets")), name="frontend-assets")

    # Serve other static files (favicon, brain.glb, etc.)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # If a real file exists in static dir, serve it
        file_path = STATIC_DIR / full_path
        if full_path and file_path.is_file():
            return FileResponse(str(file_path))
        # Otherwise serve index.html (SPA client-side routing)
        return FileResponse(str(STATIC_DIR / "index.html"))
else:
    # Local dev – no static build, just API
    @app.get("/")
    def root():
        return {"message": "NeuroScan AI API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}
