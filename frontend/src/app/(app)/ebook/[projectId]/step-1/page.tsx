"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { WizardNav } from "@/components/layout/wizard-nav";
import { MAIN_NICHES } from "@/lib/utils/bangla-data";
import { Heart, TrendingUp, Users } from "lucide-react";

const ICONS = { Heart, TrendingUp, Users };

export default function Step1NichePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedNiche || !user) return;
    setLoading(true);

    const niche = MAIN_NICHES.find((n) => n.id === selectedNiche);

    // Save to Supabase
    await supabase
      .from("ebook_projects")
      .update({
        main_niche: niche?.en || selectedNiche,
        current_step: 2,
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    router.push(`/ebook/${projectId}/step-2`);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-ota-blue">
          ধাপ ১: নিশ নির্বাচন করুন
        </h2>
        <p className="text-slate-500 mt-2">
          আপনার ইবুকের মূল ক্যাটাগরি বেছে নিন
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {MAIN_NICHES.map((niche) => {
          const IconComponent =
            ICONS[niche.icon as keyof typeof ICONS] || Heart;

          return (
            <Card
              key={niche.id}
              selected={selectedNiche === niche.id}
              onClick={() => setSelectedNiche(niche.id)}
              className="text-center py-8"
            >
              <div
                className={`w-16 h-16 ${niche.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
              >
                <IconComponent className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">
                {niche.bn}
              </h3>
              <p className="text-sm text-slate-400 mb-3">({niche.en})</p>
              <p className="text-sm text-slate-500">{niche.description}</p>
              <p className="text-xs text-ota-teal mt-2">
                {niche.subCount}+ সাব-নিশ
              </p>
            </Card>
          );
        })}
      </div>

      <WizardNav
        currentStep={1}
        isConfirmed={false}
        canGoBack={false}
        canGoForward={!!selectedNiche}
        loading={loading}
        onBack={() => {}}
        onConfirm={handleConfirm}
        confirmLabel="নিশ নির্বাচন করুন"
      />
    </div>
  );
}
