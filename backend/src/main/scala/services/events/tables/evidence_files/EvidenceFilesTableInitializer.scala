package services.events.tables.evidence_files

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object EvidenceFilesTableInitializer:
  private val initializeV3Sql = """CREATE TABLE evidence_files(id TEXT PRIMARY KEY,event_id TEXT NOT NULL REFERENCES events(id),user_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,mime TEXT NOT NULL,size INT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now());"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

