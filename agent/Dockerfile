FROM python:3.11-slim-bookworm

WORKDIR /app

# Install system dependencies for Raspberry Pi
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libopenblas-dev \
    libgfortran5 \
    libatlas-base-dev \
    libjpeg-dev \
    libpng-dev \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    libv4l-dev \
    libxvidcore-dev \
    libx264-dev \
    libgtk-3-dev \
    libcanberra-gtk3-module \
    python3-dev \
    gcc \
    g++ \
    cmake \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create data directories
RUN mkdir -p /data/faces \
    /data/events \
    /data/models \
    /data/logs

ENV PYTHONUNBUFFERED=1
ENV HARDWARE_MODE=raspberry_pi
ENV DATA_DIR=/data

CMD ["python", "-u", "main.py"]