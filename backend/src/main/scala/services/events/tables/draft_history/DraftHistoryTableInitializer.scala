package services.events.tables.draft_history

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object DraftHistoryTableInitializer:
  private val initializeV3Sql = """CREATE TABLE draft_history(event_id TEXT NOT NULL REFERENCES events(id),version INT NOT NULL,config JSONB NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(event_id,version));"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

