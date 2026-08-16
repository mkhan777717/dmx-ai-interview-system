from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse
import os
import subprocess
import uuid
import shutil

# We expect an idle video to exist at this path
BASE_VIDEO_PATH = "/app/input/idle.mp4"
WAV2LIP_SCRIPT = "/app/Wav2Lip/inference.py"
CHECKPOINT_PATH = "/app/Wav2Lip/checkpoints/wav2lip_gan.pth"


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Wav2Lip Service Started")
    if not os.path.exists(BASE_VIDEO_PATH):
        print(f"WARNING: Base video not found at {BASE_VIDEO_PATH}. "
              f"You must supply an idle.mp4 to generate videos.")
    yield


app = FastAPI(title="Wav2Lip Avatar Service", lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok", "ready": os.path.exists(BASE_VIDEO_PATH)}

@app.post("/generate")
async def generate_video(audio: UploadFile = File(...)):
    """
    Receives a WAV audio file, runs Wav2Lip inference against the base video,
    and returns the resulting MP4 file.
    """
    if not os.path.exists(BASE_VIDEO_PATH):
        raise HTTPException(status_code=500, detail="Base video (idle.mp4) not found in /app/input/")

    job_id = str(uuid.uuid4())
    audio_path = f"/app/input/{job_id}.wav"
    output_path = f"/app/output/{job_id}.mp4"

    try:
        # Save uploaded audio
        with open(audio_path, "wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)

        # Run Wav2Lip inference
        # Using a subprocess call to inference.py ensures we don't have to 
        # mess with sys.path or global state inside FastAPI
        cmd = [
            "python", WAV2LIP_SCRIPT,
            "--checkpoint_path", CHECKPOINT_PATH,
            "--face", BASE_VIDEO_PATH,
            "--audio", audio_path,
            "--outfile", output_path,
            # Adjust these for speed vs quality on CPU/GPU
            "--nosmooth",
            "--pads", "0", "10", "0", "0"
        ]

        print(f"[{job_id}] Running Wav2Lip...")
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"[{job_id}] Wav2Lip Error: {result.stderr}")
            raise HTTPException(status_code=500, detail=f"Wav2Lip processing failed: {result.stderr[-200:]}")

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Wav2Lip completed but output video not found")

        # Return the generated video
        return FileResponse(output_path, media_type="video/mp4", filename=f"{job_id}.mp4")

    finally:
        # Cleanup audio (keep output for debugging, or cleanup later)
        if os.path.exists(audio_path):
            os.remove(audio_path)
