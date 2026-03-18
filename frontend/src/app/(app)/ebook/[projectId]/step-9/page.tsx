"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WizardNav } from "@/components/layout/wizard-nav";
import { callAgent } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Check, RotateCcw, Pen, ChevronRight,
  BookOpen, AlertTriangle, Loader2, ArrowLeft,
} from "lucide-react";

type TopicInfo = {
  chapter_number: number;
  chapter_title: string;
  topic_number: number;
  topic_title: string;
  status: "pending" | "writing" | "review" | "confirmed";
  content?: string;
  word_count?: number;
  writing_style?: string;
};

type WritingStyle = { id: string; bn: string; en: string };
type RewriteAngle = { id: string; bn: string };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Step9ContentPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [currentTopic, setCurrentTopic] = useState<TopicInfo | null>(null);
  const [content, setContent] = useState("");
  const [styles, setStyles] = useState<WritingStyle[]>([]);
  const [rewriteAngles, setRewriteAngles] = useState<RewriteAngle[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("storytelling");
  const [phase, setPhase] = useState<"select_style" | "writing" | "review" | "rewrite_options">("select_style");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
    loadStyles();
  }, []);

  async function loadStyles() {
    try {
      const [stylesRes, anglesRes] = await Promise.all([
        fetch(`${API_URL}/api/agents/writing-styles`),
        fetch(`${API_URL}/api/agents/rewrite-angles`),
      ]);
      if (stylesRes.ok) {
        const d = await stylesRes.json();
        setStyles(d.styles || []);
      }
      if (anglesRes.ok) {
        const d = await anglesRes.json();
        setRewriteAngles(d.angles || []);
      }
    } catch {}
  }

  async function loadData() {
    const { data: project } = await supabase
      .from("ebook_projects")
      .select("outline_data")
      .eq("id", projectId)
      .single();

    const { data: chapters } = await supabase
      .from("ebook_chapters")
      .select("*")
      .eq("project_id", projectId)
      .order("chapter_number");

    if (!project?.outline_data?.chapters) return;

    // Build flat topic list from outline + saved content
    const allTopics: TopicInfo[] = [];
    for (const ch of project.outline_data.chapters) {
      const savedChapter = chapters?.find((c: { chapter_number: number }) => c.chapter_number === ch.number);

      for (let ti = 0; ti < ch.topics.length; ti++) {
        const topic = ch.topics[ti];
        allTopics.push({
          chapter_number: ch.number,
          chapter_title: ch.title,
          topic_number: ti + 1,
          topic_title: topic.title,
          status: "pending",
          content: undefined,
          word_count: 0,
          writing_style: undefined,
        });
      }
    }

    setTopics(allTopics);

    // Find first non-confirmed topic
    const firstPending = allTopics.find((t) => t.status !== "confirmed");
    if (firstPending) {
      setCurrentTopic(firstPending);
    }
  }

  const buildStateData = useCallback(async () => {
    const { data: project } = await supabase
      .from("ebook_projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) return {};

    return {
      niche: { main_niche: project.main_niche || "", sub_niche: project.sub_niche || "", niche_description: "", market_demand: "Medium", target_keywords: [] },
      avatar: project.avatar_data || {},
      problem: { selected_problem: project.problem_data?.selected_problem || { title: "", description: "" }, other_options: [] },
      solutions: { selected_solutions: project.solution_data?.selected_solutions || [] },
      research: project.research_data || { executive_summary: "" },
      book_title: { selected_title: project.title_data?.selected_title || { title: project.title || "", subtitle: "", tagline: "", title_style: "" }, other_options: [] },
      outline: project.outline_data || {},
      topics_content: topics.filter((t) => t.status === "confirmed").map((t) => ({
        chapter_number: t.chapter_number,
        topic_number: t.topic_number,
        title: t.topic_title,
        content_markdown: t.content || "",
        word_count: t.word_count || 0,
        writing_style: t.writing_style || "",
        status: t.status,
      })),
      writing_style_preference: selectedStyle,
    };
  }, [projectId, supabase, topics, selectedStyle]);

  async function writeTopic() {
    if (!currentTopic || !user) return;
    setGenerating(true);
    setError("");
    setPhase("writing");

    try {
      const stateData = await buildStateData();
      const result = await callAgent(8, projectId, user.id, {
        action: "write",
        chapter_number: currentTopic.chapter_number,
        topic_number: currentTopic.topic_number,
        writing_style: selectedStyle,
      }, stateData);

      if (result.success) {
        // Find the written topic in the state
        const writtenTopics = result.state?.topics_content || [];
        const written = writtenTopics.find(
          (t: { chapter_number: number; topic_number: number }) =>
            t.chapter_number === currentTopic.chapter_number &&
            t.topic_number === currentTopic.topic_number
        );

        if (written) {
          setContent(written.content_markdown || "");
          setCurrentTopic((prev) =>
            prev ? { ...prev, content: written.content_markdown, word_count: written.word_count, status: "review" } : prev
          );
          // Update in topics list
          setTopics((prev) =>
            prev.map((t) =>
              t.chapter_number === currentTopic.chapter_number && t.topic_number === currentTopic.topic_number
                ? { ...t, content: written.content_markdown, word_count: written.word_count, status: "review", writing_style: selectedStyle }
                : t
            )
          );
        }
        setPhase("review");
      } else {
        setError(result.error || "কন্টেন্ট লিখতে ব্যর্থ");
        setPhase("select_style");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করতে পারছে না");
      setPhase("select_style");
    }
    setGenerating(false);
  }

  async function rewriteTopic(angle: string) {
    if (!currentTopic || !user) return;
    setGenerating(true);
    setError("");
    setPhase("writing");

    try {
      const stateData = await buildStateData();
      // Add current content to state for rewrite
      const topicsWithContent = [...(stateData.topics_content || [])];
      topicsWithContent.push({
        chapter_number: currentTopic.chapter_number,
        topic_number: currentTopic.topic_number,
        title: currentTopic.topic_title,
        content_markdown: content,
        word_count: currentTopic.word_count || 0,
        writing_style: selectedStyle,
        status: "review",
      });
      stateData.topics_content = topicsWithContent;

      const result = await callAgent(8, projectId, user.id, {
        action: "rewrite",
        chapter_number: currentTopic.chapter_number,
        topic_number: currentTopic.topic_number,
        rewrite_angle: angle,
      }, stateData);

      if (result.success) {
        const writtenTopics = result.state?.topics_content || [];
        const written = writtenTopics.find(
          (t: { chapter_number: number; topic_number: number }) =>
            t.chapter_number === currentTopic.chapter_number &&
            t.topic_number === currentTopic.topic_number
        );
        if (written) {
          setContent(written.content_markdown || "");
          setCurrentTopic((prev) => prev ? { ...prev, content: written.content_markdown, word_count: written.word_count } : prev);
        }
        setPhase("review");
      } else {
        setError(result.error || "রিরাইট করতে ব্যর্থ");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করতে পারছে না");
    }
    setGenerating(false);
  }

  async function confirmTopic() {
    if (!currentTopic) return;

    // Save content to ebook_chapters in Supabase
    await supabase.from("ebook_chapters").upsert({
      project_id: projectId,
      chapter_number: currentTopic.chapter_number,
      title: currentTopic.chapter_title,
      content: content,
      word_count: currentTopic.word_count || 0,
      writing_style: selectedStyle,
      status: "confirmed",
    }, { onConflict: "project_id,chapter_number" });

    // Update local state
    setTopics((prev) =>
      prev.map((t) =>
        t.chapter_number === currentTopic.chapter_number && t.topic_number === currentTopic.topic_number
          ? { ...t, status: "confirmed", content }
          : t
      )
    );

    // Move to next topic
    const currentIndex = topics.findIndex(
      (t) => t.chapter_number === currentTopic.chapter_number && t.topic_number === currentTopic.topic_number
    );
    const nextTopic = topics[currentIndex + 1];

    if (nextTopic) {
      setCurrentTopic(nextTopic);
      setContent("");
      setPhase("select_style");
    } else {
      // All topics done - move to step 10
      await supabase.from("ebook_projects").update({
        current_step: 10,
        updated_at: new Date().toISOString(),
      }).eq("id", projectId);
      router.push(`/ebook/${projectId}/step-10`);
    }
  }

  const confirmedCount = topics.filter((t) => t.status === "confirmed").length;
  const totalCount = topics.length;
  const progressPercent = totalCount > 0 ? (confirmedCount / totalCount) * 100 : 0;

  return (
    <div>
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-ota-blue">ধাপ ৯: কন্টেন্ট লেখা</h2>
        <p className="text-slate-500 mt-1">টপিক বাই টপিক ইবুক কন্টেন্ট লেখা হবে</p>
      </div>

      {/* Progress Bar */}
      <div className="max-w-3xl mx-auto mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-slate-500">{confirmedCount}/{totalCount} টপিক সম্পন্ন</span>
          <span className="font-medium text-ota-orange">{Math.round(progressPercent)}%</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-ota-orange to-ota-teal rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="flex gap-6 max-w-6xl mx-auto">
        {/* Left Sidebar - Topic Navigator */}
        <div className="w-64 shrink-0 hidden lg:block">
          <div className="bg-white border rounded-xl p-3 sticky top-20 max-h-[70vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 px-2">টপিক তালিকা</h3>
            {topics.map((t, i) => (
              <button
                key={i}
                onClick={() => {
                  if (t.status === "confirmed" || t === currentTopic) {
                    setCurrentTopic(t);
                    setContent(t.content || "");
                    setPhase(t.content ? "review" : "select_style");
                  }
                }}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs mb-0.5 flex items-center gap-2 transition-colors
                  ${t === currentTopic ? "bg-ota-orange/10 text-ota-orange font-medium" : ""}
                  ${t.status === "confirmed" ? "text-ota-teal" : "text-slate-500"}
                  ${t.status === "pending" && t !== currentTopic ? "opacity-50" : "hover:bg-slate-50"}
                `}
              >
                {t.status === "confirmed" ? (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                ) : t === currentTopic ? (
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 shrink-0 rounded-full border border-slate-300" />
                )}
                <span className="truncate">Ch{t.chapter_number}.{t.topic_number} {t.topic_title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {!currentTopic ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-ota-teal mx-auto mb-3" />
              <p className="text-lg font-semibold text-slate-700">সব টপিক সম্পন্ন!</p>
            </div>
          ) : (
            <div>
              {/* Current Topic Header */}
              <div className="bg-ota-blue/5 rounded-xl p-4 mb-4 border border-ota-blue/10">
                <p className="text-xs text-ota-blue font-medium">
                  অধ্যায় {currentTopic.chapter_number}: {currentTopic.chapter_title}
                </p>
                <h3 className="text-lg font-bold text-slate-800 mt-1">
                  টপিক {currentTopic.topic_number}: {currentTopic.topic_title}
                </h3>
              </div>

              {/* Phase: Select Writing Style */}
              {phase === "select_style" && (
                <div>
                  <h4 className="font-semibold text-slate-700 mb-3">লেখার ধরন বেছে নিন:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                    {styles.map((style) => (
                      <Card
                        key={style.id}
                        selected={selectedStyle === style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className="py-3 px-3 text-center"
                      >
                        <p className="text-sm font-medium">{style.bn}</p>
                        <p className="text-xs text-slate-400">({style.en})</p>
                      </Card>
                    ))}
                  </div>
                  <div className="text-center">
                    <Button onClick={writeTopic} loading={generating} size="lg">
                      <Sparkles className="w-5 h-5" /> এই টপিক লিখুন
                    </Button>
                  </div>
                  {error && <p className="mt-3 text-sm text-red-500 text-center"><AlertTriangle className="w-4 h-4 inline mr-1" />{error}</p>}
                </div>
              )}

              {/* Phase: Writing (loading) */}
              {phase === "writing" && (
                <div className="text-center py-16">
                  <Loader2 className="w-12 h-12 text-ota-orange animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold text-slate-700">লেখা হচ্ছে...</p>
                  <p className="text-sm text-slate-500 mt-1">Claude Opus এই টপিকটি লিখছে</p>
                </div>
              )}

              {/* Phase: Review content */}
              {phase === "review" && content && (
                <div>
                  {/* Content preview */}
                  <div className="bg-white border rounded-xl p-6 mb-4 prose prose-slate max-w-none
                    prose-headings:text-ota-blue prose-strong:text-slate-800
                    prose-blockquote:border-ota-teal prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                    max-h-[500px] overflow-y-auto"
                  >
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>

                  {/* Word count */}
                  <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                    <span>শব্দ সংখ্যা: {currentTopic.word_count || content.split(/\s+/).length}</span>
                    <span>স্টাইল: {styles.find((s) => s.id === selectedStyle)?.bn || selectedStyle}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-3 justify-center">
                    <Button onClick={confirmTopic} variant="primary" size="lg">
                      <Check className="w-5 h-5" /> নিশ্চিত করুন ও পরবর্তী টপিক
                    </Button>
                    <Button onClick={() => writeTopic()} variant="outline" size="md">
                      <RotateCcw className="w-4 h-4" /> একই স্টাইলে পুনরায় লিখুন
                    </Button>
                    <Button onClick={() => setPhase("rewrite_options")} variant="ghost" size="md">
                      <Pen className="w-4 h-4" /> ভিন্ন অ্যাঙ্গেলে রিরাইট
                    </Button>
                  </div>
                </div>
              )}

              {/* Phase: Rewrite angle selection */}
              {phase === "rewrite_options" && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Button variant="ghost" size="sm" onClick={() => setPhase("review")}>
                      <ArrowLeft className="w-4 h-4" /> ফিরে যান
                    </Button>
                    <h4 className="font-semibold text-slate-700">রিরাইটের অ্যাঙ্গেল বেছে নিন:</h4>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {rewriteAngles.map((angle) => (
                      <Card
                        key={angle.id}
                        onClick={() => rewriteTopic(angle.id)}
                        className="py-3 px-3 text-center cursor-pointer"
                      >
                        <p className="text-sm font-medium">{angle.bn}</p>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom nav - only show Back to go to previous step */}
      <div className="mt-8 border-t pt-4">
        <Button variant="ghost" onClick={() => router.push(`/ebook/${projectId}/step-8`)}>
          <ArrowLeft className="w-4 h-4" /> আউটলাইনে ফিরে যান
        </Button>
      </div>
    </div>
  );
}
