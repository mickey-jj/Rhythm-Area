package services.events.tables.qualifier_snapshots

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

object QualifierSnapshotsTable:
  private val insertServiceGenerateSql = """insert into qualifier_snapshots(event_id,rows) values(?,?::jsonb)"""
  def insertServiceGenerate(connection: Connection, eventId: String, rows: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](insertServiceGenerateSql).run((eventId,rows)))

  private val findTransportSql = """select rows::text from qualifier_snapshots where event_id=?"""
  def findTransport(connection: Connection, eventId: String): IO[Option[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](findTransportSql).option(eventId))
