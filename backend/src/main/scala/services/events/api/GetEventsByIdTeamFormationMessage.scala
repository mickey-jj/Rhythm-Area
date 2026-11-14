package services.events.api
import cats.effect.IO
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.*
import services.system.api.*
final case class GetEventsByIdTeamFormationMessage(idKey: EventId, viewer: Option[String]) extends APIMessage[TeamFormationView]:
  def plan(connection: Connection): IO[TeamFormationView] = for
    e <- ReadEventMessage(idKey.value).plan(connection)
    _ <- new RepositorySupport(connection).visible(e,viewer)
    result <- new TeamFormationSupport(connection).board(e,viewer)
  yield result
