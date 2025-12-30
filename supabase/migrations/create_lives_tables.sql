-- Create lives table for Facebook Live sessions
-- Run this in Supabase SQL Editor

-- Create live status enum type
DO $$ BEGIN
  CREATE TYPE live_status AS ENUM ('upcoming', 'live', 'ended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create lives table
CREATE TABLE IF NOT EXISTS public.lives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  cover_image TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  facebook_link TEXT,
  status live_status DEFAULT 'upcoming' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create live_products junction table
CREATE TABLE IF NOT EXISTS public.live_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  live_id UUID NOT NULL REFERENCES public.lives(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(live_id, product_id)
);

-- Enable RLS
ALTER TABLE public.lives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_products ENABLE ROW LEVEL SECURITY;

-- Public read access for lives
CREATE POLICY "Public read access for lives"
ON public.lives FOR SELECT
USING (true);

-- Public read access for live_products
CREATE POLICY "Public read access for live_products"
ON public.live_products FOR SELECT
USING (true);

-- Admin/superuser can manage lives
CREATE POLICY "Admin manage lives"
ON public.lives FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'superuser')
  )
);

-- Admin/superuser can manage live_products
CREATE POLICY "Admin manage live_products"
ON public.live_products FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'superuser')
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lives_status ON public.lives(status);
CREATE INDEX IF NOT EXISTS idx_lives_scheduled_at ON public.lives(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_live_products_live_id ON public.live_products(live_id);
CREATE INDEX IF NOT EXISTS idx_live_products_product_id ON public.live_products(product_id);
