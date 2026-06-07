import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(items) {
          items.forEach(({ name, value, options }) => {});
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  let userId = "";
  if (user) {
    userId = user.id;
  } else {
    userId = request.cookies.get("hc_uid")?.value || "";
    if (!userId) userId = crypto.randomUUID();
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", userId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!request.cookies.get("hc_uid")?.value && !user) {
    response.cookies.set("hc_uid", userId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
