# ---- Stage 1: Build the React frontend ----
FROM node:20-slim AS frontend-build

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Python backend + serve frontend ----
FROM python:3.11-slim

# System deps for OpenCV, ultralytics
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxrender1 libxext6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ .

# Copy the YOLO model
COPY backend/model.pt ./model.pt

# Copy built frontend into /app/static (FastAPI serves from here)
COPY --from=frontend-build /frontend/dist ./static

# Create upload + data dirs writable by HF Spaces user (uid 1000)
RUN mkdir -p uploads && chmod 777 uploads
RUN chmod 777 /app

# Expose the port HF Spaces expects
EXPOSE 7860

# Run with uvicorn on port 7860
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
