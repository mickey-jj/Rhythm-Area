package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.*
import services.identity.api.IsJudgeMessage
import services.system.api.APIMessage
final case class GetEliminationGroupsByIdClockMessage(idKey: EliminationGroupId,viewer: Option[String]) extends APIMessage[MatchClockBoard]:
  def plan(connection: Connection): IO[MatchClockBoard] = for
    g <- new EliminationSupport(connection).read(idKey.value)
    e <- ReadEventMessage(g.eventId,true).plan(connection)
    _ <- new RepositorySupport(connection).visible(e,viewer)
    judge <- viewer.traverse(u=>IsJudgeMessage(e,u,None).plan(connection)).map(_.contains(true))
    b <- new GroupClockSupport(connection).board(g,judge && g.scheduleState==ScheduleState.Current)
  yield b
