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

final case class PostMatchesByIdRevealMessage(idKey: MatchId, user: User, input: VersionInput) extends APIMessage[MatchView]:
  def plan(connection: Connection): IO[MatchView] =
    val expected = input.expectedVersion
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        m <- GetMatchesByIdMessage(id,Some(user.id),true,privateData=true).plan(connection)
        e <- ReadEventMessage(m.eventId).plan(connection)
        _ <- RequireJudgeMessage(e,user.id,Some(id)).plan(connection)
        _ <- requireVersion(m.version,expected)
        _ <- check(m.status=="awaiting-reveal",409,"INVALID_STATE","本场没有待揭晓的隐藏曲")
        charts <- ReadPoolMessage(e.id).plan(connection)
        chosen = charts.filter(c=>Engine.roles(c).contains("mystery") && m.slots.exists(_.chartKey==c.chart_key))
        _ <- chosen.traverse_(c=>services.events.tables.chart_reveals.ChartRevealsTable.insertServiceReveal(connection, e.id, c.chart_key, id, user.id))
        _ <- services.events.tables.matches.MatchesTable.updateServiceReveal(connection, id)
        _ <- ReadAuditMessage(e.id,user.id,"match.reveal",s"$id · 公开 ${chosen.size} 张隐藏谱面；公开后重赛不恢复保密").plan(connection)
        result <- GetMatchesByIdMessage(id,Some(user.id)).plan(connection)
      yield result)
