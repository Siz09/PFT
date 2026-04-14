import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const expireSupabaseCookies = async (response: NextResponse) => {
  const cookieStore = await cookies();
  const names = new Set(
    cookieStore
      .getAll()
      .map((cookie) => cookie.name)
      .filter((name) => name.startsWith("sb-")),
  );

  names.add("sb-access-token");
  names.add("sb-refresh-token");

  names.forEach((name) => {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  });
};

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("Supabase server sign-out failed", error);
  }

  const response = NextResponse.json({ ok: true });
  await expireSupabaseCookies(response);
  return response;
}
