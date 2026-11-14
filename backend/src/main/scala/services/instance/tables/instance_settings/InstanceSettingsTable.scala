package services.instance.tables.instance_settings

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

object InstanceSettingsTable:
  private val findServiceCreateSql = """select owner_id,event_id from instance_settings where id=1 for update"""
  def findServiceCreate(connection: Connection): IO[(Option[String],Option[String])] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,(Option[String],Option[String])](findServiceCreateSql).unique(()))

  private val updateServiceCreateSql = """update instance_settings set event_id=?,appearance=?::jsonb where id=1"""
  def updateServiceCreate(connection: Connection, eventId: String, appearance: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateServiceCreateSql).run((eventId,appearance)))

  private val findServiceUpdateSql = """select id from instance_settings where id=1 for update"""
  def findServiceUpdate(connection: Connection): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,Int](findServiceUpdateSql).unique(()))

  private val updateServiceUpdateSql = """update instance_settings set appearance=?::jsonb where id=1"""
  def updateServiceUpdate(connection: Connection, appearance: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateServiceUpdateSql).run(appearance))

  private val findInstanceViewSql = """select owner_id,event_id,appearance::text,demo_loaded from instance_settings where id=1"""
  def findInstanceView(connection: Connection): IO[(Option[String],Option[String],String,Boolean)] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,(Option[String],Option[String],String,Boolean)](findInstanceViewSql).unique(()))

  private val findInstanceSetupSql = """select owner_id from instance_settings where id=1 for update"""
  def findInstanceSetup(connection: Connection): IO[Option[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,Option[String]](findInstanceSetupSql).unique(()))

  private val updateInstanceSetupSql = """update instance_settings set owner_id=? where id=1"""
  def updateInstanceSetup(connection: Connection, ownerId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateInstanceSetupSql).run(ownerId))

  private val findInstanceRequireownerSql = """select owner_id from instance_settings where id=1"""
  def findInstanceRequireowner(connection: Connection): IO[Option[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,Option[String]](findInstanceRequireownerSql).unique(()))

  private val findInstanceLoaddemoSql = """select owner_id,event_id,demo_loaded from instance_settings where id=1 for update"""
  def findInstanceLoaddemo(connection: Connection): IO[(Option[String],Option[String],Boolean)] =
    Database.run(connection)(org.typelevel.doobie.Query[Unit,(Option[String],Option[String],Boolean)](findInstanceLoaddemoSql).unique(()))

  private val updateInstanceLoaddemoSql = """update instance_settings set demo_loaded=true where id=1"""
  def updateInstanceLoaddemo(connection: Connection): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[Unit](updateInstanceLoaddemoSql).run(()))
