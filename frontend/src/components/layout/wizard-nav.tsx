"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";

interface WizardNavProps {
  currentStep: number;
  isConfirmed: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  loading?: boolean;
  onBack: () => void;
  onConfirm: () => void;
  onRegenerate?: () => void;
  confirmLabel?: string;
}

export function WizardNav({
  currentStep,
  isConfirmed,
  canGoBack,
  canGoForward,
  loading = false,
  onBack,
  onConfirm,
  onRegenerate,
  confirmLabel,
}: WizardNavProps) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-6">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={!canGoBack || loading}
        size="md"
      >
        <ArrowLeft className="w-4 h-4" />
        পিছনে যান
      </Button>

      <div className="flex items-center gap-3">
        {onRegenerate && (
          <Button
            variant="outline"
            onClick={onRegenerate}
            disabled={loading}
            size="md"
          >
            <RotateCcw className="w-4 h-4" />
            পুনরায় তৈরি করুন
          </Button>
        )}

        <Button
          variant={isConfirmed ? "secondary" : "primary"}
          onClick={onConfirm}
          loading={loading}
          size="md"
        >
          {isConfirmed ? (
            <>
              <ArrowRight className="w-4 h-4" />
              পরবর্তী ধাপ
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              {confirmLabel || "নিশ্চিত করুন"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
