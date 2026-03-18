"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WizardNav } from "@/components/layout/wizard-nav";
import { callAgent } from "@/lib/api-client";
import { Sparkles, Star, Tag, BookMarked, AlertTriangle } from "lucide-react";

type TitleOption = {
  title: string;
  title_en?: string;
  subtitle: string;
  tagline: string;
  formula?: string;
  title_style?: string;
  strength_score: number;
};

export default function Step7TitlePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const [titles, setTitles] = useState<TitleOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { loadExisting(); }, []);

  async function loadExisting() {
    const { data } = await supabase
      .from("ebook_projects")
      .select("title_data")
      .eq("id", projectId)
      .single();
    if (data?.title_data?.titles?.length) {
      setTitles(data.title_data.titles);
    }
  }

  async function generateTitles() {
    if (!user) return;
    setGenerating(true);
    setError("");

    try {
      const { data: project } = await supabase
        .from("ebook_projects")
        .select("main_niche, sub_niche, problem_data, solution_data, research_data, niche_data")
        .eq("id", projectId)
        .single();

      const result = await callAgent(6, projectId, user.id, {}, {
        niche: {
          main_niche: project?.main_niche || "", sub_niche: project?.sub_niche || "",
          niche_description: "", market_demand: "Medium", target_keywords: [],
        },
        problem: {
          selected_problem: project?.problem_data?.selected_problem || { title: "", description: "" },
          other_options: [],
        },
        solutions: { selected_solutions: project?.solution_data?.selected_solutions || [] },
        research: project?.research_data || { executive_summary: "" },
      });

      if (result.success && result.data?.titles) {
        const allTitles = result.data.titles;
        setTitles(allTitles);
        await supabase.from("ebook_projects").update({
          title_data: { titles: allTitles },
          updated_at: new Date().toISOString(),
        }).eq("id", projectId);
      } else {
        setError(result.error || "টাইটেল তৈরি করতে ব্যর্থ");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করতে পারছে না");
    }
    setGenerating(false);
  }

  async function handleConfirm() {
    if (selectedIndex === null) return;
    setLoading(true);
    const selected = titles[selectedIndex];

    await supabase.from("ebook_projects").update({
      title: selected.title,
      subtitle: selected.subtitle,
      tagline: selected.tagline,
      title_data: { titles, selected_title: selected, selected_index: selectedIndex },
      current_step: 8,
      updated_at: new Date().toISOString(),
    }).eq("id", projectId);

    router.push(`/ebook/${projectId}/step-8`);
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ota-blue">ধাপ ৭: বইয়ের নাম নির্বাচন</h2>
        <p className="text-slate-500 mt-1">এআই ১০টি আকর্ষণীয় শিরোনাম ও ট্যাগলাইন তৈরি করবে</p>
      </div>

      {titles.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookMarked className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">বইয়ের নাম তৈরি করুন</h3>
          <p className="text-slate-500 mb-6">১০টি ভিন্ন ফর্মুলায় আকর্ষণীয় শিরোনাম পাবেন</p>
          <Button onClick={generateTitles} loading={generating} size="lg">
            <Sparkles className="w-5 h-5" /> নাম তৈরি করুন
          </Button>
          {error && <p className="mt-4 text-sm text-red-500"><AlertTriangle className="w-4 h-4 inline mr-1" />{error}</p>}
        </div>
      ) : (
        <>
          <div className="space-y-3 max-w-3xl mx-auto max-h-[500px] overflow-y-auto pr-2">
            {titles.map((t, index) => (
              <Card
                key={index}
                selected={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
                className="py-4 px-5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-slate-800">{t.title}</h4>
                    {t.title_en && <p className="text-xs text-slate-400">[{t.title_en}]</p>}
                    {t.subtitle && <p className="text-sm text-slate-600 mt-1">{t.subtitle}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-ota-teal">
                        <Tag className="w-3 h-3" /> {t.tagline}
                      </span>
                      {(t.formula || t.title_style) && (
                        <span className="text-xs bg-ota-blue/10 text-ota-blue px-2 py-0.5 rounded-full">
                          {t.formula || t.title_style}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <Star className={`w-4 h-4 ${t.strength_score >= 8 ? "text-amber-400 fill-amber-400" : "text-slate-300"}`} />
                    <span className="text-sm font-bold text-slate-600">{t.strength_score}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <WizardNav
            currentStep={7}
            isConfirmed={false}
            canGoBack={true}
            canGoForward={selectedIndex !== null}
            loading={loading}
            onBack={() => router.push(`/ebook/${projectId}/step-6`)}
            onConfirm={handleConfirm}
            onRegenerate={generateTitles}
            confirmLabel="এই নাম নির্বাচন করুন"
          />
        </>
      )}
    </div>
  );
}
