"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { StepIndicator } from "@/components/layout/step-indicator";

export default function WizardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const [confirmedSteps, setConfirmedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  // Extract current step from pathname
  useEffect(() => {
    const match = pathname.match(/step-(\d+)/);
    if (match) {
      setCurrentStep(parseInt(match[1]));
    }
  }, [pathname]);

  // Load project data
  useEffect(() => {
    if (!user || !projectId) return;

    async function loadProject() {
      const { data } = await supabase
        .from("ebook_projects")
        .select("current_step")
        .eq("id", projectId)
        .single();

      if (data) {
        // All steps before current_step are considered confirmed
        const confirmed = Array.from(
          { length: data.current_step - 1 },
          (_, i) => i + 1
        );
        setConfirmedSteps(confirmed);
      }
    }

    loadProject();
  }, [user, projectId, supabase]);

  const handleStepClick = (step: number) => {
    router.push(`/ebook/${projectId}/step-${step}`);
  };

  return (
    <div>
      {/* Step Indicator */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6">
        <StepIndicator
          currentStep={currentStep}
          confirmedSteps={confirmedSteps}
          onStepClick={handleStepClick}
        />
      </div>

      {/* Auto-save indicator */}
      <div className="flex items-center justify-end mb-2">
        <span className="text-xs text-slate-400">
          স্বয়ংক্রিয়ভাবে সেভ হচ্ছে
        </span>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {children}
      </div>
    </div>
  );
}
