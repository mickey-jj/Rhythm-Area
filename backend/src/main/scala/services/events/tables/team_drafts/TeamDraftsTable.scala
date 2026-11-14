package services.events.tables.team_drafts
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import io.circe.syntax.*
import services.events.objects.apiTypes.TeamDraftView
import services.system.api.Database
import org.typelevel.doobie.implicits.*
object TeamDraftsTable:
  private val findSql = "SELECT state_json::text FROM team_drafts WHERE event_id=?"
  def find(connection: Connection, eventId: String): IO[Option[TeamDraftView]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](findSql).option(eventId)).flatMap(_.traverse(s=>IO.fromEither(io.circe.parser.decode[TeamDraftView](s))))
  private val saveSql = "INSERT INTO team_drafts(event_id,state_json) VALUES(?,?::jsonb) ON CONFLICT(event_id) DO UPDATE SET state_json=excluded.state_json"
  def save(connection: Connection, eventId: String, draft: TeamDraftView): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](saveSql).run((eventId,draft.asJson.noSpaces)))
