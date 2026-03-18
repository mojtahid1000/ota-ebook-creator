"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";

const STEP_LABELS: Record<number, string> = {
  1: "নিশ নির্বাচন",
  2: "সাব-নিশ",
  3: "টার্গেট অডিয়েন্স",
  4: "সমস্যা নির্বাচন",
  5: "সমাধান পদ্ধতি",
  6: "রিসার্চ",
  7: "বইয়ের নাম",
  8: "আউটলাইন",
  9: "কন্টেন্ট লেখা",
  10: "রিভিউ",
  11: "এক্সপোর্ট",
  12: "কভার ডিজাইন",
};

interface StepIndicatorProps {
  currentStep: number;
  confirmedSteps: number[];
  onStepClick?: (step: number) => void;
}

export function StepIndicator({
  currentStep,
  confirmedSteps,
  onStepClick,
}: StepIndicatorProps) {
  return (
    <div className="w-full overflow-x-auto py-4">
      <div className="flex items-center min-w-max px-4 gap-1">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((step) => {
          const isCompleted = confirmedSteps.includes(step);
          const isCurrent = step === currentStep;
          const isAccessible =
            isCompleted || step <= Math.max(...confirmedSteps, 0) + 1;

          return (
            <div key={step} className="flex items-center">
              <button
                onClick={() => isAccessible && onStepClick?.(step)}
                disabled={!isAccessible}
                className={clsx(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium",
                  "transition-all duration-200 whitespace-nowrap",
                  isCompleted &&
                    "bg-ota-teal text-white hover:bg-ota-teal-dark",
                  isCurrent &&
                    !isCompleted &&
                    "bg-ota-orange text-white shadow-sm",
                  !isCurrent &&
                    !isCompleted &&
                    isAccessible &&
                    "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  !isAccessible && "bg-slate-50 text-slate-300 cursor-not-allowed"
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-white/30 flex items-center justify-center text-[10px]">
                    {step}
                  </span>
                )}
                <span className="hidden sm:inline">{STEP_LABELS[step]}</span>
              </button>
              {step < 12 && (
                <div
                  className={clsx(
                    "w-4 h-0.5 mx-0.5",
                    isCompleted ? "bg-ota-teal" : "bg-slate-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
