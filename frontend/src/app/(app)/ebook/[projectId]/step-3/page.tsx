"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WizardNav } from "@/components/layout/wizard-nav";
import { callAgent } from "@/lib/api-client";
import { AGE_RANGES, GENDERS, INCOME_LEVELS, EDUCATION_LEVELS } from "@/lib/utils/bangla-data";
import { User, Calendar, Banknote, GraduationCap, Sparkles, AlertTriangle, Check } from "lucide-react";

type PainPoint = { text: string; intensity: number };
type Goal = { text: string };

export default function Step3AvatarPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();

  // Demographics
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [income, setIncome] = useState("");
  const [education, setEducation] = useState("");

  // AI-generated psychographics
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedPainPoints, setSelectedPainPoints] = useState<number[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<number[]>([]);

  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<"demographics" | "psychographics">("demographics");

  const demographicsComplete = ageRange && gender && income && education;

  async function generatePsychographics() {
    if (!user || !demographicsComplete) return;
    setGenerating(true);
    setError("");

    try {
      const { data: project } = await supabase
        .from("ebook_projects")
        .select("main_niche, sub_niche")
        .eq("id", projectId)
        .single();

      const result = await callAgent(2, projectId, user.id, {}, {
        niche: {
          main_niche: project?.main_niche || "",
          sub_niche: project?.sub_niche || "",
          niche_description: "",
          market_demand: "Medium",
          target_keywords: [],
        },
        avatar: { age_range: ageRange, gender, income_level: income, education },
      });

      if (result.success && result.data) {
        setPainPoints(result.data.pain_points || []);
        setGoals(result.data.goals || []);
        setPhase("psychographics");
      } else {
        setError(result.error || "তৈরি করতে ব্যর্থ");
      }
    } catch {
      setError("সার্ভারের সাথে সংযোগ করতে পারছে না");
    }
    setGenerating(false);
  }

  function togglePainPoint(index: number) {
    setSelectedPainPoints((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  function toggleGoal(index: number) {
    setSelectedGoals((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  async function handleConfirm() {
    setLoading(true);

    const selected_pain_points = selectedPainPoints.map((i) => painPoints[i]?.text || "");
    const selected_goals = selectedGoals.map((i) => goals[i]?.text || "");

    await supabase
      .from("ebook_projects")
      .update({
        avatar_data: {
          age_range: ageRange,
          gender,
          income_level: income,
          education,
          pain_points: selected_pain_points,
          goals: selected_goals,
          all_pain_points: painPoints,
          all_goals: goals,
        },
        current_step: 4,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    window.location.href = `/ebook/${projectId}/step-4`;
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-ota-blue">
          ধাপ ৩: টার্গেট অডিয়েন্স নির্ধারণ
        </h2>
        <p className="text-slate-500 mt-1">
          {phase === "demographics"
            ? "আপনার ইবুকের পাঠক কে হবে তা নির্ধারণ করুন"
            : "এআই তৈরি করা সমস্যা ও লক্ষ্য থেকে বেছে নিন (একাধিক নির্বাচন করুন)"}
        </p>
      </div>

      {phase === "demographics" ? (
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Age Range */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-ota-orange" />
              <h3 className="font-semibold text-slate-700">বয়স (Age Range)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AGE_RANGES.map((age) => (
                <Card key={age.id} selected={ageRange === age.id} onClick={() => setAgeRange(age.id)} className="py-2.5 px-3 text-center">
                  <p className="text-sm font-medium">{age.bn}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-ota-orange" />
              <h3 className="font-semibold text-slate-700">লিঙ্গ (Gender)</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GENDERS.map((g) => (
                <Card key={g.id} selected={gender === g.id} onClick={() => setGender(g.id)} className="py-3 px-3 text-center">
                  <p className="text-sm font-medium">{g.bn}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Income */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="w-5 h-5 text-ota-orange" />
              <h3 className="font-semibold text-slate-700">আয়ের স্তর (Income Level)</h3>
            </div>
            <div className="space-y-2">
              {INCOME_LEVELS.map((inc) => (
                <Card key={inc.id} selected={income === inc.id} onClick={() => setIncome(inc.id)} className="py-2.5 px-4">
                  <p className="text-sm font-medium">{inc.bn}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Education */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-5 h-5 text-ota-orange" />
              <h3 className="font-semibold text-slate-700">শিক্ষাগত যোগ্যতা (Education)</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EDUCATION_LEVELS.map((edu) => (
                <Card key={edu.id} selected={education === edu.id} onClick={() => setEducation(edu.id)} className="py-2.5 px-3 text-center">
                  <p className="text-sm font-medium">{edu.bn}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <div className="text-center pt-4">
            <Button onClick={generatePsychographics} loading={generating} disabled={!demographicsComplete} size="lg">
              <Sparkles className="w-5 h-5" /> এআই দিয়ে সমস্যা ও লক্ষ্য তৈরি করুন
            </Button>
            {error && <p className="mt-3 text-sm text-red-500"><AlertTriangle className="w-4 h-4 inline mr-1" />{error}</p>}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Pain Points - Multi Select */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">সমস্যা / Pain Points (একাধিক নির্বাচন করুন)</h3>
            <p className="text-xs text-slate-400 mb-3">নির্বাচিত: {selectedPainPoints.length}</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              {painPoints.map((pp, i) => (
                <Card key={i} selected={selectedPainPoints.includes(i)} onClick={() => togglePainPoint(i)} className="py-2.5 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedPainPoints.includes(i) && <Check className="w-4 h-4 text-ota-teal shrink-0" />}
                      <p className="text-sm">{pp.text}</p>
                    </div>
                    <span className="text-xs text-ota-orange font-medium shrink-0 ml-2">
                      তীব্রতা: {pp.intensity}/10
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Goals - Multi Select */}
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">লক্ষ্য / Goals (একাধিক নির্বাচন করুন)</h3>
            <p className="text-xs text-slate-400 mb-3">নির্বাচিত: {selectedGoals.length}</p>
            <div className="space-y-2">
              {goals.map((g, i) => (
                <Card key={i} selected={selectedGoals.includes(i)} onClick={() => toggleGoal(i)} className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    {selectedGoals.includes(i) && <Check className="w-4 h-4 text-ota-teal shrink-0" />}
                    <p className="text-sm">{g.text}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Regenerate */}
          <div className="text-center">
            <Button variant="outline" onClick={generatePsychographics} loading={generating} size="sm">
              <Sparkles className="w-4 h-4" /> পুনরায় তৈরি করুন
            </Button>
          </div>

          <WizardNav
            currentStep={3}
            isConfirmed={false}
            canGoBack={true}
            canGoForward={selectedPainPoints.length > 0 && selectedGoals.length > 0}
            loading={loading}
            onBack={() => setPhase("demographics")}
            onConfirm={handleConfirm}
            confirmLabel="অডিয়েন্স নিশ্চিত করুন"
          />
        </div>
      )}
    </div>
  );
}
