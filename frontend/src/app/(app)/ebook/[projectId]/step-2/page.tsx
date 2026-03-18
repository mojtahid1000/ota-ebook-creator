"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { WizardNav } from "@/components/layout/wizard-nav";
import { Search, TrendingUp, TrendingDown, Minus } from "lucide-react";

type SubNiche = {
  id: string;
  bn: string;
  en: string;
  demand: string;
};

const DEMAND_ICONS = {
  High: { icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
  Medium: { icon: Minus, color: "text-amber-500", bg: "bg-amber-50" },
  Low: { icon: TrendingDown, color: "text-slate-400", bg: "bg-slate-50" },
};

export default function Step2SubNichePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();
  const [subNiches, setSubNiches] = useState<SubNiche[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mainNiche, setMainNiche] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    // Get project to find main niche
    const { data: project } = await supabase
      .from("ebook_projects")
      .select("main_niche")
      .eq("id", projectId)
      .single();

    if (project?.main_niche) {
      setMainNiche(project.main_niche);

      // Fetch sub-niches from backend knowledge
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(
          `${API_URL}/api/agents/sub-niches?main_niche=${encodeURIComponent(project.main_niche)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSubNiches(data.sub_niches || []);
        }
      } catch {
        // Fallback: load from hardcoded data
        setSubNiches([]);
      }
    }
    setLoading(false);
  }

  const filtered = subNiches.filter(
    (sn) =>
      sn.bn.includes(searchTerm) ||
      sn.en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = async () => {
    if (!selectedId) return;
    setLoading(true);

    const selected = subNiches.find((sn) => sn.id === selectedId);

    await supabase
      .from("ebook_projects")
      .update({
        sub_niche: selected?.bn || selectedId,
        niche_data: {
          sub_niche_id: selectedId,
          sub_niche_en: selected?.en,
          sub_niche_bn: selected?.bn,
          market_demand: selected?.demand,
        },
        current_step: 3,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    router.push(`/ebook/${projectId}/step-3`);
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-ota-blue">
          ধাপ ২: সাব-নিশ নির্বাচন করুন
        </h2>
        <p className="text-slate-500 mt-1">
          {mainNiche} ক্যাটাগরির মধ্যে নির্দিষ্ট বিষয় বেছে নিন
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-6 relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <Input
          placeholder="সাব-নিশ খুঁজুন... (বাংলা বা English)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sub-niche list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto max-h-[400px] overflow-y-auto pr-2">
          {filtered.map((sn) => {
            const demand =
              DEMAND_ICONS[sn.demand as keyof typeof DEMAND_ICONS] ||
              DEMAND_ICONS.Medium;
            const DemandIcon = demand.icon;

            return (
              <Card
                key={sn.id}
                selected={selectedId === sn.id}
                onClick={() => setSelectedId(sn.id)}
                className="py-3 px-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 text-sm">
                      {sn.bn}
                    </p>
                    <p className="text-xs text-slate-400">({sn.en})</p>
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${demand.bg} ${demand.color}`}
                  >
                    <DemandIcon className="w-3 h-3" />
                    {sn.demand}
                  </span>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-slate-400 py-8">
              কোনো সাব-নিশ পাওয়া যায়নি
            </p>
          )}
        </div>
      )}

      <WizardNav
        currentStep={2}
        isConfirmed={false}
        canGoBack={true}
        canGoForward={!!selectedId}
        loading={loading}
        onBack={() => router.push(`/ebook/${projectId}/step-1`)}
        onConfirm={handleConfirm}
        confirmLabel="সাব-নিশ নির্বাচন করুন"
      />
    </div>
  );
}
