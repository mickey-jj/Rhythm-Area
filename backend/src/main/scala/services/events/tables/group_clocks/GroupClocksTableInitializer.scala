package services.events.tables.group_clocks
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database
object GroupClocksTableInitializer:
  private val initializeV11Sql="CREATE TABLE group_clocks(match_id TEXT PRIMARY KEY REFERENCES elimination_groups(id),state_json JSONB NOT NULL)"
  def initializeV11(c: Connection): IO[Unit] = Database.run(c)(org.typelevel.doobie.Update[Unit](initializeV11Sql).run(())).void
