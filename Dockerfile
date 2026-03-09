# ---- Stage 1: Build the React frontend ----
FROM node:20-slim AS frontend-build

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Python backend + serve frontend ----
FROM python:3.11-slim

# System deps for OpenCV, ultralytics, and git (needed to pip install from GitHub)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Download model and brain GLB from dedicated HF model repo at BUILD time.
# This avoids relying on the fragile LFS/Xet init step in HF Spaces.
# Docker build has reliable outbound network; init step sometimes has DNS failures.
RUN python -c "\
from huggingface_hub import hf_hub_download; \
import shutil, os; \
p = hf_hub_download(repo_id='Pulasty/brain-tumor-model', filename='model.pt', repo_type='model'); \
shutil.copy(p, '/app/model.pt'); \
print('model.pt downloaded:', os.path.getsize('/app/model.pt'), 'bytes')"

RUN python -c "\
from huggingface_hub import hf_hub_download; \
import shutil, os; \
p = hf_hub_download(repo_id='Pulasty/brain-tumor-model', filename='brain.glb', repo_type='model'); \
os.makedirs('/app/static', exist_ok=True); \
shutil.copy(p, '/app/static/brain.glb'); \
print('brain.glb downloaded:', os.path.getsize('/app/static/brain.glb'), 'bytes')"

# Copy built frontend into /app/static (FastAPI serves from here)
COPY --from=frontend-build /frontend/dist ./static

# Create upload + data dirs writable by HF Spaces user (uid 1000)
RUN mkdir -p uploads && chmod 777 uploads
RUN chmod 777 /app

# Prevent huggingface_hub / ultralytics from making outbound network calls at startup.
# Without these, the container fails with "curl: (6) Could not resolve host: huggingface.co"
# during the HF Spaces init step.
ENV HF_HUB_OFFLINE=1
ENV HF_HUB_DISABLE_TELEMETRY=1
ENV YOLO_VERBOSE=False

# Expose the port HF Spaces expects
EXPOSE 7860

# Run with uvicorn on port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
