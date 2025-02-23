import logging
import os
import json
import threading
import time
import base64
import io
import uuid
from datetime import datetime
from typing import Dict, Optional

import fitz  # PyMuPDF
from PIL import Image
from queue import Queue, Empty  # FIX: Import Empty correctly here

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI initialization
app = FastAPI(title="Knowledge Processing API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase configuration
SUPABASE_URL = 'https://onyibiwnfwxatadlkygz.supabase.co'
SUPABASE_KEY = "";


supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Simple job queue
job_queue = Queue()
processing_thread = None
is_processing = False

# -----------------------------
# Models
# -----------------------------
class ProcessingStatus(BaseModel):
    knowledge_id: int
    status: Optional[str] = ""
    message: Optional[str] = ""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    result: Optional[Dict] = None

class PDFResponse(BaseModel):
    markdown: str
    images: Dict[str, str]  # filename -> base64-encoded image data
    metadata: Dict

# -----------------------------
# PDF Conversion
# -----------------------------
def convert_single_pdf(file_data: bytes, model_list=None) -> tuple:
    """
    Convert a single PDF file to markdown, extracting images and metadata.
    Returns: (markdown_text, images_dict, metadata_dict)
    """
    try:
        pdf_document = fitz.open(stream=file_data, filetype="pdf")
        markdown_text = []
        images = {}
        metadata = {
            "title": pdf_document.metadata.get("title", ""),
            "author": pdf_document.metadata.get("author", ""),
            "pages": len(pdf_document),
            "format": "PDF",
            "creation_date": pdf_document.metadata.get("creationDate", ""),
            "modification_date": pdf_document.metadata.get("modDate", ""),
        }

        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]

            # Extract text
            text = page.get_text()
            markdown_text.append(text)

            # Extract images
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]
                    base_image = pdf_document.extract_image(xref)
                    image_data = base_image["image"]

                    # Get image format (png, jpeg, etc.)
                    image_format = base_image["ext"].lower()
                    if not image_format:
                        image_format = "png"  # default fallback

                    # Convert to PIL Image for potential re-processing
                    image = Image.open(io.BytesIO(image_data))

                    # Generate unique filename
                    image_filename = f"image_{page_num + 1}_{img_index + 1}.{image_format}"

                    # Convert to base64
                    buffered = io.BytesIO()
                    image.save(buffered, format=image_format.upper())
                    img_str = base64.b64encode(buffered.getvalue()).decode()

                    images[image_filename] = {
                        "data": img_str,
                        "format": image_format,
                        "width": image.width,
                        "height": image.height,
                        "page": page_num + 1,
                    }
                except Exception as img_error:
                    logger.error(
                        f"Error processing image {img_index} on page {page_num + 1}: {str(img_error)}"
                    )
                    continue

        return "\n\n".join(markdown_text), images, metadata

    except Exception as e:
        logger.error(f"Error converting PDF: {str(e)}")
        raise

def process_pdf(file_data: bytes) -> tuple:
    """Process PDF file and return (markdown, images, metadata)."""
    try:
        return convert_single_pdf(file_data)
    except Exception as e:
        logger.error(f"Error processing PDF: {str(e)}")
        raise

