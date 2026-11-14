package services.events.tables.qualifier_snapshots

import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database

object QualifierSnapshotsTableInitializer:
  private val initializeV3Sql = """CREATE TABLE qualifier_snapshots(event_id TEXT PRIMARY KEY REFERENCES events(id),rows JSONB NOT NULL);"""
  def initializeV3(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV3Sql).run(())).void

