import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = getAdmin();
    if (admin) {
      try { await admin.rpc("increment_stat", { stat_key: "visitors" }); } catch {}
      const { data } = await admin.from("stats").select("*");
      if (data) {
        const visitors = data.find((d: { key: string; value: number }) => d.key === "visitors")?.value || 0;
        const generated = data.find((d: { key: string; value: number }) => d.key === "generated")?.value || 0;
        return NextResponse.json({ visitors, generated });
      }
    }
    return NextResponse.json({ visitors: 0, generated: 0 });
  } catch {
    return NextResponse.json({ visitors: 0, generated: 0 });
  }
}
