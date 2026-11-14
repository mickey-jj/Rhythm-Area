package services.events.utils

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

private[events] final class ServiceSupport(connection: Connection):
  private val repo = new RepositorySupport(connection)
  import repo.*
  private[events] def withinWindow(e: EventView, phase: String): IO[Unit] = if phase=="qualifier" then new RankingSupport(connection).requireOpen(e) else for
    now <- services.system.tables.system_clock.SystemClockTable.findServiceWithinwindow(connection)
    w = e.rules.windows
    start = if phase=="registration" then w.flatMap(_.registrationOpen) else None
    end = if phase=="registration" then w.flatMap(_.registrationClose) else w.flatMap(_.qualifierClose)
    _ <- check(start.forall(s => TimeValue.epoch(s).exists(_ <= now)) && end.forall(s=>TimeValue.epoch(s).exists(_ > now)),409,"WINDOW_CLOSED","当前未开始或已超过提交截止时间")
  yield ()
  private[events] def rankingsTx(e: EventView): IO[List[RankingRow]] = for
    es <- ReadEntriesMessage(e.id).plan(connection).map(_.filter(_.status == "accepted"))
    as <- ReadRankingAttemptsMessage(e.id).plan(connection)
    slots <- ReadPoolMessage(e.id).plan(connection).map(_.filter(c => Engine.inPool(c,"qualifier")).map(_.chart_key))
    metric=if e.rules.entryMode=="team" && e.rules.team.aggregation=="sum" then e.rules.metric.copy(minimum=(Engine.decimal(e.rules.metric.minimum).get*e.rules.team.perChart).toString,maximum=(Engine.decimal(e.rules.metric.maximum).get*e.rules.team.perChart).toString) else e.rules.metric
    standings = es.map(en => (en,Engine.selectEffectiveAttempt(e.rules.copy(metric=metric),slots,as.filter(_.entryId == en.id))))
    sorted = standings.sortBy((_,s) => s.flatMap(_.total).flatMap(Engine.decimal).map(_ * (if e.rules.metric.higherWins then -1 else 1)).getOrElse(BigDecimal("1e100")))
    rows = sorted.zipWithIndex.map { (pair,index) =>
      val total = pair._2.flatMap(_.total)
      val rank = total.map(t => sorted.indexWhere(_._2.flatMap(_.total).flatMap(Engine.decimal) == Engine.decimal(t))+1)
      RankingRow(pair._1,total,pair._2.exists(_.complete),rank,pair._2.toList.flatMap(_.attemptIds))
    }
  yield rows
