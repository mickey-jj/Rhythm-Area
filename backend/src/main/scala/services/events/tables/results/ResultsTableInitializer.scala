package services.events.tables.results

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object ResultsTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS results (
 id TEXT PRIMARY KEY, match_id TEXT NOT NULL REFERENCES matches(id), version INT NOT NULL,
 winner_id TEXT NOT NULL REFERENCES entries(id), explanation JSONB NOT NULL,
 confirmed_by TEXT NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(match_id,version)
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

