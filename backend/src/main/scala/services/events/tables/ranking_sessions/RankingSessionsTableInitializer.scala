package services.events.tables.ranking_sessions
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database
object RankingSessionsTableInitializer:
  private val initializeV9Sql = """CREATE TABLE ranking_sessions(event_id TEXT NOT NULL REFERENCES events(id),stage_id TEXT NOT NULL,state_json JSONB NOT NULL,PRIMARY KEY(event_id,stage_id));"""
  def initializeV9(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV9Sql).run(())).void
