-- Content Studio Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  company_name  TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Content Plans
CREATE TABLE IF NOT EXISTS content_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  month         TEXT,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Content Pieces
CREATE TABLE IF NOT EXISTS content_pieces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id       UUID REFERENCES content_plans(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  platform      TEXT NOT NULL,
  content_type  TEXT,
  status        TEXT DEFAULT 'to_film' CHECK (status IN ('to_film', 'filming', 'in_review', 'published')),
  due_date      DATE,
  duration      TEXT,
  hook          TEXT NOT NULL,
  script        TEXT,
  reference_url TEXT,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Shot List Items
CREATE TABLE IF NOT EXISTS shot_list_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id      UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  shot_number   INTEGER NOT NULL,
  shot_desc     TEXT NOT NULL,
  framing       TEXT,
  notes         TEXT,
  is_completed  BOOLEAN DEFAULT false,
  sort_order    INTEGER DEFAULT 0
);

-- Pro Tips
CREATE TABLE IF NOT EXISTS pro_tips (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id      UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  tip_text      TEXT NOT NULL,
  sort_order    INTEGER DEFAULT 0
);

-- Uploads (v2)
CREATE TABLE IF NOT EXISTS uploads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  piece_id      UUID REFERENCES content_pieces(id) ON DELETE CASCADE,
  uploaded_by   UUID REFERENCES profiles(id),
  file_url      TEXT NOT NULL,
  file_name     TEXT,
  file_type     TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_content_plans_client_id ON content_plans(client_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_plan_id ON content_pieces(plan_id);
CREATE INDEX IF NOT EXISTS idx_content_pieces_status ON content_pieces(status);
CREATE INDEX IF NOT EXISTS idx_shot_list_items_piece_id ON shot_list_items(piece_id);
CREATE INDEX IF NOT EXISTS idx_pro_tips_piece_id ON pro_tips(piece_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE shot_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pro_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR id = auth.uid()
  );

-- Content Plans policies
CREATE POLICY "Clients see own plans" ON content_plans
  FOR SELECT USING (
    client_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert plans" ON content_plans
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update plans" ON content_plans
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete plans" ON content_plans
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Content Pieces policies
CREATE POLICY "Users see relevant pieces" ON content_pieces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_plans
      WHERE content_plans.id = content_pieces.plan_id
      AND (content_plans.client_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Admins can insert pieces" ON content_pieces
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Clients update own piece status" ON content_pieces
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM content_plans
      WHERE content_plans.id = content_pieces.plan_id
      AND content_plans.client_id = auth.uid()
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete pieces" ON content_pieces
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Shot List Items policies
CREATE POLICY "Users see relevant shots" ON shot_list_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_pieces
      JOIN content_plans ON content_plans.id = content_pieces.plan_id
      WHERE content_pieces.id = shot_list_items.piece_id
      AND (content_plans.client_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Admins can insert shots" ON shot_list_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Clients check off shots" ON shot_list_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM content_pieces
      JOIN content_plans ON content_plans.id = content_pieces.plan_id
      WHERE content_pieces.id = shot_list_items.piece_id
      AND (content_plans.client_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Admins can delete shots" ON shot_list_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Pro Tips policies
CREATE POLICY "Users see relevant tips" ON pro_tips
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_pieces
      JOIN content_plans ON content_plans.id = content_pieces.plan_id
      WHERE content_pieces.id = pro_tips.piece_id
      AND (content_plans.client_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Admins can insert tips" ON pro_tips
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update tips" ON pro_tips
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete tips" ON pro_tips
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Uploads policies
CREATE POLICY "Users see relevant uploads" ON uploads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_pieces
      JOIN content_plans ON content_plans.id = content_pieces.plan_id
      WHERE content_pieces.id = uploads.piece_id
      AND (content_plans.client_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Users can upload to own pieces" ON uploads
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM content_pieces
      JOIN content_plans ON content_plans.id = content_pieces.plan_id
      WHERE content_pieces.id = uploads.piece_id
      AND (content_plans.client_id = auth.uid()
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_plans_updated_at
  BEFORE UPDATE ON content_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_content_pieces_updated_at
  BEFORE UPDATE ON content_pieces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
