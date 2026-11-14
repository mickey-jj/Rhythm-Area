package services.events.tables.matches

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object MatchesTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS matches (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), round INT NOT NULL, ordinal INT NOT NULL,
 a_id TEXT REFERENCES entries(id), b_id TEXT REFERENCES entries(id), winner_id TEXT REFERENCES entries(id),
 status TEXT NOT NULL DEFAULT 'waiting', version INT NOT NULL DEFAULT 1, rules JSONB NOT NULL,
 next_match TEXT REFERENCES matches(id), next_side TEXT, extra_round INT NOT NULL DEFAULT 0,
 UNIQUE(event_id,round,ordinal)
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

  private val initializeV3Sql = """ALTER TABLE matches DROP CONSTRAINT matches_event_id_round_ordinal_key;
ALTER TABLE matches ADD COLUMN stage_id TEXT NOT NULL DEFAULT 'main';
ALTER TABLE matches ADD COLUMN bracket TEXT NOT NULL DEFAULT 'winners';
ALTER TABLE matches ADD COLUMN node_key TEXT;
ALTER TABLE matches ADD COLUMN source_a TEXT;
ALTER TABLE matches ADD COLUMN source_b TEXT;
ALTER TABLE matches ADD COLUMN generation INT NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX matches_node_idx ON matches(event_id,stage_id,node_key);
UPDATE matches m SET stage_id=coalesce((e.rules->'stages'->-1->>'id'),'main'),node_key='W'||m.round||'-'||m.ordinal,
 source_a=CASE WHEN m.round=1 THEN coalesce('entry:'||m.a_id,'empty') ELSE 'winner:W'||(m.round-1)||'-'||(m.ordinal*2) END,
 source_b=CASE WHEN m.round=1 THEN coalesce('entry:'||m.b_id,'empty') ELSE 'winner:W'||(m.round-1)||'-'||(m.ordinal*2+1) END
 FROM events e WHERE e.id=m.event_id AND m.node_key IS NULL;"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void


  private val initializeV6Sql = """ALTER TABLE matches ADD COLUMN schedule_state TEXT NOT NULL DEFAULT 'current' CHECK(schedule_state IN ('current','historical'));
ALTER TABLE matches ADD COLUMN charts_snapshot JSONB;"""
  def initializeV6(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV6Sql).run(())).void
