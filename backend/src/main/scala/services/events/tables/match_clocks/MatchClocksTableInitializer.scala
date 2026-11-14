package services.events.tables.match_clocks
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.Database
object MatchClocksTableInitializer:
  private val initializeV10Sql="CREATE TABLE match_clocks(match_id TEXT PRIMARY KEY REFERENCES matches(id),state_json JSONB NOT NULL)"
  def initializeV10(c: Connection): IO[Unit] = Database.run(c)(org.typelevel.doobie.Update[Unit](initializeV10Sql).run(())).void
