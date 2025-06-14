# Base image with Python and essential build tools
FROM python:3.13-slim

LABEL description="Build environment for convertMaster app with PyInstaller and system dependencies."

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    tesseract-ocr \
    ghostscript \
    p7zip-full \
    curl \
    wget \
    unzip \
    build-essential \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgtk2.0-0 \
    ca-certificates \
    git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy your app's code
COPY ./services/converter /app/converter
COPY ./services/converter-sw /app/

# Install Python dependencies
RUN pip install --no-cache-dir -r converter/requirements.txt \
    && pip install pyinstaller

# Download FFmpeg static binary
RUN apt-get update && apt-get install -y ffmpeg
RUN mkdir -p ffmpeg-bin && cp /usr/bin/ffmpeg ffmpeg-bin/

# Build main application using PyInstaller
RUN GTK_PATH=$(ldconfig -p | grep libgtk-x11-2.0.so.0 | head -n 1 | awk '{print $4}') && \
    pyinstaller \
      --noconfirm --clean --console --name app \
      --onefile --log-level DEBUG \
      --add-data "ffmpeg-bin/ffmpeg:dependencies" \
      --add-data "/usr/bin/tesseract:dependencies/tesseract-ocr" \
      --add-data "/usr/bin/gs:dependencies/ghostscript" \
      --add-data "/usr/bin/7z:dependencies/7zip" \
      --add-data "$GTK_PATH:dependencies/gtk2" \
      --add-data "/usr/bin/libreoffice:dependencies/libreoffice" \
      main.py
