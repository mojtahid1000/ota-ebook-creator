"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { WizardNav } from "@/components/layout/wizard-nav";
import { callAgent } from "@/lib/api-client";
import {
  Sparkles, BarChart3, Quote, BookOpen, Shield, Globe, AlertTriangle,
} from "lucide-react";

type ResearchResult = {
  executive_summary: string;
  statistics: { fact: string; source: string }[];
  expert_quotes: { quote: string; author: string; role: string }[];
  case_studies: { title: string; summary: string }[];
  confidence_score: number;
  disclaimers: string[];
  bangladesh_context: string;
};

export default function Step6ResearchPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const [research, setResearch] = useState<ResearchResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadExisting();
  }, []);

  async function loadExisting() {
    const { data } = await supabase
      .from("ebook_projects")
      .select("research_data")
      .eq("id", projectId)
      .single();
    if (data?.research_data?.executive_summary) {
      setResearch(data.research_data);
    }
  }

  async function generateResearch() {
    if (!user) return;
    setGenerating(true);
    setError("");

    try {
      const { data: project } = await supabase
        .from("ebook_projects")
        .select("main_niche, sub_niche, avatar_data, problem_data, solution_data, niche_data")
        .eq("id", projectId)
        .single();

      const result = await callAgent(5, projectId, user.id, {}, {
        niche: {
          main_niche: project?.main_niche || "",
          sub_niche: project?.sub_niche || "",
          niche_description: `${project?.main_niche} > ${project?.sub_niche}`,
          market_demand: "Medium", target_keywords: [],
        },
        avatar: project?.avatar_data || {},
        problem: {
          selected_problem: project?.problem_data?.selected_problem || { title: "", description: "" },
          other_options: [],
        },
        solutions: {
          selected_solutions: project?.solution_data?.selected_solutions || [],
        },
      });

      if (result.success && result.data) {
        setResearch(result.data);
        await supabase.from("ebook_projects").update({
          research_data: result.data,
          updated_at: new Date().toISOString(),
        }).eq("id", projectId);
      } else {
        setError(result.error || "রিসার্চ তৈরি করতে ব্যর্থ");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করতে পারছে না");
    }
    setGenerating(false);
  }

  async function handleConfirm() {
    setLoading(true);
    await supabase.from("ebook_projects").update({
      current_step: 7, updated_at: new Date().toISOString(),
    }).eq("id", projectId);
    router.push(`/ebook/${projectId}/step-7`);
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ota-blue">ধাপ ৬: রিসার্চ সামারি</h2>
        <p className="text-slate-500 mt-1">এআই আপনার বিষয়ে গভীর গবেষণা করবে (Opus Model)</p>
      </div>

      {!research ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-ota-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-10 h-10 text-ota-blue" />
          </div>
          <h3 className="text-lg font-semibold mb-2">গভীর রিসার্চ শুরু করুন</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Claude Opus আপনার সমস্যা ও সমাধান নিয়ে পরিসংখ্যান, বিশেষজ্ঞ মতামত ও কেস স্টাডি সংগ্রহ করবে
          </p>
          <Button onClick={generateResearch} loading={generating} size="lg" variant="secondary">
            <Sparkles className="w-5 h-5" /> রিসার্চ শুরু করুন
          </Button>
          {error && <p className="mt-4 text-sm text-red-500"><AlertTriangle className="w-4 h-4 inline mr-1" />{error}</p>}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Confidence Score */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-sm text-slate-500">রিসার্চ কনফিডেন্স:</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className={`w-5 h-5 rounded ${i < research.confidence_score ? "bg-ota-teal" : "bg-slate-200"}`} />
              ))}
            </div>
            <span className="font-bold text-ota-teal">{research.confidence_score}/10</span>
          </div>

          {/* Summary */}
          <div className="bg-ota-blue/5 rounded-xl p-5 border border-ota-blue/10">
            <h3 className="font-semibold text-ota-blue flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5" /> সারসংক্ষেপ
            </h3>
            <p className="text-slate-700 leading-relaxed">{research.executive_summary}</p>
          </div>

          {/* Statistics */}
          <div>
            <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-ota-orange" /> পরিসংখ্যান ({research.statistics.length})
            </h3>
            <div className="space-y-2">
              {research.statistics.map((stat, i) => (
                <div key={i} className="bg-white border rounded-lg p-3 flex items-start gap-3">
                  <span className="text-ota-orange font-bold text-lg">{i + 1}</span>
                  <div>
                    <p className="text-sm text-slate-700">{stat.fact}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{stat.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expert Quotes */}
          {research.expert_quotes.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <Quote className="w-5 h-5 text-ota-teal" /> বিশেষজ্ঞ মতামত
              </h3>
              <div className="space-y-3">
                {research.expert_quotes.map((q, i) => (
                  <blockquote key={i} className="border-l-4 border-ota-teal pl-4 py-2">
                    <p className="text-sm text-slate-700 italic">&ldquo;{q.quote}&rdquo;</p>
                    <p className="text-xs text-slate-500 mt-1">— {q.author}, {q.role}</p>
                  </blockquote>
                ))}
              </div>
            </div>
          )}

          {/* Case Studies */}
          {research.case_studies.length > 0 && (
            <div>
              <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-amber-500" /> কেস স্টাডি
              </h3>
              {research.case_studies.map((cs, i) => (
                <div key={i} className="bg-amber-50 rounded-lg p-4 mb-2">
                  <p className="font-medium text-slate-800 mb-1">{cs.title}</p>
                  <p className="text-sm text-slate-600">{cs.summary}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bangladesh Context */}
          {research.bangladesh_context && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <h3 className="font-semibold text-emerald-700 flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5" /> বাংলাদেশ প্রসঙ্গ
              </h3>
              <p className="text-sm text-slate-700">{research.bangladesh_context}</p>
            </div>
          )}

          {/* Disclaimers */}
          {research.disclaimers.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <h3 className="font-semibold text-amber-700 flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5" /> ডিসক্লেইমার
              </h3>
              {research.disclaimers.map((d, i) => (
                <p key={i} className="text-sm text-amber-800">• {d}</p>
              ))}
            </div>
          )}

          <WizardNav
            currentStep={6}
            isConfirmed={false}
            canGoBack={true}
            canGoForward={true}
            loading={loading}
            onBack={() => router.push(`/ebook/${projectId}/step-5`)}
            onConfirm={handleConfirm}
            onRegenerate={generateResearch}
            confirmLabel="রিসার্চ নিশ্চিত করুন"
          />
        </div>
      )}
    </div>
  );
}
