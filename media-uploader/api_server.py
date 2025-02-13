import os
import time
import tempfile
import base64
import json
import logging
import shutil

from fastapi import FastAPI, File, UploadFile, HTTPException
import uvicorn

# Import the PDF processing method from your existing file.
from marker_api.pdf_parser import process_pdf_file
from marker.models import load_all_models

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load models once at startup (adjust if you need per-request initialization)
model_list = load_all_models()

app = FastAPI(
    title="PDF Parser API",
    description="Converts uploaded PDF files to markdown, extracts metadata and images.",
    version="1.0",
)

@app.post("/upload-pdf", summary="Upload a PDF and get extracted content")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")

    try:
        # Read PDF content from the uploaded file.
        pdf_content = await file.read()
        # Create a temporary directory for file output.
        temp_dir = tempfile.mkdtemp()
        base_filename = os.path.splitext(file.filename)[0]

        result = process_pdf_file(pdf_content, base_filename, model_list, temp_dir)
    except Exception as e:
        logger.exception("Error processing PDF file")
        raise HTTPException(status_code=500, detail=str(e))

    try:
        with open(result["markdown_file"], "r", encoding="utf-8") as md_file:
            markdown_text = md_file.read()
        with open(result["metadata_file"], "r", encoding="utf-8") as meta_file:
            metadata = json.load(meta_file)
    except Exception as e:
        logger.exception("Error reading processed files")
        raise HTTPException(status_code=500, detail="Error reading output files")

    # Process images: encode images as base64 strings.
    images = {}
    for img_name, img_path in result["images"].items():
        try:
            with open(img_path, "rb") as img:
                encoded_img = base64.b64encode(img.read()).decode("utf-8")
                images[img_name] = encoded_img
        except Exception as e:
            logger.error(f"Error processing image {img_name}: {e}")

    # Clean up the temporary directory.
    shutil.rmtree(temp_dir, ignore_errors=True)

    return {
        "markdown": markdown_text,
        "metadata": metadata,
        "images": images,
        "processing_time": result["time"],
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 