import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type SettingsPayload = {
  currency: string;
  profileName: string | null;
};

const SETTINGS_ROW_ID = "default";

const normalizeCurrency = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
};

export async function GET() {
  try {
    const client = createSupabaseServiceRoleClient();
    const { data, error } = await client
      .from("app_settings")
      .select("currency, profile_name")
      .eq("id", SETTINGS_ROW_ID)
      .maybeSingle<{ currency: string; profile_name: string | null }>();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      settings: {
        currency: data?.currency ?? "USD",
        profileName: data?.profile_name ?? null,
      } satisfies SettingsPayload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Partial<SettingsPayload>;
    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.currency !== undefined) {
      const currency = normalizeCurrency(body.currency);
      if (!currency) {
        return NextResponse.json({ error: "Invalid currency. Use ISO-4217 code (e.g. USD)." }, { status: 400 });
      }
      patch.currency = currency;
    }
    if (body.profileName !== undefined) {
      if (body.profileName !== null && typeof body.profileName !== "string") {
        return NextResponse.json({ error: "profileName must be string or null" }, { status: 400 });
      }
      patch.profile_name = body.profileName?.trim() ? body.profileName.trim() : null;
    }

    const client = createSupabaseServiceRoleClient();
    const { data, error } = await client
      .from("app_settings")
      .upsert({ id: SETTINGS_ROW_ID, ...patch }, { onConflict: "id" })
      .select("currency, profile_name")
      .single<{ currency: string; profile_name: string | null }>();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      settings: {
        currency: data.currency,
        profileName: data.profile_name,
      } satisfies SettingsPayload,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = error instanceof SyntaxError ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
