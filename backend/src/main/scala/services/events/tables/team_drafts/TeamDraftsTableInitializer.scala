package services.events.tables.team_drafts
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database
object TeamDraftsTableInitializer:
  private val initializeV7Sql = """CREATE TABLE team_drafts(event_id TEXT PRIMARY KEY REFERENCES events(id),state_json JSONB NOT NULL);"""
  def initializeV7(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV7Sql).run(())).void
