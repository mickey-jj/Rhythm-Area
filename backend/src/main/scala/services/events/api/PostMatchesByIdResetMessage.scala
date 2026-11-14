package services.events.api
import cats.effect.IO
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.{OperationsSupport,RepositorySupport}
import services.identity.objects.User
import services.identity.api.RequireEventOwnerMessage
import services.system.api.APIMessage
final case class PostMatchesByIdResetMessage(idKey: MatchId,user: User,input: MatchResetInput) extends APIMessage[MatchView]:
  def plan(connection: Connection): IO[MatchView] = for
    m <- GetMatchesByIdMessage(idKey,Some(user.id)).plan(connection)
    e <- ReadEventMessage(m.eventId,true).plan(connection)
    _ <- RequireEventOwnerMessage(e,user.id).plan(connection)
    _ <- new RepositorySupport(connection).check(input.reason.trim.nonEmpty && input.reason.length<=1990,400,"REASON_REQUIRED","请填写重置原因（1990 字以内）")
    _ <- new OperationsSupport(connection).replayTx(user,e,m.id,MatchDecision(input.expectedVersion,"主办重置 · "+input.reason.trim,None))
    _ <- ReadAuditMessage(e.id,user.id,"match.reset",m.id+" · "+input.reason.trim).plan(connection)
    result <- GetMatchesByIdMessage(idKey,Some(user.id)).plan(connection)
  yield result
