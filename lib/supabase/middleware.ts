import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(items) {
          items.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    response.headers.set("x-user-id", user.id);
  } else {
    let anonId = request.cookies.get("hc_uid")?.value;
    if (!anonId) {
      anonId = crypto.randomUUID();
      response.cookies.set("hc_uid", anonId, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: false,
        sameSite: "lax",
        path: "/",
      });
    }
    response.headers.set("x-user-id", anonId);
  }

  return response;
}
