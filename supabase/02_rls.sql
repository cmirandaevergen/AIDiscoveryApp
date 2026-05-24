-- ============================================================
-- AI Discovery App — RLS Policies
-- Run AFTER 01_schema.sql in the Supabase SQL editor
-- ============================================================

-- Helper function: is the current user a participant in an engagement?
CREATE OR REPLACE FUNCTION is_engagement_participant(eid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM engagement_participants
    WHERE engagement_id = eid AND profile_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: what is the current user's role in an engagement?
CREATE OR REPLACE FUNCTION engagement_role(eid UUID)
RETURNS user_role AS $$
  SELECT role FROM engagement_participants
  WHERE engagement_id = eid AND profile_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: is the current user a consultant?
CREATE OR REPLACE FUNCTION is_consultant()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'consultant');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── profiles ─────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Own row always
CREATE POLICY "profiles: own row" ON profiles
  FOR ALL USING (id = auth.uid());

-- Consultant can read profiles of people in their engagements
CREATE POLICY "profiles: consultant reads engagement members" ON profiles
  FOR SELECT USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM engagement_participants ep1
      JOIN engagement_participants ep2 ON ep1.engagement_id = ep2.engagement_id
      WHERE ep1.profile_id = auth.uid() AND ep2.profile_id = profiles.id
    )
  );

-- ── companies ────────────────────────────────────────────────

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD on companies they created
CREATE POLICY "companies: consultant full CRUD" ON companies
  FOR ALL USING (is_consultant() AND created_by = auth.uid());

-- Client lead: read their own company
CREATE POLICY "companies: client lead reads own" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND company_id = companies.id
    )
  );

-- ── engagements ──────────────────────────────────────────────

ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD on engagements they created
CREATE POLICY "engagements: consultant full CRUD" ON engagements
  FOR ALL USING (is_consultant() AND created_by = auth.uid());

-- Client lead and participant: read engagements they are enrolled in
CREATE POLICY "engagements: participants read" ON engagements
  FOR SELECT USING (is_engagement_participant(id));

-- ── engagement_participants ───────────────────────────────────

ALTER TABLE engagement_participants ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD on participants in their engagements
CREATE POLICY "ep: consultant full CRUD" ON engagement_participants
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM engagements e WHERE e.id = engagement_id AND e.created_by = auth.uid()
    )
  );

-- Non-consultant: read own row
CREATE POLICY "ep: read own row" ON engagement_participants
  FOR SELECT USING (profile_id = auth.uid());

-- ── surveys ──────────────────────────────────────────────────

ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD on surveys in their engagements
CREATE POLICY "surveys: consultant full CRUD" ON surveys
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM engagements e WHERE e.id = engagement_id AND e.created_by = auth.uid()
    )
  );

-- Client lead / participant: read published surveys in their engagements
CREATE POLICY "surveys: enrolled reads published" ON surveys
  FOR SELECT USING (
    is_published = TRUE AND is_engagement_participant(engagement_id)
  );

-- ── survey_questions ─────────────────────────────────────────

ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD
CREATE POLICY "sq: consultant full CRUD" ON survey_questions
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM surveys s JOIN engagements e ON e.id = s.engagement_id
      WHERE s.id = survey_id AND e.created_by = auth.uid()
    )
  );

-- Enrolled users: read
CREATE POLICY "sq: enrolled reads" ON survey_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM surveys s WHERE s.id = survey_id AND is_engagement_participant(s.engagement_id)
    )
  );

-- ── survey_responses ─────────────────────────────────────────

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Consultant: read all responses in their engagements
CREATE POLICY "sr: consultant reads all" ON survey_responses
  FOR SELECT USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM surveys s JOIN engagements e ON e.id = s.engagement_id
      WHERE s.id = survey_id AND e.created_by = auth.uid()
    )
  );

-- Participant: CRUD own row
CREATE POLICY "sr: participant own CRUD" ON survey_responses
  FOR ALL USING (profile_id = auth.uid());

-- ── question_answers ─────────────────────────────────────────

ALTER TABLE question_answers ENABLE ROW LEVEL SECURITY;

-- Consultant: read all
CREATE POLICY "qa: consultant reads all" ON question_answers
  FOR SELECT USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM survey_responses sr
      JOIN surveys s ON s.id = sr.survey_id
      JOIN engagements e ON e.id = s.engagement_id
      WHERE sr.id = response_id AND e.created_by = auth.uid()
    )
  );

-- Participant: CRUD own answers
CREATE POLICY "qa: participant own CRUD" ON question_answers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM survey_responses sr WHERE sr.id = response_id AND sr.profile_id = auth.uid()
    )
  );

-- ── workshop_sessions ────────────────────────────────────────

ALTER TABLE workshop_sessions ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD
CREATE POLICY "ws: consultant full CRUD" ON workshop_sessions
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM engagements e WHERE e.id = engagement_id AND e.created_by = auth.uid()
    )
  );

-- Enrolled users: read
CREATE POLICY "ws: enrolled reads" ON workshop_sessions
  FOR SELECT USING (is_engagement_participant(engagement_id));

