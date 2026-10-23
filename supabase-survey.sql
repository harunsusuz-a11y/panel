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

-- Sadece admin ve manager okuyabilir/silebilir.
DROP POLICY IF EXISTS "survey_select_admin" ON survey_responses;
CREATE POLICY "survey_select_admin" ON survey_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin','manager')));

DROP POLICY IF EXISTS "survey_delete_admin" ON survey_responses;
CREATE POLICY "survey_delete_admin" ON survey_responses FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Anonim katılım: sadece INSERT (okuma/silme yok). Uzunluk sınırları:
ALTER TABLE survey_responses
  ADD CONSTRAINT survey_len_name CHECK (full_name IS NULL OR char_length(full_name) <= 120),
  ADD CONSTRAINT survey_len_company CHECK (company IS NULL OR char_length(company) <= 120),
  ADD CONSTRAINT survey_len_comment CHECK (comment IS NULL OR char_length(comment) <= 2000);
DROP POLICY IF EXISTS "survey_insert_anon" ON survey_responses;
CREATE POLICY "survey_insert_anon" ON survey_responses FOR INSERT TO anon, authenticated WITH CHECK (true);
GRANT INSERT ON survey_responses TO anon;
