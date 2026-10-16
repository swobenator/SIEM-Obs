-- Initial database schema for stored events and timestamp-ordered event queries.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Keep accepted levels and field lengths consistent with the event validation schema.
CREATE TABLE events(

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    source TEXT NOT NULL
        CHECK (length(source) BETWEEN 1 AND 100),

    level TEXT NOT NULL
        CHECK (
            level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')
        ),

    message TEXT NOT NULL
        CHECK (length(message) BETWEEN 1 AND 5000),

    metadata JSONB NOT NULL DEFAULT '{}'

);

-- Supports newest-first event listing and cursor pagination.
CREATE INDEX idx_events_timestamp
ON events (timestamp DESC);