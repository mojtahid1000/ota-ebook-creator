"""Export API routes - PDF, DOCX generation."""

import os
import tempfile
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from services.export_service import generate_pdf, generate_docx


router = APIRouter()

OUTPUT_DIR = os.path.join(tempfile.gettempdir(), "ota_ebooks")
os.makedirs(OUTPUT_DIR, exist_ok=True)


class ExportRequest(BaseModel):
    project_id: str
    title: str
    subtitle: str = ""
    author: str
    press: str = ""
    website: str = ""
    chapters: list[dict]  # [{title, content}]
    design_settings: dict = {}
    book_description: str = ""
    about_author: str = ""


@router.post("/pdf")
async def export_pdf(request: ExportRequest):
    """Generate PDF ebook and return download URL."""
    try:
        pdf_bytes = generate_pdf(
            title=request.title,
            subtitle=request.subtitle,
            author=request.author,
            press=request.press,
            website=request.website,
            chapters=request.chapters,
            design_settings=request.design_settings,
            book_description=request.book_description,
            about_author=request.about_author,
        )

        filename = f"{request.project_id}_ebook.pdf"
        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(pdf_bytes)

        return {
            "success": True,
            "format": "pdf",
            "filename": filename,
            "size_bytes": len(pdf_bytes),
            "download_url": f"/api/exports/download/{filename}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@router.post("/docx")
async def export_docx(request: ExportRequest):
    """Generate DOCX ebook and return download URL."""
    try:
        docx_bytes = generate_docx(
            title=request.title,
            subtitle=request.subtitle,
            author=request.author,
            press=request.press,
            website=request.website,
            chapters=request.chapters,
            design_settings=request.design_settings,
            book_description=request.book_description,
            about_author=request.about_author,
        )

        filename = f"{request.project_id}_ebook.docx"
        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, "wb") as f:
            f.write(docx_bytes)

        return {
            "success": True,
            "format": "docx",
            "filename": filename,
            "size_bytes": len(docx_bytes),
            "download_url": f"/api/exports/download/{filename}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOCX generation failed: {str(e)}")


@router.get("/download/{filename}")
async def download_file(filename: str):
    """Download a generated ebook file."""
    filepath = os.path.join(OUTPUT_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    media_type = "application/pdf" if filename.endswith(".pdf") else \
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return FileResponse(
        filepath,
        media_type=media_type,
        filename=filename,
    )
