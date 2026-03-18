"""Project API routes - CRUD for ebook projects."""

from fastapi import APIRouter

router = APIRouter()


@router.get("/")
async def list_projects():
    """List all projects. Frontend handles this via Supabase directly."""
    return {"message": "Use Supabase client directly for project CRUD"}


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Get a single project."""
    return {"project_id": project_id, "message": "Use Supabase client directly"}
