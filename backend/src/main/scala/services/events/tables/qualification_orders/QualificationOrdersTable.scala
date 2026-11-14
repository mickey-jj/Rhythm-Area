package services.events.tables.qualification_orders

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

object QualificationOrdersTable:
  private val findServiceGenerateSql = """select snapshot::text,entry_order::text from qualification_orders where event_id=?"""
  def findServiceGenerate(connection: Connection, eventId: String): IO[Option[(String,String)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String)](findServiceGenerateSql).option(eventId))

  private val insertServiceResolvequalifierSql = """insert into qualification_orders(event_id,snapshot,entry_order,reason,user_id) values(?,?::jsonb,?::jsonb,?,?) on conflict(event_id) do update set snapshot=excluded.snapshot,entry_order=excluded.entry_order,reason=excluded.reason,user_id=excluded.user_id"""
  def insertServiceResolvequalifier(connection: Connection, eventId: String, snapshot: String, entryOrder: String, reason: String, userId: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String,String)](insertServiceResolvequalifierSql).run((eventId,snapshot,entryOrder,reason,userId)))
