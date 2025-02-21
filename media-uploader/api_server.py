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
from marker.convert import convert_single_pdf
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
# Function to parse PDF and return markdown, metadata, and image data
def parse_pdf_and_return_markdown(pdf_file: bytes, extract_images: bool, model_list, output_folder: str):
    """
    Function to parse a PDF and extract text and images.

    Args:
    pdf_file (bytes): The content of the PDF file.
    extract_images (bool): Whether to extract images or not.
    output_folder (str): Path to save the extracted assets.

    Returns:
    tuple: A tuple containing the full text, metadata, and image data (if extracted).
    """
    logger.debug("Parsing PDF file")
    full_text, images, out_meta = convert_single_pdf(pdf_file, model_list)
    logger.debug(f"Images extracted: {list(images.keys())}")
    image_data = {}

    # Save images if extraction is enabled
    if extract_images:
        image_folder = os.path.join(output_folder, "images")
        os.makedirs(image_folder, exist_ok=True)

        for i, (filename, image) in enumerate(images.items()):
            image_filename = os.path.join(image_folder, filename)
            logger.debug(f"Saving image {filename} to {image_filename}")
            image.save(image_filename, "PNG")
            image_data[filename] = image_filename

    return full_text, out_meta, image_data

def process_pdf_file(file_content: bytes, filename: str, model_list, output_folder: str):
    """
    Function to process a single PDF file.

    Args:
    file_content (bytes): The content of the PDF file.
    filename (str): The name of the PDF file.
    model_list: The list of loaded models.
    output_folder (str): Path to save the extracted assets.

    Returns:
    dict: A dictionary containing the filename, markdown text, metadata, image data, status, and processing time.
    """
    entry_time = time.time()
    logger.info(f"Entry time for {filename}: {entry_time}")
    markdown_text, metadata, image_data = parse_pdf_and_return_markdown(
        file_content, extract_images=True, model_list=model_list, output_folder=output_folder
    )
    completion_time = time.time()
    logger.info(f"Model processes complete time for {filename}: {completion_time}")
    time_difference = completion_time - entry_time

    # Save markdown and metadata to files
    markdown_file = os.path.join(output_folder, f"{filename}_content.md")
    metadata_file = os.path.join(output_folder, f"{filename}_metadata.json")

    logger.debug(f"Saving markdown to {markdown_file}")
    with open(markdown_file, "w", encoding="utf-8") as md_file:
        md_file.write(markdown_text)

    logger.debug(f"Saving metadata to {metadata_file}")
    with open(metadata_file, "w", encoding="utf-8") as json_file:
        json.dump(metadata, json_file, indent=4)

    return {
        "filename": filename,
        "markdown_file": markdown_file,
        "metadata_file": metadata_file,
        "images": image_data,
        "status": "ok",
        "time": time_difference,
    }

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