"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WizardNav } from "@/components/layout/wizard-nav";
import { callAgent } from "@/lib/api-client";
import {
  Sparkles, ChevronDown, ChevronUp, GripVertical, FileText,
  List, Quote, BarChart3, Dumbbell, CheckSquare, BookOpen, Lightbulb,
  AlertTriangle, ArrowUp, ArrowDown,
} from "lucide-react";

type Topic = {
  title: string;
  estimated_pages: number;
  content_types: string[];
  reader_takeaway: string;
};

type Chapter = {
  number: number;
  title: string;
  topics: Topic[];
  estimated_pages: number;
};

const CONTENT_TYPE_ICONS: Record<string, { icon: typeof FileText; color: string }> = {
  text: { icon: FileText, color: "text-slate-400" },
  list: { icon: List, color: "text-blue-400" },
  quote: { icon: Quote, color: "text-purple-400" },
  statistic: { icon: BarChart3, color: "text-emerald-400" },
  exercise: { icon: Dumbbell, color: "text-orange-400" },
  checklist: { icon: CheckSquare, color: "text-teal-400" },
  case_study: { icon: BookOpen, color: "text-amber-400" },
  tip: { icon: Lightbulb, color: "text-yellow-400" },
  story: { icon: BookOpen, color: "text-rose-400" },
};

