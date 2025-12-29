-- Create productImages storage bucket
-- Run this in Supabase SQL Editor

-- Create the bucket (if it doesn't exist, create it manually in Storage dashboard first)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('productImages', 'productImages', true);

-- Allow public read access to product images
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'productImages');

-- Allow authenticated users to upload product images
CREATE POLICY "Authenticated upload for product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'productImages'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update product images
CREATE POLICY "Authenticated update for product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'productImages'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete product images
CREATE POLICY "Authenticated delete for product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'productImages'
  AND auth.role() = 'authenticated'
);
