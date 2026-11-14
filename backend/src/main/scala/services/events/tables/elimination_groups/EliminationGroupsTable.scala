package services.events.tables.elimination_groups
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import io.circe.syntax.*
import services.events.objects.apiTypes.EliminationGroup
import services.system.api.Database
import org.typelevel.doobie.implicits.*
object EliminationGroupsTable:
  private val findSql = "SELECT state_json::text FROM elimination_groups WHERE id=?"
  def find(connection: Connection, id: String): IO[Option[EliminationGroup]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](findSql).option(id)).flatMap(_.traverse(s=>IO.fromEither(io.circe.parser.decode[EliminationGroup](s))))
  private val listSql = "SELECT state_json::text FROM elimination_groups WHERE event_id=? ORDER BY stage_id,(state_json->>'round')::int,id"
  def list(connection: Connection, eventId: String): IO[List[EliminationGroup]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](listSql).to[List](eventId)).flatMap(_.traverse(s=>IO.fromEither(io.circe.parser.decode[EliminationGroup](s))))
  private val saveSql = "INSERT INTO elimination_groups(id,event_id,stage_id,state_json) VALUES(?,?,?,?::jsonb) ON CONFLICT(id) DO UPDATE SET state_json=excluded.state_json"
  def save(connection: Connection, group: EliminationGroup): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](saveSql).run((group.id,group.eventId,group.stageId,group.asJson.noSpaces)))
  private val archiveSql = """UPDATE elimination_groups SET state_json=state_json || jsonb_build_object('scheduleState','historical','status',CASE WHEN state_json->>'status'='completed' THEN 'completed' ELSE 'cancelled' END,'version',(state_json->>'version')::int+1) WHERE event_id=? AND state_json->>'scheduleState'='current'"""
  def archive(connection: Connection, eventId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](archiveSql).run(eventId))
