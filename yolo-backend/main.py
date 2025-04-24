from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
from collections import Counter

app = FastAPI()

# Allow mobile app access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv5 model
model = YOLO("runs/detect/train2/weights/best.pt")  # Replace with your custom model path

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        # Run detection
        results = model.predict(image, imgsz=640)
        names = results[0].names
        classes = results[0].boxes.cls.cpu().numpy()

        if len(classes) == 0:
            return {"labels": []}

        # Convert class IDs to labels
        labels = [names[int(cls)] for cls in classes]

        # Optional: remove duplicates while preserving order
        unique_labels = list(dict.fromkeys(labels))

        return {"labels": unique_labels}

    except Exception as e:
        return {"error": str(e)}