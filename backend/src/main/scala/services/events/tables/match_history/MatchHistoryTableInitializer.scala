package services.events.tables.match_history

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object MatchHistoryTableInitializer:
  private val initializeV3Sql = """CREATE TABLE match_history(id BIGSERIAL PRIMARY KEY,match_id TEXT NOT NULL REFERENCES matches(id),generation INT NOT NULL,snapshot JSONB NOT NULL,reason TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES users(id),created_at TIMESTAMPTZ NOT NULL DEFAULT now());"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

