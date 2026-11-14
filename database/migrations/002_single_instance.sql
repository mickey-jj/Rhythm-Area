CREATE TABLE IF NOT EXISTS instance_settings (
 id INT PRIMARY KEY CHECK (id=1),
 owner_id TEXT REFERENCES users(id),
 event_id TEXT UNIQUE REFERENCES events(id),
 appearance JSONB NOT NULL DEFAULT '{"brandName":"律竞","accentColor":"#a3edd1","contact":""}'::jsonb,
 demo_loaded BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO instance_settings(id) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO schema_migrations(version) VALUES (2) ON CONFLICT DO NOTHING;
