package services.events.tables.play_slots

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object PlaySlotsTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS play_slots (
 match_id TEXT NOT NULL REFERENCES matches(id), id TEXT NOT NULL, chart_key TEXT NOT NULL,
 ordinal INT NOT NULL, extra_round INT NOT NULL DEFAULT 0, PRIMARY KEY(match_id,id)
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

