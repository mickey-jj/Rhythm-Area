package services.events.tables.audit_logs

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

object AuditLogsTable:
  private val insertRepositoryAuditSql = """insert into audit_logs(event_id,user_id,action,detail) values (?,?,?,?)"""
  def insertRepositoryAudit(connection: Connection, eventId: String, userId: String, action: String, detail: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertRepositoryAuditSql).run((eventId,userId,action,detail)))

  private val findTransportSql = """select id,action,detail,created_at::text from audit_logs where event_id=? order by id desc limit 100"""
  def findTransport(connection: Connection, eventId: String): IO[List[Audit]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,Audit](findTransportSql).to[List](eventId))
