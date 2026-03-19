"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { WizardNav } from "@/components/layout/wizard-nav";
import { callAgent } from "@/lib/api-client";
import {
  Sparkles, Star, AlertTriangle, CheckCircle, BookOpen, Loader2,
} from "lucide-react";

type ReviewResult = {
  quality_score: number;
  readability_score: number;
  engagement_score: number;
  actionability_score: number;
  overall_feedback: string;
  strengths?: string[];
  revision_flags: string[];
  book_description: string;
};

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-28 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score * 10}%` }} />
      </div>
      <span className="text-sm font-bold text-slate-700 w-8">{score}/10</span>
    </div>
  );
}

export default function Step10ReviewPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const [review, setReview] = useState<ReviewResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadExisting(); }, []);

  async function loadExisting() {
    const { data } = await supabase.from("ebook_projects").select("review_data").eq("id", projectId).single();
    if (data?.review_data?.quality_score) setReview(data.review_data);
  }

  async function generateReview() {
    if (!user) return;
    setGenerating(true);
    setError("");

    try {
      const { data: project } = await supabase.from("ebook_projects")
        .select("*").eq("id", projectId).single();
      const { data: chapters } = await supabase.from("ebook_chapters")
        .select("*").eq("project_id", projectId).order("chapter_number");

      // Build topics_content from chapters
      const topicsContent = (chapters || []).map((ch: Record<string, unknown>) => ({
        chapter_number: ch.chapter_number,
        topic_number: 1,
        title: ch.title,
        content_markdown: (ch.content as string) || "",
        word_count: (ch.word_count as number) || 0,
        writing_style: (ch.writing_style as string) || "",
        status: (ch.status as string) || "confirmed",
      }));

      const result = await callAgent(9, projectId, user.id, {}, {
        niche: { main_niche: project?.main_niche || "", sub_niche: project?.sub_niche || "", niche_description: "", market_demand: "Medium", target_keywords: [] },
        book_title: { selected_title: project?.title_data?.selected_title || { title: project?.title || "", subtitle: "", tagline: "", title_style: "" }, other_options: [] },
        outline: project?.outline_data || { chapters: [], total_chapters: 0, total_estimated_pages: 0 },
        topics_content: topicsContent,
      });

      if (result.success && result.data) {
        const reviewData: ReviewResult = {
          quality_score: result.data.quality_score || 7,
          readability_score: result.data.readability_score || 7,
          engagement_score: result.data.engagement_score || 7,
          actionability_score: result.data.actionability_score || 7,
          overall_feedback: result.data.overall_feedback || "",
          strengths: result.data.strengths || [],
          revision_flags: result.data.revision_flags || [],
          book_description: result.data.book_description || "",
        };
        setReview(reviewData);
        await supabase.from("ebook_projects").update({
          review_data: reviewData,
          updated_at: new Date().toISOString(),
        }).eq("id", projectId);
      } else {
        setError(result.error || "রিভিউ তৈরি করতে ব্যর্থ");
      }
    } catch (err) {
      console.error("Review error:", err);
      setError("সার্ভারের সাথে সংযোগ করতে পারছে না");
    }
    setGenerating(false);
  }

  async function handleConfirm() {
    setLoading(true);
    await supabase.from("ebook_projects").update({
      current_step: 11, updated_at: new Date().toISOString(),
    }).eq("id", projectId);
    router.push(`/ebook/${projectId}/step-11`);
  }

  const avgScore = review ? Math.round((review.quality_score + review.readability_score + review.engagement_score + review.actionability_score) / 4 * 10) / 10 : 0;

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ota-blue">ধাপ ১০: ইবুক রিভিউ</h2>
        <p className="text-slate-500 mt-1">এআই আপনার সম্পূর্ণ ইবুক পর্যালোচনা করবে</p>
      </div>

      {!review ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-ota-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-ota-blue" />
          </div>
          <h3 className="text-lg font-semibold mb-2">ইবুক রিভিউ শুরু করুন</h3>
          <p className="text-slate-500 mb-6">এআই আপনার সমস্ত অধ্যায় পর্যালোচনা করে স্কোর ও পরামর্শ দেবে</p>
          <Button onClick={generateReview} loading={generating} size="lg" variant="secondary">
            <Sparkles className="w-5 h-5" /> রিভিউ শুরু করুন
          </Button>
          {error && <p className="mt-4 text-sm text-red-500"><AlertTriangle className="w-4 h-4 inline mr-1" />{error}</p>}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Overall Score */}
          <div className="text-center bg-gradient-to-br from-ota-blue to-ota-blue-dark rounded-2xl p-6 text-white">
            <p className="text-sm opacity-70 mb-1">সামগ্রিক স্কোর</p>
            <div className="flex items-center justify-center gap-1 mb-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={`w-6 h-6 ${i < Math.round(avgScore / 2) ? "text-amber-400 fill-amber-400" : "text-white/30"}`} />
              ))}
            </div>
            <p className="text-3xl font-bold">{avgScore}/10</p>
          </div>

          {/* Individual Scores */}
          <div className="bg-white border rounded-xl p-5 space-y-3">
            <ScoreBar label="মান (Quality)" score={review.quality_score} color="bg-ota-blue" />
            <ScoreBar label="পাঠযোগ্যতা" score={review.readability_score} color="bg-ota-teal" />
            <ScoreBar label="আকর্ষণ" score={review.engagement_score} color="bg-ota-orange" />
            <ScoreBar label="কার্যকারিতা" score={review.actionability_score} color="bg-emerald-500" />
          </div>

          {/* Feedback */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold text-slate-700 mb-2">সামগ্রিক মন্তব্য</h3>
            <p className="text-slate-600 leading-relaxed">{review.overall_feedback}</p>
          </div>

          {/* Revision Flags */}
          {(review.revision_flags?.length || 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="font-semibold text-amber-700 flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5" /> সংশোধনের পরামর্শ ({review.revision_flags.length})
              </h3>
              {review.revision_flags.map((flag, i) => (
                <p key={i} className="text-sm text-amber-800 mb-1.5">• {flag}</p>
              ))}
            </div>
          )}

          {/* Book Description */}
          {review.book_description && (
            <div className="bg-ota-teal/5 border border-ota-teal/20 rounded-xl p-5">
              <h3 className="font-semibold text-ota-teal flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5" /> বইয়ের বর্ণনা (Back Cover)
              </h3>
              <p className="text-slate-700 italic leading-relaxed">&ldquo;{review.book_description}&rdquo;</p>
            </div>
          )}

          <WizardNav
            currentStep={10}
            isConfirmed={false}
            canGoBack={true}
            canGoForward={true}
            loading={loading}
            onBack={() => router.push(`/ebook/${projectId}/step-9`)}
            onConfirm={handleConfirm}
            onRegenerate={generateReview}
            confirmLabel="এক্সপোর্ট ধাপে যান"
          />
        </div>
      )}
    </div>
  );
}
