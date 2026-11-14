package services.events.tables.match_clocks
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.MatchClock
import services.system.api.Database
import io.circe.syntax.*
object MatchClocksTable:
  private val findSql="SELECT state_json::text FROM match_clocks WHERE match_id=?"
  def find(c: Connection,id: String): IO[Option[MatchClock]] =
    Database.run(c)(org.typelevel.doobie.Query[String,String](findSql).option(id)).flatMap(_.traverse(s=>IO.fromEither(io.circe.parser.decode[MatchClock](s))))
  private val saveSql="INSERT INTO match_clocks(match_id,state_json) VALUES(?,?::jsonb) ON CONFLICT(match_id) DO UPDATE SET state_json=excluded.state_json"
  def save(c: Connection,s: MatchClock): IO[Int] =
    Database.run(c)(org.typelevel.doobie.Update[(String,String)](saveSql).run((s.matchId,s.asJson.noSpaces)))
