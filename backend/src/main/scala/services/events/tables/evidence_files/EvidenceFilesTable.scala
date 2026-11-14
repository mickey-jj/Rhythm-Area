package services.events.tables.evidence_files

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

object EvidenceFilesTable:
  private val findServiceSubmitSql = """select count(*) from evidence_files where id=? and event_id=? and user_id=?"""
  def findServiceSubmit(connection: Connection, id: String, eventId: String, userId: String): IO[Long] =
    Database.run(connection)(org.typelevel.doobie.Query[(String,String,String),Long](findServiceSubmitSql).unique((id,eventId,userId)))

  private val insertEvidenceUploadSql = """insert into evidence_files(id,event_id,user_id,name,mime,size) values(?,?,?,?,?,?)"""
  def insertEvidenceUpload(connection: Connection, id: String, eventId: String, userId: String, name: String, mime: String, size: Int): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String,String,Int)](insertEvidenceUploadSql).run((id,eventId,userId,name,mime,size)))

  private val findEvidenceReadSql = """select event_id,user_id,name,mime,size from evidence_files where id=?"""
  def findEvidenceRead(connection: Connection, id: String): IO[Option[(String,String,String,String,Int)]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String,String,Int)](findEvidenceReadSql).option(id))
