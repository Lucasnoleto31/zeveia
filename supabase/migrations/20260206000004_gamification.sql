-- Gamification System
-- Phase 4: Points, badges, streaks, and leaderboard for assessors

-- Assessor points
CREATE TABLE assessor_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  points INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  reference_id UUID,
  description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Assessor badges
CREATE TABLE assessor_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  badge_type TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_emoji TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  period TEXT
);

-- Assessor streaks
CREATE TABLE assessor_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  streak_type TEXT NOT NULL DEFAULT 'daily_interaction',
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_assessor_points_user_id ON assessor_points(user_id);
CREATE INDEX idx_assessor_points_earned_at ON assessor_points(earned_at DESC);
CREATE INDEX idx_assessor_points_action_type ON assessor_points(action_type);
CREATE INDEX idx_assessor_badges_user_id ON assessor_badges(user_id);
CREATE INDEX idx_assessor_badges_badge_type ON assessor_badges(badge_type);
CREATE INDEX idx_assessor_streaks_user_id ON assessor_streaks(user_id);

-- RLS Policies
ALTER TABLE assessor_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessor_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessor_streaks ENABLE ROW LEVEL SECURITY;

-- assessor_points: all authenticated users can read; insert for self
CREATE POLICY "assessor_points_select" ON assessor_points
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "assessor_points_insert" ON assessor_points
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "assessor_points_update" ON assessor_points
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "assessor_points_delete" ON assessor_points
  FOR DELETE TO authenticated USING (true);

-- assessor_badges
CREATE POLICY "assessor_badges_select" ON assessor_badges
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "assessor_badges_insert" ON assessor_badges
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "assessor_badges_update" ON assessor_badges
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "assessor_badges_delete" ON assessor_badges
  FOR DELETE TO authenticated USING (true);

-- assessor_streaks
CREATE POLICY "assessor_streaks_select" ON assessor_streaks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "assessor_streaks_insert" ON assessor_streaks
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "assessor_streaks_update" ON assessor_streaks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "assessor_streaks_delete" ON assessor_streaks
  FOR DELETE TO authenticated USING (true);
