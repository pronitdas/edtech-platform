import logging
import base64
import io
import re
from typing import Dict, Tuple, List, Any, Optional

import fitz  # PyMuPDF
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PDFProcessor:
    """Processor for PDF files."""
    
    @staticmethod
    def convert_single_pdf(file_data: bytes) -> Tuple[str, Dict[str, Any], Dict[str, Any]]:
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

    @staticmethod
    def process_pdf(file_data: bytes) -> Tuple[str, Dict[str, Any], Dict[str, Any]]:
        """Process PDF file and return (markdown, images, metadata)."""
        try:
            return PDFProcessor.convert_single_pdf(file_data)
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            raise

    @staticmethod
    def parse_pdf_to_textbook(pdf_text: str) -> Dict:
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

    @staticmethod
    def convert_tree_to_textbook(tree: Dict, knowledge_id: int, knowledge_name: str) -> Dict:
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

    @staticmethod
    def walk_textbook(textbook: Dict, knowledge_id: int) -> List[Dict]:
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

    @staticmethod
    def process_pdf_text_to_index(pdf_text: str, knowledge_id: int, knowledge_name: str) -> Tuple[Dict, List[Dict]]:
        """
        Integrated function that:
          1. Parses the raw PDF text into a hierarchical tree.
          2. Converts the tree into a textbook structure.
          3. Flattens the textbook into a list of chapter records.
        
        Returns a tuple (textbook, chapters).
        """
        tree = PDFProcessor.parse_pdf_to_textbook(pdf_text)
        textbook = PDFProcessor.convert_tree_to_textbook(tree, knowledge_id, knowledge_name)
        chapters = PDFProcessor.walk_textbook(textbook, knowledge_id)
        return textbook, chapters

    @staticmethod
    def prepare_images_for_upload(images: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Prepare images for upload by decoding base64 data.
        Returns a dict mapping filenames to image data objects.
        """
        prepared_images = {}
        for img_filename, img_data in images.items():
            try:
                image_buffer = base64.b64decode(img_data["data"])
                prepared_images[img_filename] = {
                    "buffer": image_buffer,
                    "format": img_data["format"],
                    "width": img_data["width"],
                    "height": img_data["height"],
                    "page": img_data["page"],
                }
            except Exception as e:
                logger.error(f"Error preparing image {img_filename} for upload: {str(e)}")
                continue
        
        return prepared_images
