package services.events.tables.attempt_member_scores

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object AttemptMemberScoresTableInitializer:
  private val initializeV3Sql = """CREATE TABLE attempt_member_scores(attempt_id TEXT NOT NULL REFERENCES attempts(id),slot_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),score NUMERIC NOT NULL,PRIMARY KEY(attempt_id,slot_id,user_id));"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

