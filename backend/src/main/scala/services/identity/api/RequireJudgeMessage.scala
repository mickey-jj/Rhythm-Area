package services.identity.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.APIMessage
import services.events.objects.*
final case class RequireJudgeMessage(event: EventView, userKey: UserId, matchId: Option[String] = None) extends APIMessage[Unit]:
  def plan(connection: Connection): IO[Unit] = IsJudgeMessage(event,userKey,matchId).plan(connection).flatMap(allowed=>IO.raiseUnless(allowed)(AppError(403,ApiError("FORBIDDEN","需要本赛事或本场分配的裁判权限"))))