import re
def parse_pdf_to_textbook(pdf_text: str):
    """
    Parse raw PDF text into a hierarchical tree structure.
    
    Each node is a dict with keys:
      - title: the heading title
      - content: accumulated text under this node
      - children: list of child nodes

    This function uses multiple regex patterns for headings and skips lines
    that match page markers (e.g. "Page 5/45").
    """
    lines = pdf_text.splitlines()
    
    # Regex to skip page markers, e.g., "Page 5/45"
    page_marker_regex = re.compile(r'^\s*Page\s+\d+/\d+\s*$')
    
    # Define heading patterns with an associated level.
    heading_patterns = [
        (re.compile(r'^\s*#\s+(.*)'), 1),         # Markdown H1 (e.g., "# Chapter One ...")
        (re.compile(r'^\s*##\s+(.*)'), 2),        # Markdown H2
        (re.compile(r'^\s*###\s+(.*)'), 3),       # Markdown H3
        # Patterns for "Chapter" headings (case-insensitive)
        (re.compile(r'^\s*(Chapter|CHAPTER)\s+([\w\s]+)(?:[:.-]\s*(.*))?'), 1),
        # Patterns for "Section" headings
        (re.compile(r'^\s*(Section|SECTION)\s+([\w\.]+)(?:[:.-]\s*(.*))?'), 2),
        # Roman numeral headings (e.g., "I. Introduction")
        (re.compile(r'^\s*([IVXLCDM]+)\.\s+(.*)'), 1),
        # Numeric headings with decimals (e.g., "1.1 Title")
        (re.compile(r'^\s*(\d+(?:\.\d+)+)\s+(.*)'), 2),
    ]
    
    # The root of our tree.
    root = {"title": "Document", "content": "", "children": []}
    # Stack: each element is a tuple (level, node)
    stack = [(0, root)]
    current_content = []
    
    def flush_content():
        if current_content:
            # Append the joined content to the current node (top of stack).
            stack[-1][1]["content"] += "\n".join(current_content).strip() + "\n"
            current_content.clear()
    
    for line in lines:
        # Skip empty lines and page markers.
        if not line.strip() or page_marker_regex.match(line):
            continue

        matched = False
        for pattern, level in heading_patterns:
            m = pattern.match(line)
            if m:
                flush_content()
                # For Markdown patterns, use group(1); for others, try group(3) then group(2)
                if pattern.pattern.startswith(r'^\s*#'):
                    heading_title = m.group(1).strip()
                else:
                    if m.lastindex and m.lastindex >= 3 and m.group(3):
                        heading_title = m.group(3).strip()
                    elif m.lastindex and m.lastindex >= 2 and m.group(2):
                        heading_title = m.group(2).strip()
                    else:
                        heading_title = m.group(0).strip()
                new_node = {"title": heading_title, "content": "", "children": []}
                # Pop from the stack until the top has a level lower than current.
                while stack and stack[-1][0] >= level:
                    stack.pop()
                stack[-1][1]["children"].append(new_node)
                stack.append((level, new_node))
                matched = True
                break
        if not matched:
            current_content.append(line)
    flush_content()
    return root


def insert_chapters_to_db(knowledge_id: int, chapters: Dict) -> None:
    """Insert analyzed chapters into the database"""
    try:
        # Insert chapters in batches
        batch_size = 30
        for i in range(0, len(chapters), batch_size):
            batch = chapters[i:i + batch_size]
            response = supabase.table("chapters_v1").insert(batch).execute()
            if hasattr(response, 'error') and response.error:
                raise Exception(f"Error inserting chapters: {response.error}")
            
        logger.info(f"Successfully inserted {len(chapters)} chapters for knowledge_id {knowledge_id}")
        
    except Exception as e:
        logger.error(f"Error inserting chapters: {str(e)}")
        raise

# -----------------------------
# Database / Supabase helpers
# -----------------------------
def update_knowledge_status(knowledge_id: int, status: str, metadata: Optional[Dict] = None):
    """Update knowledge status and metadata in Supabase."""
    try:
        update_data = {"status": status}
        if metadata is not None:
            # Convert dict to JSON string
            update_data["metadata"] = json.dumps(metadata)

        response = (
            supabase.table("knowledge")
            .update(update_data)
            .eq("id", knowledge_id)
            .execute()
        )
        
    except Exception as e:
        logger.error(f"Error updating knowledge status: {str(e)}")

def walk_textbook(textbook: dict, knowledge_id: int):
    """
    Flatten the textbook structure into a list of chapter records.
    Each record is a dict with keys:
      id, topic, subtopic, chaptertitle, chapter, lines, knowledge_id, k_id.
    """
    result = []
    id_counter = 1
    for subtopic_index, subtopic in enumerate(textbook.get("subtopics", [])):
        for chapter in subtopic.get("chapters", []):
            content = chapter.get("content", "")
            lines_count = len(content.splitlines()) if content else 0
            result.append({
                "id": id_counter,
                "topic": textbook.get("topic", ""),
                "subtopic": f"{subtopic.get('title', '')} {subtopic_index + 1}",
                "chaptertitle": chapter.get("title", ""),
                "chapter": content,
                "lines": lines_count,
                "knowledge_id": int(knowledge_id),
                "k_id": int(knowledge_id)
            })
            id_counter += 1
    return result
