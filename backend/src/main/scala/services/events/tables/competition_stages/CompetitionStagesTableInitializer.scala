package services.events.tables.competition_stages

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object CompetitionStagesTableInitializer:
  private val initializeV3Sql = """CREATE TABLE competition_stages (
 event_id TEXT NOT NULL REFERENCES events(id), stage_id TEXT NOT NULL, ordinal INT NOT NULL,
 kind TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'running', participants JSONB NOT NULL,
 placements JSONB NOT NULL DEFAULT '[]', reason TEXT NOT NULL DEFAULT '', PRIMARY KEY(event_id,stage_id)
);
INSERT INTO competition_stages(event_id,stage_id,ordinal,kind,status,participants)
 SELECT e.id,m.stage_id,greatest(jsonb_array_length(e.rules->'stages')-1,0),'single',CASE WHEN e.status='running' THEN 'running' ELSE 'completed' END,
 coalesce((SELECT jsonb_agg(en.id ORDER BY en.seed NULLS LAST,en.created_at) FROM entries en WHERE en.event_id=e.id AND EXISTS(SELECT 1 FROM matches x WHERE x.event_id=e.id AND (x.a_id=en.id OR x.b_id=en.id))),'[]'::jsonb)
 FROM events e JOIN (SELECT DISTINCT event_id,stage_id FROM matches) m ON m.event_id=e.id WHERE true ON CONFLICT DO NOTHING;"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void


  private val initializeV6Sql = "ALTER TABLE competition_stages ADD COLUMN initial_losses JSONB NOT NULL DEFAULT '{}';"
  def initializeV6(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV6Sql).run(())).void
