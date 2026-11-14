package services.events.tables.draft_history

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

object DraftHistoryTable:
  private val insertServiceCreateSql = """insert into draft_history(event_id,version,config) values(?,1,?::jsonb)"""
  def insertServiceCreate(connection: Connection, eventId: String, config: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](insertServiceCreateSql).run((eventId,config)))

  private val insertServiceUpdateSql = """insert into draft_history(event_id,version,config) values(?,?,?::jsonb)"""
  def insertServiceUpdate(connection: Connection, eventId: String, version: Int, config: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,Int,String)](insertServiceUpdateSql).run((eventId,version,config)))

  private val findTransportSql = """select version,created_at::text from draft_history where event_id=? order by version desc limit 30"""
  def findTransport(connection: Connection, eventId: String): IO[List[(Int,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(Int,String)](findTransportSql).to[List](eventId))

  private val findTransport2Sql = """select config::text from draft_history where event_id=? and version=?"""
  def findTransport2(connection: Connection, eventId: String, version: Int): IO[Option[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,Int),String](findTransport2Sql).option((eventId,version)))
