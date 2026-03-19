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

    // Get all subscriptions
    const { data: subscriptions, error: subError } = await adminClient
      .from("subscriptions")
      .select("id, user_id, plan, status, started_at, expires_at")
      .order("started_at", { ascending: false });

    if (subError) throw subError;

    // Get user info
    const userIds = Array.from(
      new Set((subscriptions || []).map((s: { user_id: string }) => s.user_id))
    );

    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds.length > 0 ? userIds : ["__none__"]);

    const profileMap: Record<string, { full_name: string | null; email: string }> = {};
    (profiles || []).forEach((p) => {
      profileMap[p.id] = { full_name: p.full_name, email: p.email };
    });

    const result = (subscriptions || []).map((s) => ({
      id: s.id,
      user_id: s.user_id,
      user_email: profileMap[s.user_id]?.email || "—",
      user_name: profileMap[s.user_id]?.full_name || null,
      plan: s.plan,
      status: s.status,
      started_at: s.started_at,
      expires_at: s.expires_at,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Admin subscriptions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
