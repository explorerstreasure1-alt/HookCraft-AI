-- ============================================
-- HookCraft AI - Supabase SQL Setup
-- SQL Editor'da çalıştır: https://dbwhzmpfgfgemifiuhrp.supabase.co
-- ============================================

-- 1. Users tablosu (kredi takibi)
CREATE TABLE IF NOT EXISTS public.users (
  id         TEXT PRIMARY KEY,
  credits    INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Row Level Security aç
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. Service role için full erişim policy'si
CREATE POLICY service_role_all ON public.users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Test: bir kullanıcı ekle (isteğe bağlı)
-- INSERT INTO public.users (id, credits) VALUES ('test-user-123', 5) ON CONFLICT (id) DO NOTHING;

-- 5. Tabloyu kontrol et
SELECT * FROM public.users;
