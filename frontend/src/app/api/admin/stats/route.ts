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

    // Total users
    const { count: total_users } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Total projects
    const { count: total_projects } = await adminClient
      .from("ebook_projects")
      .select("*", { count: "exact", head: true });

    // Total exports (projects with status = 'exported')
    const { count: total_exports } = await adminClient
      .from("ebook_projects")
      .select("*", { count: "exact", head: true })
      .eq("status", "exported");

    // Total tokens used (sum from token_usage table if exists, otherwise 0)
    let total_tokens = 0;
    try {
      const { data: tokenData } = await adminClient
        .from("token_usage")
        .select("tokens_used");
      if (tokenData) {
        total_tokens = tokenData.reduce(
          (sum, row) => sum + (row.tokens_used || 0),
          0
        );
      }
    } catch {
      // token_usage table may not exist yet
    }

    // Paid users (subscriptions with plan != 'free')
    const { count: paid_users } = await adminClient
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .neq("plan", "free");

    // Users by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentUsers } = await adminClient
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    // Group users by date
    const usersByDateMap: Record<string, number> = {};
    (recentUsers || []).forEach((u) => {
      const date = new Date(u.created_at).toISOString().split("T")[0];
      usersByDateMap[date] = (usersByDateMap[date] || 0) + 1;
    });

    // Fill in missing dates
    const users_by_date: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      users_by_date.push({
        date: dateStr,
        count: usersByDateMap[dateStr] || 0,
      });
    }

    // Projects by status
    const { data: projectStatusData } = await adminClient
      .from("ebook_projects")
      .select("status");

    const statusMap: Record<string, number> = {};
    (projectStatusData || []).forEach((p) => {
      statusMap[p.status] = (statusMap[p.status] || 0) + 1;
    });

    const projects_by_status = Object.entries(statusMap).map(
      ([status, count]) => ({
        status,
        count,
      })
    );

    return NextResponse.json({
      total_users: total_users || 0,
      total_projects: total_projects || 0,
      total_exports: total_exports || 0,
      total_tokens,
      paid_users: paid_users || 0,
      users_by_date,
      projects_by_status,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