def convert_tree_to_textbook(tree: dict, knowledge_id: int, knowledge_name: str):
    """
    Convert the hierarchical tree (from parse_pdf_to_textbook) into a textbook dict:
      {
         "topic": <knowledge_name>,
         "knowledge_id": <knowledge_id>,
         "subtopics": [ { "title": ..., "startLine": 0, "chapters": [ { "title": ..., "content": ... }, ... ] }, ... ]
      }
    In this conversion, each direct child of the root becomes a subtopic.
    """
    textbook = {
        "topic": knowledge_name,
        "knowledge_id": knowledge_id,
        "subtopics": []
    }
    
    def process_node(node):
        """Flatten node children into chapters."""
        chapters = []
        for child in node.get("children", []):
            # If the child itself has children, consider each as a chapter.
            if child.get("children"):
                for grandchild in child["children"]:
                    chapters.append({
                        "title": grandchild["title"],
                        "content": grandchild.get("content", "").strip()
                    })
            else:
                chapters.append({
                    "title": child["title"],
                    "content": child.get("content", "").strip()
                })
        return chapters

    # Use each direct child of the root as a subtopic.
    for subtopic in tree.get("children", []):
        subtopic_obj = {
            "title": subtopic["title"],
            "startLine": 0,  # We do not track exact line numbers here.
            "chapters": []
        }
        # If the subtopic node has direct content, add it as a "Notes" chapter.
        if subtopic.get("content", "").strip():
            subtopic_obj["chapters"].append({
                "title": "Notes",
                "content": subtopic["content"].strip()
            })
        chapters = process_node(subtopic)
        subtopic_obj["chapters"].extend(chapters)
        textbook["subtopics"].append(subtopic_obj)
    return textbook
def process_pdf_text_to_index(pdf_text: str, knowledge_id: int, knowledge_name: str):
    """
    Integrated function that:
      1. Parses the raw PDF text into a hierarchical tree.
      2. Converts the tree into a textbook structure.
      3. Flattens the textbook into a list of chapter records.
    
    Returns a tuple (textbook, chapters).
    """
    tree = parse_pdf_to_textbook(pdf_text)
    textbook = convert_tree_to_textbook(tree, knowledge_id, knowledge_name)
    chapters = walk_textbook(textbook, knowledge_id)
    return textbook, chapters
# -----------------------------
# Main Worker Function
# -----------------------------
def process_knowledge(knowledge_id: int) -> None:
    """Process a single knowledge entry from the queue."""
    try:
        # Update initial status
        update_knowledge_status(knowledge_id, "processing", {"message": "Starting PDF processing"})

        # Retrieve knowledge row
        knowledge = (
            supabase.table("knowledge")
            .select("*")
            .eq("id", knowledge_id)
            .eq("seeded", False)
            .execute()
        )

        if not knowledge.data:
            raise Exception(f"No unseeded knowledge entry found with id={knowledge_id}.")

        # If 'filename' is stored as a string in your DB, just do:
        #   filename = knowledge.data[0]["filename"]
        # If it's stored as a list (like ["somefile.pdf"]), then do:
        #   filename = knowledge.data[0]["filename"][0]
        # Adjust this as needed:
        filename_field = knowledge.data[0]["filename"]
        if isinstance(filename_field, list):
            filename = filename_field[0]
        else:
            filename = filename_field

        # Fetch the file from Supabase storage
        # NOTE: adjust path if needed. If you're uploading to "doc/{knowledge_id}/..."
        # then your download path must match exactly.
        file_path = f"media/doc/{knowledge_id}/{filename}"  # Adjust as needed
        response = supabase.storage.from_("media").download(file_path)

        # Process the PDF
        markdown, images, metadata = process_pdf(response)

        # Upload each extracted image (in base64) to Supabase
        image_urls = {}
        # for img_filename, img_data in images.items():
        #     try:
        #         image_buffer = base64.b64decode(img_data["data"])
        #         storage_path = f"images/{knowledge_id}/{img_filename}"

        #         upload_response = supabase.storage.from_("media").upload(
        #             storage_path,
        #             image_buffer,
        #             {"contentType": f"image/{img_data['format']}"}
        #         )
               
        #         image_urls[img_filename] = {
        #             "url": storage_path,
        #             "metadata": {
        #                 "width": img_data["width"],
        #                 "height": img_data["height"],
        #                 "page": img_data["page"],
        #             },
        #         }
        #     except Exception as img_error:
        #         logger.error(f"Failed to upload image {img_filename}: {str(img_error)}")
        #         continue

        # Analyze content and insert chapters
        textbook, chapters = process_pdf_text_to_index(markdown, knowledge_id=knowledge.data[0]["id"],knowledge_name=knowledge.data[0]["name"])
   
        with open("textbook.txt", "w") as temp_file:
            temp_file.write(json.dumps(textbook))
        with open("chapters.txt", "w") as temp_file:
            temp_file.write(json.dumps(chapters))
        # Insert chapters into database
        insert_chapters_to_db(knowledge_id, chapters)

        # Build final metadata to store in 'knowledge' table
        result = {
            "markdown": markdown,
            "metadata": metadata,
            "analysis": textbook,
            "image_urls": image_urls,
            "processed_at": datetime.utcnow().isoformat(),
        }

        # Update status to processed
        update_knowledge_status(knowledge_id, "processed", result)

    except Exception as e:
        logger.error(f"Failed to process knowledge {knowledge_id}: {str(e)}")
        update_knowledge_status(knowledge_id, "failed", {"error": str(e)})

