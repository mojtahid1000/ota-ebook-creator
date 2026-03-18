import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Agent configs
const AGENTS: Record<number, { name: string; model: string; systemPrompt: string }> = {
  3: {
    name: "ProblemDetective",
    model: "claude-sonnet-4-6-20250514",
    systemPrompt: `You are ProblemDetective. Generate exactly 10 specific, ebook-worthy problems.
Respond in Bangla with English terms in parentheses.
OUTPUT: Valid JSON: { "problems": [{ "title": "...", "description": "...", "urgency_score": 8, "emotional_weight": 9, "why_great_topic": "..." }] }`,
  },
  4: {
    name: "SolutionStrategist",
    model: "claude-sonnet-4-6-20250514",
    systemPrompt: `You are SolutionStrategist. Generate 5-8 solution approaches.
Respond in Bangla with English terms in parentheses.
OUTPUT: Valid JSON: { "solutions": [{ "name": "...", "description": "...", "pros": ["..."], "cons": ["..."], "estimated_pages": 15, "needs_disclaimer": false }] }`,
  },
  5: {
    name: "ResearchAnalyst",
    model: "claude-sonnet-4-6-20250514",
    systemPrompt: `You are ResearchAnalyst. Conduct deep research.
Respond in Bangla with English for technical terms.
OUTPUT: Valid JSON: { "executive_summary": "...", "statistics": [{"fact":"...","source":"..."}], "expert_quotes": [{"quote":"...","author":"...","role":"..."}], "case_studies": [{"title":"...","summary":"..."}], "confidence_score": 8, "disclaimers": [], "bangladesh_context": "..." }`,
  },
  6: {
    name: "BookNameCreator",
    model: "claude-sonnet-4-6-20250514",
    systemPrompt: `You are BookNameCreator. Generate 10 compelling book title + tagline pairs using different formulas.
Respond in Bangla with English in brackets.
OUTPUT: Valid JSON: { "titles": [{ "title": "বাংলা শিরোনাম", "title_en": "English", "subtitle": "...", "tagline": "...", "formula": "How-To", "strength_score": 8 }] }`,
  },
  7: {
    name: "OutlineArchitect",
    model: "claude-sonnet-4-6-20250514",
    systemPrompt: `You are OutlineArchitect. Design complete ebook outline with 10-15 chapters.
Respond in Bangla.
OUTPUT: Valid JSON: { "total_chapters": 12, "total_estimated_pages": 120, "chapters": [{ "number": 1, "title": "...", "topics": [{"title":"...","estimated_pages":3,"content_types":["text","list"],"reader_takeaway":"..."}], "estimated_pages": 10 }] }`,
  },
  8: {
    name: "ContentWriter",
    model: "claude-sonnet-4-6-20250514",
    systemPrompt: `You are ContentWriter. Write ONE topic with high quality.
Include: H2 headline, opening hook, H3 subheadings, quotes (> blockquote), **Pro Tip:** callout, **Key Takeaway:** box, transition.
Write in Bangla with English technical terms. Output pure markdown.`,
  },
  9: {
    name: "EditorReviewer",
    model: "claude-sonnet-4-6-20250514",
    systemPrompt: `You are EditorReviewer. Review the complete ebook.
OUTPUT: Valid JSON: { "quality_score": 8, "readability_score": 7, "engagement_score": 8, "actionability_score": 7, "overall_feedback": "...", "revision_flags": ["..."], "book_description": "..." }`,
  },
  11: {
    name: "CoverDesigner",
    model: "claude-sonnet-4-6-20250514",
    systemPrompt: `You are CoverDesigner. Generate 4 DALL-E prompts for book cover backgrounds (NO text in images).
OUTPUT: Valid JSON: { "covers": [{ "style": "...", "dalle_prompt": "...", "description": "বাংলায়" }], "back_cover_prompt": "...", "recommended_text_color": "#FFFFFF" }`,
  },
  12: {
    name: "DeliveryManager",
    model: "claude-haiku-4-5-20241022",
    systemPrompt: `You are DeliveryManager. Create completion summary.
OUTPUT: Valid JSON: { "summary": { "title": "...", "total_chapters": 12, "total_pages": 120, "total_words": 35000 }, "congratulations_message": "বাংলায় অভিনন্দন", "next_steps": ["..."] }`,
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step, user_input = {}, state_data = {} } = body;

    const agent = AGENTS[step];
    if (!agent) {
      return NextResponse.json({
        success: false,
        error: `No agent for step ${step}`,
      });
    }

    // Build user prompt from context
    const niche = state_data.niche || {};
    const avatar = state_data.avatar || {};
    const problem = state_data.problem?.selected_problem || {};
    const solutions = state_data.solutions?.selected_solutions || [];
    const research = state_data.research || {};
    const bookTitle = state_data.book_title?.selected_title || {};
    const outline = state_data.outline || {};

    let userPrompt = `Context:\nNiche: ${niche.main_niche || ""} > ${niche.sub_niche || ""}\n`;
    userPrompt += `Avatar: ${avatar.age_range || ""}, ${avatar.gender || ""}, ${avatar.income_level || ""}\n`;
    userPrompt += `Problem: ${problem.title || ""}\n`;
    userPrompt += `Solutions: ${solutions.map((s: { name: string }) => s.name).join(", ")}\n`;

    if (step === 3) {
      userPrompt += `\nPain points: ${(avatar.pain_points || []).join(", ")}\nGoals: ${(avatar.goals || []).join(", ")}\n`;
      userPrompt += `\nGenerate 10 specific problems for this reader in Bangladesh. Rank by ebook potential.`;
    } else if (step === 4) {
      userPrompt += `\nProblem: ${problem.title} - ${problem.description}\n`;
      userPrompt += `\nGenerate 5-8 solution approaches for this problem.`;
    } else if (step === 5) {
      userPrompt += `\nResearch summary: ${research.executive_summary || ""}\n`;
      userPrompt += `\nConduct deep research on this topic for a Bangladesh audience.`;
    } else if (step === 6) {
      userPrompt += `\nResearch: ${research.executive_summary || ""}\n`;
      userPrompt += `\nGenerate 10 compelling book title + tagline pairs.`;
    } else if (step === 7) {
      userPrompt += `\nBook title: ${bookTitle.title || ""}\nResearch: ${research.executive_summary || ""}\n`;
      userPrompt += `\nDesign complete ebook outline with 10-15 chapters.`;
    } else if (step === 8) {
      const chNum = user_input.chapter_number || 1;
      const topicNum = user_input.topic_number || 1;
      const style = user_input.writing_style || "storytelling";
      userPrompt += `\nBook: ${bookTitle.title || ""}\nChapter ${chNum}, Topic ${topicNum}\nStyle: ${style}\n`;
      userPrompt += `\nWrite this topic now. Include headlines, tips, quotes, key takeaway.`;
    } else if (step === 9) {
      userPrompt += `\nReview the complete ebook "${bookTitle.title || ""}". Score quality, readability, engagement, actionability.`;
    } else if (step === 11) {
      userPrompt += `\nBook: "${bookTitle.title || ""}"\nDesign 4 cover variations.`;
    } else if (step === 12) {
      userPrompt += `\nPrepare delivery summary for "${bookTitle.title || ""}".`;
    }

    const message = await anthropic.messages.create({
      model: agent.model,
      max_tokens: 4096,
      system: agent.systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response if applicable
    let parsedData: Record<string, unknown> = {};
    try {
      const jsonStart = responseText.indexOf("{");
      const jsonEnd = responseText.lastIndexOf("}") + 1;
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        parsedData = JSON.parse(responseText.substring(jsonStart, jsonEnd));
      }
    } catch {
      // For ContentWriter (step 8), response is markdown not JSON
      if (step === 8) {
        parsedData = { content_markdown: responseText, word_count: responseText.split(/\s+/).length };
      }
    }

    return NextResponse.json({
      success: true,
      agent_name: agent.name,
      step,
      data: parsedData,
      raw_text: step === 8 ? responseText : undefined,
    });
  } catch (error) {
    console.error("Agent API error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
