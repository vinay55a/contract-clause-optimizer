"""
Contract Parser Service — Extract text from PDF, DOCX, and plain text.
"""
import os
import logging
from typing import Tuple
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path: str) -> Tuple[str, int]:
    """Extract text from PDF file. Returns (text, page_count)."""
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            pages = []
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    pages.append(text)
            return "\n\n".join(pages), len(pdf.pages)
    except ImportError:
        logger.error("pdfplumber not installed")
        return "", 0
    except Exception as e:
        logger.error(f"PDF extraction error: {e}")
        return "", 0


def extract_text_from_docx(file_path: str) -> Tuple[str, int]:
    """Extract text from DOCX file. Returns (text, estimated_page_count)."""
    try:
        from docx import Document
        doc = Document(file_path)
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        text = "\n\n".join(paragraphs)
        # Estimate pages (roughly 400 words per page)
        word_count = len(text.split())
        estimated_pages = max(1, word_count // 400)
        return text, estimated_pages
    except ImportError:
        logger.error("python-docx not installed")
        return "", 0
    except Exception as e:
        logger.error(f"DOCX extraction error: {e}")
        return "", 0


def extract_text_from_txt(file_path: str) -> Tuple[str, int]:
    """Extract text from plain text file."""
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        word_count = len(text.split())
        estimated_pages = max(1, word_count // 400)
        return text, estimated_pages
    except Exception as e:
        logger.error(f"Text extraction error: {e}")
        return "", 0


def parse_contract_file(file_path: str, content_type: str) -> dict:
    """
    Parse a contract file and return extracted data.
    
    Returns:
        dict with keys: text, word_count, page_count, error
    """
    path = Path(file_path)
    ext = path.suffix.lower()

    text = ""
    page_count = 1

    try:
        if ext == ".pdf" or "pdf" in content_type:
            text, page_count = extract_text_from_pdf(file_path)
        elif ext in (".docx", ".doc") or "word" in content_type:
            text, page_count = extract_text_from_docx(file_path)
        elif ext == ".txt" or "text" in content_type:
            text, page_count = extract_text_from_txt(file_path)
        else:
            # Try as text
            text, page_count = extract_text_from_txt(file_path)
    except Exception as e:
        logger.error(f"Contract parsing error: {e}")
        return {"text": "", "word_count": 0, "page_count": 0, "error": str(e)}

    if not text.strip():
        return {"text": "", "word_count": 0, "page_count": 0, "error": "No text could be extracted from the file"}

    word_count = len(text.split())

    return {
        "text": text,
        "word_count": word_count,
        "page_count": page_count,
        "error": None,
    }


def parse_contract_text(raw_text: str) -> dict:
    """Parse raw pasted contract text."""
    text = raw_text.strip()
    if not text:
        return {"text": "", "word_count": 0, "page_count": 0, "error": "Empty text"}

    word_count = len(text.split())
    estimated_pages = max(1, word_count // 400)

    return {
        "text": text,
        "word_count": word_count,
        "page_count": estimated_pages,
        "error": None,
    }
