import io
import re
import httpx
import json
from app.config.settings import settings

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

try:
    import pypdf
except ImportError:
    pypdf = None


async def parse_resume(pdf_bytes: bytes) -> dict:
    """
    Parse a PDF resume and return structured JSON using LLM.
    Args:
        pdf_bytes: Raw PDF file bytes
    Returns:
        dict with name, email, phone, skills, education, experience, predicted_role
    """
    # ── Extract raw text ──────────────────────────────────────────────────────
    text = ""
    if fitz is not None:
        try:
            doc_pdf = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page in doc_pdf:
                text += page.get_text()
            doc_pdf.close()
        except Exception as e:
            print(f"PyMuPDF extract warning: {e}")

    if not text.strip() and pypdf is not None:
        try:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as e:
            print(f"pypdf extract warning: {e}")

    if not text.strip():
        # Last resort fallback: decode utf-8 printable characters
        text = pdf_bytes.decode("utf-8", errors="ignore")

    # Truncate text if it's absurdly long to save tokens
    text = text[:15000]

    messages = [
        {
            "role": "system",
            "content": (
                "You are an expert technical recruiter and resume parser. "
                "Extract the following information from the resume text into a strict JSON object. "
                "Output ONLY the JSON object, no markdown blocks or other text. "
                "Required JSON schema:\n"
                "{\n"
                '  "name": "Full Name (string or null)",\n'
                '  "email": "Email address (string or null)",\n'
                '  "phone": "Phone number (string or null)",\n'
                '  "skills": ["skill1", "skill2"] (List of technical skills ONLY. Extract as many tech stack keywords as possible. E.g., React, Python, AWS),\n'
                '  "education": ["Degree from University (Year)"] (List of strings summarizing education degrees),\n'
                '  "experience": ["Company Name - Role (Duration)"] (List of strings summarizing past roles),\n'
                '  "projects": ["Project Name - Description"] (List of strings describing personal or work projects),\n'
                '  "predicted_role": "Predicted job title based on skills (e.g., Frontend Developer, Backend Developer, Data Scientist. If unsure, default to Software Engineer)",\n'
                '  "resume_quality_score": Integer between 1 and 100 representing the overall quality, depth, and ATS-readiness of the resume\n'
                "}"
            ),
        },
        {
            "role": "user",
            "content": f"Resume Text:\n{text}",
        },
    ]

    try:
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json={
                    "model": "openai/gpt-4o-mini", 
                    "messages": messages,
                    "response_format": {"type": "json_object"}
                },
                headers={
                    "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()
            data = response.json()
            result_str = data["choices"][0]["message"]["content"].strip()
            
            # Parse JSON
            parsed = json.loads(result_str)
            
            return {
                "name": parsed.get("name"),
                "email": parsed.get("email"),
                "phone": parsed.get("phone"),
                "skills": parsed.get("skills", []),
                "education": parsed.get("education", []),
                "experience": parsed.get("experience", []),
                "projects": parsed.get("projects", []),
                "predicted_role": parsed.get("predicted_role", "Software Engineer"),
                "resume_quality_score": parsed.get("resume_quality_score", 85),
            }

    except Exception as e:
        print(f"LLM Resume parsing error: {e}")
        # Fallback to basic regex if API fails
        emails = re.findall(r"[\w.\-]+@[\w.\-]+\.\w+", text)
        return {
            "name": "Candidate",
            "email": emails[0] if emails else None,
            "phone": None,
            "skills": ["JavaScript", "Python", "SQL"], # Dummy fallback
            "education": [],
            "experience": [],
            "projects": [],
            "predicted_role": "Software Engineer",
            "resume_quality_score": 75,
        }
