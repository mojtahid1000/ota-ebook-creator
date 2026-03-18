"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { callAgent } from "@/lib/api-client";
import {
  Sparkles, Image as ImageIcon, Palette, Download,
  AlertTriangle, Loader2, Check, PartyPopper,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CoverPrompt = { style: string; dalle_prompt: string; description: string };

export default function Step12CoverPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const [coverPrompts, setCoverPrompts] = useState<CoverPrompt[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [generatingPrompts, setGeneratingPrompts] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [deliveryData, setDeliveryData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  async function generateCoverPrompts() {
    if (!user) return;
    setGeneratingPrompts(true);
    setError("");

    try {
      const { data: project } = await supabase.from("ebook_projects").select("*").eq("id", projectId).single();

      const result = await callAgent(11, projectId, user.id, { action: "generate_prompts" }, {
        niche: { main_niche: project?.main_niche || "", sub_niche: project?.sub_niche || "", niche_description: "", market_demand: "Medium", target_keywords: [] },
        book_title: { selected_title: project?.title_data?.selected_title || { title: project?.title || "", subtitle: "", tagline: "", title_style: "" }, other_options: [] },
        review: project?.review_data || { book_description: "" },
      });

      if (result.success) {
        const raw = result.state?.covers_raw || {};
        setCoverPrompts(raw.covers || []);
      } else {
        setError(result.error || "কভার প্রম্পট তৈরি করতে ব্যর্থ");
      }
    } catch { setError("সার্ভার সংযোগ ব্যর্থ"); }
    setGeneratingPrompts(false);
  }

  async function generateImage(promptIndex: number) {
    if (!user) return;
    setGeneratingImage(true);
    setSelectedIndex(promptIndex);
    setError("");

    try {
      const { data: project } = await supabase.from("ebook_projects").select("*").eq("id", projectId).single();
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      const result = await callAgent(11, projectId, user.id, {
        action: "generate_images",
        prompt_index: promptIndex,
        image_provider: "dalle",
        author_name: profile?.author_name || "Author",
        press_name: profile?.press_name || "",
      }, {
        niche: { main_niche: project?.main_niche || "", sub_niche: project?.sub_niche || "", niche_description: "", market_demand: "Medium", target_keywords: [] },
        book_title: { selected_title: project?.title_data?.selected_title || { title: project?.title || "", subtitle: "", tagline: "", title_style: "" }, other_options: [] },
        covers_raw: { covers: coverPrompts, recommended_text_color: "#FFFFFF" },
        review: project?.review_data || {},
      });

      if (result.success && result.state?.covers?.front_options?.[promptIndex]?.image_url) {
        setGeneratedImageUrl(result.state.covers.front_options[promptIndex].image_url);
      } else {
        setError("ছবি তৈরি করতে ব্যর্থ - DALL-E API চেক করুন");
      }
    } catch { setError("সার্ভার সংযোগ ব্যর্থ"); }
    setGeneratingImage(false);
  }

  async function finishEbook() {
    if (!user) return;

    // Call DeliveryManager (Agent 12)
    try {
      const { data: project } = await supabase.from("ebook_projects").select("*").eq("id", projectId).single();
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

      const result = await callAgent(12, projectId, user.id, {
        author_name: profile?.author_name || "Author",
      }, {
        niche: { main_niche: project?.main_niche || "", sub_niche: project?.sub_niche || "", niche_description: "", market_demand: "Medium", target_keywords: [] },
        book_title: { selected_title: project?.title_data?.selected_title || { title: project?.title || "", subtitle: "", tagline: "", title_style: "" }, other_options: [] },
        outline: project?.outline_data || { chapters: [], total_chapters: 0, total_estimated_pages: 0 },
        topics_content: [],
        export: { formats_generated: ["pdf"], file_urls: {}, design_settings: {} },
        covers: { front_options: [], back_image_url: "", selected_front_index: 0 },
      });

      if (result.success) {
        setDeliveryData(result.state?.delivery || {});
        await supabase.from("ebook_projects").update({
          status: "completed", updated_at: new Date().toISOString(),
        }).eq("id", projectId);
      }
    } catch {}
  }

  // Show completion screen
  if (deliveryData) {
    const summary = (deliveryData as Record<string, unknown>).summary as Record<string, unknown> || {};
    const message = (deliveryData as Record<string, unknown>).congratulations_message as string || "";
    const nextSteps = (deliveryData as Record<string, unknown>).next_steps as string[] || [];

    return (
      <div className="text-center py-12 max-w-2xl mx-auto">
        <div className="w-24 h-24 bg-gradient-to-br from-ota-orange to-ota-teal rounded-full flex items-center justify-center mx-auto mb-6">
          <PartyPopper className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-ota-blue mb-3">ইবুক সম্পন্ন!</h2>
        {message && <p className="text-lg text-slate-600 mb-6">{message}</p>}

        <div className="bg-white border rounded-xl p-6 mb-6 text-left">
          <h3 className="font-semibold text-ota-blue mb-3">সারসংক্ষেপ</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-500">শিরোনাম</p>
              <p className="font-medium">{summary.title as string || "N/A"}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-500">অধ্যায়</p>
              <p className="font-medium">{summary.total_chapters as number || 0}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-500">পৃষ্ঠা</p>
              <p className="font-medium">~{summary.total_pages as number || 0}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-slate-500">শব্দ</p>
              <p className="font-medium">{summary.total_words as number || 0}</p>
            </div>
          </div>
        </div>

        {nextSteps.length > 0 && (
          <div className="bg-ota-teal/5 border border-ota-teal/20 rounded-xl p-6 mb-6 text-left">
            <h3 className="font-semibold text-ota-teal mb-3">পরবর্তী পদক্ষেপ</h3>
            {nextSteps.map((step, i) => (
              <p key={i} className="text-sm text-slate-700 mb-1.5">
                {i + 1}. {step}
              </p>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push(`/ebook/${projectId}/step-11`)} variant="outline">
            <Download className="w-4 h-4" /> এক্সপোর্টে ফিরে যান
          </Button>
          <Button onClick={() => router.push("/dashboard")}>
            ড্যাশবোর্ডে যান
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ota-blue">ধাপ ১২: কভার ডিজাইন</h2>
        <p className="text-slate-500 mt-1">DALL-E দিয়ে প্রফেশনাল কভার তৈরি করুন</p>
      </div>

      <div className="max-w-3xl mx-auto">
        {coverPrompts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-ota-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Palette className="w-10 h-10 text-ota-orange" />
            </div>
            <h3 className="text-lg font-semibold mb-2">কভার ডিজাইন শুরু করুন</h3>
            <p className="text-slate-500 mb-6">এআই ৪টি ভিন্ন স্টাইলে কভার ডিজাইন প্রস্তাব করবে</p>
            <Button onClick={generateCoverPrompts} loading={generatingPrompts} size="lg">
              <Sparkles className="w-5 h-5" /> কভার ডিজাইন তৈরি করুন
            </Button>
            {error && <p className="mt-4 text-sm text-red-500"><AlertTriangle className="w-4 h-4 inline mr-1" />{error}</p>}
          </div>
        ) : (
          <>
            {/* Cover Style Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {coverPrompts.map((cover, i) => (
                <Card
                  key={i}
                  selected={selectedIndex === i}
                  onClick={() => setSelectedIndex(i)}
                  className="py-4 px-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-ota-blue/10 rounded-lg flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5 text-ota-blue" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{cover.style}</h4>
                      <p className="text-sm text-slate-500 mt-1">{cover.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Generate Image Button */}
            {selectedIndex !== null && !generatedImageUrl && (
              <div className="text-center mb-6">
                <Button onClick={() => generateImage(selectedIndex)} loading={generatingImage} size="lg" variant="secondary">
                  {generatingImage ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> DALL-E দিয়ে ছবি তৈরি হচ্ছে...</>
                  ) : (
                    <><ImageIcon className="w-5 h-5" /> এই স্টাইলে কভার তৈরি করুন</>
                  )}
                </Button>
                <p className="text-xs text-slate-400 mt-2">DALL-E 3 ব্যবহার করে ছবি তৈরি হবে (~20 সেকেন্ড)</p>
              </div>
            )}

            {/* Generated Image Preview */}
            {generatedImageUrl && (
              <div className="text-center mb-6">
                <div className="bg-slate-100 rounded-xl p-4 inline-block">
                  <div className="w-48 h-72 bg-gradient-to-br from-ota-blue to-ota-blue-dark rounded-lg flex items-center justify-center text-white">
                    <div className="text-center p-3">
                      <Check className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">কভার তৈরি হয়েছে</p>
                      <p className="text-xs opacity-70 mt-1">ফাইল সেভ হয়েছে</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Skip Cover Option */}
            <div className="text-center mb-6">
              <p className="text-sm text-slate-400 mb-3">অথবা</p>
              <Button variant="ghost" onClick={finishEbook} size="sm">
                কভার ছাড়াই ইবুক সম্পন্ন করুন
              </Button>
            </div>

            {error && <p className="text-sm text-red-500 text-center mb-4"><AlertTriangle className="w-4 h-4 inline mr-1" />{error}</p>}

            {/* Finish Button */}
            {generatedImageUrl && (
              <div className="text-center">
                <Button onClick={finishEbook} size="lg">
                  <PartyPopper className="w-5 h-5" /> ইবুক সম্পন্ন করুন!
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
