"""
File upload security module for media-uploader service.
Provides comprehensive validation for uploaded files including:
- File extension validation
- File size limits
- MIME type validation
- Magic number validation
- Content scanning
"""

import os
import magic
import hashlib
from pathlib import Path
from typing import Tuple, Optional, Dict, Set
from fastapi import UploadFile, HTTPException

# Security configuration
class FileUploadSecurityConfig:
    """Configuration for file upload security"""
    
    # Maximum file sizes by type (in bytes)
    MAX_FILE_SIZES = {
        # Documents
        ".pdf": 50 * 1024 * 1024,      # 50MB
        ".doc": 25 * 1024 * 1024,       # 25MB
        ".docx": 25 * 1024 * 1024,      # 25MB
        ".txt": 5 * 1024 * 1024,        # 5MB
        
        # Images
        ".png": 10 * 1024 * 1024,       # 10MB
        ".jpg": 10 * 1024 * 1024,       # 10MB
        ".jpeg": 10 * 1024 * 1024,      # 10MB
        
        # Videos
        ".mp4": 500 * 1024 * 1024,      # 500MB
        ".avi": 500 * 1024 * 1024,      # 500MB
        ".mov": 500 * 1024 * 1024,      # 500MB
    }
    
    # Allowed MIME types mapped to extensions
    ALLOWED_MIME_TYPES = {
        # Documents
        "application/pdf": {".pdf"},
        "application/msword": {".doc"},
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {".docx"},
        "text/plain": {".txt"},
        
        # Images
        "image/png": {".png"},
        "image/jpeg": {".jpg", ".jpeg"},
        
        # Videos
        "video/mp4": {".mp4"},
        "video/x-msvideo": {".avi"},
        "video/quicktime": {".mov"},
    }
    
    # Magic number signatures for file type validation
    FILE_SIGNATURES = {
        # PDF
        b"%PDF": [".pdf"],
        
        # Microsoft Office
        b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1": [".doc"],  # OLE format
        b"PK\x03\x04": [".docx"],  # ZIP-based Office format
        
        # Images
        b"\x89PNG\r\n\x1a\n": [".png"],
        b"\xff\xd8\xff": [".jpg", ".jpeg"],
        
        # Videos
        b"\x00\x00\x00\x18ftypmp4": [".mp4"],
        b"\x00\x00\x00\x14ftypisom": [".mp4"],
        b"RIFF": [".avi"],  # Followed by file size and "AVI "
    }
    
    # Default maximum file size if not specified per type
    DEFAULT_MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
    
    # Minimum file size to prevent empty files
    MIN_FILE_SIZE = 1  # 1 byte
    
    # Maximum filename length
    MAX_FILENAME_LENGTH = 255
    
    # Forbidden filename patterns
    FORBIDDEN_PATTERNS = [
        "..",  # Directory traversal
        "~",   # Temp files
        "$",   # System files
    ]
    
    # Allowed characters in filenames (alphanumeric, dash, underscore, dot)
    ALLOWED_FILENAME_CHARS = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_.")


