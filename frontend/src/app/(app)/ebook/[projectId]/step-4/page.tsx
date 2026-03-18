"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WizardNav } from "@/components/layout/wizard-nav";
import { callAgent } from "@/lib/api-client";
import { Sparkles, AlertTriangle, Flame, Heart } from "lucide-react";

type Problem = {
  title: string;
  description: string;
  urgency_score: number;
  emotional_weight: number;
  why_great_topic: string;
};

export default function Step4ProblemPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if problems already generated
    loadExisting();
  }, []);

  async function loadExisting() {
    const { data } = await supabase
      .from("ebook_projects")
      .select("problem_data")
      .eq("id", projectId)
      .single();

    if (data?.problem_data?.problems?.length) {
      setProblems(data.problem_data.problems);
    }
  }

  async function generateProblems() {
    if (!user) return;
    setGenerating(true);
    setError("");

    try {
      // Get project state for context
      const { data: project } = await supabase
        .from("ebook_projects")
        .select("main_niche, sub_niche, avatar_data, niche_data")
        .eq("id", projectId)
        .single();

      const result = await callAgent(
        3,
        projectId,
        user.id,
        { action: "generate" },
        {
          niche: {
            main_niche: project?.main_niche || "",
            sub_niche: project?.sub_niche || "",
            niche_description: `${project?.main_niche} > ${project?.sub_niche}`,
            market_demand: project?.niche_data?.market_demand || "Medium",
            target_keywords: [],
          },
          avatar: {
            age_range: project?.avatar_data?.age_range || "25-34",
            gender: project?.avatar_data?.gender || "all",
            income_level: project?.avatar_data?.income_level || "middle",
            education: project?.avatar_data?.education || "bachelors",
            pain_points: project?.avatar_data?.pain_points || [],
            goals: project?.avatar_data?.goals || [],
          },
        }
      );

      if (result.success && result.data?.problems) {
        const allProblems = result.data.problems;
        setProblems(allProblems);

        await supabase
          .from("ebook_projects")
          .update({
            problem_data: { problems: allProblems },
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);
      } else {
        setError(result.error || "সমস্যা তৈরি করতে ব্যর্থ হয়েছে");
      }
    } catch (err) {
      setError("সার্ভারের সাথে সংযোগ করতে পারছে না");
    }

    setGenerating(false);
  }

  async function handleConfirm() {
    if (selectedIndex === null) return;
    setLoading(true);

    const selected = problems[selectedIndex];

    await supabase
      .from("ebook_projects")
      .update({
        problem_data: {
          problems,
          selected_problem: selected,
          selected_index: selectedIndex,
        },
        current_step: 5,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    router.push(`/ebook/${projectId}/step-5`);
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ota-blue">
          ধাপ ৪: সমস্যা নির্বাচন করুন
        </h2>
        <p className="text-slate-500 mt-1">
          এআই আপনার পাঠকের জন্য ১০টি সমস্যা খুঁজে বের করবে
        </p>
      </div>

      {problems.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-ota-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-ota-orange" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            এআই দিয়ে সমস্যা খুঁজুন
          </h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            আপনার নিশ ও অডিয়েন্সের উপর ভিত্তি করে এআই ১০টি নির্দিষ্ট
            সমস্যা তৈরি করবে
          </p>
          <Button onClick={generateProblems} loading={generating} size="lg">
            <Sparkles className="w-5 h-5" />
            সমস্যা তৈরি করুন
          </Button>
          {error && (
            <p className="mt-4 text-sm text-red-500 flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3 max-w-3xl mx-auto max-h-[500px] overflow-y-auto pr-2">
            {problems.map((problem, index) => (
              <Card
                key={index}
                selected={selectedIndex === index}
                onClick={() => setSelectedIndex(index)}
                className="py-4 px-5"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg font-bold text-ota-orange mt-0.5">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 mb-1">
                      {problem.title}
                    </h4>
                    <p className="text-sm text-slate-500 mb-2">
                      {problem.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1 text-red-500">
                        <Flame className="w-3.5 h-3.5" />
                        জরুরি: {problem.urgency_score}/10
                      </span>
                      <span className="flex items-center gap-1 text-rose-500">
                        <Heart className="w-3.5 h-3.5" />
                        আবেগ: {problem.emotional_weight}/10
                      </span>
                    </div>
                    {problem.why_great_topic && (
                      <p className="text-xs text-ota-teal mt-1.5">
                        {problem.why_great_topic}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <WizardNav
            currentStep={4}
            isConfirmed={false}
            canGoBack={true}
            canGoForward={selectedIndex !== null}
            loading={loading}
            onBack={() => router.push(`/ebook/${projectId}/step-3`)}
            onConfirm={handleConfirm}
            onRegenerate={generateProblems}
            confirmLabel="সমস্যা নির্বাচন করুন"
          />
        </>
      )}
    </div>
  );
}
