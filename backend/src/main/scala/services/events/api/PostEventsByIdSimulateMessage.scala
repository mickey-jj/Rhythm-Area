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

final case class PostEventsByIdSimulateMessage(idKey: EventId, user: User) extends APIMessage[SimulationResult]:
  def plan(connection: Connection): IO[SimulationResult] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        u <- IO.pure(user); e <- ReadEventMessage(id).plan(connection); _ <- RequireEventOwnerMessage(e,u.id).plan(connection); charts <- ReadPoolMessage(id).plan(connection)
      yield
        val rules=e.rules.stages.find(_.kind!="ranking").map(_.effective(e.rules)).getOrElse(e.rules)
        val state = rules.draft.flatMap(s => List.fill(s.count)(s)).foldLeft[Either[Issue,DraftState]](Right(DraftState(Nil))) { (acc,step) =>
          acc.flatMap(st => Engine.eligibleCharts(rules,charts,st).headOption.toRight(Issue("draft","模拟中候选耗尽")).flatMap(c => Engine.applyDraftAction(rules,charts,st,step.actor,c.chart_key)))
        }
        SimulationResult(Engine.validate(e.rules,charts),state.map(_.actions).getOrElse(Nil),state.map(st=>Engine.buildPlayOrder(rules,st).map((slot,chart)=>SimulationSlot(slot.id,chart))).getOrElse(Nil),state.left.toOption)
      )
