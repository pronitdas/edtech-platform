"""
OCR Service using Docling (IBM) for document understanding
Docling provides high-quality OCR with layout analysis, table extraction, and more
"""

import os
import logging
from typing import Dict, Any, List, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

# Feature flag check
from .vm_llm_provider import FeatureFlags

class DoclingOCR:
    """
    Docling-based OCR for document understanding
    
    Docling (by IBM) provides:
    - High-quality OCR for documents
    - Layout analysis (headings, paragraphs, tables, figures)
    - Table extraction
    - PDF rendering
    - Markdown/JSON output
    """
    
    def __init__(self):
        self.enabled = FeatureFlags.USE_DOCLING
        self._model = None
        self._initialize()
    
    def _initialize(self):
        """Initialize Docling model"""
        if not self.enabled:
            logger.info("Docling OCR is disabled via feature flag")
            return
        
        try:
            # Docling import
            from docling import DocumentProcessor, PdfInputFormat, ChunkingMode
            from docling.models.ocr_model import OcrModel
            
            self._processor = DocumentProcessor(
                format=PdfInputFormat.PDF,
                ocr_model=OcrModel(
                    lang=["en"],  # Add more languages as needed
                    device="auto"  # GPU if available
                )
            )
            logger.info("Docling OCR initialized successfully")
            
        except ImportError as e:
            logger.warning(f"Docling not installed: {e}")
            self.enabled = False
        except Exception as e:
            logger.error(f"Failed to initialize Docling: {e}")
            self.enabled = False
    
    async def process_document(
        self,
        file_path: str,
        extract_tables: bool = True,
        extract_images: bool = True,
        generate_markdown: bool = True
    ) -> Dict[str, Any]:
        """
        Process a document with Docling
        
        Args:
            file_path: Path to the document (PDF, image, etc.)
            extract_tables: Whether to extract tables
            extract_images: Whether to extract images
            generate_markdown: Whether to generate markdown output
            
        Returns:
            Dictionary containing extracted content
        """
        if not self.enabled:
            raise RuntimeError("Docling OCR is disabled")
        
        try:
            # Process the document
            doc = self._processor.process(
                input_source=file_path
            )
            
            # Extract content based on options
            result = {
                "text": doc.text,
                "markdown": doc.export_to_markdown() if generate_markdown else None,
                "pages": [],
                "tables": [],
                "images": [],
                "statistics": doc.stats if hasattr(doc, 'stats') else {}
            }
            
            # Extract per-page content
            if hasattr(doc, 'pages'):
                for page in doc.pages:
                    page_data = {
                        "page_num": page.page_no,
                        "text": page.text if hasattr(page, 'text') else "",
                        "elements": []
                    }
                    
                    # Extract elements (headings, paragraphs, etc.)
                    if hasattr(page, 'elements'):
                        for elem in page.elements:
                            elem_data = {
                                "type": type(elem).__name__,
                                "text": elem.text if hasattr(elem, 'text') else ""
                            }
                            page_data["elements"].append(elem_data)
                    
                    result["pages"].append(page_data)
            
            # Extract tables
            if extract_tables and hasattr(doc, 'tables'):
                for table in doc.tables:
                    table_data = {
                        "page": table.page_no if hasattr(table, 'page_no') else None,
                        "text": table.text if hasattr(table, 'text') else "",
                        "data": table.data if hasattr(table, 'data') else [],
                        "metadata": table.metadata if hasattr(table, 'metadata') else {}
                    }
                    result["tables"].append(table_data)
            
            # Extract images
            if extract_images and hasattr(doc, 'images'):
                for img in doc.images:
                    img_data = {
                        "page": img.page_no if hasattr(img, 'page_no') else None,
                        "ref": img.ref if hasattr(img, 'ref') else "",
                        "caption": img.caption if hasattr(img, 'caption') else ""
                    }
                    result["images"].append(img_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Docling processing error: {e}")
            raise
    
    async def extract_text(
        self,
        file_path: str,
        language: str = "en"
    ) -> str:
        """Extract plain text from document"""
        result = await self.process_document(
            file_path=file_path,
            extract_tables=False,
            extract_images=False,
            generate_markdown=False
        )
        return result.get("text", "")
    
    async def extract_tables(
        self,
        file_path: str
    ) -> List[Dict[str, Any]]:
        """Extract tables from document"""
        result = await self.process_document(
            file_path=file_path,
            extract_tables=True,
            extract_images=False,
            generate_markdown=False
        )
        return result.get("tables", [])
    
    async def analyze_layout(
        self,
        file_path: str
    ) -> List[Dict[str, Any]]:
        """Analyze document layout"""
        result = await self.process_document(
            file_path=file_path,
            extract_tables=False,
            extract_images=True,
            generate_markdown=False
        )
        
        layout_elements = []
        for page in result.get("pages", []):
            for elem in page.get("elements", []):
                layout_elements.append({
                    "type": elem.get("type"),
                    "text": elem.get("text", "")[:200],  # Truncate long text
                    "page": page.get("page_num")
                })
        
        return layout_elements


class DeepSeekOCR2:
    """
    DeepSeek OCR 2 for document understanding
    
    DeepSeek OCR 2 provides:
    - End-to-end document understanding
    - Multi-modal capabilities
    - High accuracy on complex layouts
    """
    
    def __init__(self):
        self.enabled = FeatureFlags.USE_DEEPSEEK_OCR
        self._model = None
        self._initialize()
    
    def _initialize(self):
        """Initialize DeepSeek OCR 2 model"""
        if not self.enabled:
            logger.info("DeepSeek OCR 2 is disabled via feature flag")
            return
        
        try:
            # DeepSeek OCR 2 initialization
            # Note: DeepSeek OCR 2 may require specific installation
            from deepseek_ocr import DeepSeekOCR
            
            self._model = DeepSeekOCR(
                model_path=os.getenv("DEEPSEEK_OCR_MODEL_PATH"),
                device="auto"
            )
            logger.info("DeepSeek OCR 2 initialized successfully")
            
        except ImportError as e:
            logger.warning(f"DeepSeek OCR 2 not installed: {e}")
            self.enabled = False
        except Exception as e:
            logger.error(f"Failed to initialize DeepSeek OCR 2: {e}")
            self.enabled = False
    
    async def process_document(
        self,
        file_path: str,
        output_format: str = "json"  # "json", "markdown", "text"
    ) -> Dict[str, Any]:
        """
        Process a document with DeepSeek OCR 2
        
        Args:
            file_path: Path to the document
            output_format: Desired output format
            
        Returns:
            Extracted content in specified format
        """
        if not self.enabled:
            raise RuntimeError("DeepSeek OCR 2 is disabled")
        
        try:
            # Process document
            result = self._model.process(
                input_path=file_path,
                output_format=output_format
            )
            
            return result
            
        except Exception as e:
            logger.error(f"DeepSeek OCR 2 processing error: {e}")
            raise
    
    async def extract_with_layout(
        self,
        file_path: str
    ) -> Dict[str, Any]:
        """Extract content with full layout information"""
        result = await self.process_document(file_path, output_format="json")
        return result


class OCRService:
    """
    Unified OCR service with feature flag support
    
    Routes to appropriate OCR provider based on configuration:
    - docling (default): IBM Docling for document understanding
    - deepseek: DeepSeek OCR 2 for advanced document processing
    """
    
    def __init__(self):
        self.provider_name = FeatureFlags.get_ocr_provider()
        
        # Initialize providers
        self.docling = DoclingOCR() if FeatureFlags.USE_DOCLING else None
        self.deepseek = DeepSeekOCR2() if FeatureFlags.USE_DEEPSEEK_OCR else None
        
        logger.info(f"OCR Service initialized with provider: {self.provider_name}")
    
    async def process(
        self,
        file_path: str,
        provider: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Process document using configured or specified provider
        
        Args:
            file_path: Path to document
            provider: Override provider (optional)
            **kwargs: Provider-specific options
            
        Returns:
            Extracted content
        """
        selected_provider = provider or self.provider_name
        
        if selected_provider == "docling" and self.docling:
            return await self.docling.process_document(file_path, **kwargs)
        elif selected_provider == "deepseek" and self.deepseek:
            return await self.deepseek.process_document(file_path, **kwargs)
        elif self.docling:
            logger.warning(f"Provider {selected_provider} not available, using docling")
            return await self.docling.process_document(file_path, **kwargs)
        else:
            raise RuntimeError(f"No OCR provider available")
    
    async def extract_text(
        self,
        file_path: str,
        provider: Optional[str] = None
    ) -> str:
        """Extract plain text"""
        selected_provider = provider or self.provider_name
        
        if selected_provider == "docling" and self.docling:
            return await self.docling.extract_text(file_path)
        elif selected_provider == "deepseek" and self.deepseek:
            result = await self.deepseek.process_document(file_path, output_format="text")
            return result.get("text", "")
        elif self.docling:
            return await self.docling.extract_text(file_path)
        else:
            raise RuntimeError(f"No OCR provider available")
    
    async def extract_tables(
        self,
        file_path: str,
        provider: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Extract tables from document"""
        selected_provider = provider or self.provider_name
        
        if selected_provider == "docling" and self.docling:
            return await self.docling.extract_tables(file_path)
        elif selected_provider == "deepseek" and self.deepseek:
            result = await self.deepseek.process_document(file_path, output_format="json")
            return result.get("tables", [])
        elif self.docling:
            return await self.docling.extract_tables(file_path)
        else:
            raise RuntimeError(f"No OCR provider available")
    
    async def analyze_layout(
        self,
        file_path: str,
        provider: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Analyze document layout"""
        selected_provider = provider or self.provider_name
        
        if selected_provider == "docling" and self.docling:
            return await self.docling.analyze_layout(file_path)
        elif selected_provider == "deepseek" and self.deepseek:
            result = await self.deepseek.extract_with_layout(file_path)
            return result.get("layout", [])
        elif self.docling:
            return await self.docling.analyze_layout(file_path)
        else:
            raise RuntimeError(f"No OCR provider available")
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get information about configured OCR provider"""
        return {
            "provider": self.provider_name,
            "docling_enabled": FeatureFlags.USE_DOCLING,
            "deepseek_enabled": FeatureFlags.USE_DEEPSEEK_OCR,
            "table_extraction_enabled": FeatureFlags.ENABLE_OCR_TABLE_EXTRACTION,
            "layout_analysis_enabled": FeatureFlags.ENABLE_OCR_LAYOUT_ANALYSIS
        }


# Export singleton
ocr_service = OCRService()

__all__ = ['OCRService', 'ocr_service', 'DoclingOCR', 'DeepSeekOCR2', 'FeatureFlags']
