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

final case class GetEventsByIdPoolMessage(idKey: EventId, viewer: Option[User], query: Map[String,String]) extends APIMessage[List[Chart]]:
  def plan(connection: Connection): IO[List[Chart]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        e <- GetEventsByIdMessage(id,viewer.map(_.id)).plan(connection); s <- IO.pure(viewer)
        mid = query.get("matchId")
        context <- mid.traverse(m=>GetMatchesByIdMessage(m,s.map(_.id)).plan(connection))
        _ <- IO.raiseWhen(context.exists(_.eventId!=id))(AppError(400,ApiError("INVALID_MATCH","场次不属于当前赛事")))
        charts <- mid.fold(ReadPoolMessage(id).plan(connection))(m=>ReadMatchChartsMessage(m,id).plan(connection))
        privileged <- s.traverse(v=>IsJudgeMessage(e,v.id,mid).plan(connection)).map(_.contains(true))
        global <- s.traverse(v=>IsJudgeMessage(e,v.id).plan(connection)).map(_.contains(true))
        relevantPools = context.toList.flatMap(m=>m.rules.draft.map(_.pool) ++ Option.when(m.rules.resolution.tie=="extra")(m.rules.resolution.extraPool).toList).toSet
        selectedKeys = context.toList.flatMap(_.slots.map(_.chartKey)).toSet
        revealed <- ReadRevealedChartsMessage(id).plan(connection)
      yield charts.map(c => if global || (privileged && (selectedKeys(c.chart_key) || Engine.pools(c).exists(relevantPools))) || !Engine.roles(c).contains("mystery") || revealed(c.chart_key) then c else concealed(c,id)))
