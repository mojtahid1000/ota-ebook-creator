import { verifyAdmin } from "@/lib/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await verifyAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  try {
    const adminClient = createAdminSupabaseClient();

    // Get profile
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get subscription
    const { data: subscription } = await adminClient
      .from("subscriptions")
      .select("plan, status, started_at, expires_at")
      .eq("user_id", userId)
      .single();

    // Get projects
    const { data: projects } = await adminClient
      .from("ebook_projects")
      .select("id, title, status, current_step, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Get total tokens
    let total_tokens = 0;
    try {
      const { data: tokenData } = await adminClient
        .from("token_usage")
        .select("tokens_used")
        .eq("user_id", userId);
      if (tokenData) {
        total_tokens = tokenData.reduce(
          (sum, row) => sum + (row.tokens_used || 0),
          0
        );
      }
    } catch {
      // token_usage table may not exist
    }

    return NextResponse.json({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      avatar_url: profile.avatar_url || null,
      role: profile.role || "user",
      is_active: profile.is_active !== false,
      created_at: profile.created_at,
      subscription: subscription || null,
      projects: projects || [],
      total_tokens,
    });
  } catch (error) {
    console.error("Admin user detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
