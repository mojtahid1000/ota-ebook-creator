import { verifyAdmin } from "@/lib/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
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

    // Get current status
    const { data: profile } = await adminClient
      .from("profiles")
      .select("is_active")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const newStatus = !(profile.is_active !== false);

    const { error } = await adminClient
      .from("profiles")
      .update({ is_active: newStatus })
      .eq("id", userId);

    if (error) throw error;

    return NextResponse.json({ is_active: newStatus });
  } catch (error) {
    console.error("Toggle active error:", error);
    return NextResponse.json(
      { error: "Failed to toggle user status" },
      { status: 500 }
    );
  }
}
