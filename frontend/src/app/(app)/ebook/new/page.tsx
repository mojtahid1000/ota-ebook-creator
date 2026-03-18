"use client";

import { useEffect, useRef } from "react";
import { useSupabase } from "@/providers/supabase-provider";
import { Loader2 } from "lucide-react";

export default function NewEbookPage() {
  const { supabase, user } = useSupabase();
  const creating = useRef(false);

  useEffect(() => {
    if (user && !creating.current) {
      creating.current = true;
      createProject();
    }
  }, [user]);

  async function createProject() {
    if (!user) return;

    try {
      // Step 1: Insert
      const { error: insertError } = await supabase
        .from("ebook_projects")
        .insert({
          user_id: user.id,
          status: "draft",
          current_step: 1,
        });

      if (insertError) {
        console.error("Insert failed:", insertError);
        window.location.href = "/dashboard";
        return;
      }

      // Step 2: Fetch the just-created project
      const { data, error: fetchError } = await supabase
        .from("ebook_projects")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        window.location.href = `/ebook/${data[0].id}/step-1`;
      } else {
        console.error("Fetch failed:", fetchError);
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error("Create project error:", err);
      window.location.href = "/dashboard";
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
