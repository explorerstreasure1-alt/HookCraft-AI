import { supabaseAdmin } from "@/lib/supabase/admin";

const localStore = new Map<string, number>();

export async function getCredits(userId: string): Promise<number> {
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (data) return data.credits;

    await supabaseAdmin.from("users").insert({ id: userId, credits: 3 });
    return 3;
  } catch {
    return localStore.get(userId) ?? 3;
  }
}

export async function setCredits(userId: string, amount: number): Promise<void> {
  try {
    await supabaseAdmin.from("users").upsert({ id: userId, credits: amount });
  } catch {
    localStore.set(userId, amount);
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
