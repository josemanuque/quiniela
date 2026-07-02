-- Supabase Storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- RLS for storage.objects — users can only write their own avatar (path = their user_id)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND name = auth.uid()::text);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND name = auth.uid()::text)
WITH CHECK (bucket_id = 'avatars' AND name = auth.uid()::text);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND name = auth.uid()::text);

-- Public read is handled by the bucket being public (no extra SELECT policy needed)

-- Group stakes: free-text incentive set by the group owner
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS stakes TEXT;

-- RLS: allow group owner to update stakes (existing update policy covers owner already,
-- but be explicit about the stakes column via a dedicated policy if needed)
-- The existing groups RLS update policy already checks owner_id = auth.uid(), so no new policy needed.
