package services.events.tables.attempt_items

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object AttemptItemsTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS attempt_items (
 attempt_id TEXT NOT NULL REFERENCES attempts(id), slot_id TEXT NOT NULL, score NUMERIC NOT NULL,
 ordinal INT NOT NULL, PRIMARY KEY(attempt_id,slot_id)
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

  private val initializeV3Sql = """ALTER TABLE attempt_items ADD COLUMN member_id TEXT REFERENCES users(id);"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

