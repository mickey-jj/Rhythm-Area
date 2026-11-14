package services.events.tables.pool_entries

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object PoolEntriesTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS pool_entries (
 event_id TEXT NOT NULL REFERENCES events(id), chart_key TEXT NOT NULL, song_key TEXT NOT NULL,
 game_key TEXT NOT NULL, metadata JSONB NOT NULL, ordinal INT NOT NULL,
 PRIMARY KEY(event_id,chart_key)
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

