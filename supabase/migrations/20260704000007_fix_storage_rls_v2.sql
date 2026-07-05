-- Storage has both owner (uuid) and owner_id (text) columns.
-- Newer Supabase sets owner_id = auth.uid()::text on upload.
-- Rewrite policies to use owner_id for UPDATE/DELETE, and a simple
-- bucket+name check for INSERT that matches the upload path (= userId).

DROP POLICY IF EXISTS "avatars: insert own"  ON storage.objects;
DROP POLICY IF EXISTS "avatars: update own"  ON storage.objects;
DROP POLICY IF EXISTS "avatars: delete own"  ON storage.objects;
DROP POLICY IF EXISTS "avatars: public read" ON storage.objects;

-- INSERT: path must equal the caller's user ID
CREATE POLICY "avatars: insert own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND name = auth.uid()::text
  );

-- UPDATE: caller must own the object (owner_id set by Storage on first upload)
CREATE POLICY "avatars: update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING   (bucket_id = 'avatars' AND owner_id = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND owner_id = auth.uid()::text);

-- DELETE: caller must own the object
CREATE POLICY "avatars: delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND owner_id = auth.uid()::text);

-- SELECT: bucket is public — allow anyone to read
CREATE POLICY "avatars: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');
