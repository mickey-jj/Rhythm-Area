package services.events.tables.lineups

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object LineupsTableInitializer:
  private val initializeV3Sql = """CREATE TABLE lineups(match_id TEXT NOT NULL REFERENCES matches(id),entry_id TEXT NOT NULL REFERENCES entries(id),slot_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(match_id,entry_id,slot_id,user_id));"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

