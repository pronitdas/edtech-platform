import logging
import base64
import io
import re
import hashlib
import statistics
import os
import json
import time
from typing import Dict, Tuple, List, Any, Optional, Set
from dataclasses import dataclass
from collections import defaultdict
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

import fitz  # PyMuPDF
from PIL import Image
from openai import OpenAI

# Import methods from VideoProcessorV2
from video_processor_v2 import VideoProcessorV2

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TextBlock:
    """Represents a block of text with its properties."""
    text: str
    font_size: float
    font_name: str
    is_bold: bool
    is_italic: bool
    color: int
    bbox: Tuple[float, float, float, float]
    page_num: int
    block_type: str = "normal"  # Can be: title, heading, paragraph, list_item, table, etc.
    level: int = 0

class PDFProcessor:
    """Advanced processor for PDF files with adaptive structure detection."""
    
    # Default OpenAI API Key - should be loaded from environment in production
    DEFAULT_OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
    
    # Default model name
    DEFAULT_OPENAI_MODEL = "gpt-4o-mini"
    
    # Batch processing settings
    DEFAULT_BATCH_SIZE = 3
    DEFAULT_MAX_WORKERS = 4
    
    @staticmethod
    def extract_text_blocks(pdf_document: fitz.Document) -> List[TextBlock]:
        """Extract text blocks with rich formatting information from the entire document."""
        all_blocks = []
        
        for page_num, page in enumerate(pdf_document):
            # Get detailed text with spans to preserve formatting
            text_dict = page.get_text("dict")
            
            for block in text_dict.get("blocks", []):
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        text = span.get("text", "").strip()
                        if not text:
                            continue
                            
                        # Extract all formatting information
                        font_size = span.get("size", 0)
                        font_name = span.get("font", "")
                        flags = span.get("flags", 0)
                        is_bold = bool(flags & 16)  # Font flag for bold is 2^4 (16)
                        is_italic = bool(flags & 1)  # Font flag for italic is 2^0 (1)
                        color = span.get("color", 0)
                        bbox = span.get("bbox", (0, 0, 0, 0))
                        
                        all_blocks.append(TextBlock(
                            text=text,
                            font_size=font_size,
                            font_name=font_name,
                            is_bold=is_bold,
                            is_italic=is_italic,
                            color=color,
                            bbox=bbox,
                            page_num=page_num,
                            block_type="normal",
                            level=0
                        ))
        
        return all_blocks
    
    @staticmethod
    def analyze_document_structure(blocks: List[TextBlock]) -> List[TextBlock]:
        """
        Multi-layered analysis to classify text blocks in the document.
        Uses font metrics, positioning, and content patterns.
        """
        if not blocks:
            return blocks
            
        # Step 1: Analyze font size distribution to identify body text and potential headings
        font_sizes = [block.font_size for block in blocks if block.font_size > 0]
        if not font_sizes:
            return blocks
            
        try:
            # Find the most common font size (likely body text)
            body_font_size = statistics.mode(font_sizes)
        except statistics.StatisticsError:
            # If there's no clear mode, use median
            body_font_size = statistics.median(font_sizes)
        
        # Step 2: Identify potential headings based on font properties
        size_threshold = body_font_size * 1.1  # 10% larger than body text
        
        # Collect all sizes larger than body text for heading level assignment
        heading_sizes = sorted(set(size for size in font_sizes if size > size_threshold), reverse=True)
        heading_levels = {size: idx + 1 for idx, size in enumerate(heading_sizes)}
        
        # Step 3: Collect unique formatting combinations 
        format_combinations = set()
        for block in blocks:
            format_key = (block.font_size, block.is_bold, block.is_italic, block.font_name)
            format_combinations.add(format_key)
        
        # Step 4: Identify patterns in the document
        # Check if the document uses different fonts for headings
        fonts_used = set(block.font_name for block in blocks)
        font_analysis = {}
        
        for font in fonts_used:
            font_blocks = [block for block in blocks if block.font_name == font]
            font_analysis[font] = {
                "count": len(font_blocks),
                "avg_length": sum(len(block.text) for block in font_blocks) / len(font_blocks) if font_blocks else 0,
                "sizes": set(block.font_size for block in font_blocks)
            }
        
        # Step 5: Apply classification using multiple evidence sources
        for block in blocks:
            # Rule 1: Size-based classification
            if block.font_size in heading_levels:
                block.block_type = "heading"
                block.level = heading_levels[block.font_size]
                continue
                
            # Rule 2: Bold text that's not common in document is likely a heading
            bold_blocks = [b for b in blocks if b.is_bold]
            bold_percentage = len(bold_blocks) / len(blocks) if blocks else 0
            
            if block.is_bold and bold_percentage < 0.3:  # If less than 30% of text is bold
                if block.font_size >= body_font_size:
                    block.block_type = "heading"
                    block.level = len(heading_levels) + 1 if heading_levels else 1
                    continue
            
            # Rule 3: Content-based pattern matching for headings
            if len(block.text) < 100:  # Potential heading by length
                text = block.text.strip()
                
                # Check for common heading patterns
                if re.match(r'^(?:chapter|section|part|appendix|figure|table)\s+\d+', text, re.IGNORECASE):
                    block.block_type = "heading"
                    block.level = 1 if text.lower().startswith(("chapter", "part")) else 2
                    continue
                    
                # Numbered headings (1., 1.1, etc.)
                if re.match(r'^\d+(\.\d+)*\.?\s+\S+', text):
                    parts = re.match(r'^\d+(\.\d+)*', text).group(0).count('.') + 1
                    block.block_type = "heading"
                    block.level = parts
                    continue
                    
                # Letter headings (A., B., etc.)
                if re.match(r'^[A-Z]\.(\d+)?\s+\S+', text):
                    block.block_type = "heading"
                    block.level = 2
                    continue
                    
                # Roman numeral headings
                if re.match(r'^[IVXLCDM]+\.\s+\S+', text):
                    block.block_type = "heading"
                    block.level = 1
                    continue
            
            # Rule 4: Detect list items
            if re.match(r'^\s*[-•*]\s+\S+', block.text) or re.match(r'^\s*\d+\.\s+\S+', block.text):
                block.block_type = "list_item"
                continue
                
            # Default is paragraph
            block.block_type = "paragraph"
        
        # Step 6: Fix potential classification errors using contextual information
        # Group by page
        pages = defaultdict(list)
        for block in blocks:
            pages[block.page_num].append(block)
            
        # Check for title on first page
        if 0 in pages and pages[0]:
            first_page_blocks = sorted(pages[0], key=lambda b: b.font_size, reverse=True)
            if first_page_blocks and first_page_blocks[0].font_size > body_font_size * 1.3:
                first_page_blocks[0].block_type = "title"
                
        return blocks
    
    @staticmethod
    def organize_blocks_into_document(blocks: List[TextBlock]) -> Dict:
        """
        Organize the classified blocks into a hierarchical document structure.
        """
        # Sort blocks by page number and vertical position
        sorted_blocks = sorted(blocks, key=lambda b: (b.page_num, b.bbox[1]))
        
        # Root structure
        document = {
            "title": "",
            "content": "",
            "children": []
        }
        
        # Find document title
        title_block = next((b for b in sorted_blocks if b.block_type == "title"), None)
        if title_block:
            document["title"] = title_block.text
        
        # Current section stack - [(level, node), ...]
        section_stack = [(0, document)]
        current_content = []
        
        # Process blocks
        for block in sorted_blocks:
            # Skip title block as it's handled separately
            if block.block_type == "title":
                continue
                
            if block.block_type == "heading":
                # Flush any accumulated content to current section
                if current_content:
                    section_stack[-1][1]["content"] += "\n".join(current_content)
                    current_content = []
                
                # Create new section
                new_section = {
                    "title": block.text,
                    "content": "",
                    "children": [],
                    "level": block.level,
                    "type": "section"
                }
                
                # Adjust stack - pop until we find a parent with a lower level
                while section_stack and section_stack[-1][0] >= block.level:
                    section_stack.pop()
                
                # Add new section to parent's children
                section_stack[-1][1]["children"].append(new_section)
                
                # Push new section onto stack
                section_stack.append((block.level, new_section))
            else:
                # Accumulate content
                current_content.append(block.text)
        
        # Flush any remaining content
        if current_content:
            section_stack[-1][1]["content"] += "\n".join(current_content)
        
        return document
    
    @staticmethod
    def convert_single_pdf(file_data: bytes) -> Tuple[str, Dict[str, Any], Dict[str, Any]]:
        """
        Convert a single PDF file with enhanced structure detection.
        Returns: (text_content, images_dict, metadata_dict)
        """
        try:
            pdf_document = fitz.open(stream=file_data, filetype="pdf")
            
            # Extract metadata
            metadata = {
                "title": pdf_document.metadata.get("title", ""),
                "author": pdf_document.metadata.get("author", ""),
                "subject": pdf_document.metadata.get("subject", ""),
                "keywords": pdf_document.metadata.get("keywords", ""),
                "creator": pdf_document.metadata.get("creator", ""),
                "producer": pdf_document.metadata.get("producer", ""),
                "creation_date": pdf_document.metadata.get("creationDate", ""),
                "modification_date": pdf_document.metadata.get("modDate", ""),
                "format": "PDF",
                "pages": len(pdf_document),
                "is_encrypted": pdf_document.is_encrypted,
                "file_size": len(file_data),
            }
            
            # Extract rich text blocks with formatting
            text_blocks = PDFProcessor.extract_text_blocks(pdf_document)
            
            # Analyze document structure
            classified_blocks = PDFProcessor.analyze_document_structure(text_blocks)
            
            # Organize into hierarchical document
            document_structure = PDFProcessor.organize_blocks_into_document(classified_blocks)
            
            # Extract and convert images
            images = {}
            # for page_num, page in enumerate(pdf_document):
            #     # Get images
            #     image_list = page.get_images(full=True)
                
            #     for img_index, img in enumerate(image_list):
            #         try:
            #             xref = img[0]
            #             base_image = pdf_document.extract_image(xref)
            #             image_bytes = base_image["image"]
                        
            #             # Determine image format
            #             image_format = base_image.get("ext", "").lower()
            #             if not image_format or image_format == "":
            #                 image_format = "png"  # Default format
                        
            #             # Create unique image ID using hash of image data for deduplication
            #             image_hash = hashlib.md5(image_bytes).hexdigest()[:10]
            #             image_filename = f"img_{page_num+1}_{img_index+1}_{image_hash}.{image_format}"
                        
            #             # Process image with PIL for consistency
            #             try:
            #                 pil_image = Image.open(io.BytesIO(image_bytes))
                            
            #                 # Check if image is too small (likely an icon or bullet)
            #                 if pil_image.width < 20 or pil_image.height < 20:
            #                     continue
                                
            #                 # Convert to base64
            #                 buffered = io.BytesIO()
            #                 pil_image.save(buffered, format=image_format.upper())
            #                 img_b64 = base64.b64encode(buffered.getvalue()).decode()
                            
            #                 # Store image with metadata
            #                 images[image_filename] = {
            #                     "data": img_b64,
            #                     "format": image_format,
            #                     "width": pil_image.width,
            #                     "height": pil_image.height,
            #                     "page": page_num + 1,
            #                     "mode": pil_image.mode,
            #                     "hash": image_hash
            #                 }
            #             except Exception as pil_error:
            #                 logger.warning(f"Error processing image with PIL: {str(pil_error)}")
            #                 # Fallback: store raw image without PIL processing
            #                 img_b64 = base64.b64encode(image_bytes).decode()
            #                 images[image_filename] = {
            #                     "data": img_b64,
            #                     "format": image_format,
            #                     "page": page_num + 1,
            #                     "hash": image_hash
            #                 }
            #         except Exception as img_error:
            #             logger.error(f"Error extracting image {img_index} on page {page_num + 1}: {str(img_error)}")
            
            # Generate flat text representation
            text_content = PDFProcessor.document_to_text(document_structure)
            
            return text_content, images, metadata
            
        except Exception as e:
            logger.error(f"Error converting PDF: {str(e)}")
            # Attempt basic text extraction as fallback
            try:
                pdf_document = fitz.open(stream=file_data, filetype="pdf")
                text_content = ""
                for page in pdf_document:
                    text_content += page.get_text()
                
                return text_content, {}, {"format": "PDF", "pages": len(pdf_document)}
            except:
                raise  # Re-raise if even the fallback fails
    
    @staticmethod
    def document_to_text(document: Dict) -> str:
        """Convert document structure to flat text representation with markdown formatting."""
        parts = []
        
        # Add title
        if document.get("title"):
            parts.append(f"# {document['title']}\n")
        
        # Add content
        if document.get("content"):
            parts.append(document["content"])
        
        # Process children recursively
        def process_section(section, depth=1):
            section_parts = []
            
            # Add heading with appropriate number of #
            heading_marks = "#" * (depth + 1)  # +1 because title is h1
            section_parts.append(f"\n{heading_marks} {section['title']}\n")
            
            # Add content
            if section.get("content"):
                section_parts.append(section["content"])
            
            # Process subsections
            for child in section.get("children", []):
                section_parts.append(process_section(child, depth + 1))
            
            return "\n".join(section_parts)
        
        # Process all top-level sections
        for section in document.get("children", []):
            parts.append(process_section(section))
        
        return "\n".join(parts)
    
    @staticmethod
    def process_pdf(file_data: bytes) -> Tuple[str, Dict[str, Any], Dict[str, Any]]:
        """
        Process PDF file with multiple fallback strategies.
        Returns (text_content, images, metadata).
        """
        try:
            # Try enhanced processing with structure detection
            return PDFProcessor.convert_single_pdf(file_data)
        except Exception as e:
            logger.error(f"Enhanced PDF processing failed: {str(e)}")
            
            # Fallback to basic text extraction
            try:
                pdf_document = fitz.open(stream=file_data, filetype="pdf")
                text_content = ""
                for page in pdf_document:
                    text_content += page.get_text() + "\n\n"
                
                return text_content, {}, {"format": "PDF", "pages": len(pdf_document)}
            except Exception as fallback_error:
                logger.error(f"Basic PDF fallback failed: {str(fallback_error)}")
                raise
    
    @staticmethod
    def parse_pdf_to_textbook(pdf_text: str) -> Dict:
        """
        Parse PDF text into a hierarchical structure based on headings.
        Falls back to simpler heading detection when enhanced structure isn't available.
        """
        lines = pdf_text.splitlines()
        logger.info(f"Processing {len(lines)} lines of text")
        
        # Detect markdown headings first (from our enhanced converter)
        markdown_heading_pattern = re.compile(r'^(#+)\s+(.+)$')
        
        # Fallback patterns for heading detection
        fallback_patterns = [
            # Chapter/section patterns
            (re.compile(r'^(Chapter|CHAPTER|Section|SECTION)\s+(\d+|[IVXLCDMivxlcdm]+)(?:[.:]\s*(.+))?', re.IGNORECASE),
             lambda m: (f"{m.group(1)} {m.group(2)}{': ' + m.group(3) if m.group(3) else ''}", 
                      1 if m.group(1).lower() == 'chapter' else 2)),
            
            # Numbered headings (1.2.3)
            (re.compile(r'^(\d+(?:\.\d+)*)\s+(.+)$'),
             lambda m: (f"{m.group(1)} {m.group(2)}", len(m.group(1).split('.')))),
            
            # Single number or letter headings (1. or A.)
            (re.compile(r'^([A-Z0-9])\.\s+(.+)$'),
             lambda m: (f"{m.group(1)}. {m.group(2)}", 1 if m.group(1).isdigit() else 2)),
            
            # Roman numeral headings
            (re.compile(r'^([IVXLCDMivxlcdm]+)\.\s+(.+)$'),
             lambda m: (f"{m.group(1)}. {m.group(2)}", 1)),
            
            # Appendix style headings
            (re.compile(r'^(Appendix|APPENDIX)\s+([A-Z])(?:[.:]\s*(.+))?', re.IGNORECASE),
             lambda m: (f"Appendix {m.group(2)}{': ' + m.group(3) if m.group(3) else ''}", 1)),
            
            # Keywords that typically indicate headings when on their own line
            (re.compile(r'^(Introduction|Conclusion|Summary|Abstract|References|Bibliography|Acknowledgements|Foreword|Preface|Appendix)$', re.IGNORECASE),
             lambda m: (m.group(1), 1)),
        ]
        
        # Initialize document structure
        root = {"title": "Document", "content": "", "children": []}
        stack = [(0, root)]
        current_content = []
        
        # Helper to add accumulated content to current node
        def flush_content():
            if current_content:
                content = "\n".join(current_content).strip()
                if content:
                    stack[-1][1]["content"] += content + "\n"
                current_content.clear()
        
        # Process each line
        for line in lines:
            line = line.strip()
            if not line:
                current_content.append("")  # Preserve empty lines for paragraph breaks
                continue
            
            # Detect headings
            matched = False
            
            # First check for markdown headings (our enhanced output)
            md_match = markdown_heading_pattern.match(line)
            if md_match:
                level = len(md_match.group(1))  # Number of # symbols
                title = md_match.group(2).strip()
                
                flush_content()
                new_node = {"title": title, "content": "", "children": []}
                
                # Adjust stack based on heading level
                while stack and stack[-1][0] >= level:
                    stack.pop()
                    
                stack[-1][1]["children"].append(new_node)
                stack.append((level, new_node))
                matched = True
            else:
                # Try fallback patterns
                for pattern, get_heading_info in fallback_patterns:
                    match = pattern.match(line)
                    if match:
                        title, level = get_heading_info(match)
                        
                        flush_content()
                        new_node = {"title": title, "content": "", "children": []}
                        
                        # Adjust stack based on heading level
                        while stack and stack[-1][0] >= level:
                            stack.pop()
                            
                        stack[-1][1]["children"].append(new_node)
                        stack.append((level, new_node))
                        matched = True
                        break
            
            if not matched:
                # Skip page numbers and standard headers/footers
                if re.match(r'^\s*Page\s+\d+\s+of\s+\d+\s*$', line) or re.match(r'^\s*\d+\s*$', line):
                    continue
                    
                current_content.append(line)
        
        # Add any remaining content
        flush_content()
        
        return root
    
    @staticmethod
    def convert_tree_to_textbook(tree: Dict, knowledge_id: int, knowledge_name: str) -> Dict:
        """
        Convert document tree to structured textbook format with improved organization.
        """
        textbook = {
            "topic": knowledge_name,
            "knowledge_id": knowledge_id,
            "subtopics": []
        }
        
        # Helper functions
        def extract_metadata(content: str) -> Dict:
            """Extract metadata from content text."""
            words = content.split()
            return {
                "word_count": len(words),
                "has_code": bool(re.search(r'```[\s\S]*?```', content)),
                "has_equations": bool(re.search(r'[=+\-*/^()]|\b\d+\b', content)),
                "has_bullets": bool(re.search(r'^\s*[•\-*]\s+', content, re.MULTILINE)),
                "reading_time": max(1, round(len(words) / 200)),  # Approx. reading time in minutes
            }
        
        def detect_section_type(title: str) -> str:
            """Detect section type from title."""
            title_lower = title.lower()
            
            if re.match(r'^chapter\s+\d+', title_lower) or re.match(r'^\d+\.\s+', title_lower):
                return "chapter"
            elif re.match(r'^section\s+\d+', title_lower) or re.match(r'^\d+\.\d+', title_lower):
                return "section"
            elif re.match(r'^appendix\s+[a-z]', title_lower):
                return "appendix"
            elif any(word in title_lower for word in ["introduction", "overview", "abstract"]):
                return "introduction"
            elif any(word in title_lower for word in ["summary", "conclusion", "discussion"]):
                return "conclusion"
            elif any(word in title_lower for word in ["reference", "bibliography"]):
                return "references"
            elif any(word in title_lower for word in ["exercise", "problem"]):
                return "exercises"
            else:
                return "section"
        
        # Sort children by their position in the document
        # This ensures we get a logical reading order
        def sort_children(children):
            return sorted(children, key=lambda x: x.get("_position", 0))
        
        # Create subtopics based on document structure
        position = 0
        
        def process_node(node, level=0, parent_subtopic=None):
            nonlocal position
            position += 1
            node["_position"] = position
            
            section_type = detect_section_type(node.get("title", ""))
            content = node.get("content", "").strip()
            
            # Create a chapter object
            chapter = {
                "title": node.get("title", ""),
                "content": content,
                "type": section_type,
                "metadata": extract_metadata(content)
            }
            
            # Determine which subtopic this belongs to
            if section_type == "chapter" or level <= 1 or parent_subtopic is None:
                # Create a new subtopic
                subtopic = {
                    "title": node.get("title", ""),
                    "startLine": 0,  # Will calculate later
                    "chapters": [chapter]
                }
                textbook["subtopics"].append(subtopic)
                
                # Process children
                for child in sort_children(node.get("children", [])):
                    process_node(child, level + 1, subtopic)
            else:
                # Add to parent subtopic
                parent_subtopic["chapters"].append(chapter)
                
                # Process children
                for child in sort_children(node.get("children", [])):
                    process_node(child, level + 1, parent_subtopic)
        
        # Process all top-level nodes
        for child in sort_children(tree.get("children", [])):
            process_node(child)
        
        # If no subtopics were created, create at least one from the root
        if not textbook["subtopics"] and tree.get("content", "").strip():
            textbook["subtopics"] = [{
                "title": tree.get("title", "Document"),
                "startLine": 0,
                "chapters": [{
                    "title": "Content",
                    "content": tree.get("content", "").strip(),
                    "type": "section",
                    "metadata": extract_metadata(tree.get("content", ""))
                }]
            }]
        
        # Calculate start lines
        line_count = 0
        for subtopic in textbook["subtopics"]:
            subtopic["startLine"] = line_count
            for chapter in subtopic["chapters"]:
                content_lines = len(chapter["content"].splitlines()) if chapter["content"] else 0
                line_count += content_lines + 2  # Add spacing between chapters
        
        return textbook
    
    @staticmethod
    def walk_textbook(textbook: Dict, knowledge_id: int) -> List[Dict]:
        """
        Flatten the textbook structure into a list of chapter records.
        """
        result = []
        id_counter = 1
        
        for subtopic_index, subtopic in enumerate(textbook.get("subtopics", [])):
            for chapter in subtopic.get("chapters", []):
                content = chapter.get("content", "")
                lines_count = len(content.splitlines()) if content else 0
                
                # Create chapter record
                chapter_record = {
                    "id": id_counter,
                    "topic": textbook.get("topic", ""),
                    "subtopic": f"{subtopic.get('title', '')} {subtopic_index + 1}",
                    "chaptertitle": chapter.get("title", ""),
                    "chapter": content,
                    "lines": lines_count,
                    "knowledge_id": int(knowledge_id),
                    "k_id": int(knowledge_id),
                    "type": chapter.get("type", "section"),
                    "level": chapter.get("level", 0),
                    "metadata": chapter.get("metadata", {})
                }
                
                result.append(chapter_record)
                id_counter += 1
        
        return result

    @staticmethod
    def prepare_images_for_upload(images: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
        """
        Prepare extracted images for upload - custom implementation for PDF.
        
        Args:
            images: Dictionary of images extracted from PDF
            
        Returns:
            Dictionary ready for upload with standardized metadata and buffer
        """
        upload_ready = {}
        
        for filename, img_data in images.items():
            # Extract the base64 encoded data
            img_base64 = img_data.get("data", "")
            
            # Convert base64 to bytes for upload
            img_bytes = base64.b64decode(img_base64) if img_base64 else b""
            
            # Get image format
            img_format = img_data.get("format", "png")
            
            # Create standardized metadata
            upload_ready[filename] = {
                "buffer": img_bytes,  # Add the bytes data as buffer
                "format": img_format,
                "width": img_data.get("width", 0),
                "height": img_data.get("height", 0),
                "alt_text": img_data.get("alt_text", ""),
                "page": img_data.get("page", 0)
            }
        
        return upload_ready
    @staticmethod
    def process_text_to_index(text: str, knowledge_id: int, knowledge_name: str) -> Tuple[Dict, List[Dict]]:
        """Reuse the PDF text to index processing logic."""
        from pdf_processor import PDFProcessor
        return PDFProcessor.process_pdf_text_to_index(text, knowledge_id, knowledge_name)
    @staticmethod
    def process_pdf_text_to_index(pdf_text: str, knowledge_id: int, knowledge_name: str, 
                                 openai_api_key: str = DEFAULT_OPENAI_API_KEY,
                                 openai_model: str = DEFAULT_OPENAI_MODEL,
                                 batch_size: int = DEFAULT_BATCH_SIZE,
                                 max_workers: int = DEFAULT_MAX_WORKERS) -> Tuple[Dict, List[Dict]]:
        """
        Process PDF text into structured format using OpenAI API.
        
        Utilizes VideoProcessorV2 methods:
        1. Split the text into manageable chunks
        2. Process each chunk with OpenAI to generate structured content
        3. Merge the chunks into a coherent course structure
        4. Convert the structure to chapters for database insertion
        
        Returns (course_structure, chapters)
        """
        logger.info(f"Processing PDF text with smart chapter generation for knowledge ID {knowledge_id}")
        
        # Initialize OpenAI client
        client = OpenAI(api_key=openai_api_key)
        
        # Step 1: Split text into chunks using VideoProcessorV2
        chunks = VideoProcessorV2.chunk_text(pdf_text)
        logger.info(f"Split PDF text into {len(chunks)} chunks")
        
        # Step 2: Process chunks in batches using VideoProcessorV2
        # Define a function that adapts VideoProcessorV2's process_chunk method for PDFs
        def process_pdf_chunk(chunk, chunk_index, total_chunks, client, model_name):
            # Use the same schema but adapt the prompt for PDF content
            try:
                prompt = f"""
                Transform this document content into a structured course chapter, adding useful insights or examples where appropriate.
                
                DOCUMENT CONTENT:
                ```
                {chunk}
                ```
                
                INSTRUCTIONS:
                1. Create a coherent chapter with a clear title and sections based on the content
                2. Preserve all original content and examples
                3. Add appropriate insights, examples, or clarifications where helpful
                4. Include all numerical examples and data points from the original
                5. This is part {chunk_index+1} of {total_chunks}, ensure your section flows with others
                
                Structure the content with proper headings, key points, and examples. Make it thorough and educational.
                """

                # Use VideoProcessorV2's process method but with our PDF-specific prompt
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are a curriculum development expert specializing in creating educational content from documents.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.5,
                    response_format={"type": "json_schema", "json_schema": VideoProcessorV2.get_chapter_schema()},
                )

                # Extract the structured content
                structured_content = json.loads(response.choices[0].message.content)

                # Add chunk metadata
                structured_content["chunk_index"] = chunk_index
                structured_content["total_chunks"] = total_chunks
                
                # Add PDF-specific metadata
                structured_content["document_type"] = "pdf"

                return structured_content
                
            except Exception as e:
                logger.error(f"Error processing chunk {chunk_index+1}: {str(e)}")
                # Return an error structure to maintain consistency
                return {
                    "title": f"Error in Chunk {chunk_index+1}",
                    "sections": [
                        {
                            "heading": "Processing Error",
                            "content": f"An error occurred while processing this chunk: {str(e)}",
                            "key_points": [],
                            "examples": [],
                        }
                    ],
                    "chapter_number": chunk_index + 1,
                    "learning_objectives": ["Resolve processing errors"],
                    "chunk_index": chunk_index,
                    "total_chunks": total_chunks,
                    "error": str(e),
                    "document_type": "pdf"
                }
        
        # Use VideoProcessorV2's batch processing with our custom function
        chunk_results = []
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(
                    process_pdf_chunk,
                    chunk,
                    i,
                    len(chunks),
                    client,
                    openai_model,
                )
                for i, chunk in enumerate(chunks)
            ]
            
            # Process results as they complete
            for i, future in enumerate(as_completed(futures)):
                try:
                    result = future.result()
                    chunk_results.append(result)
                    logger.info(f"Completed chunk {i+1}/{len(chunks)}")
                    
                    # Add a small delay between batches to avoid rate limiting
                    if (i + 1) % batch_size == 0:
                        time.sleep(1)
                except Exception as e:
                    logger.error(f"Error in future for chunk {i}: {str(e)}")
                    chunk_results.append({
                        "title": f"Error in Chunk Processing",
                        "sections": [
                            {
                                "heading": "Processing Error",
                                "content": f"An error occurred: {str(e)}",
                                "key_points": [],
                                "examples": [],
                            }
                        ],
                        "chapter_number": i + 1,
                        "learning_objectives": [],
                        "chunk_index": i,
                        "total_chunks": len(chunks),
                        "error": str(e),
                        "document_type": "pdf"
                    })
        
        # Sort results by chunk index to maintain order
        chunk_results.sort(key=lambda x: x.get("chunk_index", 0))
        
        # Step 3: Merge chunks into course structure using VideoProcessorV2
        course_structure = VideoProcessorV2.merge_structured_chunks(
            chunk_results=chunk_results,
            knowledge_name=knowledge_name,
            client=client,
            model_name=openai_model,
        )
        
        # Add PDF-specific metadata
        course_structure["metadata"] = {
            "markdown": "",
            "metadata": {
                "processed_at": datetime.utcnow().isoformat(),
                "document_type": "pdf"
            }
        }
        
        # Step 4: Create chapters from structure using VideoProcessorV2
        chapters = VideoProcessorV2.create_chapters_from_structure(
            course_structure=course_structure, 
            knowledge_id=knowledge_id
        )
        
        return course_structure, chapters
