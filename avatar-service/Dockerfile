FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    wget \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Clone Wav2Lip
RUN git clone https://github.com/Rudrabha/Wav2Lip.git /app/Wav2Lip

# Install python dependencies
COPY requirements.txt .
# Install torch with CPU support for max compatibility, 
# If deployed on a real GPU machine, you can change this to a CUDA index
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Download model weights using HuggingFace mirrors
RUN mkdir -p /app/Wav2Lip/face_detection/detection/sfd && \
    wget -O /app/Wav2Lip/face_detection/detection/sfd/s3fd.pth "https://huggingface.co/camenduru/Wav2Lip/resolve/main/checkpoints/s3fd.pth" && \
    wget -O /app/Wav2Lip/checkpoints/wav2lip_gan.pth "https://huggingface.co/camenduru/Wav2Lip/resolve/main/checkpoints/wav2lip_gan.pth"

# Copy our FastAPI app
COPY main.py /app/main.py

# Create I/O directories
RUN mkdir -p /app/input /app/output

# Add an idle video to the input folder (the user should replace this)
# For now, we will use a dummy placeholder if needed, but the user is expected to supply 'idle.mp4'

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
