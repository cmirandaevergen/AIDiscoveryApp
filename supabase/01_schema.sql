-- ============================================================
-- AI Discovery App — Schema SQL
-- Run this in the Supabase SQL editor (both Dev and Prod projects)
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('consultant', 'client_lead', 'participant');
CREATE TYPE engagement_status AS ENUM ('draft', 'active', 'completed', 'archived');
CREATE TYPE question_type AS ENUM ('text', 'rating', 'multiple_choice', 'checkbox');
CREATE TYPE use_case_status AS ENUM ('submitted', 'enriched', 'scored', 'on_roadmap', 'archived');
CREATE TYPE canvas_zone AS ENUM ('staging', 'quick_win', 'strategic_bet', 'incremental', 'deprioritize');
CREATE TYPE roadmap_horizon AS ENUM ('h1', 'h2', 'h3');
CREATE TYPE export_format AS ENUM ('powerpoint', 'word', 'excel');
CREATE TYPE export_status AS ENUM ('pending', 'processing', 'complete', 'failed');

-- ── profiles ─────────────────────────────────────────────────
-- Extends auth.users. Created automatically via trigger on sign-up.

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role          user_role NOT NULL DEFAULT 'participant',
  display_name  TEXT,
  company_id    UUID,                          -- FK added after companies table
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── companies ────────────────────────────────────────────────

CREATE TABLE companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  industry    TEXT,
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Now add the FK from profiles → companies (deferred to avoid circular dependency)
ALTER TABLE profiles
  ADD CONSTRAINT profiles_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- ── engagements ──────────────────────────────────────────────

CREATE TABLE engagements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  status      engagement_status NOT NULL DEFAULT 'draft',
  join_code   TEXT NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── engagement_participants ───────────────────────────────────

CREATE TABLE engagement_participants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id  UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  profile_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role           user_role NOT NULL DEFAULT 'participant',
  joined_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (engagement_id, profile_id)
);

-- ── surveys ──────────────────────────────────────────────────

CREATE TABLE surveys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id  UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  is_published   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── survey_questions ─────────────────────────────────────────

CREATE TABLE survey_questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id    UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  question     TEXT NOT NULL,
  type         question_type NOT NULL DEFAULT 'text',
  options      JSONB,                          -- for multiple_choice / checkbox
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── survey_responses ─────────────────────────────────────────

CREATE TABLE survey_responses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id   UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submitted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (survey_id, profile_id)
);

-- ── question_answers ─────────────────────────────────────────

CREATE TABLE question_answers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id  UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id  UUID NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  answer       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (response_id, question_id)
);

-- ── workshop_sessions ────────────────────────────────────────

CREATE TABLE workshop_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id  UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE UNIQUE,
  is_live        BOOLEAN NOT NULL DEFAULT FALSE,
  canvas_mode    TEXT NOT NULL DEFAULT 'ideation',  -- ideation | presentation | review
  started_at     TIMESTAMPTZ,
  ended_at       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── use_cases ────────────────────────────────────────────────

CREATE TABLE use_cases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id  UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  session_id     UUID REFERENCES workshop_sessions(id) ON DELETE SET NULL,
  submitted_by   UUID NOT NULL REFERENCES profiles(id),
  title          TEXT NOT NULL,
  description    TEXT,
  department     TEXT,
  status         use_case_status NOT NULL DEFAULT 'submitted',
  ai_summary     TEXT,
  ai_tags        TEXT[],
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── canvas_position_history ───────────────────────────────────

CREATE TABLE canvas_position_history (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id   UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  moved_by      UUID NOT NULL REFERENCES profiles(id),
  x             NUMERIC NOT NULL,
  y             NUMERIC NOT NULL,
  zone          canvas_zone,
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── canvas_snapshots ─────────────────────────────────────────

CREATE TABLE canvas_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id  UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  snapshot_json  JSONB NOT NULL,
  trigger        TEXT NOT NULL DEFAULT 'periodic',  -- periodic | session_close | manual
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── use_case_scores ──────────────────────────────────────────

CREATE TABLE use_case_scores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id    UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  scored_by      UUID NOT NULL REFERENCES profiles(id),
  value_score    NUMERIC CHECK (value_score BETWEEN 0 AND 100),
  feasibility_score NUMERIC CHECK (feasibility_score BETWEEN 0 AND 100),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (use_case_id, scored_by)
);

-- ── roi_inputs ───────────────────────────────────────────────

CREATE TABLE roi_inputs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id         UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE UNIQUE,
  annual_benefit      NUMERIC,
  implementation_cost NUMERIC,
  annual_opex         NUMERIC,
  discount_rate       NUMERIC DEFAULT 0.10,
  time_horizon_years  INTEGER DEFAULT 5,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── roi_outputs ──────────────────────────────────────────────

CREATE TABLE roi_outputs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id  UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE UNIQUE,
  npv          NUMERIC,
  irr          NUMERIC,
  payback_years NUMERIC,
  cash_flows   JSONB,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── roadmap_items ────────────────────────────────────────────

CREATE TABLE roadmap_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id  UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  use_case_id    UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  horizon        roadmap_horizon NOT NULL DEFAULT 'h1',
  position       INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (engagement_id, use_case_id)
);

-- ── business_cases ───────────────────────────────────────────

CREATE TABLE business_cases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id       UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  generation_status   TEXT NOT NULL DEFAULT 'pending',  -- pending | generating | complete | failed
  executive_summary   TEXT,
  opportunity_analysis TEXT,
  recommendation      TEXT,
  risks               TEXT,
  next_steps          TEXT,
  generated_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── output_exports ───────────────────────────────────────────

CREATE TABLE output_exports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  engagement_id  UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
  created_by     UUID NOT NULL REFERENCES profiles(id),
  format         export_format NOT NULL,
  status         export_status NOT NULL DEFAULT 'pending',
  blob_url       TEXT,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── updated_at trigger ───────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at         BEFORE UPDATE ON profiles         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_companies_updated_at        BEFORE UPDATE ON companies        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_engagements_updated_at      BEFORE UPDATE ON engagements      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_surveys_updated_at          BEFORE UPDATE ON surveys          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_workshop_sessions_updated_at BEFORE UPDATE ON workshop_sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_use_cases_updated_at        BEFORE UPDATE ON use_cases        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_use_case_scores_updated_at  BEFORE UPDATE ON use_case_scores  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_roi_inputs_updated_at       BEFORE UPDATE ON roi_inputs       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_roadmap_items_updated_at    BEFORE UPDATE ON roadmap_items    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_business_cases_updated_at   BEFORE UPDATE ON business_cases   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_output_exports_updated_at   BEFORE UPDATE ON output_exports   FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── auto-create profile on sign-up ───────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, display_name)
  VALUES (
    NEW.id,
    'consultant',
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
