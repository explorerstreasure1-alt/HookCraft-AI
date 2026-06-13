import { getAdmin } from "@/lib/supabase/admin";

export type UserProfile = {
  credits: number;
  xp: number;
  level: number;
  streak: number;
  last_login: string | null;
  last_spin: string | null;
  last_quest_reset: string | null;
  quests_completed: number;
  total_generations: number;
  referral_code: string | null;
  referred_by: string | null;
  plan: string;
};

export async function getCredits(userId: string): Promise<number> {
  const admin = getAdmin();
  if (!admin) return 1000;

  const { data, error } = await admin
    .from("users")
    .select("credits, last_credit_reset")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      await admin.from("users").insert({ 
        id: userId, 
        credits: 1000,
        last_credit_reset: new Date().toISOString()
      });
      return 1000;
    }
    console.error("[storage] getCredits error:", error.message);
    throw error;
  }

  if (data?.last_credit_reset) {
    const lastReset = new Date(data.last_credit_reset);
    const now = new Date();
    const daysSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceReset >= 30) {
      await admin.from("users").update({ 
        credits: 10000,
        last_credit_reset: now.toISOString()
      }).eq("id", userId);
      return 10000;
    }
  }

  return data?.credits ?? 1000;
}

export async function setCredits(userId: string, amount: number): Promise<void> {
  const admin = getAdmin();
  if (!admin) throw new Error("Supabase admin client not available");

  const { error } = await admin
    .from("users")
    .upsert({ id: userId, credits: Math.max(0, amount) });

  if (error) {
    console.error("[storage] setCredits error:", error.message);
    throw error;
  }
}

export async function decrementCredits(
  userId: string,
  amount: number = 1
): Promise<number> {
  const admin = getAdmin();
  if (!admin) throw new Error("Supabase admin client not available");

  const current = await getCredits(userId);
  if (current < amount) {
    throw new Error(`Insufficient credits: have ${current}, need ${amount}`);
  }

  const next = current - amount;
  await setCredits(userId, next);
  return next;
}

export async function addCredits(userId: string, amount: number): Promise<void> {
  const current = await getCredits(userId);
  await setCredits(userId, current + amount);
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const admin = getAdmin();
  if (!admin) return { credits: 1000, xp: 0, level: 1, streak: 0, last_login: null, last_spin: null, last_quest_reset: null, quests_completed: 0, total_generations: 0, referral_code: null, referred_by: null, plan: "free" };

  const { data, error } = await admin
    .from("users")
    .select("credits, xp, level, streak, last_login, last_spin, last_quest_reset, quests_completed, total_generations, referral_code, referred_by, plan")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      const now = new Date().toISOString();
      const code = generateReferralCode();
      await admin.from("users").insert({ 
        id: userId, 
        credits: 1000, 
        last_credit_reset: now, 
        xp: 0, 
        level: 1, 
        streak: 0, 
        last_login: now, 
        quests_completed: 0, 
        total_generations: 0,
        referral_code: code,
        referred_by: null,
        plan: "free"
      });
      return { credits: 1000, xp: 0, level: 1, streak: 0, last_login: now, last_spin: null, last_quest_reset: null, quests_completed: 0, total_generations: 0, referral_code: code, referred_by: null, plan: "free" };
    }
    throw error;
  }

  return {
    credits: data?.credits ?? 1000,
    xp: data?.xp ?? 0,
    level: data?.level ?? 1,
    streak: data?.streak ?? 0,
    last_login: data?.last_login,
    last_spin: data?.last_spin,
    last_quest_reset: data?.last_quest_reset,
    quests_completed: data?.quests_completed ?? 0,
    total_generations: data?.total_generations ?? 0,
    referral_code: data?.referral_code,
    referred_by: data?.referred_by,
    plan: data?.plan ?? "free",
  };
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "HC-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function xpForLevel(level: number): number {
  return level * 100 + (level - 1) * 50;
}

export async function addXp(userId: string, amount: number): Promise<{ newLevel: number; leveledUp: boolean }> {
  const admin = getAdmin();
  if (!admin) return { newLevel: 1, leveledUp: false };

  const profile = await getProfile(userId);
  let xp = profile.xp + amount;
  let level = profile.level;
  let leveledUp = false;

  while (xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
    leveledUp = true;
  }

  await admin.from("users").update({ xp, level }).eq("id", userId);
  return { newLevel: level, leveledUp };
}

export async function updateStreak(userId: string): Promise<{ streak: number; isNew: boolean }> {
  const admin = getAdmin();
  if (!admin) return { streak: 0, isNew: false };

  const profile = await getProfile(userId);
  const now = new Date();
  let streak = profile.streak;
  let isNew = false;

  if (!profile.last_login) {
    streak = 1;
    isNew = true;
  } else {
    const lastLogin = new Date(profile.last_login);
    const hoursSince = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
    
    if (hoursSince >= 48) {
      streak = 1;
      isNew = true;
    } else if (hoursSince >= 20) {
      streak = profile.streak + 1;
      isNew = true;
    }
  }

  await admin.from("users").update({ streak, last_login: now.toISOString() }).eq("id", userId);
  return { streak, isNew };
}

export async function incrementGenerations(userId: string): Promise<void> {
  const admin = getAdmin();
  if (!admin) return;
  const profile = await getProfile(userId);
  await admin.from("users").update({ total_generations: profile.total_generations + 1 }).eq("id", userId);
}

export async function completeQuest(userId: string): Promise<number> {
  const admin = getAdmin();
  if (!admin) return 0;
  const profile = await getProfile(userId);
  const newCount = profile.quests_completed + 1;
  await admin.from("users").update({ quests_completed: newCount }).eq("id", userId);
  return newCount;
}

export async function applyReferralCode(newUserId: string, code: string): Promise<{ success: boolean; bonus: number }> {
  const admin = getAdmin();
  if (!admin) return { success: false, bonus: 0 };

  const profile = await getProfile(newUserId);
  if (profile.referred_by) {
    return { success: false, bonus: 0 };
  }

  const { data: referrer } = await admin
    .from("users")
    .select("id")
    .eq("referral_code", code)
    .single();

  if (!referrer || referrer.id === newUserId) {
    return { success: false, bonus: 0 };
  }

  await admin.from("users").update({ referred_by: referrer.id }).eq("id", newUserId);
  
  await addCredits(newUserId, 500);
  await addCredits(referrer.id, 500);
  await addXp(newUserId, 50);
  await addXp(referrer.id, 50);

  return { success: true, bonus: 500 };
}

export async function getReferralStats(userId: string): Promise<{ code: string; count: number; credits: number }> {
  const admin = getAdmin();
  if (!admin) return { code: "", count: 0, credits: 0 };

  const profile = await getProfile(userId);
  const code = profile.referral_code || generateReferralCode();

  if (!profile.referral_code) {
    await admin.from("users").update({ referral_code: code }).eq("id", userId);
  }

  const { count } = await admin
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("referred_by", userId);

  return { code, count: count || 0, credits: (count || 0) * 500 };
}
