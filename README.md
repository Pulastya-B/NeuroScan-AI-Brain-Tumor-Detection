---
title: NeuroScan AI
emoji: 🧠
colorFrom: indigo
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
---

# NeuroScan AI — Brain Tumor Detection Platform

A full-stack clinical web platform for AI-powered brain MRI analysis. Built as a Minor Project, it provides role-based portals for doctors and patients, real-time scan processing via YOLOv10, and a 3D interactive landing page.

**Live demo:** [huggingface.co/spaces/Pulasty/Brain-Tumor-Detection](https://huggingface.co/spaces/Pulasty/Brain-Tumor-Detection)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| 3D / Animation | Three.js, React Three Fiber, Framer Motion |
| Charts | Recharts |
| Backend | FastAPI, SQLAlchemy 2, SQLite |
| Auth | JWT (python-jose + bcrypt) |
| AI Model | YOLOv10 (Ultralytics fork, THU-MIG) |
| AI Chatbot | Mistral AI |
| Deployment | Docker on Hugging Face Spaces |

---

## Project Structure

```
brain-tumor-detection/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py           # Register, login, /me
│   │   │   ├── scans.py          # Upload, detect, review, analytics, WebSocket
│   │   │   ├── chat.py           # Mistral AI chatbot proxy
│   │   │   ├── doctors.py
│   │   │   ├── patients.py
│   │   │   └── notifications.py
│   │   ├── models/               # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/
│   │   │   └── detection.py      # YOLOv10 inference + mock fallback
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   └── main.py
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── components/
        │   ├── 3d/BrainScene.jsx
        │   └── shared/DashboardLayout.jsx
        ├── pages/
        │   ├── LandingPage.jsx
        │   ├── AuthPages.jsx
        │   ├── DoctorDashboard.jsx
        │   ├── PatientDashboard.jsx
        │   ├── ScanDetail.jsx
        │   └── Analytics.jsx
        ├── hooks/useAuth.jsx
        └── App.jsx
```

---

## Local Setup

**Prerequisites:** Python 3.10+, Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Place your YOLOv10 model weights
cp /path/to/your/model.pt ./model.pt

uvicorn app.main:app --reload --port 8000
```

API runs at `http://localhost:8000` · Swagger docs at `/docs`

The database is SQLite and is created automatically on first run — no setup needed.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

Set `VITE_API_URL=http://localhost:8000` in `frontend/.env` if the backend is on a different port.

---

## Features

### Landing Page
- Interactive 3D brain model (GLB via Three.js + React Three Fiber)
- Neural particle animation, scroll-linked transitions
- Feature cards, how-it-works section, separate CTAs for doctor and patient portals

### Authentication
- Role-based registration (Doctor / Patient) with separate field sets
- JWT tokens, 24-hour expiry, protected routes per role
- Doctor: specialization, license number, hospital affiliation
- Patient: age, gender, blood group, medical history

### Patient Portal
- Drag-and-drop MRI upload (JPEG/PNG)
- Assign a doctor on upload
- Scan history with status badges and confidence scores
- Real-time status updates via WebSocket (falls back to polling)
- Scan detail view: bounding box overlay on MRI, AI findings, doctor review

### Doctor Portal
- Overview stats: total patients, scans analyzed, detections, pending reviews
- Full scan queue with filtering; annotate severity (urgent / routine / follow-up)
- Write clinical notes and submit a diagnosis — patient is notified automatically
- Patient roster with scan history per patient
- Analytics dashboard: weekly scan volume, detection type breakdown, aggregate stats

### AI Detection
- YOLOv10 runs in a background thread after upload
- Returns detected class, confidence score, and bounding box coordinates
- Class names read dynamically from `model.names` — no hardcoded mapping needed
- If `model.pt` is absent at startup, the service falls back to mock detection so the UI remains fully testable

### AI Chatbot
- Floating chat widget on all pages
- Powered by Mistral AI; strictly scoped to medical and platform-related queries

### Notifications
- Bell icon with unread count, auto-polled every 15 seconds
- Events: scan processing complete, doctor review submitted
- Color-coded by type (alert, success, info)

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/doctor` | — | Doctor signup |
| POST | `/api/auth/register/patient` | — | Patient signup |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user |
| POST | `/api/scans/upload` | Patient | Upload MRI + trigger detection |
| GET | `/api/scans/` | JWT | User's own scans |
| GET | `/api/scans/all` | Doctor | All scans |
| GET | `/api/scans/stats` | Doctor | Aggregate stats |
| GET | `/api/scans/analytics` | Doctor | Analytics dashboard data |
| GET | `/api/scans/{id}` | JWT | Scan detail |
| PUT | `/api/scans/{id}/review` | Doctor | Submit review |
| WS | `/api/scans/{id}/ws` | — | Real-time scan status |
| POST | `/api/chat` | JWT | Chatbot query |
| GET | `/api/notifications/` | JWT | User's notifications |
| PUT | `/api/notifications/{id}/read` | JWT | Mark as read |

---

## Model

The model weights (`model.pt`) and the 3D brain asset (`brain.glb`) are stored in a separate Hugging Face model repo ([Pulasty/brain-tumor-model](https://huggingface.co/Pulasty/brain-tumor-model)) and are downloaded at Docker build time. They are not checked into this repository.

The model was trained on a 2-class dataset (brain tumor present / not present). Class names are loaded directly from the model file, so swapping in a different checkpoint with more classes requires no code changes.

---

## Deployment

The app is containerised with a multi-stage Dockerfile (Node 20 build → Python 3.11 runtime) and deployed on Hugging Face Spaces. The frontend is built by Vite and served as static files by FastAPI.

---

*Minor Project — Brain Tumor Detection using Deep Learning*
