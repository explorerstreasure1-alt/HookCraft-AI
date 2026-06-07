import { getAdmin } from "@/lib/supabase/admin";

export async function getCredits(userId: string): Promise<number> {
  const admin = getAdmin();
  if (!admin) {
    console.log("[storage] no admin client, returning default 3");
    return 3;
  }

  const { data, error } = await admin
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      await admin.from("users").insert({ id: userId, credits: 3 });
      return 3;
    }
    console.error("[storage] getCredits error:", error.message);
    throw error;
  }

  return data?.credits ?? 3;
}

export async function setCredits(userId: string, amount: number): Promise<void> {
  const admin = getAdmin();
  if (!admin) throw new Error("Supabase admin client not available");

  const { error } = await admin
    .from("users")
    .upsert({ id: userId, credits: amount });

  if (error) {
    console.error("[storage] setCredits error:", error.message);
    throw error;
  }
}

export async function decrementCredits(userId: string): Promise<number> {
  const current = await getCredits(userId);
  const next = Math.max(0, current - 1);
  await setCredits(userId, next);
  return next;
}

export async function addCredits(userId: string, amount: number): Promise<void> {
  const current = await getCredits(userId);
  await setCredits(userId, current + amount);
}
