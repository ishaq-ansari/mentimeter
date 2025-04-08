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

CREATE TABLE sessions (
  id text PRIMARY KEY,
  questions jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text REFERENCES sessions(id),
  question_id text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access to sessions"
  ON sessions
  FOR ALL
  TO public
  USING (true);

CREATE POLICY "Allow public access to responses"
  ON responses
  FOR ALL
  TO public
  USING (true);