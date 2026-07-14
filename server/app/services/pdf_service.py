from PyPDF2 import PdfReader
import re
from typing import BinaryIO


def extract_text_from_pdf(file: BinaryIO) -> str:
    """Extract text from PDF file"""
    try:
        pdf_reader = PdfReader(file)
        resume_text = ""
        
        for page in pdf_reader.pages:
            text = page.extract_text()
            if text:
                resume_text += text + "\n"
        
        # Clean up text
        resume_text = re.sub(r'\s+', ' ', resume_text).strip()
        
        return resume_text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        raise Exception("Failed to extract text from PDF")
