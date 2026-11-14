package services.events.tables.events

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

object EventsTable:
  private val insertServiceCreateSql = """insert into events(id,owner_id,name,tagline,description,rules) values (?,?,?,?,?,?::jsonb)"""
  def insertServiceCreate(connection: Connection, id: String, ownerId: String, name: String, tagline: String, description: String, rules: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String,String,String)](insertServiceCreateSql).run((id,ownerId,name,tagline,description,rules)))

  private val updateServiceUpdateSql = """update events set name=?,tagline=?,description=?,rules=?::jsonb,version=version+1,updated_at=now() where id=?"""
  def updateServiceUpdate(connection: Connection, name: String, tagline: String, description: String, rules: String, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String,String)](updateServiceUpdateSql).run((name,tagline,description,rules,id)))

  private val updateServicePublishSql = """update events set status='registration',version=version+1,updated_at=now() where id=?"""
  def updateServicePublish(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateServicePublishSql).run(id))

  private val updateServiceReopenSql = """update events set status='draft',version=version+1,updated_at=now() where id=?"""
  def updateServiceReopen(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateServiceReopenSql).run(id))

  private val updateServiceGenerateSql = """update events set status=?,version=version+1 where id=?"""
  def updateServiceGenerate(connection: Connection, status: String, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String)](updateServiceGenerateSql).run((status,id)))

  private val updateOperationsReplaytxSql = """update events set status='running',version=version+1 where id=?"""
  def updateOperationsReplaytx(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateOperationsReplaytxSql).run(id))

  private val updateCompetitionCompletetxSql = """update events set status='completed',version=version+1 where id=?"""
  def updateCompetitionCompletetx(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateCompetitionCompletetxSql).run(id))

  private val updateCompetitionResolvetxSql = """update events set status='completed',version=version+1 where id=?"""
  def updateCompetitionResolvetx(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateCompetitionResolvetxSql).run(id))

  private val updateInstanceLoaddemoSql = """update events set demo=true,version=version+1 where id=?"""
  def updateInstanceLoaddemo(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateInstanceLoaddemoSql).run(id))

  private val updateTransportSql = """update events set status='archived',version=version+1 where id=?"""
  def updateTransport(connection: Connection, id: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[String](updateTransportSql).run(id))

  private val findRepositoryFindeventSql = """select e.id,e.owner_id,e.name,e.tagline,e.description,e.status,e.rules::text,e.version,e.demo,(select count(*) from pool_entries p where p.event_id=e.id),(select count(*) from entries n where n.event_id=e.id and n.status='accepted'),coalesce((select max(r.version) from rule_revisions r where r.event_id=e.id),e.version) from events e where e.id=? and exists(select 1 from instance_settings i where i.id=1 and i.event_id=e.id)"""
  def findRepositoryFindevent(connection: Connection, id: String): IO[Option[EventView]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String,String,String,EventStatus,String,Int,Boolean,Long,Long,Int)](findRepositoryFindeventSql).option(id)).flatMap(_.traverse(readEventRow))

  private val findRepositoryFindeventlockedSql = """select e.id,e.owner_id,e.name,e.tagline,e.description,e.status,e.rules::text,e.version,e.demo,(select count(*) from pool_entries p where p.event_id=e.id),(select count(*) from entries n where n.event_id=e.id and n.status='accepted'),coalesce((select max(r.version) from rule_revisions r where r.event_id=e.id),e.version) from events e where e.id=? and exists(select 1 from instance_settings i where i.id=1 and i.event_id=e.id) for update of e"""
  def findRepositoryFindeventlocked(connection: Connection, id: String): IO[Option[EventView]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,(String,String,String,String,String,EventStatus,String,Int,Boolean,Long,Long,Int)](findRepositoryFindeventlockedSql).option(id)).flatMap(_.traverse(readEventRow))

  private def readEventRow(row: (String,String,String,String,String,EventStatus,String,Int,Boolean,Long,Long,Int)): IO[EventView] =
    val (id,owner,name,tagline,description,status,rules,version,demo,poolCount,entryCount,ruleVersion) = row
    IO.fromEither(io.circe.parser.decode[RuleSet](rules)).map(decoded => EventView(id,owner,name,tagline,description,status,decoded,version,demo,poolCount,entryCount,ruleVersion))
