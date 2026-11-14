package services.events.tables.team_candidates
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database
object TeamCandidatesTableInitializer:
  private val initializeV7Sql = """CREATE TABLE team_candidates(event_id TEXT NOT NULL REFERENCES events(id),user_id TEXT NOT NULL REFERENCES users(id),captain_status TEXT NOT NULL DEFAULT 'none' CHECK(captain_status IN('none','pending','approved','rejected')),note TEXT NOT NULL DEFAULT '',joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),PRIMARY KEY(event_id,user_id));"""
  def initializeV7(connection: Connection): IO[Unit] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](initializeV7Sql).run(())).void
