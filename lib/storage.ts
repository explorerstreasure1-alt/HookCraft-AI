import { getAdmin } from "@/lib/supabase/admin";

const localStore = new Map<string, number>();

export async function getCredits(userId: string): Promise<number> {
  const admin = getAdmin();
  if (!admin) return localStore.get(userId) ?? 3;

  try {
    const { data } = await admin
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();
    if (data) return data.credits;
    await admin.from("users").insert({ id: userId, credits: 3 });
    return 3;
  } catch {
    return localStore.get(userId) ?? 3;
  }
}

export async function setCredits(userId: string, amount: number): Promise<void> {
  const admin = getAdmin();
  if (!admin) { localStore.set(userId, amount); return; }
  try {
    await admin.from("users").upsert({ id: userId, credits: amount });
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
