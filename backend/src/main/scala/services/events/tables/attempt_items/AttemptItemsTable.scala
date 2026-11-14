package services.events.tables.attempt_items

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

object AttemptItemsTable:
  private val findRepositoryAttemptsSql = """select slot_id,score::text from attempt_items where attempt_id=? order by ordinal"""
  def findRepositoryAttempts(connection: Connection, attemptId: String): IO[List[ScoreItem]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,ScoreItem](findRepositoryAttemptsSql).to[List](attemptId))

  private val findRepositoryRankingattemptsSql = """select slot_id,score::text from attempt_items where attempt_id=? order by ordinal"""
  def findRepositoryRankingattempts(connection: Connection, attemptId: String): IO[List[ScoreItem]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,ScoreItem](findRepositoryRankingattemptsSql).to[List](attemptId))

  private val insertServiceSubmitSql = """insert into attempt_items(attempt_id,slot_id,score,ordinal) values (?,?,?,?)"""
  def insertServiceSubmit(connection: Connection, attemptId: String, slotId: String, score: BigDecimal, ordinal: Int): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,BigDecimal,Int)](insertServiceSubmitSql).run((attemptId,slotId,score,ordinal)))

  private val findTransportSql = """select ai.slot_id,a.entry_id,ai.score::text,a.sequence from attempt_items ai join attempts a on a.id=ai.attempt_id
          where a.match_id=? and a.status='approved' order by a.sequence desc"""
  def findTransport(connection: Connection, matchId: String): IO[List[(String,String,String,Long)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String,Long)](findTransportSql).to[List](matchId))
