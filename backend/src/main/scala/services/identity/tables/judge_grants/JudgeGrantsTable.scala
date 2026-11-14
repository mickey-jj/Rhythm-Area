package services.identity.tables.judge_grants

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

object JudgeGrantsTable:
  private val findRepositoryIsjudgeSql = """select exists(select 1 from judge_grants where event_id=? and user_id=?) or exists(select 1 from event_judges where event_id=? and user_id=? and match_id=?)"""
  def findRepositoryIsjudge(connection: Connection, eventId: String, userId: String, eventId2: String, userId2: String, matchId: String): IO[Boolean] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String,String,String,String),Boolean](findRepositoryIsjudgeSql).unique((eventId,userId,eventId2,userId2,matchId)))


  private val deleteOperationsGrantSql = """delete from judge_grants where event_id=? and user_id=?"""
  def deleteOperationsGrant(connection: Connection, eventId: String, userId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](deleteOperationsGrantSql).run((eventId,userId)))

  private val insertOperationsGrantSql = """insert into judge_grants(event_id,user_id) values(?,?) on conflict do nothing"""
  def insertOperationsGrant(connection: Connection, eventId: String, userId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](insertOperationsGrantSql).run((eventId,userId)))

  private val findInstanceViewSql = """select exists(select 1 from judge_grants where event_id=? and user_id=?) or exists(select 1 from event_judges where event_id=? and user_id=?)"""
  def findInstanceView(connection: Connection, eventId: String, userId: String, eventId2: String, userId2: String): IO[Boolean] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String,String,String),Boolean](findInstanceViewSql).unique((eventId,userId,eventId2,userId2)))
