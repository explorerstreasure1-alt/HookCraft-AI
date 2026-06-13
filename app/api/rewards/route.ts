import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase/admin";
import { getProfile, updateStreak, addXp, addCredits, xpForLevel } from "@/lib/storage";

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id") || "";
  if (!userId) return NextResponse.json({ error: "Missing user identity" }, { status: 400 });

  try {
    const profile = await getProfile(userId);
    const { streak } = await updateStreak(userId);

    const nextLevelXp = xpForLevel(profile.level);
    const xpProgress = Math.min((profile.xp / nextLevelXp) * 100, 100);

    return NextResponse.json({
      credits: profile.credits,
      xp: profile.xp,
      level: profile.level,
      streak,
      nextLevelXp,
      xpProgress,
      lastSpin: profile.last_spin,
      questsCompleted: profile.quests_completed,
      totalGenerations: profile.total_generations,
      canSpin: canSpin(profile.last_spin),
      dailyReward: getDailyReward(streak),
    });
  } catch (err) {
    console.error("[rewards] GET error:", err);
    return NextResponse.json({ error: "Failed to load rewards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = request.headers.get("x-user-id") || "";
  if (!userId) return NextResponse.json({ error: "Missing user identity" }, { status: 400 });

  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (action === "claim_daily") {
      return await claimDaily(userId);
    }
    if (action === "spin") {
      return await spinWheel(userId);
    }
    if (action === "complete_quest") {
      return await completeQuestAction(userId);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("[rewards] POST error:", err);
    return NextResponse.json({ error: "Failed to process reward" }, { status: 500 });
  }
}

async function claimDaily(userId: string) {
  const profile = await getProfile(userId);
  const reward = getDailyReward(profile.streak);
  await addCredits(userId, reward.credits);
  const { newLevel, leveledUp } = await addXp(userId, reward.xp);

  return NextResponse.json({
    success: true,
    credits: reward.credits,
    xp: reward.xp,
    newLevel,
    leveledUp,
    streak: profile.streak,
    message: `Day ${profile.streak} reward claimed!`,
  });
}

async function spinWheel(userId: string) {
  const profile = await getProfile(userId);
  if (!canSpin(profile.last_spin)) {
    return NextResponse.json({ error: "Spin not available yet" }, { status: 429 });
  }

  const admin = getAdmin();
  if (admin) {
    await admin.from("users").update({ last_spin: new Date().toISOString() }).eq("id", userId);
  }

  const prizes = [
    { credits: 50, xp: 20, label: "50 Credits", weight: 30 },
    { credits: 100, xp: 40, label: "100 Credits", weight: 25 },
    { credits: 200, xp: 80, label: "200 Credits", weight: 15 },
    { credits: 500, xp: 150, label: "500 Credits", weight: 8 },
    { credits: 1000, xp: 300, label: "1000 Credits", weight: 3 },
    { credits: 25, xp: 10, label: "25 Credits", weight: 35 },
    { credits: 75, xp: 30, label: "75 Credits", weight: 28 },
    { credits: 150, xp: 60, label: "150 Credits", weight: 18 },
  ];

  const totalWeight = prizes.reduce((sum, p) => sum + p.weight, 0);
  let random = Math.random() * totalWeight;
  let prizeIndex = 0;

  for (let i = 0; i < prizes.length; i++) {
    random -= prizes[i].weight;
    if (random <= 0) {
      prizeIndex = i;
      break;
    }
  }

  const prize = prizes[prizeIndex];
  await addCredits(userId, prize.credits);
  const { newLevel, leveledUp } = await addXp(userId, prize.xp);

  return NextResponse.json({
    success: true,
    prizeIndex,
    credits: prize.credits,
    xp: prize.xp,
    label: prize.label,
    newLevel,
    leveledUp,
  });
}

async function completeQuestAction(userId: string) {
  const profile = await getProfile(userId);
  const now = new Date();
  const lastReset = profile.last_quest_reset ? new Date(profile.last_quest_reset) : null;
  const hoursSinceReset = lastReset ? (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60) : 999;

  if (hoursSinceReset < 24 && profile.quests_completed >= 3) {
    return NextResponse.json({ error: "Daily quests completed. Come back tomorrow!" }, { status: 429 });
  }

  const admin = getAdmin();
  if (admin) {
    const updateData: Record<string, unknown> = { quests_completed: profile.quests_completed + 1 };
    if (hoursSinceReset >= 24) {
      updateData.last_quest_reset = now.toISOString();
      updateData.quests_completed = 1;
    }
    await admin.from("users").update(updateData).eq("id", userId);
  }

  const questReward = 30;
  await addCredits(userId, questReward);
  const { newLevel, leveledUp } = await addXp(userId, 15);

  return NextResponse.json({
    success: true,
    credits: questReward,
    xp: 15,
    newLevel,
    leveledUp,
    questsCompleted: hoursSinceReset >= 24 ? 1 : profile.quests_completed + 1,
  });
}

function canSpin(lastSpin: string | null): boolean {
  if (!lastSpin) return true;
  const last = new Date(lastSpin);
  const now = new Date();
  const hoursSince = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
  return hoursSince >= 24;
}

function getDailyReward(streak: number): { credits: number; xp: number } {
  const baseCredits = 50;
  const bonusCredits = Math.min(streak * 10, 200);
  const baseXp = 20;
  const bonusXp = Math.min(streak * 5, 100);
  return { credits: baseCredits + bonusCredits, xp: baseXp + bonusXp };
}