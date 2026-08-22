/*
# Dayflow HRMS - Verification Codes Table

Stores 6-digit email verification codes for the signup flow.
Codes expire after 10 minutes and are single-use.
*/

CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  employee_id text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_email ON verification_codes(email);

ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (signup flow before auth exists)
DROP POLICY IF EXISTS "vc_insert_any" ON verification_codes;
CREATE POLICY "vc_insert_any" ON verification_codes FOR INSERT
  TO anon, authenticated WITH CHECK (true);

-- Allow anyone to read (for verification lookup)
DROP POLICY IF EXISTS "vc_select_any" ON verification_codes;
CREATE POLICY "vc_select_any" ON verification_codes FOR SELECT
  TO anon, authenticated USING (true);

-- Allow anyone to update (mark as used)
DROP POLICY IF EXISTS "vc_update_any" ON verification_codes;
CREATE POLICY "vc_update_any" ON verification_codes FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);