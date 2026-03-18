"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WizardNav } from "@/components/layout/wizard-nav";
import { callAgent } from "@/lib/api-client";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  ShieldAlert,
} from "lucide-react";

type Solution = {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  estimated_pages: number;
  needs_disclaimer: boolean;
};

export default function Step5SolutionPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadExisting();
  }, []);

  async function loadExisting() {
    const { data } = await supabase
      .from("ebook_projects")
      .select("solution_data")
      .eq("id", projectId)
      .single();

    if (data?.solution_data?.solutions?.length) {
      setSolutions(data.solution_data.solutions);
    }
  }

  async function generateSolutions() {
    if (!user) return;
    setGenerating(true);
    setError("");

    try {
      const { data: project } = await supabase
        .from("ebook_projects")
        .select("main_niche, sub_niche, avatar_data, problem_data, niche_data")
        .eq("id", projectId)
        .single();

      const result = await callAgent(
        4,
        projectId,
        user.id,
        { action: "generate" },
        {
          niche: {
            main_niche: project?.main_niche || "",
            sub_niche: project?.sub_niche || "",
            niche_description: `${project?.main_niche} > ${project?.sub_niche}`,
            market_demand: "Medium",
            target_keywords: [],
          },
          avatar: project?.avatar_data || {},
          problem: {
            selected_problem: project?.problem_data?.selected_problem || {
              title: "",
              description: "",
            },
            other_options: [],
          },
        }
      );

      if (result.success && result.state?.solutions) {
        const allSolutions = result.state.solutions.selected_solutions || [];
        setSolutions(allSolutions);

        await supabase
          .from("ebook_projects")
          .update({
            solution_data: { solutions: allSolutions },
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId);
      } else {
        setError(result.error || "সমাধান তৈরি করতে ব্যর্থ হয়েছে");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করতে পারছে না");
    }

    setGenerating(false);
  }

  function toggleSelection(index: number) {
    setSelectedIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : prev.length < 3
          ? [...prev, index]
          : prev
    );
  }

  async function handleConfirm() {
    if (selectedIndices.length === 0) return;
    setLoading(true);

    const selected = selectedIndices.map((i) => solutions[i]);

    await supabase
      .from("ebook_projects")
      .update({
        solution_data: {
          solutions,
          selected_solutions: selected,
          selected_indices: selectedIndices,
        },
        current_step: 6,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    router.push(`/ebook/${projectId}/step-6`);
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ota-blue">
          ধাপ ৫: সমাধান পদ্ধতি বাছাই করুন
        </h2>
        <p className="text-slate-500 mt-1">
          ১-৩টি পদ্ধতি বাছাই করুন (একাধিক নির্বাচন করা যাবে)
        </p>
      </div>

      {solutions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-ota-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-ota-teal" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            সমাধান পদ্ধতি তৈরি করুন
          </h3>
          <p className="text-slate-500 mb-6">
            এআই আপনার সমস্যার জন্য ৫-৮টি সমাধান পদ্ধতি প্রস্তাব করবে
          </p>
          <Button
            onClick={generateSolutions}
            loading={generating}
            size="lg"
            variant="secondary"
          >
            <Sparkles className="w-5 h-5" />
            সমাধান তৈরি করুন
          </Button>
          {error && (
            <p className="mt-4 text-sm text-red-500 flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4" /> {error}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="text-sm text-center text-slate-400 mb-4">
            নির্বাচিত: {selectedIndices.length}/3
          </div>

          <div className="space-y-4 max-w-3xl mx-auto max-h-[500px] overflow-y-auto pr-2">
            {solutions.map((sol, index) => {
              const isSelected = selectedIndices.includes(index);

              return (
                <Card
                  key={index}
                  selected={isSelected}
                  onClick={() => toggleSelection(index)}
                  className="py-4 px-5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-800">
                      {sol.name}
                    </h4>
                    <div className="flex items-center gap-2">
                      {sol.needs_disclaimer && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          ডিসক্লেইমার
                        </span>
                      )}
                      <span className="text-xs bg-ota-blue/10 text-ota-blue px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FileText className="w-3 h-3" />~
                        {sol.estimated_pages} পৃষ্ঠা
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-3">
                    {sol.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="font-medium text-emerald-600 mb-1">
                        সুবিধা:
                      </p>
                      {sol.pros.map((p, i) => (
                        <p key={i} className="flex items-start gap-1 text-slate-600">
                          <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                          {p}
                        </p>
                      ))}
                    </div>
                    <div>
                      <p className="font-medium text-red-500 mb-1">
                        অসুবিধা:
                      </p>
                      {sol.cons.map((c, i) => (
                        <p key={i} className="flex items-start gap-1 text-slate-600">
                          <XCircle className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />
                          {c}
                        </p>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <WizardNav
            currentStep={5}
            isConfirmed={false}
            canGoBack={true}
            canGoForward={selectedIndices.length > 0}
            loading={loading}
            onBack={() => router.push(`/ebook/${projectId}/step-4`)}
            onConfirm={handleConfirm}
            onRegenerate={generateSolutions}
            confirmLabel={`${selectedIndices.length}টি পদ্ধতি নির্বাচন করুন`}
          />
        </>
      )}
    </div>
  );
}
