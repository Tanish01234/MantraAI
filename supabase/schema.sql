-- Supabase Database Schema for MentraAI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Memory Table
-- Stores user interactions, goals, and chat history
CREATE TABLE IF NOT EXISTS user_memory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('chat', 'notes', 'career_goal', 'career_roadmap')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_memory_user_id ON user_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_memory_created_at ON user_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_memory_interaction_type ON user_memory(interaction_type);

-- Enable Row Level Security (RLS)
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own data
CREATE POLICY "Users can view their own memory"
  ON user_memory FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own data
CREATE POLICY "Users can insert their own memory"
  ON user_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own data
CREATE POLICY "Users can update their own memory"
  ON user_memory FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own data
CREATE POLICY "Users can delete their own memory"
  ON user_memory FOR DELETE
  USING (auth.uid() = user_id);

-- Storage Bucket for Notes
-- This will be created via Supabase Dashboard, but here's the SQL reference:
-- Storage bucket name: 'notes'
-- Public: false (private bucket)
-- Allowed MIME types: application/pdf, text/plain, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
