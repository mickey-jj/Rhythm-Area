package services.events.tables.reviews

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object ReviewsTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS reviews (
 id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(id), reviewer_id TEXT NOT NULL REFERENCES users(id),
 decision TEXT NOT NULL CHECK(decision IN ('approved','rejected')), reason TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

