import { verifyAdmin } from "@/lib/admin";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await verifyAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminClient = createAdminSupabaseClient();

    const { data: rows, error } = await adminClient
      .from("admin_settings")
      .select("key, value");

    if (error) {
      // Table may not exist - return defaults
      return NextResponse.json({});
    }

    // Convert rows to a key-value map
    const settings: Record<string, unknown> = {};
    (rows || []).forEach((row) => {
      settings[row.key] = row.value;
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Admin settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await verifyAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key, value } = await request.json();

    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminSupabaseClient();

    // Upsert the setting
    const { error } = await adminClient
      .from("admin_settings")
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin settings update error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
