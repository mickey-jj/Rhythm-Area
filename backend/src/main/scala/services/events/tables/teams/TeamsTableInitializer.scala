package services.events.tables.teams

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object TeamsTableInitializer:
  private val initializeV3Sql = """CREATE TABLE teams(id TEXT PRIMARY KEY,event_id TEXT NOT NULL REFERENCES events(id),captain_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,code TEXT NOT NULL UNIQUE,entry_id TEXT REFERENCES entries(id),frozen BOOLEAN NOT NULL DEFAULT false);"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