export default function Step8OutlinePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadExisting(); }, []);

  async function loadExisting() {
    const { data } = await supabase
      .from("ebook_projects")
      .select("outline_data")
      .eq("id", projectId)
      .single();
    if (data?.outline_data?.chapters?.length) {
      setChapters(data.outline_data.chapters);
      setTotalPages(data.outline_data.total_estimated_pages || 0);
    }
  }

  async function generateOutline() {
    if (!user) return;
    setGenerating(true);
    setError("");

    try {
      const { data: project } = await supabase
        .from("ebook_projects")
        .select("main_niche, sub_niche, avatar_data, problem_data, solution_data, research_data, title_data, title")
        .eq("id", projectId)
        .single();

      const result = await callAgent(7, projectId, user.id, {}, {
        niche: {
          main_niche: project?.main_niche || "", sub_niche: project?.sub_niche || "",
          niche_description: "", market_demand: "Medium", target_keywords: [],
        },
        avatar: project?.avatar_data || {},
        problem: {
          selected_problem: project?.problem_data?.selected_problem || { title: "", description: "" },
          other_options: [],
        },
        solutions: { selected_solutions: project?.solution_data?.selected_solutions || [] },
        research: project?.research_data || {},
        book_title: {
          selected_title: project?.title_data?.selected_title || { title: project?.title || "", subtitle: "", tagline: "", title_style: "" },
          other_options: [],
        },
      });

      if (result.success && result.data) {
        const outline = result.data;
        setChapters(outline.chapters || []);
        setTotalPages(outline.total_estimated_pages || 0);
        await supabase.from("ebook_projects").update({
          outline_data: outline,
          total_chapters: outline.total_chapters,
          estimated_pages: outline.total_estimated_pages,
          updated_at: new Date().toISOString(),
        }).eq("id", projectId);
      } else {
        setError(result.error || "আউটলাইন তৈরি করতে ব্যর্থ");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করতে পারছে না");
    }
    setGenerating(false);
  }

  function moveChapter(index: number, direction: "up" | "down") {
    const newChapters = [...chapters];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newChapters.length) return;
    [newChapters[index], newChapters[targetIndex]] = [newChapters[targetIndex], newChapters[index]];
    newChapters.forEach((ch, i) => (ch.number = i + 1));
    setChapters(newChapters);
  }

  async function handleConfirm() {
    setLoading(true);

    // Save chapters to ebook_chapters table
    for (const ch of chapters) {
      await supabase.from("ebook_chapters").upsert({
        project_id: projectId,
        chapter_number: ch.number,
        title: ch.title,
        sub_topics: ch.topics,
        estimated_pages: ch.estimated_pages,
        status: "pending",
      }, { onConflict: "project_id,chapter_number" });
    }

    await supabase.from("ebook_projects").update({
      outline_data: { chapters, total_chapters: chapters.length, total_estimated_pages: totalPages },
      total_chapters: chapters.length,
      estimated_pages: totalPages,
      current_step: 9,
      updated_at: new Date().toISOString(),
    }).eq("id", projectId);

    router.push(`/ebook/${projectId}/step-9`);
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ota-blue">ধাপ ৮: ইবুক আউটলাইন</h2>
        <p className="text-slate-500 mt-1">অধ্যায় ও টপিকসহ সম্পূর্ণ ইবুক কাঠামো</p>
      </div>

      {chapters.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-ota-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <List className="w-10 h-10 text-ota-orange" />
          </div>
          <h3 className="text-lg font-semibold mb-2">আউটলাইন তৈরি করুন</h3>
          <p className="text-slate-500 mb-6">এআই ১০-১৫টি অধ্যায় ও টপিক সহ সম্পূর্ণ কাঠামো তৈরি করবে</p>
          <Button onClick={generateOutline} loading={generating} size="lg">
            <Sparkles className="w-5 h-5" /> আউটলাইন তৈরি করুন
          </Button>
          {error && <p className="mt-4 text-sm text-red-500"><AlertTriangle className="w-4 h-4 inline mr-1" />{error}</p>}
        </div>
      ) : (
        <>
          {/* Summary bar */}
          <div className="flex items-center justify-center gap-6 mb-6 text-sm">
            <span className="bg-ota-blue/10 text-ota-blue px-3 py-1.5 rounded-full font-medium">
              {chapters.length} অধ্যায়
            </span>
            <span className="bg-ota-orange/10 text-ota-orange px-3 py-1.5 rounded-full font-medium">
              ~{totalPages} পৃষ্ঠা
            </span>
            <span className="bg-ota-teal/10 text-ota-teal px-3 py-1.5 rounded-full font-medium">
              {chapters.reduce((sum, ch) => sum + ch.topics.length, 0)} টপিক
            </span>
          </div>

          {/* Chapters list */}
          <div className="max-w-3xl mx-auto space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {chapters.map((ch, index) => {
              const isExpanded = expandedChapter === index;

              return (
                <div key={ch.number} className="bg-white border rounded-xl overflow-hidden">
                  {/* Chapter header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpandedChapter(isExpanded ? null : index)}
                  >
                    <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />

                    <div className="flex gap-1 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); moveChapter(index, "up"); }}
                        className="p-0.5 hover:bg-slate-200 rounded" disabled={index === 0}>
                        <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveChapter(index, "down"); }}
                        className="p-0.5 hover:bg-slate-200 rounded" disabled={index === chapters.length - 1}>
                        <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>

                    <span className="text-ota-orange font-bold text-sm shrink-0">
                      {ch.number}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{ch.title}</p>
                      <p className="text-xs text-slate-400">{ch.topics.length} টপিক • ~{ch.estimated_pages} পৃষ্ঠা</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </div>

                  {/* Topics (expanded) */}
                  {isExpanded && (
                    <div className="border-t bg-slate-50 p-4 space-y-2">
                      {ch.topics.map((topic, ti) => (
                        <div key={ti} className="bg-white rounded-lg p-3 border border-slate-100">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-700">{topic.title}</p>
                              <p className="text-xs text-slate-400 mt-0.5">~{topic.estimated_pages} পৃষ্ঠা</p>
                            </div>
                            <div className="flex gap-1">
                              {topic.content_types.map((ct) => {
                                const iconData = CONTENT_TYPE_ICONS[ct];
                                if (!iconData) return null;
                                const Icon = iconData.icon;
                                return <Icon key={ct} className={`w-3.5 h-3.5 ${iconData.color}`} />;
                              })}
                            </div>
                          </div>
                          {topic.reader_takeaway && (
                            <p className="text-xs text-ota-teal mt-1">
                              <Lightbulb className="w-3 h-3 inline mr-1" />
                              {topic.reader_takeaway}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <WizardNav
            currentStep={8}
            isConfirmed={false}
            canGoBack={true}
            canGoForward={chapters.length > 0}
            loading={loading}
            onBack={() => router.push(`/ebook/${projectId}/step-7`)}
            onConfirm={handleConfirm}
            onRegenerate={generateOutline}
            confirmLabel="আউটলাইন নিশ্চিত করুন"
          />
        </>
      )}
    </div>
  );
}
