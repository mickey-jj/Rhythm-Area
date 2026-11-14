package services.events.tables.ranking_sessions
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import io.circe.syntax.*
import services.events.objects.RankingSession
import services.system.api.Database
import org.typelevel.doobie.implicits.*
object RankingSessionsTable:
  private val findSql = "SELECT state_json::text FROM ranking_sessions WHERE event_id=? AND stage_id=?"
  def find(connection: Connection, eventId: String, stageId: String): IO[Option[RankingSession]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),String](findSql).option((eventId,stageId))).flatMap(_.traverse(s=>IO.fromEither(io.circe.parser.decode[RankingSession](s))))
  private val saveSql = "INSERT INTO ranking_sessions(event_id,stage_id,state_json) VALUES(?,?,?::jsonb) ON CONFLICT(event_id,stage_id) DO UPDATE SET state_json=excluded.state_json"
  def save(connection: Connection, session: RankingSession): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](saveSql).run((session.eventId,session.stageId,session.asJson.noSpaces)))
