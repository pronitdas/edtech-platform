# Use an official PyTorch base image with CUDA support
ARG CUDA_VERSION=12.1.0
ARG UBUNTU_VERSION=22.04

FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04

# Ensure NVIDIA runtime makes GPUs visible
ENV NVIDIA_VISIBLE_DEVICES=all
ENV SUPABASE_URL=
ENV SUPABASE_KEY=
ENV OPENAI_API_KEY=
# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    curl \
    unzip \
    git \
    python3-pip \
    python3-dev \
    libgl1 \
    libglib2.0-0 \
    gnupg2 \
    ca-certificates \
    apt-transport-https \
    software-properties-common \
    libreoffice \
    ffmpeg \
    git-lfs \
    xvfb \
    libgl1-mesa-glx \
    libsndfile1 \
    libportaudio2 \
    libasound-dev \
    portaudio19-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and setuptools
RUN pip3 install --no-cache-dir --upgrade pip setuptools wheel  

# Copy requirements first to leverage Docker cache
COPY requirements.txt ./

# Install Python dependencies in stages to handle potential conflicts
# RUN pip3 install --no-cache-dir \
#     numpy \
#     torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118  

# Install remaining dependencies
RUN pip3 install --no-cache-dir -r requirements.txt --ignore-installed blinker

# Pre-download Whisper model to cache  pip3 install --no-cache-dir openai-whisper --ignore-installed blinker && \
RUN python3 -c "import whisper; whisper.load_model('base')"

# Copy application code
COPY . .

# Pre-load models
# RUN python -c 'from marker.models import load_all_models; load_all_models()'

# Create temporary directory
RUN mkdir -p /app/temp

# Expose API port
EXPOSE 8000

# Set the default command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
