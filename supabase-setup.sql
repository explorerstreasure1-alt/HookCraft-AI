-- ============================================
-- HookCraft AI - Supabase Setup
-- Run in SQL Editor: https://dbwhzmpfgfgemifiuhrp.supabase.co
-- ============================================

-- 1. Users tablosu (kredi takibi + gamification + monetization)
CREATE TABLE IF NOT EXISTS public.users (
  id         TEXT PRIMARY KEY,
  credits    INTEGER NOT NULL DEFAULT 1000,
  last_credit_reset TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xp         INTEGER NOT NULL DEFAULT 0,
  level      INTEGER NOT NULL DEFAULT 1,
  streak     INTEGER NOT NULL DEFAULT 0,
  last_login TIMESTAMPTZ,
  last_spin  TIMESTAMPTZ,
  last_quest_reset TIMESTAMPTZ,
  quests_completed INTEGER NOT NULL DEFAULT 0,
  total_generations INTEGER NOT NULL DEFAULT 0,
  plan       TEXT NOT NULL DEFAULT 'free',
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies WHERE policyname = 'service_role_all' AND tablename = 'users'
  ) THEN
    CREATE POLICY service_role_all ON public.users FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Yeni kayıt olunca otomatik users tablosuna ekle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := 'HC-' || substr(md5(random()::text || clock_timestamp()::text), 1, 6);
  INSERT INTO public.users (id, credits, last_credit_reset, xp, level, streak, last_login, quests_completed, total_generations, plan, referral_code)
  VALUES (new.id, 1000, NOW(), 0, 1, 0, NOW(), 0, 0, 'free', upper(new_code))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Site stats
CREATE TABLE IF NOT EXISTS public.stats (
  key   TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);
INSERT INTO public.stats (key, value) VALUES ('visitors', 0) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.stats (key, value) VALUES ('generated', 0) ON CONFLICT (key) DO NOTHING;
INSERT INTO public.stats (key, value) VALUES ('scenes', 0) ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_activity (
  user_id TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.increment_stat(stat_key TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.stats SET value = value + 1 WHERE key = stat_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Upgrade: existing tabloya tüm yeni kolonları ekle
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_credit_reset TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_spin TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_quest_reset TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS quests_completed INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_generations INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referred_by TEXT;

-- 5. Mevcut kullanıcılara referral code ata (boş olanlara)
DO $$
DECLARE
  u RECORD;
  new_code TEXT;
BEGIN
  FOR u IN SELECT id FROM public.users WHERE referral_code IS NULL
  LOOP
    new_code := 'HC-' || substr(md5(random()::text || clock_timestamp()::text || u.id), 1, 6);
    UPDATE public.users SET referral_code = upper(new_code) WHERE id = u.id;
  END LOOP;
END $$;

-- 6. Check
SELECT * FROM public.users;
SELECT * FROM public.stats;
