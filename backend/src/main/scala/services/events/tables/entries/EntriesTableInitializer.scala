package services.events.tables.entries

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object EntriesTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS entries (
 id TEXT PRIMARY KEY, event_id TEXT NOT NULL REFERENCES events(id), user_id TEXT NOT NULL REFERENCES users(id),
 display_name TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','withdrawn')),
 seed INT, reason TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(event_id,user_id)
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

