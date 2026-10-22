-- Müşteri anketi (public /anket sayfası)
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT,
  company TEXT,
  q1_satisfaction INT NOT NULL CHECK (q1_satisfaction BETWEEN 1 AND 5),
  q2_creative INT NOT NULL CHECK (q2_creative BETWEEN 1 AND 5),
  q3_communication INT NOT NULL CHECK (q3_communication BETWEEN 1 AND 5),
  q4_process INT NOT NULL CHECK (q4_process BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Anonim INSERT politikası YOK: kayıtlar sadece /api/survey/submit (service role) üzerinden yazılır.
-- Sadece admin ve manager okuyabilir/silebilir.
DROP POLICY IF EXISTS "survey_select_admin" ON survey_responses;
CREATE POLICY "survey_select_admin" ON survey_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')));

DROP POLICY IF EXISTS "survey_delete_admin" ON survey_responses;
CREATE POLICY "survey_delete_admin" ON survey_responses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
