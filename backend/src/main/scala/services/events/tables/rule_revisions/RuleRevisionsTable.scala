package services.events.tables.rule_revisions

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

object RuleRevisionsTable:
  private val insertServicePublishSql = """insert into rule_revisions(event_id,version,rules,charts) values (?,?,?::jsonb,?::jsonb)"""
  def insertServicePublish(connection: Connection, eventId: String, version: Int, rules: String, charts: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,Int,String,String)](insertServicePublishSql).run((eventId,version,rules,charts)))
