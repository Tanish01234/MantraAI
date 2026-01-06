-- User History Table for MentraAI
-- Stores all user interactions across all modules with ChatGPT-style persistence

-- Drop existing table if you want to recreate (CAUTION: This will delete all data)
-- DROP TABLE IF EXISTS user_history CASCADE;

CREATE TABLE IF NOT EXISTS user_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  module_type TEXT NOT NULL CHECK (module_type IN ('chat', 'notes', 'career', 'exam_planner', 'confusion')),
  title TEXT, -- Auto-generated short title (5-7 words)
  content JSONB NOT NULL, -- Full conversation/data stored as JSON
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata (language, tags, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_history_user_id ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_history_session_id ON user_history(session_id);
CREATE INDEX IF NOT EXISTS idx_user_history_module_type ON user_history(module_type);
CREATE INDEX IF NOT EXISTS idx_user_history_created_at ON user_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_history_updated_at ON user_history(updated_at DESC);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_user_history_user_module ON user_history(user_id, module_type, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only view their own history
CREATE POLICY "Users can view their own history"
  ON user_history FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert their own history"
  ON user_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own history
CREATE POLICY "Users can update their own history"
  ON user_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete their own history"
  ON user_history FOR DELETE
  USING (auth.uid() = user_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_user_history_updated_at ON user_history;
CREATE TRIGGER trigger_update_user_history_updated_at
  BEFORE UPDATE ON user_history
  FOR EACH ROW
  EXECUTE FUNCTION update_user_history_updated_at();

-- Helper function to get user's history count by module
CREATE OR REPLACE FUNCTION get_user_history_count(p_user_id UUID, p_module_type TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  IF p_module_type IS NULL THEN
    SELECT COUNT(*) INTO count FROM user_history WHERE user_id = p_user_id;
  ELSE
    SELECT COUNT(*) INTO count FROM user_history WHERE user_id = p_user_id AND module_type = p_module_type;
  END IF;
  RETURN count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to delete all history for a user and module
CREATE OR REPLACE FUNCTION delete_user_history_by_module(p_user_id UUID, p_module_type TEXT)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_history 
  WHERE user_id = p_user_id AND module_type = p_module_type;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to delete a specific session
CREATE OR REPLACE FUNCTION delete_user_history_session(p_user_id UUID, p_session_id UUID)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_history 
  WHERE user_id = p_user_id AND session_id = p_session_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
