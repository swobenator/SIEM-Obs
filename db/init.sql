CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE events(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'
);