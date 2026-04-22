import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type BulkPatchPayload = {
  ids?: string[];
  categoryId?: string;
  type?: "income" | "expense";
  date?: string;
};

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as BulkPatchPayload;
    const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string" && id.trim()) : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.categoryId !== undefined) {
      if (typeof body.categoryId !== "string" || !body.categoryId.trim()) {
        return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 });
      }
      patch.category_id = body.categoryId.trim();
    }
    if (body.type !== undefined) {
      if (body.type !== "income" && body.type !== "expense") {
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
      }
      patch.type = body.type;
    }
    if (body.date !== undefined) {
      if (!isIsoDate(body.date)) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 });
      }
      patch.transaction_date = body.date;
    }

    const changedFields = Object.keys(patch).filter((key) => key !== "updated_at");
    if (changedFields.length === 0) {
      return NextResponse.json({ error: "No bulk fields to update" }, { status: 400 });
    }

    const client = createSupabaseServiceRoleClient();
    const { data, error } = await client.from("transactions").update(patch).in("id", ids).select("id");
    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json({ updatedCount: data?.length ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[] };
    const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string" && id.trim()) : [];
    if (ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }
    const client = createSupabaseServiceRoleClient();
    const { data, error } = await client.from("transactions").delete().in("id", ids).select("id");
    if (error) {
      throw new Error(error.message);
    }
    return NextResponse.json({ deletedCount: data?.length ?? 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
