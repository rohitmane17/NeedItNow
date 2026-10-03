-- ============================================================================
-- NeedItNow — VIT Pune 24-hour campus request platform
-- Migration 0001: schema, row level security and the 24h expiry machinery.
--
-- Run this whole file in the Supabase SQL editor (or `supabase db push`).
-- ============================================================================

-- Create requests table
CREATE TABLE public.requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'Items', 'Academic', 'People', 'Events', 'Other'
  location TEXT NOT NULL, -- e.g. 'C-Block', 'Library', 'A-Block Canteen'
  contact_info TEXT NOT NULL, -- Phone / Telegram handle / WhatsApp link
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL,
  helper_count INT DEFAULT 0 NOT NULL
);

-- ---------------------------------------------------------------------------
-- PRN #7 "Forgetful": every row lives for exactly 24 hours.
-- ---------------------------------------------------------------------------
ALTER TABLE public.requests ADD CONSTRAINT requests_expires_within_24h
  CHECK (expires_at > created_at AND expires_at <= created_at + INTERVAL '24 hours');

-- Every query the app issues filters on expires_at, so index it.
CREATE INDEX requests_expires_at_idx ON public.requests (expires_at DESC);
CREATE INDEX requests_created_at_idx ON public.requests (created_at DESC);
CREATE INDEX requests_category_idx ON public.requests (category);

-- Enable RLS
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Security Policies
CREATE POLICY "Allow public select active" ON public.requests
  FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Allow public insert" ON public.requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update helper" ON public.requests
  FOR UPDATE USING (expires_at > NOW());

-- Expired rows are invisible to SELECT, but they must also be *deleted*, or the
-- table grows forever. Two layers enforce that:
--   1. delete_expired_requests() — called by the client on load and every 60s.
--   2. an optional pg_cron job (bottom of this file) that hard-deletes hourly
--      even if nobody has the app open.

-- Hard Deletion Function
CREATE OR REPLACE FUNCTION delete_expired_requests()
RETURNS void AS $$
BEGIN
  DELETE FROM public.requests WHERE expires_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safety net: never let a row be born already-expired or live past 24h.
CREATE OR REPLACE FUNCTION enforce_request_lifetime()
RETURNS trigger AS $$
BEGIN
  IF NEW.expires_at IS NULL OR NEW.expires_at > NEW.created_at + INTERVAL '24 hours' THEN
    NEW.expires_at := NEW.created_at + INTERVAL '24 hours';
  END IF;
  IF NEW.expires_at <= NOW() THEN
    NEW.expires_at := NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requests_lifetime_trigger
  BEFORE INSERT OR UPDATE ON public.requests
  FOR EACH ROW EXECUTE FUNCTION enforce_request_lifetime();

-- Atomic "I can help" counter. Avoids the read-modify-write race the client
-- would otherwise have when two students tap Help at the same moment.
CREATE OR REPLACE FUNCTION increment_helper_count(request_id UUID)
RETURNS public.requests AS $$
DECLARE
  updated public.requests;
BEGIN
  UPDATE public.requests
     SET helper_count = helper_count + 1
   WHERE id = request_id
     AND expires_at > NOW()
  RETURNING * INTO updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request % not found or already expired', request_id;
  END IF;

  RETURN updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- OPTIONAL but recommended: schedule the hard delete.
-- Enable the "pg_cron" extension in Dashboard → Database → Extensions, then run:
--
--   SELECT cron.schedule(
--     'needitnow-purge',
--     '7 * * * *',            -- every hour at :07
--     $$SELECT delete_expired_requests();$$
--   );
--
-- The client also calls delete_expired_requests() on mount and every 60s, so
-- this is a backstop, not the only line of defence.
-- ---------------------------------------------------------------------------
