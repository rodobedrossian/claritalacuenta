-- Add a policy to allow service role to read credit card statements
CREATE POLICY "Service role can read all statements"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'credit-card-statements');

-- Update bucket to explicitly allow PDF files
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'credit-card-statements';