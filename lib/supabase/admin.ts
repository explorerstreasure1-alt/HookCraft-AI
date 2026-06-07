import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getAdmin(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.log("[admin] missing SUPABASE_URL or SERVICE_ROLE_KEY");
    return null;
  }

  try {
    client = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    console.log("[admin] Supabase client created");
    return client;
  } catch (err) {
    console.error("[admin] failed to create client:", err);
    return null;
  }
}

export { getAdmin };