# -----------------------------
# Queue / Worker Thread
# -----------------------------
def process_queue():
    """Process items in the queue."""
    global is_processing
    while True:
        try:
            knowledge_id = job_queue.get(timeout=1)  # 1-second timeout
            is_processing = True
            process_knowledge(knowledge_id)
        except Empty:  # FIX: Correct queue.Empty to Empty
            is_processing = False
            break
        except Exception as e:
            logger.error(f"Error in processing thread: {str(e)}")
            is_processing = False
            break

def ensure_processing_thread():
    """Ensure the processing thread is running."""
    global processing_thread, is_processing
    if processing_thread is None or not processing_thread.is_alive():
        if not is_processing:
            processing_thread = threading.Thread(target=process_queue)
            processing_thread.daemon = True
            processing_thread.start()

# -----------------------------
# Routes
# -----------------------------
@app.get("/process/{knowledge_id}")
def start_processing(knowledge_id: int):
    """Start processing a knowledge entry."""
    try:
        # Check if knowledge exists
        knowledge = (
            supabase.table("knowledge")
            .select("*")
            .eq("id", knowledge_id)
            .eq("seeded", False)
            .execute()
        )
        if not knowledge.data:
            raise HTTPException(404, "Knowledge not found or already seeded.")

        # If it's in progress or 'seeded' is True, block re-queue
        if knowledge.data[0].get("seeded") is True:
            raise HTTPException(400, "Knowledge is already being processed or seeded.")

        # Add to queue
        job_queue.put(knowledge_id)
        ensure_processing_thread()

        return {
            "knowledge_id": knowledge_id,
            "status": "queued",
            "message": "Knowledge processing has been queued.",
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to start processing: {str(e)}")
        raise HTTPException(500, f"Failed to start processing: {str(e)}")


@app.get("/process/{knowledge_id}/status")
def get_processing_status(knowledge_id: int):
    """Get the current processing status."""
    try:
        knowledge = supabase.table("knowledge").select("*").eq("id", knowledge_id).execute()
        if not knowledge.data:
            raise HTTPException(404, "Knowledge not found")

        data = knowledge.data[0]
        return ProcessingStatus(
            knowledge_id=knowledge_id,
            status=data.get("status", "unknown"),
            result=json.loads(data.get("metadata", "{}")) if data.get("metadata") else None
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Failed to get status: {str(e)}")
        raise HTTPException(500, f"Failed to get status: {str(e)}")


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """
    A quick endpoint to test how your PDF is being read and
    how text/images are extracted (not used in the queue system).
    """
    try:
        contents = await file.read()
        pdf_document = fitz.open(stream=contents, filetype="pdf")

        markdown_text = []
        images = {}
        metadata = {
            "title": pdf_document.metadata.get("title", ""),
            "author": pdf_document.metadata.get("author", ""),
            "pages": len(pdf_document),
            "format": "PDF",
        }

        for page_num in range(len(pdf_document)):
            page = pdf_document[page_num]

            # Extract text
            text = page.get_text()
            markdown_text.append(text)

            # Extract images
            image_list = page.get_images(full=True)
            for img_index, img in enumerate(image_list):
                xref = img[0]
                base_image = pdf_document.extract_image(xref)
                image_data = base_image["image"]

                # Convert to PIL Image
                image = Image.open(io.BytesIO(image_data))

                # Generate unique filename
                image_filename = f"image_{page_num + 1}_{img_index + 1}.png"

                # Convert to base64 for direct return
                buffered = io.BytesIO()
                image.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode()

                images[image_filename] = img_str

        return JSONResponse({
            "markdown": "\n\n".join(markdown_text),
            "images": images,
            "metadata": metadata
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Run locally (for testing with: python yourfilename.py)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
