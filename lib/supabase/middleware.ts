import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(items) {
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userId = "";
  if (user) {
    userId = user.id;
  } else {
    userId = request.cookies.get("hc_uid")?.value || "";
    if (!userId) userId = crypto.randomUUID();
  }

  response.headers.set("x-user-id", userId);

  if (!request.cookies.get("hc_uid")?.value && !user) {
    response.cookies.set("hc_uid", userId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }

  const refCode = request.nextUrl.searchParams.get("ref");
  if (refCode) {
    response.cookies.set("hc_ref", refCode.toUpperCase(), {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
