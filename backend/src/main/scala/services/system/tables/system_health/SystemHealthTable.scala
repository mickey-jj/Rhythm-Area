package services.system.tables.system_health

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

object SystemHealthTable:
  private val findServiceDraftSql = """select gen_random_uuid()::text"""
  def findServiceDraft(connection: Connection): IO[String] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,String](findServiceDraftSql).unique(()))

  private val findServiceFinalizematchSql = """select gen_random_uuid()::text"""
  def findServiceFinalizematch(connection: Connection): IO[String] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,String](findServiceFinalizematchSql).unique(()))

  private val findTransportSql = """select 1"""
  def findTransport(connection: Connection): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,Int](findTransportSql).unique(()))
