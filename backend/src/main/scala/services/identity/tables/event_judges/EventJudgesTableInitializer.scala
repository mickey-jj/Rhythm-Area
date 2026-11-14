package services.identity.tables.event_judges

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object EventJudgesTableInitializer:
  private val initializeV3Sql = """CREATE TABLE event_judges(event_id TEXT NOT NULL REFERENCES events(id),user_id TEXT NOT NULL REFERENCES users(id),match_id TEXT REFERENCES matches(id),PRIMARY KEY(event_id,user_id,match_id));"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

