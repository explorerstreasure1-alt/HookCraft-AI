import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") || "";
  const firstVisit = request.headers.get("x-first-visit") === "1";
  const admin = getAdmin();
  if (!admin) return NextResponse.json({ visitors: 0, generated: 0, scenes: 0, active: 0 });

  try {
    if (userId) {
      const { status } = await admin.from("user_activity").upsert({ user_id: userId, last_seen: new Date().toISOString() }).select().single();
      // upsert returns 201 for insert, 200 for update
    }

    if (firstVisit) {
      try { await admin.rpc("increment_stat", { stat_key: "visitors" }); } catch {}
    }

    const [statsRes, activeRes] = await Promise.all([
      admin.from("stats").select("*"),
      admin.from("user_activity").select("*", { count: "exact", head: true }).gte("last_seen", new Date(Date.now() - 120000).toISOString()),
    ]);

    const s = statsRes.data;
    const visitors = s?.find((d: { key: string; value: number }) => d.key === "visitors")?.value || 0;
    const generated = s?.find((d: { key: string; value: number }) => d.key === "generated")?.value || 0;
    const scenes = s?.find((d: { key: string; value: number }) => d.key === "scenes")?.value || 0;

    return NextResponse.json({ visitors, generated, scenes, active: activeRes.count || 0 });
  } catch {
    return NextResponse.json({ visitors: 0, generated: 0, scenes: 0, active: 0 });
  }
}
