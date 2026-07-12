FROM python:3.12-slim-bookworm

WORKDIR /app

# Install system dependencies for Raspberry Pi
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libgl1 \
#     libglib2.0-0 \
#     libsm6 \
#     libxext6 \
#     libxrender1 \
#     libgomp1 \
#     libopenblas-dev \
#     libgfortran5 \
#     libatlas-base-dev \
#     libjpeg-dev \
#     libpng-dev \
#     libavcodec-dev \
#     libavformat-dev \
#     libswscale-dev \
#     libv4l-dev \
#     libxvidcore-dev \
#     libx264-dev \
#     libgtk-3-dev \
#     libcanberra-gtk3-module \
#     python3-dev \
#     gcc \
#     g++ \
#     cmake \
#     libcamera-dev \
#     libcamera-apps \
#     && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    pkg-config \
    cmake \
    libcap-dev \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libopenblas-dev \
    libgfortran5 \
    libjpeg-dev \
    libpng-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libgtk-3-0 \
    libcanberra-gtk3-module \
    gcc \
    g++ \
    libcamera-dev \
    libcamera-apps \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python dependencies
# Note: picamera2 and GPIO libs will be installed only on ARM architecture
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

# Create data directories
RUN mkdir -p /data/faces \
    /data/events \
    /data/models \
    /data/logs

# Download required models (anti-spoofing, etc.)
RUN python scripts/download_models.py --skip-optional || \
    echo "Warning: Optional models download failed - some features may be unavailable"

ENV PYTHONUNBUFFERED=1
ENV HARDWARE_MODE=raspberry_pi
ENV DATA_DIR=/data

CMD ["python", "-u", "main.py"]