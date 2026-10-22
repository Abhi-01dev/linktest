-- Persist the integrity score and disqualification outcome for each attempt.
ALTER TABLE mock_test_attempts
ADD COLUMN IF NOT EXISTS integrity_trust_index INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS disqualified BOOLEAN NOT NULL DEFAULT false;
