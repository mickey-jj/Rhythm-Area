package services.events.tables.appeals

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object AppealsTableInitializer:
  private val initializeV3Sql = """CREATE TABLE appeals(id TEXT PRIMARY KEY,event_id TEXT NOT NULL REFERENCES events(id),match_id TEXT NOT NULL REFERENCES matches(id),user_id TEXT NOT NULL REFERENCES users(id),reason TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',decision TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT now());"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

