ARG CUDA_VERSION="12.6.3"
ARG CUDNN_VERSION=""
ARG UBUNTU_VERSION="22.04"
ARG MAX_JOBS=4

FROM runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel-ubuntu22.04

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
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip3 install --default-timeout=1000  --no-cache-dir -r requirements.txt  --ignore-installed blinker
# Install PyTorch with CUDA support
RUN pip3 install --no-cache-dir torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118  --ignore-installed blinker  

# Pre-download Whisper model to cache
RUN pip3 install --no-cache-dir openai-whisper  --ignore-installed blinker && \
    python3 -c "import whisper; whisper.load_model('base')"
# Copy application code
COPY . .

# Create temporary directory
RUN mkdir -p /app/temp

# Expose API port
EXPOSE 8000

# Set the default command
CMD ["uvicorn", "v2:app", "--host", "0.0.0.0", "--port", "8000"]
