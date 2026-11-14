package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.MatchClockSupport
import services.identity.api.IsJudgeMessage
import services.system.api.APIMessage
final case class GetMatchesByIdClockMessage(idKey: MatchId,viewer: Option[String]) extends APIMessage[MatchClockBoard]:
  def plan(connection: Connection): IO[MatchClockBoard] = for
    m <- GetMatchesByIdMessage(idKey,viewer,true).plan(connection)
    e <- ReadEventMessage(m.eventId).plan(connection)
    judge <- viewer.traverse(u=>IsJudgeMessage(e,u,Some(m.id)).plan(connection)).map(_.contains(true))
    b <- new MatchClockSupport(connection).board(m,judge && m.scheduleState==ScheduleState.Current)
  yield b
