"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useMemo } from "react";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );
  return browserClient;
}

export function createSupabaseClient() {
  if (typeof window === "undefined") {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    );
  }
  return getSupabaseBrowserClient();
}

export function useSupabaseClient() {
  return useMemo(() => createSupabaseClient(), []);
}
