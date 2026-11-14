package services.events.api

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
import services.events.utils.*

final case class ReadRevealedChartsMessage(eventKey: EventId) extends APIMessage[Set[String]]:
  def plan(connection: Connection): IO[Set[String]] =
    val eventId = eventKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    for
      charts <- services.events.tables.chart_reveals.ChartRevealsTable.findRepositoryRevealedcharts(connection,eventId)
      groups <- services.events.tables.elimination_groups.EliminationGroupsTable.list(connection,eventId)
    yield charts.toSet ++ groups.filter(g=>g.status=="playing" || g.status=="completed").flatMap(_.charts.map(_.chart_key))
