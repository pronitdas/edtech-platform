ARG CUDA_VERSION="12.6.3"
ARG CUDNN_VERSION=""
ARG UBUNTU_VERSION="22.04"
ARG MAX_JOBS=4

FROM nvidia/cuda:${CUDA_VERSION}-cudnn${CUDNN_VERSION}-devel-ubuntu${UBUNTU_VERSION}

# Ensure NVIDIA runtime makes GPUs visible
ENV NVIDIA_VISIBLE_DEVICES=all

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        wget \
        curl \
        unzip \
        git \
        python3 \
        python3-pip \
        python3-packaging \
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
        python3-dev \
        libasound-dev \
        portaudio19-dev && \
    ln -s /usr/bin/python3 /usr/bin/python && \
    rm -rf /var/lib/apt/lists/*

# Install PyTorch with CUDA support
RUN pip3 install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# Pre-download Whisper model to cache
RUN pip3 install --no-cache-dir openai-whisper && \
    python3 -c "import whisper; whisper.load_model('base')"

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --default-timeout=1000  --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Pre-load models
RUN python -c 'from marker.models import load_all_models; load_all_models()'

# Create temporary directory
RUN mkdir -p /app/temp

# Expose API port
EXPOSE 8000

# Set the default command
CMD ["uvicorn", "v2:app", "--host", "0.0.0.0", "--port", "8000"]