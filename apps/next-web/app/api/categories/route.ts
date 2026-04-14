import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const client = createSupabaseServiceRoleClient();
    const { data, error } = await client
      .from("categories")
      .select("id, name, icon, color, is_system")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      categories: (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        isSystem: row.is_system,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
