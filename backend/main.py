"""
OTA Ebook Creator - Backend API
Python FastAPI + Claude Agent SDK
"""

import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import agents, projects, exports, payments
from agents.orchestrator import orchestrator
from agents.agent_01_niche_navigator import NicheNavigator
from agents.agent_02_avatar_architect import AvatarArchitect
from agents.agent_03_problem_detective import ProblemDetective
from agents.agent_04_solution_strategist import SolutionStrategist
from agents.agent_05_research_analyst import ResearchAnalyst
from agents.agent_06_book_name_creator import BookNameCreator
from agents.agent_07_outline_architect import OutlineArchitect
from agents.agent_08_content_writer import ContentWriter
from agents.agent_09_editor_reviewer import EditorReviewer
from agents.agent_10_export_master import ExportMaster
from agents.agent_11_cover_designer import CoverDesigner
from agents.agent_12_delivery_manager import DeliveryManager

app = FastAPI(
    title="OTA Ebook Creator API",
    description="AI-powered ebook creation with 12 specialized agents",
    version="1.0.0",
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(agents.router, prefix="/api/agents", tags=["Agents"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(exports.router, prefix="/api/exports", tags=["Exports"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])


# Register Agents 1-4
orchestrator.register_agent(1, NicheNavigator())
orchestrator.register_agent(2, AvatarArchitect())
orchestrator.register_agent(3, ProblemDetective())
orchestrator.register_agent(4, SolutionStrategist())

# Register Agents 5-7
orchestrator.register_agent(5, ResearchAnalyst())
orchestrator.register_agent(6, BookNameCreator())
orchestrator.register_agent(7, OutlineArchitect())

# Register Agent 8 - ContentWriter (most complex)
orchestrator.register_agent(8, ContentWriter())

# Register Agents 9-10
orchestrator.register_agent(9, EditorReviewer())
orchestrator.register_agent(10, ExportMaster())

# Register Agents 11-12
orchestrator.register_agent(11, CoverDesigner())
orchestrator.register_agent(12, DeliveryManager())


@app.get("/")
async def root():
    return {
        "name": "OTA Ebook Creator API",
        "version": "1.0.0",
        "status": "running",
        "agents": 12,
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
