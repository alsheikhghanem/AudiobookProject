from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import edge_tts
import os

# Initialize FastAPI app
app = FastAPI(title="TTS Local Server")

# Allow requests from our future local HTML frontend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Define the data structure the API expects to receive
class TTSRequest(BaseModel):
    text: str
    voice: str = "ar-SA-HamedNeural"
    rate: str = "+0%"


@app.get("/")
def read_root():
    return {"status": "Server is running perfectly!"}


@app.post("/api/tts")
async def generate_tts(request: TTSRequest):
    output_file = "temp_audio.mp3"

    # Remove old file if it exists to avoid conflicts
    if os.path.exists(output_file):
        os.remove(output_file)

    print(f"Generating audio... Voice: {request.voice}, Rate: {request.rate}")

    # Generate the audio file
    communicate = edge_tts.Communicate(request.text, request.voice, rate=request.rate)
    await communicate.save(output_file)

    # Return the generated MP3 file to the frontend
    return FileResponse(
        output_file,
        media_type="audio/mpeg",
        filename="audiobook.mp3"
    )
