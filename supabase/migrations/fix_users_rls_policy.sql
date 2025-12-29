-- Fix: Users RLS policy infinite recursion
-- Run this in your Supabase SQL Editor

-- First, create a security definer function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Drop the old problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Superusers can update user roles" ON public.users;

-- Recreate policies using the security definer function
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'superuser')
  );

CREATE POLICY "Superusers can update user roles" ON public.users
  FOR UPDATE USING (
    public.get_user_role(auth.uid()) = 'superuser'
  );
