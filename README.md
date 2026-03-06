---
title: NeuroScan AI
emoji: 🧠
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# 🧠 NeuroScan AI — Brain Tumor Detection Platform

A full-stack web application for AI-powered brain tumor detection built for a Minor Project.  
Upgrades a simple Gradio demo into a production-ready clinical platform with role-based auth, 3D landing page, doctor/patient dashboards, real-time notifications, and YOLO-powered detection.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| 3D Graphics | Three.js + React Three Fiber |
| Animations | Framer Motion |
| Backend | FastAPI (Python) |
| Database | PostgreSQL + SQLAlchemy |
| Auth | JWT (python-jose + bcrypt) |
| AI Model | YOLOv8 (Ultralytics) |
| Charts | Recharts |

---

## 📁 Project Structure

```
brain-tumor-detection/
├── backend/
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   │   ├── auth.py    # Register, login, /me
│   │   │   ├── scans.py   # Upload, detect, review
│   │   │   ├── patients.py
│   │   │   ├── doctors.py
│   │   │   └── notifications.py
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/
│   │   │   └── detection.py   # YOLO inference
│   │   ├── core/
│   │   │   ├── config.py      # Settings
│   │   │   ├── database.py    # DB connection
│   │   │   └── security.py    # JWT utils
│   │   └── main.py
│   ├── model.pt           # ← Place your YOLO model here
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── 3d/
    │   │   │   └── BrainScene.jsx    # Three.js 3D brain
    │   │   └── shared/
    │   │       └── DashboardLayout.jsx
    │   ├── pages/
    │   │   ├── LandingPage.jsx       # 3D hero landing
    │   │   ├── AuthPages.jsx         # Login + Register
    │   │   ├── DoctorDashboard.jsx
    │   │   ├── PatientDashboard.jsx
    │   │   └── ScanDetail.jsx
    │   ├── hooks/
    │   │   └── useAuth.jsx           # Auth context + API
    │   └── App.jsx
    └── package.json
```

---

## 🚀 Setup & Run

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL running locally

### 1. Database Setup
```bash
psql -U postgres
CREATE DATABASE neuroscan_db;
\q
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy your YOLO model
cp /path/to/your/model.pt ./model.pt

# Configure environment
cp .env .env.local   # Edit DATABASE_URL if needed

# Run the server
uvicorn app.main:app --reload --port 8000
```
Backend runs at: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```
Frontend runs at: **http://localhost:3000**

---

## 🎯 Features

### Landing Page
- Interactive 3D brain visualization (Three.js + R3F)
- Animated neural particle system
- Feature showcase, how-it-works, tumor type cards
- Separate CTAs for Doctor and Patient portals

### Authentication
- Separate Doctor and Patient registration flows
- JWT-based secure auth with 24hr token expiry
- Role-based route protection
- Doctor fields: specialization, license, hospital
- Patient fields: age, gender, blood group, medical history

### Doctor Dashboard
- Stats: total patients, scans, tumors detected, pending reviews
- Recent scans table with detection results
- Tumor type distribution pie chart
- Patient roster with quick access
- Scan detail view with clinical notes + diagnosis form
- Review submission → auto-notifies patient

### Patient Dashboard
- Drag-and-drop MRI upload (JPG/PNG)
- Doctor assignment dropdown
- Scan history with result badges
- Real-time status tracking
- Detailed scan view with AI results + confidence bar

### AI Detection (YOLO)
- Runs YOLOv8 on uploaded scan in background
- Detects: **Glioma**, **Meningioma**, **Pituitary tumor**, **No Tumor**
- Returns bounding boxes, confidence scores, annotated image
- Falls back to mock detection if model.pt not present (dev mode)

### Notifications
- Real-time notification bell with unread count
- Auto-polls every 15 seconds
- Triggered on: scan complete, doctor review submitted
- Type-coded: alert (red), success (green), info (blue)

---

## 🧠 YOLO Model Integration

Your existing `model.pt` file needs to be placed in the `backend/` directory.

Expected class IDs (adjust in `app/services/detection.py` if different):
```python
class_names = {
    0: "glioma",
    1: "meningioma",
    2: "no_tumor",
    3: "pituitary"
}
```

If Ultralytics is not installed or model.pt is missing, the system uses **mock detection** for development — returning randomized realistic results so the UI is fully functional.

---

## 🔒 API Endpoints

### Auth
- `POST /api/auth/register/doctor` — Doctor signup
- `POST /api/auth/register/patient` — Patient signup
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/auth/me` — Get current user

### Scans
- `POST /api/scans/upload` — Upload + auto-detect
- `GET /api/scans/` — User's own scans
- `GET /api/scans/all` — All scans (doctor only)
- `GET /api/scans/stats` — Scan statistics
- `GET /api/scans/{id}` — Scan detail
- `PUT /api/scans/{id}/review` — Doctor review (doctor only)

### Notifications
- `GET /api/notifications/` — User's notifications
- `GET /api/notifications/unread-count` — Badge count
- `PUT /api/notifications/{id}/read` — Mark as read
- `PUT /api/notifications/mark-all-read` — Mark all read

---

## 🎓 Project Info

**Minor Project** — Brain Tumor Detection using Deep Learning  
Stack: FastAPI + PostgreSQL + React + Three.js + YOLOv8
