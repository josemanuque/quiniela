-- Fix avatar upload RLS.
-- The previous INSERT policy checked `name = auth.uid()::text` which fails
-- on upsert because Supabase Storage evaluates the WITH CHECK before setting owner.
-- Use owner column (auto-set by Storage on upload) for UPDATE/DELETE,
-- and a simple bucket + uid path check for INSERT.

DROP POLICY IF EXISTS "Users can upload own avatar"  ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar"  ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar"  ON storage.objects;

-- INSERT: the file path must equal the uploader's uid
CREATE POLICY "avatars: insert own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = auth.uid()::text
    AND auth.role() = 'authenticated'
  );

-- UPDATE: must own the object (Supabase sets owner = auth.uid() on first upload)
CREATE POLICY "avatars: update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING   (bucket_id = 'avatars' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

-- DELETE: must own the object
CREATE POLICY "avatars: delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND owner = auth.uid());

-- SELECT: bucket is public so no SELECT policy is needed, but add one as fallback
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');
