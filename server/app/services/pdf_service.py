import io
import re
import importlib
from typing import BinaryIO, Union, Any


def _get_pdf_reader() -> Any:
    for mod_name in ["pypdf", "PyPDF2"]:
        try:
            mod = importlib.import_module(mod_name)
            if hasattr(mod, "PdfReader"):
                return mod.PdfReader
        except Exception:
            continue
    return None


def _get_pymupdf() -> Any:
    for mod_name in ["pymupdf", "fitz"]:
        try:
            return importlib.import_module(mod_name)
        except Exception:
            continue
    return None


def extract_text_from_pdf(file: Union[BinaryIO, bytes]) -> str:
    """Extract text from PDF file with multi-tier fallback."""
    try:
        if isinstance(file, (bytes, bytearray)):
            content = bytes(file)
        elif hasattr(file, "read"):
            raw = file.read()
            content = bytes(raw) if isinstance(raw, (bytes, bytearray)) else str(raw).encode("utf-8")
        else:
            content = b""

        # Reset file pointer if seekable
        if hasattr(file, "seek"):
            try:
                file.seek(0)
            except Exception:
                pass

        resume_text = ""

        # Tier 1: PyMuPDF
        fitz = _get_pymupdf()
        if fitz is not None:
            try:
                doc = fitz.open(stream=content, filetype="pdf")
                for page in doc:
                    txt = page.get_text()
                    if isinstance(txt, str):
                        resume_text += txt + "\n"
                doc.close()
            except Exception as e:
                print(f"PyMuPDF extract notice: {e}")

        # Tier 2: pypdf / PyPDF2
        if not resume_text.strip():
            pdf_reader_cls = _get_pdf_reader()
            if pdf_reader_cls is not None:
                try:
                    pdf_reader = pdf_reader_cls(io.BytesIO(content))
                    for page in pdf_reader.pages:
                        txt = page.extract_text()
                        if txt:
                            resume_text += str(txt) + "\n"
                except Exception as e:
                    print(f"pypdf extract notice: {e}")

        # Tier 3: Raw UTF-8 printable string fallback
        if not resume_text.strip():
            resume_text = content.decode("utf-8", errors="ignore")

        # Clean up whitespace
        resume_text = re.sub(r'\s+', ' ', resume_text).strip()
        return resume_text
    except Exception as e:
        print(f"PDF extraction error: {e}")
        return ""
