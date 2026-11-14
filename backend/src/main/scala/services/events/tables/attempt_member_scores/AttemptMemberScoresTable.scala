package services.events.tables.attempt_member_scores

import cats.effect.{IO, Resource}
import cats.syntax.all.*
import java.sql.Connection
import java.nio.file.{Files, Path}
import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
import services.events.api.*
import services.instance.api.*
import services.identity.api.*
import services.system.api.*
import services.system.utils.*
import org.typelevel.doobie.implicits.*

object AttemptMemberScoresTable:
  private val findPublicMatchSql = """select s.slot_id,a.entry_id,s.user_id,u.display_name,s.score::text,a.sequence
    from attempt_member_scores s join attempts a on a.id=s.attempt_id join users u on u.id=s.user_id
    join matches m on m.id=a.match_id and m.generation=a.generation
    where a.match_id=? and a.status='approved' order by a.sequence desc,s.user_id"""
  def findPublicMatch(connection: Connection, matchId: String): IO[List[(String,String,String,String,String,Long)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String,String,String,Long)](findPublicMatchSql).to[List](matchId))
  private val findAttemptSql="SELECT slot_id,user_id,score::text FROM attempt_member_scores WHERE attempt_id=? ORDER BY slot_id,user_id"
  def findAttempt(c: Connection,id: String): IO[List[MemberScore]] = Database.run(c)(org.typelevel.doobie.Query[String,(String,String,String)](findAttemptSql).to[List](id)).map(_.map((s,u,v)=>MemberScore(s,u,v)))
  private val insertServiceSubmitSql = """insert into attempt_member_scores(attempt_id,slot_id,user_id,score) values(?,?,?,?)"""
  def insertServiceSubmit(connection: Connection, attemptId: String, slotId: String, userId: String, score: BigDecimal): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,BigDecimal)](insertServiceSubmitSql).run((attemptId,slotId,userId,score)))
