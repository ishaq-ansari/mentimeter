/*
  # Add current_question_index to sessions table

  This migration adds a current_question_index column to the sessions table.
  This column will be used to keep track of which question is currently being shown
  to participants in a session.

  1. Changes:
    - Add current_question_index integer column to sessions table with default value of 0
*/

-- Add current_question_index column to sessions table
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;