/*
  # Create tables for interactive sessions

  1. New Tables
    - `sessions` - Stores session information
      - `id` (text, primary key) - Session identifier
      - `questions` (jsonb) - Array of questions and their configurations
      - `created_at` (timestamp)
    - `responses` - Stores participant responses
      - `id` (uuid, primary key)
      - `session_id` (text) - References sessions.id
      - `question_id` (text) - Question identifier within the session
      - `response` (text) - The participant's response
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Allow public access for now (since we don't have authentication yet)
*/

DO $$ BEGIN

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS sessions (
  id text PRIMARY KEY,
  questions jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create responses table if it doesn't exist
CREATE TABLE IF NOT EXISTS responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text REFERENCES sessions(id),
  question_id text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$ BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', 'sessions');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', 'responses');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create policies if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Allow public access to sessions'
  ) THEN
    CREATE POLICY "Allow public access to sessions"
      ON sessions
      FOR ALL
      TO public
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'responses' AND policyname = 'Allow public access to responses'
  ) THEN
    CREATE POLICY "Allow public access to responses"
      ON responses
      FOR ALL
      TO public
      USING (true);
  END IF;
END $$;

END $$;