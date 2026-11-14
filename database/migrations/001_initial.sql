CREATE TABLE IF NOT EXISTS schema_migrations (version INT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, password_hash TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, tagline TEXT NOT NULL,
 description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','registration','running','completed','archived')),
 rules JSONB NOT NULL, version INT NOT NULL DEFAULT 1, demo BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rule_revisions (
 event_id TEXT NOT NULL REFERENCES events(id), version INT NOT NULL, rules JSONB NOT NULL, charts JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(event_id,version)
);
CREATE TABLE IF NOT EXISTS pool_entries (
 event_id TEXT NOT NULL REFERENCES events(id), chart_key TEXT NOT NULL, song_key TEXT NOT NULL,
 game_key TEXT NOT NULL, metadata JSONB NOT NULL, ordinal INT NOT NULL,
 PRIMARY KEY(event_id,chart_key)
);
CREATE TABLE IF NOT EXISTS entries (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), user_id TEXT NOT NULL REFERENCES users(id),
 display_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','withdrawn')),
 seed INT, reason TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(event_id,user_id)
);
CREATE TABLE IF NOT EXISTS matches (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), round INT NOT NULL, ordinal INT NOT NULL,
 a_id TEXT REFERENCES entries(id), b_id TEXT REFERENCES entries(id), winner_id TEXT REFERENCES entries(id),
 status TEXT NOT NULL DEFAULT 'waiting', version INT NOT NULL DEFAULT 1, rules JSONB NOT NULL,
 next_match TEXT REFERENCES matches(id), next_side TEXT, extra_round INT NOT NULL DEFAULT 0,
 UNIQUE(event_id,round,ordinal)
);
CREATE TABLE IF NOT EXISTS draft_actions (
 match_id TEXT NOT NULL REFERENCES matches(id), sequence INT NOT NULL, step_id TEXT NOT NULL,
 actor TEXT NOT NULL, action TEXT NOT NULL, chart_key TEXT NOT NULL, slot_id TEXT NOT NULL,
 user_id TEXT NOT NULL REFERENCES users(id), idempotency_key TEXT NOT NULL, PRIMARY KEY(match_id,sequence),
 UNIQUE(match_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS play_slots (
 match_id TEXT NOT NULL REFERENCES matches(id), id TEXT NOT NULL, chart_key TEXT NOT NULL,
 ordinal INT NOT NULL, extra_round INT NOT NULL DEFAULT 0, PRIMARY KEY(match_id,id)
);
CREATE TABLE IF NOT EXISTS attempts (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), match_id TEXT REFERENCES matches(id),
 entry_id TEXT NOT NULL REFERENCES entries(id), submitted_by TEXT NOT NULL REFERENCES users(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 sequence BIGSERIAL NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), evidence_note TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attempt_items (
 attempt_id TEXT NOT NULL REFERENCES attempts(id), slot_id TEXT NOT NULL, score NUMERIC NOT NULL,
 ordinal INT NOT NULL, PRIMARY KEY(attempt_id,slot_id)
);
CREATE TABLE IF NOT EXISTS reviews (
 id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(id), reviewer_id TEXT NOT NULL REFERENCES users(id),
 decision TEXT NOT NULL CHECK(decision IN ('approved','rejected')), reason TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS results (
 id TEXT PRIMARY KEY, match_id TEXT NOT NULL REFERENCES matches(id), version INT NOT NULL,
 winner_id TEXT NOT NULL REFERENCES entries(id), explanation JSONB NOT NULL,
 confirmed_by TEXT NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(match_id,version)
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGSERIAL PRIMARY KEY, event_id TEXT REFERENCES events(id), user_id TEXT REFERENCES users(id),
 action TEXT NOT NULL, detail TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attempts_event_idx ON attempts(event_id,entry_id);
CREATE INDEX IF NOT EXISTS events_owner_idx ON events(owner_id);
INSERT INTO schema_migrations(version) VALUES (1) ON CONFLICT DO NOTHING;
