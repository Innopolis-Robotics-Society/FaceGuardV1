FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libatlas-base-dev \
    libgfortran5 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent code
COPY . .

# Create data directories
RUN mkdir -p /app/data/faces \
    /app/data/events \
    /app/data/models \
    /app/data/logs

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV HARDWARE_MODE=development

# Run agent
CMD ["python", "-u", "main.py"]
