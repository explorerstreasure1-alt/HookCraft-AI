const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const localStore = new Map<string, number>();

function localGet(key: string): number {
  return localStore.get(key) ?? 0;
}

async function supabaseFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseKey!,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  return res;
}

export async function getCredits(userId: string): Promise<number> {
  if (!supabaseUrl || !supabaseKey) return localGet(userId) || 3;

  try {
    const res = await supabaseFetch(
      `users?id=eq.${encodeURIComponent(userId)}&select=credits`,
      { headers: { Prefer: "return=representation" } }
    );
    const data = await res.json();
    if (data?.length > 0) return data[0].credits;

    await supabaseFetch("users", {
      method: "POST",
      body: JSON.stringify({ id: userId, credits: 3 }),
      headers: { Prefer: "return=minimal" },
    });
    return 3;
  } catch {
    return localGet(userId) || 3;
  }
}

export async function setCredits(userId: string, amount: number): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    localStore.set(userId, amount);
    return;
  }
  try {
    await supabaseFetch(`users?id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      body: JSON.stringify({ credits: amount }),
      headers: { Prefer: "return=minimal" },
    });
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
