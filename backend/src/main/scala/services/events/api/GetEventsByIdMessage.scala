package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.system.api.APIMessage
final case class GetEventsByIdMessage(idKey: EventId, viewer: Option[String]) extends APIMessage[EventView]:
  def plan(connection: Connection): IO[EventView] = for
    event <- ReadEventMessage(idKey.value).plan(connection)
    _ <- IO.raiseUnless(event.status!="draft" || viewer.contains(event.ownerId))(AppError(404,ApiError("NOT_FOUND","赛事尚未公开")))
  yield event
