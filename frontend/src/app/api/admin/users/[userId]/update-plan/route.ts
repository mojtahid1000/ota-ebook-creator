import { verifyAdmin } from "@/lib/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const supabase = await verifyAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await params;

  try {
    const { plan } = await request.json();

    if (!plan || !["free", "pro", "unlimited"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const adminClient = createAdminSupabaseClient();

    // Check if subscription exists
    const { data: existing } = await adminClient
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (existing) {
      // Update existing subscription
      const { error } = await adminClient
        .from("subscriptions")
        .update({
          plan,
          status: "active",
          started_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      // Create new subscription
      const { error } = await adminClient.from("subscriptions").insert({
        user_id: userId,
        plan,
        status: "active",
        started_at: new Date().toISOString(),
      });

      if (error) throw error;
    }

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Update plan error:", error);
    return NextResponse.json(
      { error: "Failed to update plan" },
      { status: 500 }
    );
  }
}
