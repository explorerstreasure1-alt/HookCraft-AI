import { NextResponse } from "next/server";
import { getCredits } from "@/lib/storage";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") || "";
  if (!userId) {
    return NextResponse.json({ error: "Missing user identity" }, { status: 400 });
  }

  try {
    const credits = await getCredits(userId);
    return NextResponse.json({ credits, userId });
  } catch (err) {
    console.error("[credits] error:", err);
    return NextResponse.json({ credits: 1000, userId });
  }
}
