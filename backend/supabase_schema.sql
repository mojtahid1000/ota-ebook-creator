-- OTA Ebook Creator - Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT,
  press_name TEXT,
  website_url TEXT,
  preferred_ai_provider TEXT DEFAULT 'claude' CHECK (preferred_ai_provider IN ('claude', 'openai')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, author_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'author_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'unlimited')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due')),
  payment_provider TEXT DEFAULT 'sslcommerz',
  payment_ref TEXT,
  ebooks_used_this_month INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  tokens_budget INT DEFAULT 200000,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- EBOOK PROJECTS
-- ============================================================
CREATE TABLE public.ebook_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  subtitle TEXT,
  tagline TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'exported')),
  current_step INT NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 12),
  ai_provider TEXT DEFAULT 'claude' CHECK (ai_provider IN ('claude', 'openai')),

  -- Step data (JSONB for flexibility)
  main_niche TEXT,
  sub_niche TEXT,
  niche_data JSONB DEFAULT '{}',
  avatar_data JSONB DEFAULT '{}',
  problem_data JSONB DEFAULT '{}',
  solution_data JSONB DEFAULT '{}',
  research_data JSONB DEFAULT '{}',
  title_data JSONB DEFAULT '{}',
  outline_data JSONB DEFAULT '{}',
  review_data JSONB DEFAULT '{}',
  design_settings JSONB DEFAULT '{}',

  -- Writing preferences
  writing_style_preference TEXT,

  -- Token tracking
  tokens_used INT DEFAULT 0,
  tokens_budget INT DEFAULT 200000,
  last_agent_completed INT DEFAULT 0,

  total_chapters INT DEFAULT 0,
  estimated_pages INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ebook_projects_user ON public.ebook_projects(user_id);

-- ============================================================
-- EBOOK CHAPTERS
-- ============================================================
CREATE TABLE public.ebook_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.ebook_projects(id) ON DELETE CASCADE,
  chapter_number INT NOT NULL,
  title TEXT NOT NULL,
  sub_topics JSONB DEFAULT '[]',
  estimated_pages INT DEFAULT 0,
  content TEXT,
  writing_style TEXT,
  word_count INT DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'writing', 'review', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, chapter_number)
);

CREATE INDEX idx_ebook_chapters_project ON public.ebook_chapters(project_id);

-- ============================================================
-- EBOOK COVERS
-- ============================================================
CREATE TABLE public.ebook_covers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.ebook_projects(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  cover_type TEXT NOT NULL CHECK (cover_type IN ('front', 'back')),
  prompt_used TEXT,
  style TEXT,
  color_scheme TEXT,
  is_selected BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ebook_covers_project ON public.ebook_covers(project_id);

-- ============================================================
-- EBOOK EXPORTS
-- ============================================================
CREATE TABLE public.ebook_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.ebook_projects(id) ON DELETE CASCADE,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'docx', 'gdocs')),
  file_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AGENT LOGS
-- ============================================================
CREATE TABLE public.agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.ebook_projects(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_model TEXT NOT NULL,
  step_number INT NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  tokens_used INT DEFAULT 0,
  duration_ms INT DEFAULT 0,
  status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed', 'retrying')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_logs_project ON public.agent_logs(project_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_covers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own projects" ON public.ebook_projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own chapters" ON public.ebook_chapters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ebook_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users manage own covers" ON public.ebook_covers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ebook_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users manage own exports" ON public.ebook_exports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.ebook_projects WHERE id = project_id AND user_id = auth.uid())
  );

CREATE POLICY "Users view own agent logs" ON public.agent_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.ebook_projects WHERE id = project_id AND user_id = auth.uid())
  );

-- ============================================================
-- AUTO-CREATE SUBSCRIPTION ON NEW USER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, tokens_budget)
  VALUES (NEW.id, 'free', 'active', 200000);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();
