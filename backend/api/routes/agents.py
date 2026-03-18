"""Agent API routes - trigger agent steps and get status."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from models.agent_state import EbookState
from agents.orchestrator import orchestrator

router = APIRouter()


class RunAgentRequest(BaseModel):
    project_id: str
    user_id: str
    step: int
    user_input: dict = {}
    ai_provider: str = "claude"
    state_data: dict = {}


class RunAgentResponse(BaseModel):
    success: bool
    agent_name: str = ""
    step: int = 0
    state: dict = {}
    error: str = ""
    message: str = ""
    tokens_used: int = 0


@router.post("/run", response_model=RunAgentResponse)
async def run_agent(request: RunAgentRequest):
    """Run a specific agent step."""
    # Reconstruct state from request data
    state_dict = {
        "project_id": request.project_id,
        "user_id": request.user_id,
        "current_step": request.step,
        "ai_provider": request.ai_provider,
        **request.state_data,
    }

    try:
        state = EbookState(**state_dict)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid state data: {str(e)}")

    result = await orchestrator.run_step(request.step, state, request.user_input)

    return RunAgentResponse(**result)


@router.get("/sub-niches")
async def get_sub_niches(main_niche: str):
    """Get sub-niches for a main niche from knowledge base."""
    agent = orchestrator.agents.get(1)
    if not agent:
        return {"sub_niches": []}

    from agents.agent_01_niche_navigator import NicheNavigator
    if isinstance(agent, NicheNavigator):
        sub_niches = agent.get_sub_niches(main_niche)
        return {"main_niche": main_niche, "sub_niches": sub_niches}

    return {"sub_niches": []}


@router.get("/writing-styles")
async def get_writing_styles():
    """Get available writing styles for ContentWriter."""
    from agents.agent_08_content_writer import ContentWriter
    return {"styles": ContentWriter.get_writing_styles()}


@router.get("/rewrite-angles")
async def get_rewrite_angles():
    """Get available rewrite angles for ContentWriter."""
    from agents.agent_08_content_writer import ContentWriter
    return {"angles": ContentWriter.get_rewrite_angles()}


@router.get("/info")
async def agent_info():
    """Get info about all registered agents."""
    return {
        "total_agents": 12,
        "agents": orchestrator.get_agent_info(),
    }
