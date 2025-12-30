-- Add images array column to products table
-- Run this in Supabase SQL Editor

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Optional: Migrate existing image_url to images array
UPDATE public.products
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL AND images IS NULL;
