ALTER TABLE matches DROP CONSTRAINT matches_event_id_round_ordinal_key;
ALTER TABLE matches ADD COLUMN stage_id TEXT NOT NULL DEFAULT 'main';
ALTER TABLE matches ADD COLUMN bracket TEXT NOT NULL DEFAULT 'winners';
ALTER TABLE matches ADD COLUMN node_key TEXT;
ALTER TABLE matches ADD COLUMN source_a TEXT;
ALTER TABLE matches ADD COLUMN source_b TEXT;
ALTER TABLE matches ADD COLUMN generation INT NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX matches_node_idx ON matches(event_id,stage_id,node_key);
CREATE TABLE competition_stages (
 event_id TEXT NOT NULL REFERENCES events(id), stage_id TEXT NOT NULL, ordinal INT NOT NULL,
 kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'running', participants JSONB NOT NULL,
 placements JSONB NOT NULL DEFAULT '[]', reason TEXT NOT NULL DEFAULT '', PRIMARY KEY(event_id,stage_id)
);
CREATE TABLE event_judges(event_id TEXT NOT NULL REFERENCES events(id),user_id TEXT NOT NULL REFERENCES users(id),match_id TEXT REFERENCES matches(id),PRIMARY KEY(event_id,user_id,match_id));
CREATE TABLE judge_grants(event_id TEXT NOT NULL REFERENCES events(id),user_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(event_id,user_id));
CREATE TABLE appeals(id TEXT PRIMARY KEY,event_id TEXT NOT NULL REFERENCES events(id),match_id TEXT NOT NULL REFERENCES matches(id),user_id TEXT NOT NULL REFERENCES users(id),reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',decision TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE teams(id TEXT PRIMARY KEY,event_id TEXT NOT NULL REFERENCES events(id),captain_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,code TEXT NOT NULL UNIQUE,entry_id TEXT REFERENCES entries(id),frozen BOOLEAN NOT NULL DEFAULT false);
CREATE TABLE team_members(team_id TEXT NOT NULL REFERENCES teams(id),user_id TEXT NOT NULL REFERENCES users(id),event_id TEXT NOT NULL REFERENCES events(id),PRIMARY KEY(team_id,user_id),UNIQUE(event_id,user_id));
CREATE TABLE lineups(match_id TEXT NOT NULL REFERENCES matches(id),entry_id TEXT NOT NULL REFERENCES entries(id),slot_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(match_id,entry_id,slot_id,user_id));
CREATE TABLE evidence_files(id TEXT PRIMARY KEY,event_id TEXT NOT NULL REFERENCES events(id),user_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,mime TEXT NOT NULL,size INT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now());
ALTER TABLE attempts ADD COLUMN generation INT NOT NULL DEFAULT 0;
ALTER TABLE attempts ADD COLUMN evidence_id TEXT REFERENCES evidence_files(id);
ALTER TABLE attempt_items ADD COLUMN member_id TEXT REFERENCES users(id);
ALTER TABLE attempts DROP CONSTRAINT attempts_status_check;
ALTER TABLE attempts ADD CONSTRAINT attempts_status_check CHECK(status IN ('pending','approved','rejected','superseded'));
CREATE TABLE match_history(id BIGSERIAL PRIMARY KEY,match_id TEXT NOT NULL REFERENCES matches(id),generation INT NOT NULL,snapshot JSONB NOT NULL,reason TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE attempt_member_scores(attempt_id TEXT NOT NULL REFERENCES attempts(id),slot_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),score NUMERIC NOT NULL,PRIMARY KEY(attempt_id,slot_id,user_id));
CREATE TABLE qualification_orders(event_id TEXT PRIMARY KEY REFERENCES events(id),snapshot JSONB NOT NULL,entry_order JSONB NOT NULL,reason TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id));
CREATE TABLE qualifier_snapshots(event_id TEXT PRIMARY KEY REFERENCES events(id),rows JSONB NOT NULL);
CREATE TABLE draft_history(event_id TEXT NOT NULL REFERENCES events(id),version INT NOT NULL,config JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(event_id,version));
-- Preserve the graph of existing v0.2 single-elimination schedules and their actual match IDs.
UPDATE matches m SET stage_id=coalesce((e.rules->'stages'->-1->>'id'),'main'),node_key='W'||m.round||'-'||m.ordinal,
 source_a=CASE WHEN m.round=1 THEN coalesce('entry:'||m.a_id,'empty') ELSE 'winner:W'||(m.round-1)||'-'||(m.ordinal*2) END,
 source_b=CASE WHEN m.round=1 THEN coalesce('entry:'||m.b_id,'empty') ELSE 'winner:W'||(m.round-1)||'-'||(m.ordinal*2+1) END
 FROM events e WHERE e.id=m.event_id AND m.node_key IS NULL;
INSERT INTO competition_stages(event_id,stage_id,ordinal,kind,status,participants)
 SELECT e.id,m.stage_id,greatest(jsonb_array_length(e.rules->'stages')-1,0),'single',CASE WHEN e.status='running' THEN 'running' ELSE 'completed' END,
 coalesce((SELECT jsonb_agg(en.id ORDER BY en.seed NULLS LAST,en.created_at) FROM entries en WHERE en.event_id=e.id AND EXISTS(SELECT 1 FROM matches x WHERE x.event_id=e.id AND (x.a_id=en.id OR x.b_id=en.id))),'[]'::jsonb)
 FROM events e JOIN (SELECT DISTINCT event_id,stage_id FROM matches) m ON m.event_id=e.id WHERE true ON CONFLICT DO NOTHING;
INSERT INTO schema_migrations(version) VALUES(3);
