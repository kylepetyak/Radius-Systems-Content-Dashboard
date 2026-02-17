-- ============================================
-- Content Studio — Fix Script (idempotent, safe to re-run)
-- Run this in Supabase SQL Editor to fix auth & RLS issues
-- ============================================

-- 1. Create a SECURITY DEFINER helper to check admin role
--    This avoids self-referencing RLS issues on the profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Drop ALL existing policies (both old names from schema.sql and new names from this script)
--    This makes the script safe to re-run multiple times

-- Profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert own profile" ON profiles;

-- Content Plans
DROP POLICY IF EXISTS "Clients see own plans" ON content_plans;
DROP POLICY IF EXISTS "Admins can insert plans" ON content_plans;
DROP POLICY IF EXISTS "Admins can update plans" ON content_plans;
DROP POLICY IF EXISTS "Admins can delete plans" ON content_plans;

-- Content Pieces
DROP POLICY IF EXISTS "Users see relevant pieces" ON content_pieces;
DROP POLICY IF EXISTS "Admins can insert pieces" ON content_pieces;
DROP POLICY IF EXISTS "Clients update own piece status" ON content_pieces;
DROP POLICY IF EXISTS "Users update pieces" ON content_pieces;
DROP POLICY IF EXISTS "Admins can delete pieces" ON content_pieces;

-- Shot List Items
DROP POLICY IF EXISTS "Users see relevant shots" ON shot_list_items;
DROP POLICY IF EXISTS "Admins can insert shots" ON shot_list_items;
DROP POLICY IF EXISTS "Clients check off shots" ON shot_list_items;
DROP POLICY IF EXISTS "Users update shots" ON shot_list_items;
DROP POLICY IF EXISTS "Admins can delete shots" ON shot_list_items;

-- Pro Tips
DROP POLICY IF EXISTS "Users see relevant tips" ON pro_tips;
DROP POLICY IF EXISTS "Admins can insert tips" ON pro_tips;
DROP POLICY IF EXISTS "Admins can update tips" ON pro_tips;
DROP POLICY IF EXISTS "Admins can delete tips" ON pro_tips;

-- Uploads
DROP POLICY IF EXISTS "Users see relevant uploads" ON uploads;
DROP POLICY IF EXISTS "Users can upload to own pieces" ON uploads;

-- 3. Recreate policies using the safe is_admin() function

-- Profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Anyone can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Content Plans
CREATE POLICY "Clients see own plans" ON content_plans
  FOR SELECT USING (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can insert plans" ON content_plans
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update plans" ON content_plans
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete plans" ON content_plans
  FOR DELETE USING (public.is_admin());

-- Content Pieces
CREATE POLICY "Users see relevant pieces" ON content_pieces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_plans
      WHERE content_plans.id = content_pieces.plan_id
      AND (content_plans.client_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins can insert pieces" ON content_pieces
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Users update pieces" ON content_pieces
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM content_plans
      WHERE content_plans.id = content_pieces.plan_id
      AND content_plans.client_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Admins can delete pieces" ON content_pieces
  FOR DELETE USING (public.is_admin());

-- Shot List Items
CREATE POLICY "Users see relevant shots" ON shot_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_pieces
      JOIN content_plans ON content_plans.id = content_pieces.plan_id
      WHERE content_pieces.id = shot_list_items.piece_id
      AND (content_plans.client_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins can insert shots" ON shot_list_items
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Users update shots" ON shot_list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM content_pieces
      JOIN content_plans ON content_plans.id = content_pieces.plan_id
      WHERE content_pieces.id = shot_list_items.piece_id
      AND (content_plans.client_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins can delete shots" ON shot_list_items
  FOR DELETE USING (public.is_admin());

-- Pro Tips
CREATE POLICY "Users see relevant tips" ON pro_tips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_pieces
      JOIN content_plans ON content_plans.id = content_pieces.plan_id
      WHERE content_pieces.id = pro_tips.piece_id
      AND (content_plans.client_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Admins can insert tips" ON pro_tips
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update tips" ON pro_tips
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Admins can delete tips" ON pro_tips
  FOR DELETE USING (public.is_admin());

-- Uploads
CREATE POLICY "Users see relevant uploads" ON uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_pieces
      JOIN content_plans ON content_plans.id = content_pieces.plan_id
      WHERE content_pieces.id = uploads.piece_id
      AND (content_plans.client_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Users can upload to own pieces" ON uploads
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM content_pieces
      JOIN content_plans ON content_plans.id = content_pieces.plan_id
      WHERE content_pieces.id = uploads.piece_id
      AND (content_plans.client_id = auth.uid() OR public.is_admin())
    )
  );

-- 4. Confirm ALL existing users' emails (so they can log in)
UPDATE auth.users SET
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email_confirmed_at IS NULL;

-- 5. Ensure profiles exist for all auth users (trigger may not have fired)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  COALESCE(raw_user_meta_data->>'role', 'client')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 6. Make YOUR account an admin (uncomment and update the email below)
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL_HERE';
