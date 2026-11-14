package services.events.tables.team_members

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object TeamMembersTableInitializer:
  private val initializeV3Sql = """CREATE TABLE team_members(team_id TEXT NOT NULL REFERENCES teams(id),user_id TEXT NOT NULL REFERENCES users(id),event_id TEXT NOT NULL REFERENCES events(id),PRIMARY KEY(team_id,user_id),UNIQUE(event_id,user_id));"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

