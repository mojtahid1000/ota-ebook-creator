"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, BookOpen, Clock, CheckCircle, FileText } from "lucide-react";

type EbookProject = {
  id: string;
  title: string | null;
  status: string;
  current_step: number;
  main_niche: string | null;
  sub_niche: string | null;
  created_at: string;
  updated_at: string;
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "ড্রাফট", color: "bg-slate-100 text-slate-600", icon: FileText },
  in_progress: { label: "চলছে", color: "bg-ota-orange/10 text-ota-orange", icon: Clock },
  completed: { label: "সম্পন্ন", color: "bg-ota-teal/10 text-ota-teal", icon: CheckCircle },
  exported: { label: "এক্সপোর্টেড", color: "bg-ota-blue/10 text-ota-blue", icon: BookOpen },
};

const STEP_LABELS: Record<number, string> = {
  1: "নিশ নির্বাচন", 2: "সাব-নিশ", 3: "অডিয়েন্স", 4: "সমস্যা",
  5: "সমাধান", 6: "রিসার্চ", 7: "বইয়ের নাম", 8: "আউটলাইন",
  9: "কন্টেন্ট", 10: "রিভিউ", 11: "এক্সপোর্ট", 12: "কভার",
};

export default function DashboardPage() {
  const { supabase, user } = useSupabase();
  const [projects, setProjects] = useState<EbookProject[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!user) return;
    loadProjects();
  }, [user]);

  async function loadProjects() {
    const { data } = await supabase
      .from("ebook_projects")
      .select("*")
      .order("updated_at", { ascending: false });

    setProjects(data || []);
    setLoading(false);
  }

  async function createNewProject() {
    if (!user) return;

    // Insert project
    const { error: insertError } = await supabase
      .from("ebook_projects")
      .insert({ user_id: user.id, status: "draft", current_step: 1 });

    if (insertError) {
      console.error("Insert error:", insertError);
      return;
    }

    // Fetch the latest created project
    const { data, error: fetchError } = await supabase
      .from("ebook_projects")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      router.push(`/ebook/${data.id}/step-1`);
    } else {
      console.error("Fetch error:", fetchError);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ota-blue">
            আমার ইবুক প্রজেক্টস
          </h1>
          <p className="text-slate-500 mt-1">
            আপনার সকল ইবুক প্রজেক্ট এখানে দেখুন
          </p>
        </div>
        <Button onClick={createNewProject} size="lg">
          <Plus className="w-5 h-5" />
          নতুন ইবুক তৈরি করুন
        </Button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border p-6 animate-pulse"
            >
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
              <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-ota-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-10 h-10 text-ota-orange" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            এখনো কোনো ইবুক নেই
          </h2>
          <p className="text-slate-500 mb-6">
            আপনার প্রথম এআই ইবুক তৈরি শুরু করুন!
          </p>
          <Button onClick={createNewProject} size="lg">
            <Plus className="w-5 h-5" />
            প্রথম ইবুক তৈরি করুন
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const status = STATUS_MAP[project.status] || STATUS_MAP.draft;
            const StatusIcon = status.icon;

            return (
              <Card
                key={project.id}
                onClick={() =>
                  router.push(
                    `/ebook/${project.id}/step-${project.current_step}`
                  )
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 line-clamp-1">
                    {project.title || "নতুন ইবুক"}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}
                  >
                    <StatusIcon className="w-3 h-3 inline mr-1" />
                    {status.label}
                  </span>
                </div>

                {project.sub_niche && (
                  <p className="text-sm text-slate-500 mb-2">
                    {project.main_niche} &gt; {project.sub_niche}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400">
                    ধাপ {project.current_step}/12:{" "}
                    {STEP_LABELS[project.current_step]}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(project.updated_at).toLocaleDateString("bn-BD")}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ota-orange rounded-full transition-all"
                    style={{
                      width: `${(project.current_step / 12) * 100}%`,
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
