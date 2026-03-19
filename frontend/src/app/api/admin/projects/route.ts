import { verifyAdmin } from "@/lib/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await verifyAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminSupabaseClient();

    // Get all projects
    const { data: projects, error: projectsError } = await adminClient
      .from("ebook_projects")
      .select("id, title, user_id, main_niche, current_step, status, created_at")
      .order("created_at", { ascending: false });

    if (projectsError) throw projectsError;

    // Get user info for all project owners
    const userIds = Array.from(
      new Set((projects || []).map((p: { user_id: string }) => p.user_id))
    );

    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const profileMap: Record<string, { full_name: string | null; email: string }> = {};
    (profiles || []).forEach((p) => {
      profileMap[p.id] = { full_name: p.full_name, email: p.email };
    });

    const result = (projects || []).map((p) => ({
      id: p.id,
      title: p.title,
      user_email: profileMap[p.user_id]?.email || "—",
      user_name: profileMap[p.user_id]?.full_name || null,
      main_niche: p.main_niche,
      current_step: p.current_step,
      status: p.status,
      created_at: p.created_at,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}
