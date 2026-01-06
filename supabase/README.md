# Supabase Setup Guide

## Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL from `schema.sql` to create the necessary tables

## Storage Setup

1. Go to Storage in your Supabase dashboard
2. Create a new bucket named `notes`
3. Set it to **Private** (not public)
4. Add the following policies:

### Storage Policy for Notes Upload

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload their own notes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own files
CREATE POLICY "Users can read their own notes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own notes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Authentication

Supabase Auth is already configured. Make sure:
- Email authentication is enabled
- Email confirmation can be disabled for development (optional)

## Environment Variables

Add these to your `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```
