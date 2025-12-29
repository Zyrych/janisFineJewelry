-- Create product-images storage bucket
-- Run this in Supabase SQL Editor

-- Create the bucket (if it doesn't exist, create it manually in Storage dashboard first)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);

-- Allow public read access to product images
CREATE POLICY "Public read access for product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated admins/superusers to upload product images
CREATE POLICY "Admin upload access for product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'superuser')
  )
);

-- Allow authenticated admins/superusers to update product images
CREATE POLICY "Admin update access for product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'superuser')
  )
);

-- Allow authenticated admins/superusers to delete product images
CREATE POLICY "Admin delete access for product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'superuser')
  )
);
