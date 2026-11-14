package services.events.tables.elimination_groups
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database
object EliminationGroupsTableInitializer:
  private val initializeV8Sql = """CREATE TABLE elimination_groups(id TEXT PRIMARY KEY,event_id TEXT NOT NULL REFERENCES events(id),stage_id TEXT NOT NULL,state_json JSONB NOT NULL);CREATE INDEX elimination_groups_event_idx ON elimination_groups(event_id);"""
  def initializeV8(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV8Sql).run(())).void
