-- Migration: add unique constraint to prevent duplicate votes per event per voter
-- Run this once in your MySQL client. If duplicates exist, dedupe first.

-- 1) Optional: find duplicates
-- SELECT event_id, voter_id, COUNT(*) cnt FROM votes GROUP BY event_id, voter_id HAVING cnt > 1;

-- 2) Optional: dedupe (keep the earliest id)
-- DELETE v1 FROM votes v1
-- JOIN votes v2 ON v1.event_id = v2.event_id AND v1.voter_id = v2.voter_id AND v1.id > v2.id;

-- 3) Add unique constraint
ALTER TABLE votes
ADD CONSTRAINT uc_event_voter UNIQUE (event_id, voter_id);
