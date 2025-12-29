-- Migration: Add profile fields to users table
-- Run this in your Supabase SQL Editor

-- Add new columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS facebook_link TEXT,
ADD COLUMN IF NOT EXISTS facebook_name TEXT,
ADD COLUMN IF NOT EXISTS birthday DATE;

-- Note: phone and address columns already exist in the original schema
