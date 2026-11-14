package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.system.api.APIMessage
import services.events.tables.events.EventsTable
final case class ReadEventMessage(idKey: EventId, lock: Boolean = false) extends APIMessage[EventView]:
  def plan(connection: Connection): IO[EventView] =
    val selected = if lock then EventsTable.findRepositoryFindeventlocked(connection,idKey.value) else EventsTable.findRepositoryFindevent(connection,idKey.value)
    selected.flatMap(_.liftTo[IO](AppError(404,ApiError("NOT_FOUND","当前实例中不存在此赛事"))))
