package services.events.tables.draft_actions

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object DraftActionsTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS draft_actions (
 match_id TEXT NOT NULL REFERENCES matches(id), sequence INT NOT NULL, step_id TEXT NOT NULL,
 actor TEXT NOT NULL, action TEXT NOT NULL, chart_key TEXT NOT NULL, slot_id TEXT NOT NULL,
 user_id TEXT NOT NULL REFERENCES users(id), idempotency_key TEXT NOT NULL, PRIMARY KEY(match_id,sequence),
 UNIQUE(match_id,idempotency_key)
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

