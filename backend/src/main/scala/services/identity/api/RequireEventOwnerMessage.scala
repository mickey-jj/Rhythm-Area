package services.identity.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.APIMessage
import services.events.objects.*
final case class RequireEventOwnerMessage(event: EventView, userKey: UserId) extends APIMessage[Unit]:
  def plan(connection: Connection): IO[Unit] = IO.raiseUnless(event.ownerId==userKey.value)(AppError(403,ApiError("FORBIDDEN","需要本赛事主办权限")))
