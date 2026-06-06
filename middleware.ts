import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const userId = request.cookies.get("hc_user_id")?.value;

  if (!userId) {
    const newId = crypto.randomUUID();
    response.cookies.set("hc_user_id", newId, {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    response.headers.set("x-user-id", newId);
  } else {
    response.headers.set("x-user-id", userId);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
