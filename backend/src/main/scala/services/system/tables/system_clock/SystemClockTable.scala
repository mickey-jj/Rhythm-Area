package services.system.tables.system_clock

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

object SystemClockTable:
  private val millisecondsSql = "SELECT floor(extract(epoch from clock_timestamp())*1000)::bigint"
  def milliseconds(connection: Connection): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,Long](millisecondsSql).unique(()))
  private val findServiceWithinwindowSql = """select extract(epoch from now())::bigint"""
  def findServiceWithinwindow(connection: Connection): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,Long](findServiceWithinwindowSql).unique(()))
