-- Migration: Move legacy hero_1/2/3 and carousel fields into left/right carousel columns
-- Safe: adds columns if missing, migrates values, does NOT drop legacy columns (drop statements are provided commented)

BEGIN;

-- Add new left/right carousel columns (if not already present)
ALTER TABLE public.hero_config
  ADD COLUMN IF NOT EXISTS left_card_images jsonb not null default '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS left_carousel_enabled boolean not null default false,
  ADD COLUMN IF NOT EXISTS left_carousel_autoplay boolean not null default true,
  ADD COLUMN IF NOT EXISTS left_carousel_infinite boolean not null default true,
  ADD COLUMN IF NOT EXISTS left_carousel_pause_on_hover boolean not null default true,
  ADD COLUMN IF NOT EXISTS left_carousel_transition text not null default 'fade',
  ADD COLUMN IF NOT EXISTS left_carousel_interval integer not null default 3000,
  ADD COLUMN IF NOT EXISTS left_carousel_transition_duration integer not null default 300,
  ADD COLUMN IF NOT EXISTS right_card_images jsonb not null default '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS right_carousel_enabled boolean not null default false,
  ADD COLUMN IF NOT EXISTS right_carousel_autoplay boolean not null default true,
  ADD COLUMN IF NOT EXISTS right_carousel_infinite boolean not null default true,
  ADD COLUMN IF NOT EXISTS right_carousel_pause_on_hover boolean not null default true,
  ADD COLUMN IF NOT EXISTS right_carousel_transition text not null default 'fade',
  ADD COLUMN IF NOT EXISTS right_carousel_interval integer not null default 3000,
  ADD COLUMN IF NOT EXISTS right_carousel_transition_duration integer not null default 300;

-- Migrate existing legacy fields into new structure for existing rows
-- This updates only when new columns are empty/default to avoid overwriting intentional existing data.
UPDATE public.hero_config
SET
  left_card_images = CASE
    WHEN coalesce(left_card_images::text, '[]') = '[]' THEN jsonb_build_array(coalesce(hero_1_url, ''), coalesce(hero_2_url, ''), coalesce(hero_3_url, ''))
    ELSE left_card_images
  END,
  right_card_images = CASE
    WHEN coalesce(right_card_images::text, '[]') = '[]' THEN jsonb_build_array(coalesce(hero_2_url, hero_1_url, ''), coalesce(hero_3_url, hero_2_url, ''), coalesce(hero_1_url, hero_3_url, ''))
    ELSE right_card_images
  END,
  left_carousel_enabled = COALESCE(left_carousel_enabled, carousel_enabled, false),
  left_carousel_autoplay = COALESCE(left_carousel_autoplay, autoplay, true),
  left_carousel_infinite = COALESCE(left_carousel_infinite, loop, true),
  left_carousel_pause_on_hover = COALESCE(left_carousel_pause_on_hover, pause_on_hover, true),
  left_carousel_transition = COALESCE(left_carousel_transition, transition_type, 'fade'),
  left_carousel_interval = COALESCE(left_carousel_interval, transition_interval, 3000),
  left_carousel_transition_duration = COALESCE(left_carousel_transition_duration, transition_ms, 300),
  right_carousel_enabled = COALESCE(right_carousel_enabled, carousel_enabled, false),
  right_carousel_autoplay = COALESCE(right_carousel_autoplay, autoplay, true),
  right_carousel_infinite = COALESCE(right_carousel_infinite, loop, true),
  right_carousel_pause_on_hover = COALESCE(right_carousel_pause_on_hover, pause_on_hover, true),
  right_carousel_transition = COALESCE(right_carousel_transition, transition_type, 'fade'),
  right_carousel_interval = COALESCE(right_carousel_interval, transition_interval, 3000),
  right_carousel_transition_duration = COALESCE(right_carousel_transition_duration, transition_ms, 300)
WHERE true;

-- Optional: remove legacy columns once you have verified the migration (commented by default)
-- ALTER TABLE public.hero_config DROP COLUMN IF EXISTS hero_1_url;
-- ALTER TABLE public.hero_config DROP COLUMN IF EXISTS hero_2_url;
-- ALTER TABLE public.hero_config DROP COLUMN IF EXISTS hero_3_url;
-- ALTER TABLE public.hero_config DROP COLUMN IF EXISTS carousel_enabled;
-- ALTER TABLE public.hero_config DROP COLUMN IF EXISTS autoplay;
-- ALTER TABLE public.hero_config DROP COLUMN IF EXISTS loop;
-- ALTER TABLE public.hero_config DROP COLUMN IF EXISTS pause_on_hover;
-- ALTER TABLE public.hero_config DROP COLUMN IF EXISTS transition_type;
-- ALTER TABLE public.hero_config DROP COLUMN IF EXISTS transition_interval;
-- ALTER TABLE public.hero_config DROP COLUMN IF EXISTS transition_ms;

COMMIT;

-- Verify after running:
-- SELECT * FROM public.hero_config WHERE config_key = 'default';
-- If you want to roll back before COMMIT, run ROLLBACK instead of COMMIT.
