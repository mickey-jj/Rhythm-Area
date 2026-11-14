package services.events.tables.draft_actions

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

object DraftActionsTable:
  private val findRepositoryActionsSql = """select step_id,actor,action,chart_key,slot_id from draft_actions where match_id=? order by sequence"""
  def findRepositoryActions(connection: Connection, matchId: String): IO[List[DraftAction]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,DraftAction](findRepositoryActionsSql).to[List](matchId))

  private val insertServiceDraftSql = """insert into draft_actions(match_id,sequence,step_id,actor,action,chart_key,slot_id,user_id,idempotency_key) values (?,?,?,?,?,?,?,?,?)"""
  def insertServiceDraft(connection: Connection, matchId: String, sequence: Int, stepId: String, actor: Actor, action: DraftActionKind, chartKey: String, slotId: String, userId: String, idempotencyKey: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,Int,String,Actor,DraftActionKind,String,String,String,String)](insertServiceDraftSql).run((matchId,sequence,stepId,actor,action,chartKey,slotId,userId,idempotencyKey)))

  private val findOperationsReplaytxSql = """select (select count(*) from draft_actions where match_id=?)+(select count(*) from attempts where match_id=?)"""
  def findOperationsReplaytx(connection: Connection, matchId: String, matchId2: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String),Long](findOperationsReplaytxSql).unique((matchId,matchId2)))

  private val deleteOperationsReplaytxSql = """delete from draft_actions where match_id=?"""
  def deleteOperationsReplaytx(connection: Connection, matchId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](deleteOperationsReplaytxSql).run(matchId))
