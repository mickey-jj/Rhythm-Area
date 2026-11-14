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

final case class PostMatchesByIdDraftActionsMessage(idKey: MatchId, user: User, input: DraftInput) extends APIMessage[MatchView]:
  def plan(connection: Connection): IO[MatchView] =
    val in = input
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        m <- GetMatchesByIdMessage(id,Some(user.id),true,privateData=true).plan(connection)
        e <- ReadEventMessage(m.eventId).plan(connection)
        _ <- requireVersion(m.version,in.expectedVersion)
        _ <- new MatchClockSupport(connection).requireActive(m)
        _ <- check(m.status == "drafting",409,"INVALID_STATE","本场尚未开始选禁或已完成选禁")
        _ <- check(in.idempotencyKey.nonEmpty && in.idempotencyKey.length < 100,400,"INVALID_KEY","请求键无效")
        actualActions <- ReadActionsMessage(id).plan(connection)
        step <- Engine.currentStep(m.rules,DraftState(actualActions)).liftTo[IO](AppError(409,ApiError("DRAFT_COMPLETE","选禁已完成")))
        participant = if step.actor == "A" then m.a else if step.actor == "B" then m.b else None
        privileged <- IsJudgeMessage(e,user.id,Some(id)).plan(connection)
        _ <- check(privileged || participant.exists(_.userId == user.id),403,"WRONG_ACTOR","尚未轮到你；裁判动作由主办方执行")
        charts <- ReadPoolMessage(m.eventId).plan(connection)
        // Randomness is supplied by the DB effect boundary, persisted once, never recomputed on GET.
        randomKey <- services.system.tables.system_health.SystemHealthTable.findServiceDraft(connection)
        candidate = if step.action == "random" then Engine.eligibleCharts(m.rules,charts,DraftState(actualActions)).sortBy(c => services.system.objects.TokenDigest(randomKey+c.chart_key)).headOption.map(_.chart_key) else in.chartKey
        key <- candidate.liftTo[IO](AppError(400,ApiError("NO_CANDIDATES","请选曲；无合法候选时暂停待处理")))
        state <- Engine.applyDraftAction(m.rules,charts,DraftState(actualActions),step.actor,key).leftMap(i => AppError(400,ApiError("INVALID_ACTION",i.message,Some(i.fieldPath)))).liftTo[IO]
        action = state.actions.last
        _ <- services.events.tables.draft_actions.DraftActionsTable.insertServiceDraft(connection, id, state.actions.size, action.stepId, action.actor, action.action, action.chartKey, action.slotId, user.id, in.idempotencyKey)
        done = Engine.currentStep(m.rules,state).isEmpty
        disclosed <- ReadRevealedChartsMessage(m.eventId).plan(connection)
        hiddenKeys = charts.filter(c=>Engine.roles(c).contains("mystery") && !disclosed(c.chart_key)).map(_.chart_key).toSet
        pendingReveal = done && Engine.buildPlayOrder(m.rules,state).exists(pair=>hiddenKeys(pair._2))
        _ <- if done then Engine.buildPlayOrder(m.rules,state).zipWithIndex.traverse_ { (pair,i) =>
          services.events.tables.play_slots.PlaySlotsTable.insertServiceDraft(connection, id, pair._1.id, pair._2, i+1)
        } else ().pure[IO]
        _ <- services.events.tables.matches.MatchesTable.updateServiceDraft(connection, if pendingReveal then "awaiting-reveal" else if done then "playing" else "drafting", id)
        _ <- ReadAuditMessage(m.eventId,user.id,"match.draft",s"$id · ${action.actor} ${action.action} $key${if e.ownerId == user.id then "（主办代操作）" else ""}").plan(connection)
        result <- GetMatchesByIdMessage(id,Some(user.id)).plan(connection)
      yield result)
