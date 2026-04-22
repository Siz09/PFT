import { NextResponse } from "next/server";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const addNextDue = (dateText: string, frequency: "daily" | "weekly" | "monthly") => {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  if (frequency === "daily") {
    date.setUTCDate(date.getUTCDate() + 1);
  } else if (frequency === "weekly") {
    date.setUTCDate(date.getUTCDate() + 7);
  } else {
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  return date.toISOString().slice(0, 10);
};

export async function POST() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const client = createSupabaseServiceRoleClient();
    const { data: rules, error: rulesError } = await client
      .from("recurring_rules")
      .select("id, type, amount_cents, category_id, merchant, description, frequency, next_due")
      .eq("active", true)
      .lte("next_due", today);
    if (rulesError) {
      throw new Error(rulesError.message);
    }
    if (!rules || rules.length === 0) {
      return NextResponse.json({ created: 0 });
    }

    const nowIso = new Date().toISOString();
    const inserts = rules.map((rule) => ({
      amount_cents: rule.amount_cents,
      type: rule.type,
      category_id: rule.category_id,
      merchant: rule.merchant,
      description: rule.description,
      transaction_date: today,
      tags: ["recurring"],
      created_at: nowIso,
      updated_at: nowIso,
    }));
    const { error: insertError } = await client.from("transactions").insert(inserts);
    if (insertError) {
      throw new Error(insertError.message);
    }

    await Promise.all(
      rules.map(async (rule) => {
        const nextDue = addNextDue(rule.next_due, rule.frequency as "daily" | "weekly" | "monthly");
        const { error } = await client
          .from("recurring_rules")
          .update({ next_due: nextDue, updated_at: nowIso })
          .eq("id", rule.id);
        if (error) {
          throw new Error(error.message);
        }
      })
    );

    return NextResponse.json({ created: inserts.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
