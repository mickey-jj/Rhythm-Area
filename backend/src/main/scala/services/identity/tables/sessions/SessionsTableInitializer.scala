package services.identity.tables.sessions

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object SessionsTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL,
 expires_at TIMESTAMPTZ NOT NULL
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

