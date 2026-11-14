package services.identity.tables.judge_grants

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object JudgeGrantsTableInitializer:
  private val initializeV3Sql = """CREATE TABLE judge_grants(event_id TEXT NOT NULL REFERENCES events(id),user_id TEXT NOT NULL REFERENCES users(id),PRIMARY KEY(event_id,user_id));"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