class FileUploadValidator:
    """Validates uploaded files for security"""
    
    def __init__(self, config: Optional[FileUploadSecurityConfig] = None):
        self.config = config or FileUploadSecurityConfig()
        self._magic = None
    
    @property
    def magic_instance(self):
        """Lazy load python-magic instance"""
        if self._magic is None:
            self._magic = magic.Magic(mime=True)
        return self._magic
    
    def validate_filename(self, filename: str) -> Tuple[bool, Optional[str]]:
        """Validate filename for security issues"""
        if not filename:
            return False, "Filename cannot be empty"
        
        # Check length
        if len(filename) > self.config.MAX_FILENAME_LENGTH:
            return False, f"Filename too long (max {self.config.MAX_FILENAME_LENGTH} characters)"
        
        # Check for forbidden patterns
        for pattern in self.config.FORBIDDEN_PATTERNS:
            if pattern in filename:
                return False, f"Forbidden pattern '{pattern}' in filename"
        
        # Check for allowed characters
        for char in filename:
            if char not in self.config.ALLOWED_FILENAME_CHARS:
                return False, f"Invalid character '{char}' in filename"
        
        # Ensure filename has an extension
        if "." not in filename or filename.startswith(".") or filename.endswith("."):
            return False, "Invalid filename format"
        
        return True, None
    
    def validate_extension(self, filename: str) -> Tuple[bool, Optional[str]]:
        """Validate file extension"""
        file_ext = Path(filename).suffix.lower()
        
        if not file_ext:
            return False, "File must have an extension"
        
        allowed_extensions = set()
        for mime_exts in self.config.ALLOWED_MIME_TYPES.values():
            allowed_extensions.update(mime_exts)
        
        if file_ext not in allowed_extensions:
            return False, f"File type '{file_ext}' not allowed"
        
        return True, None
    
    def validate_size(self, content: bytes, filename: str) -> Tuple[bool, Optional[str]]:
        """Validate file size"""
        file_size = len(content)
        file_ext = Path(filename).suffix.lower()
        
        # Check minimum size
        if file_size < self.config.MIN_FILE_SIZE:
            return False, "File is empty or too small"
        
        # Get maximum size for this file type
        max_size = self.config.MAX_FILE_SIZES.get(file_ext, self.config.DEFAULT_MAX_FILE_SIZE)
        
        if file_size > max_size:
            max_size_mb = max_size / (1024 * 1024)
            return False, f"File too large (max {max_size_mb:.1f}MB for {file_ext} files)"
        
        return True, None
    
    def validate_mime_type(self, content: bytes, filename: str) -> Tuple[bool, Optional[str]]:
        """Validate MIME type using python-magic"""
        try:
            detected_mime = self.magic_instance.from_buffer(content)
            file_ext = Path(filename).suffix.lower()
            
            # Check if detected MIME type is allowed
            if detected_mime not in self.config.ALLOWED_MIME_TYPES:
                return False, f"Detected MIME type '{detected_mime}' not allowed"
            
            # Check if file extension matches the detected MIME type
            allowed_exts = self.config.ALLOWED_MIME_TYPES.get(detected_mime, set())
            if file_ext not in allowed_exts:
                return False, f"File extension '{file_ext}' doesn't match detected type '{detected_mime}'"
            
            return True, None
            
        except Exception as e:
            return False, f"Error detecting file type: {str(e)}"
    
    def validate_magic_number(self, content: bytes, filename: str) -> Tuple[bool, Optional[str]]:
        """Validate file magic number (file signature)"""
        if len(content) < 16:  # Need at least 16 bytes for most signatures
            return False, "File too small to validate"
        
        file_ext = Path(filename).suffix.lower()
        
        # Check known signatures
        for signature, allowed_exts in self.config.FILE_SIGNATURES.items():
            if content.startswith(signature):
                if file_ext in allowed_exts:
                    return True, None
                else:
                    return False, f"File signature doesn't match extension '{file_ext}'"
        
        # Special case for AVI files (RIFF format)
        if content.startswith(b"RIFF") and len(content) > 12:
            if content[8:12] == b"AVI " and file_ext == ".avi":
                return True, None
        
        # If we couldn't match a signature, it might be a text file
        if file_ext == ".txt":
            try:
                # Try to decode as UTF-8
                content[:1024].decode('utf-8')
                return True, None
            except UnicodeDecodeError:
                return False, "Invalid text file encoding"
        
        return False, f"Unknown or invalid file signature for '{file_ext}'"
    
    def calculate_checksum(self, content: bytes) -> str:
        """Calculate SHA-256 checksum of file content"""
        return hashlib.sha256(content).hexdigest()
    
    def scan_content(self, content: bytes, filename: str) -> Tuple[bool, Optional[str]]:
        """
        Scan file content for malicious patterns.
        This is a basic implementation - in production, integrate with
        antivirus services like ClamAV or cloud-based scanners.
        """
        # Check for common malicious patterns in different file types
        file_ext = Path(filename).suffix.lower()
        
        if file_ext in [".pdf"]:
            # Check for suspicious PDF patterns
            suspicious_patterns = [
                b"/JavaScript",
                b"/JS",
                b"/Launch",
                b"/EmbeddedFile",
                b"/OpenAction",
                b"/AcroForm",
                b"/XFA",
            ]
            
            for pattern in suspicious_patterns:
                if pattern in content:
                    return False, f"Suspicious pattern detected in PDF: {pattern.decode('ascii', errors='ignore')}"
        
        elif file_ext in [".doc", ".docx"]:
            # Check for suspicious Office document patterns
            suspicious_patterns = [
                b"powershell",
                b"cmd.exe",
                b"wscript",
                b"cscript",
                b"mshta",
            ]
            
            content_lower = content.lower()
            for pattern in suspicious_patterns:
                if pattern in content_lower:
                    return False, f"Suspicious pattern detected in document"
        
        return True, None
    
    async def validate_upload(self, file: UploadFile) -> Tuple[bool, Optional[str], Optional[Dict[str, any]]]:
        """
        Comprehensive validation of uploaded file.
        Returns: (is_valid, error_message, metadata)
        """
        metadata = {
            "original_filename": file.filename,
            "content_type": file.content_type,
        }
        
        # Validate filename
        is_valid, error = self.validate_filename(file.filename)
        if not is_valid:
            return False, error, metadata
        
        # Validate extension
        is_valid, error = self.validate_extension(file.filename)
        if not is_valid:
            return False, error, metadata
        
        # Read file content
        content = await file.read()
        await file.seek(0)  # Reset file pointer
        
        metadata["file_size"] = len(content)
        metadata["checksum"] = self.calculate_checksum(content)
        
        # Validate file size
        is_valid, error = self.validate_size(content, file.filename)
        if not is_valid:
            return False, error, metadata
        
        # Validate MIME type
        is_valid, error = self.validate_mime_type(content, file.filename)
        if not is_valid:
            return False, error, metadata
        
        # Validate magic number
        is_valid, error = self.validate_magic_number(content, file.filename)
        if not is_valid:
            return False, error, metadata
        
        # Scan content for malicious patterns
        is_valid, error = self.scan_content(content, file.filename)
        if not is_valid:
            return False, error, metadata
        
        # All validations passed
        metadata["validated"] = True
        return True, None, metadata


# Singleton instance
_validator_instance = None


def get_validator() -> FileUploadValidator:
    """Get singleton validator instance"""
    global _validator_instance
    if _validator_instance is None:
        _validator_instance = FileUploadValidator()
    return _validator_instance


async def secure_file_upload(file: UploadFile) -> Dict[str, any]:
    """
    Convenience function for secure file upload validation.
    Raises HTTPException on validation failure.
    """
    validator = get_validator()
    is_valid, error, metadata = await validator.validate_upload(file)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"File validation failed: {error}")
    
    return metadata