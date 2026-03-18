"""Pydantic models for agent state and data flow between agents."""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NicheData(BaseModel):
    main_niche: str
    sub_niche: str
    niche_description: str = ""
    market_demand: str = "Medium"  # High/Medium/Low
    target_keywords: list[str] = []


class AvatarData(BaseModel):
    age_range: str = ""
    gender: str = ""
    income_level: str = ""
    education: str = ""
    pain_points: list[str] = []
    goals: list[str] = []
    emotional_triggers: list[str] = []
    daily_struggles: list[str] = []
    desired_transformation: str = ""


class ProblemOption(BaseModel):
    title: str
    description: str
    urgency_score: int = 5  # 1-10
    emotional_weight: int = 5  # 1-10
    why_great_topic: str = ""


class ProblemData(BaseModel):
    selected_problem: ProblemOption
    other_options: list[ProblemOption] = []


class SolutionApproach(BaseModel):
    name: str
    description: str
    pros: list[str] = []
    cons: list[str] = []
    estimated_pages: int = 10
    needs_disclaimer: bool = False


class SolutionData(BaseModel):
    selected_solutions: list[SolutionApproach]


class Statistic(BaseModel):
    fact: str
    source: str = ""


class ExpertQuote(BaseModel):
    quote: str
    author: str
    role: str = ""


class CaseStudy(BaseModel):
    title: str
    summary: str


class ResearchData(BaseModel):
    executive_summary: str = ""
    statistics: list[Statistic] = []
    expert_quotes: list[ExpertQuote] = []
    case_studies: list[CaseStudy] = []
    confidence_score: int = 7  # 1-10
    disclaimers: list[str] = []
    bangladesh_context: str = ""


class BookTitleOption(BaseModel):
    title: str
    subtitle: str = ""
    tagline: str
    title_style: str  # How-To, Number, Question, Promise, etc.
    strength_score: int = 7  # 1-10


class BookTitleData(BaseModel):
    selected_title: BookTitleOption
    other_options: list[BookTitleOption] = []


class TopicOutline(BaseModel):
    title: str
    estimated_pages: int = 3
    content_types: list[str] = []  # text, list, quote, stat, exercise, checklist
    reader_takeaway: str = ""


class ChapterOutline(BaseModel):
    number: int
    title: str
    topics: list[TopicOutline] = []
    estimated_pages: int = 10


class OutlineData(BaseModel):
    total_chapters: int = 0
    total_estimated_pages: int = 0
    chapters: list[ChapterOutline] = []


class TopicContent(BaseModel):
    chapter_number: int
    topic_number: int
    title: str
    content_markdown: str = ""
    word_count: int = 0
    writing_style: str = ""
    status: str = "pending"  # pending, writing, review, confirmed


class ReviewData(BaseModel):
    quality_score: int = 0
    readability_score: int = 0
    engagement_score: int = 0
    actionability_score: int = 0
    revision_flags: list[str] = []
    overall_feedback: str = ""
    book_description: str = ""


class DesignSettings(BaseModel):
    font: str = "Hind Siliguri"
    header_style: str = "minimal"
    footer_style: str = "standard"
    chapter_title_style: str = "full_page"
    quote_box_style: str = "left_accent"
    tip_box_style: str = "orange_gradient"
    margins: str = "standard"
    line_spacing: float = 1.5


class ExportData(BaseModel):
    formats_generated: list[str] = []
    file_urls: dict[str, str] = {}
    design_settings: DesignSettings = DesignSettings()


class CoverOption(BaseModel):
    image_url: str
    style: str
    colors: list[str] = []


class CoverData(BaseModel):
    front_options: list[CoverOption] = []
    back_image_url: str = ""
    selected_front_index: int = 0


# Master state that accumulates through the pipeline
class EbookState(BaseModel):
    project_id: str
    user_id: str
    current_step: int = 1
    ai_provider: str = "claude"  # claude or openai

    # Agent outputs (accumulated)
    niche: Optional[NicheData] = None
    avatar: Optional[AvatarData] = None
    problem: Optional[ProblemData] = None
    solutions: Optional[SolutionData] = None
    research: Optional[ResearchData] = None
    book_title: Optional[BookTitleData] = None
    outline: Optional[OutlineData] = None
    topics_content: list[TopicContent] = []
    review: Optional[ReviewData] = None
    export: Optional[ExportData] = None
    covers: Optional[CoverData] = None

    # Token tracking
    tokens_used: int = 0
    tokens_budget: int = 200000

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
