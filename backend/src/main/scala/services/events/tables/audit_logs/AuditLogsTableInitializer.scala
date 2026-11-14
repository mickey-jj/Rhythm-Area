package services.events.tables.audit_logs

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object AuditLogsTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS audit_logs (
 id BIGSERIAL PRIMARY KEY, event_id TEXT REFERENCES events(id), user_id TEXT REFERENCES users(id),
 action TEXT NOT NULL, detail TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

