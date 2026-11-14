package services.events.tables.rule_revisions

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object RuleRevisionsTableInitializer:
  private val initializeV1Sql = """CREATE TABLE IF NOT EXISTS rule_revisions (
 event_id TEXT NOT NULL REFERENCES events(id), version INT NOT NULL, rules JSONB NOT NULL, charts JSONB NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(event_id,version)
);"""
  def initializeV1(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV1Sql).run(())).void

