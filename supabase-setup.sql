-- ============================================
-- HookCraft AI - Supabase Setup
-- Run in SQL Editor: https://dbwhzmpfgfgemifiuhrp.supabase.co
-- ============================================

-- 1. Users tablosu (kredi takibi)
CREATE TABLE IF NOT EXISTS public.users (
  id         TEXT PRIMARY KEY,
  credits    INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 2. Check
SELECT * FROM public.users;
