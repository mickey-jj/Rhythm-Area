package services.events.tables.events

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object EventsTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS events (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, tagline TEXT NOT NULL,
 description TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','registration','running','completed','archived')),
 rules JSONB NOT NULL, version INT NOT NULL DEFAULT 1, demo BOOLEAN NOT NULL DEFAULT false,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_owner_idx ON events(owner_id);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

