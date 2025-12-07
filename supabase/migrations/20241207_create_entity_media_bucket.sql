-- Atlas Eidolon Entity Media Storage Bucket
-- Storage bucket for uploaded videos and images during entity cataloguing

-- Create the entity-media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'entity-media',
  'entity-media',
  true,  -- Public read access for displaying media
  104857600,  -- 100MB file size limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Enable RLS on objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view entity media (public bucket)
CREATE POLICY "Public read access for entity-media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'entity-media');

-- Policy: Authenticated users can upload entity media
CREATE POLICY "Authenticated users can upload entity-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'entity-media');

-- Policy: Authenticated users can update their own uploads
CREATE POLICY "Authenticated users can update entity-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'entity-media' AND auth.uid() = owner);

-- Policy: Authenticated users can delete their own uploads
CREATE POLICY "Authenticated users can delete entity-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'entity-media' AND auth.uid() = owner);

