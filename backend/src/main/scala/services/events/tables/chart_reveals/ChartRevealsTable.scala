package services.events.tables.chart_reveals

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

object ChartRevealsTable:
  private val findRepositoryRevealedchartsSql = """select chart_key from chart_reveals where event_id=?"""
  def findRepositoryRevealedcharts(connection: Connection, eventId: String): IO[List[String]] =
    Database.run(connection)(org.typelevel.doobie.Query[String,String](findRepositoryRevealedchartsSql).to[List](eventId))

  private val insertServiceRevealSql = """insert into chart_reveals(event_id,chart_key,match_id,revealed_by) values(?,?,?,?) on conflict do nothing"""
  def insertServiceReveal(connection: Connection, eventId: String, chartKey: String, matchId: String, revealedBy: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertServiceRevealSql).run((eventId,chartKey,matchId,revealedBy)))
