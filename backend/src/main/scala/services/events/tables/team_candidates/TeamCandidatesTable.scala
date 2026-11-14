package services.events.tables.team_candidates
import cats.effect.IO
import java.sql.Connection
import services.events.objects.*
import services.events.objects.given
import services.events.objects.apiTypes.TeamCandidate
import services.identity.objects.User
import services.system.api.Database
import org.typelevel.doobie.implicits.*
object TeamCandidatesTable:
  private val listSql = """SELECT u.id,u.username,u.display_name,c.captain_status,c.note,m.team_id FROM team_candidates c JOIN users u ON u.id=c.user_id LEFT JOIN team_members m ON m.event_id=c.event_id AND m.user_id=c.user_id WHERE c.event_id=? ORDER BY c.joined_at,u.id"""
  def list(connection: Connection, eventId: String): IO[List[TeamCandidate]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String,CaptainStatus,String,Option[String])](listSql).to[List](eventId)).map(_.map((id,username,name,status,note,teamId)=>TeamCandidate(User(id,username,name),status,note,teamId)))
  private val joinSql = """INSERT INTO team_candidates(event_id,user_id,note) VALUES(?,?,?) ON CONFLICT(event_id,user_id) DO UPDATE SET note=excluded.note"""
  def join(connection: Connection, eventId: String, userId: String, note: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](joinSql).run((eventId,userId,note)))
  private val ensureSql = """INSERT INTO team_candidates(event_id,user_id) VALUES(?,?) ON CONFLICT DO NOTHING"""
  def ensure(connection: Connection, eventId: String, userId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](ensureSql).run((eventId,userId)))
  private val decisionSql = """UPDATE team_candidates SET captain_status=? WHERE event_id=? AND user_id=?"""
  def decision(connection: Connection, eventId: String, userId: String, status: CaptainStatus): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(CaptainStatus,String,String)](decisionSql).run((status,eventId,userId)))
