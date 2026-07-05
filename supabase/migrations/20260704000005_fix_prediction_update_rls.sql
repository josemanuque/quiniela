-- Fix: UPDATE policy was checking locked_at IS NULL, but locked_at is never set.
-- Replace with the same kickoff_at > now() guard used by INSERT.

DROP POLICY IF EXISTS "predictions: update own pre-kickoff" ON public.predictions;

CREATE POLICY "predictions: update own pre-kickoff"
  ON public.predictions FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.kickoff_at > now()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.matches m
      WHERE m.id = match_id
        AND m.kickoff_at > now()
    )
  );
