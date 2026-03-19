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

    // Get all profiles
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, full_name, email, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (profilesError) throw profilesError;

    // Get subscriptions
    const { data: subscriptions } = await adminClient
      .from("subscriptions")
      .select("user_id, plan");

    // Get project counts per user
    const { data: projectCounts } = await adminClient
      .from("ebook_projects")
      .select("user_id");

    // Build project count map
    const projectCountMap: Record<string, number> = {};
    (projectCounts || []).forEach((p) => {
      projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1;
    });

    // Build subscription map
    const subMap: Record<string, string> = {};
    (subscriptions || []).forEach((s) => {
      subMap[s.user_id] = s.plan;
    });

    const users = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      plan: subMap[p.id] || "free",
      project_count: projectCountMap[p.id] || 0,
      is_active: p.is_active !== false,
      created_at: p.created_at,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
