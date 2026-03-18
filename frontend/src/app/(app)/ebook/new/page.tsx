"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/providers/supabase-provider";
import { Loader2 } from "lucide-react";

export default function NewEbookPage() {
  const { supabase, user } = useSupabase();
  const router = useRouter();

  useEffect(() => {
    if (user) createProject();
  }, [user]);

  async function createProject() {
    if (!user) return;

    const { data, error } = await supabase
      .from("ebook_projects")
      .insert({
        user_id: user.id,
        status: "draft",
        current_step: 1,
      })
      .select()
      .single();

    if (data) {
      router.replace(`/ebook/${data.id}/step-1`);
    } else {
      router.replace("/dashboard");
    }
  }

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-ota-orange animate-spin mx-auto mb-3" />
        <p className="text-slate-500">নতুন ইবুক প্রজেক্ট তৈরি হচ্ছে...</p>
      </div>
    </div>
  );
}
