package services.events.tables.qualification_orders

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object QualificationOrdersTableInitializer:
  private val initializeV3Sql = """CREATE TABLE qualification_orders(event_id TEXT PRIMARY KEY REFERENCES events(id),snapshot JSONB NOT NULL,entry_order JSONB NOT NULL,reason TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id));"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

