from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
import io
from PIL import Image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock authentic images - in real app, load from database
authentic_images = {
    "paracetamol": "path/to/authentic/paracetamol.jpg",  # placeholder
    "amoxicillin": "path/to/authentic/amoxicillin.jpg",
    "ibuprofen": "path/to/authentic/ibuprofen.jpg"
}

def analyze_image(uploaded_image: bytes, medicine_name: str):
    # Load uploaded image
    uploaded = Image.open(io.BytesIO(uploaded_image))
    uploaded_cv = cv2.cvtColor(np.array(uploaded), cv2.COLOR_RGB2BGR)
    
    # In real app, load authentic image from DB
    # For demo, use a mock score
    authenticity_score = np.random.randint(70, 100)  # Mock score
    
    if authenticity_score >= 85:
        result = "Authentic"
        confidence = "High"
    elif authenticity_score >= 70:
        result = "Suspicious"
        confidence = "Medium"
    else:
        result = "Counterfeit"
        confidence = "Low"
    
    return {
        "authenticity_score": int(authenticity_score),
        "confidence": confidence,
        "result": result
    }

@app.post("/analyze-image")
async def analyze_image_endpoint(file: UploadFile = File(...), medicine_name: str = "paracetamol"):
    contents = await file.read()
    result = analyze_image(contents, medicine_name)
    return result