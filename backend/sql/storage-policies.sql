-- Run manually in YOUR Supabase SQL Editor after checking the project identity.
-- This adds a security policy; it does not alter managed table columns or data.
-- If bucket names differ in .env, replace both literals below to match.
-- Both buckets MUST also have Public bucket switched OFF in Storage.
-- Restrictive policies combine with existing permissive policies using AND.
-- The server's secret/service_role bypasses RLS; browsers never receive that key.
CREATE POLICY portfolio_express_only
  ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (bucket_id <> 'portfolio-public' AND bucket_id <> 'portfolio-private')
  WITH CHECK (bucket_id <> 'portfolio-public' AND bucket_id <> 'portfolio-private');