-- ── use_cases ────────────────────────────────────────────────

ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD
CREATE POLICY "uc: consultant full CRUD" ON use_cases
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM engagements e WHERE e.id = engagement_id AND e.created_by = auth.uid()
    )
  );

-- Participant: insert own + read all in engagement
CREATE POLICY "uc: participant insert own" ON use_cases
  FOR INSERT WITH CHECK (
    submitted_by = auth.uid() AND is_engagement_participant(engagement_id)
  );

CREATE POLICY "uc: enrolled reads" ON use_cases
  FOR SELECT USING (is_engagement_participant(engagement_id));

-- ── canvas_position_history ───────────────────────────────────

ALTER TABLE canvas_position_history ENABLE ROW LEVEL SECURITY;

-- Consultant: read + insert
CREATE POLICY "cph: consultant read insert" ON canvas_position_history
  FOR SELECT USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM use_cases uc JOIN engagements e ON e.id = uc.engagement_id
      WHERE uc.id = use_case_id AND e.created_by = auth.uid()
    )
  );

CREATE POLICY "cph: consultant insert" ON canvas_position_history
  FOR INSERT WITH CHECK (
    moved_by = auth.uid() AND is_consultant()
  );

-- ── canvas_snapshots ─────────────────────────────────────────

ALTER TABLE canvas_snapshots ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD
CREATE POLICY "cs: consultant full CRUD" ON canvas_snapshots
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM engagements e WHERE e.id = engagement_id AND e.created_by = auth.uid()
    )
  );

-- Client lead: read
CREATE POLICY "cs: client lead reads" ON canvas_snapshots
  FOR SELECT USING (
    engagement_role(engagement_id) = 'client_lead'
  );

-- ── use_case_scores ──────────────────────────────────────────

ALTER TABLE use_case_scores ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD
CREATE POLICY "ucs: consultant full CRUD" ON use_case_scores
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM use_cases uc JOIN engagements e ON e.id = uc.engagement_id
      WHERE uc.id = use_case_id AND e.created_by = auth.uid()
    )
  );

-- Client lead: read
CREATE POLICY "ucs: client lead reads" ON use_case_scores
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM use_cases uc WHERE uc.id = use_case_id AND engagement_role(uc.engagement_id) = 'client_lead'
    )
  );

-- ── roi_inputs ───────────────────────────────────────────────

ALTER TABLE roi_inputs ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD
CREATE POLICY "ri: consultant full CRUD" ON roi_inputs
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM use_cases uc JOIN engagements e ON e.id = uc.engagement_id
      WHERE uc.id = use_case_id AND e.created_by = auth.uid()
    )
  );

-- Client lead: read
CREATE POLICY "ri: client lead reads" ON roi_inputs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM use_cases uc WHERE uc.id = use_case_id AND engagement_role(uc.engagement_id) = 'client_lead'
    )
  );

-- ── roi_outputs ──────────────────────────────────────────────

ALTER TABLE roi_outputs ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD
CREATE POLICY "ro: consultant full CRUD" ON roi_outputs
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM use_cases uc JOIN engagements e ON e.id = uc.engagement_id
      WHERE uc.id = use_case_id AND e.created_by = auth.uid()
    )
  );

-- Client lead: read
CREATE POLICY "ro: client lead reads" ON roi_outputs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM use_cases uc WHERE uc.id = use_case_id AND engagement_role(uc.engagement_id) = 'client_lead'
    )
  );

-- ── roadmap_items ────────────────────────────────────────────

ALTER TABLE roadmap_items ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD
CREATE POLICY "rmi: consultant full CRUD" ON roadmap_items
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM engagements e WHERE e.id = engagement_id AND e.created_by = auth.uid()
    )
  );

-- Client lead: read
CREATE POLICY "rmi: client lead reads" ON roadmap_items
  FOR SELECT USING (engagement_role(engagement_id) = 'client_lead');

-- ── business_cases ───────────────────────────────────────────

ALTER TABLE business_cases ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD
CREATE POLICY "bc: consultant full CRUD" ON business_cases
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM engagements e WHERE e.id = engagement_id AND e.created_by = auth.uid()
    )
  );

-- Client lead: read complete only
CREATE POLICY "bc: client lead reads complete" ON business_cases
  FOR SELECT USING (
    generation_status = 'complete' AND engagement_role(engagement_id) = 'client_lead'
  );

-- ── output_exports ───────────────────────────────────────────

ALTER TABLE output_exports ENABLE ROW LEVEL SECURITY;

-- Consultant: full CRUD
CREATE POLICY "oe: consultant full CRUD" ON output_exports
  FOR ALL USING (
    is_consultant() AND EXISTS (
      SELECT 1 FROM engagements e WHERE e.id = engagement_id AND e.created_by = auth.uid()
    )
  );

-- Client lead: read complete exports only
CREATE POLICY "oe: client lead reads complete" ON output_exports
  FOR SELECT USING (
    status = 'complete' AND engagement_role(engagement_id) = 'client_lead'
  );
