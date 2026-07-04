FROM python:3.11-slim-bookworm

WORKDIR /app

# Install system dependencies for Raspberry Pi
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
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python dependencies
# Note: picamera2 and GPIO libs will be installed only on ARM architecture
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/data/faces \
    /app/data/events \
    /app/data/models \
    /app/data/logs

ENV PYTHONUNBUFFERED=1
ENV HARDWARE_MODE=development

CMD ["python", "-u", "main.py"]