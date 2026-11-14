package services.events.tables.attempts

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object AttemptsTableInitializer:
  private val initializeV8Sql = """ALTER TABLE attempts ADD COLUMN group_id TEXT REFERENCES elimination_groups(id);ALTER TABLE attempts ADD CONSTRAINT attempt_one_context CHECK(match_id IS NULL OR group_id IS NULL);CREATE INDEX attempts_group_idx ON attempts(group_id);"""
  def initializeV8(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV8Sql).run(())).void
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS attempts (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), match_id TEXT REFERENCES matches(id),
 entry_id TEXT NOT NULL REFERENCES entries(id), submitted_by TEXT NOT NULL REFERENCES users(id),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 sequence BIGSERIAL NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), evidence_note TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS attempts_event_idx ON attempts(event_id,entry_id);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

  private val initializeV3Sql = """ALTER TABLE attempts ADD COLUMN generation INT NOT NULL DEFAULT 0;
ALTER TABLE attempts ADD COLUMN evidence_id TEXT REFERENCES evidence_files(id);
ALTER TABLE attempts DROP CONSTRAINT attempts_status_check;
ALTER TABLE attempts ADD CONSTRAINT attempts_status_check CHECK(status IN ('pending','approved','rejected','superseded'));"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

