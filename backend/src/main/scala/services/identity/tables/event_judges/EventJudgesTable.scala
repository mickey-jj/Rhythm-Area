package services.identity.tables.event_judges

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

object EventJudgesTable:
  private val deleteOperationsGrantSql = """delete from event_judges where event_id=? and user_id=? and match_id=?"""
  def deleteOperationsGrant(connection: Connection, eventId: String, userId: String, matchId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](deleteOperationsGrantSql).run((eventId,userId,matchId)))

  private val insertOperationsGrantSql = """insert into event_judges(event_id,user_id,match_id) values(?,?,?) on conflict do nothing"""
  def insertOperationsGrant(connection: Connection, eventId: String, userId: String, matchId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String)](insertOperationsGrantSql).run((eventId,userId,matchId)))
