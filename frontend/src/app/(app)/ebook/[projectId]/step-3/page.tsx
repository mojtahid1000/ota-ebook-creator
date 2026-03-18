"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Card } from "@/components/ui/card";
import { WizardNav } from "@/components/layout/wizard-nav";
import { AGE_RANGES, GENDERS, INCOME_LEVELS, EDUCATION_LEVELS } from "@/lib/utils/bangla-data";
import { User, Calendar, Banknote, GraduationCap } from "lucide-react";

export default function Step3AvatarPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { supabase, user } = useSupabase();
  const router = useRouter();

  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [income, setIncome] = useState("");
  const [education, setEducation] = useState("");
  const [loading, setLoading] = useState(false);

  const isComplete = ageRange && gender && income && education;

  const handleConfirm = async () => {
    if (!isComplete) return;
    setLoading(true);

    await supabase
      .from("ebook_projects")
      .update({
        avatar_data: {
          age_range: ageRange,
          gender,
          income_level: income,
          education,
        },
        current_step: 4,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    router.push(`/ebook/${projectId}/step-4`);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-ota-blue">
          ধাপ ৩: টার্গেট অডিয়েন্স নির্ধারণ
        </h2>
        <p className="text-slate-500 mt-1">
          আপনার ইবুকের পাঠক কে হবে তা নির্ধারণ করুন
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Age Range */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-ota-orange" />
            <h3 className="font-semibold text-slate-700">বয়স (Age Range)</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AGE_RANGES.map((age) => (
              <Card
                key={age.id}
                selected={ageRange === age.id}
                onClick={() => setAgeRange(age.id)}
                className="py-2.5 px-3 text-center"
              >
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
              <Card
                key={g.id}
                selected={gender === g.id}
                onClick={() => setGender(g.id)}
                className="py-3 px-3 text-center"
              >
                <p className="text-sm font-medium">{g.bn}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Income */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Banknote className="w-5 h-5 text-ota-orange" />
            <h3 className="font-semibold text-slate-700">
              আয়ের স্তর (Income Level)
            </h3>
          </div>
          <div className="space-y-2">
            {INCOME_LEVELS.map((inc) => (
              <Card
                key={inc.id}
                selected={income === inc.id}
                onClick={() => setIncome(inc.id)}
                className="py-2.5 px-4"
              >
                <p className="text-sm font-medium">{inc.bn}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Education */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-ota-orange" />
            <h3 className="font-semibold text-slate-700">
              শিক্ষাগত যোগ্যতা (Education)
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {EDUCATION_LEVELS.map((edu) => (
              <Card
                key={edu.id}
                selected={education === edu.id}
                onClick={() => setEducation(edu.id)}
                className="py-2.5 px-3 text-center"
              >
                <p className="text-sm font-medium">{edu.bn}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <WizardNav
        currentStep={3}
        isConfirmed={false}
        canGoBack={true}
        canGoForward={!!isComplete}
        loading={loading}
        onBack={() => router.push(`/ebook/${projectId}/step-2`)}
        onConfirm={handleConfirm}
        confirmLabel="অডিয়েন্স নিশ্চিত করুন"
      />
    </div>
  );
}
