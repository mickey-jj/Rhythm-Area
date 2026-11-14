package services.events.api
import cats.effect.IO
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.EliminationGroup
import services.events.utils.*
import services.events.tables.elimination_groups.EliminationGroupsTable
import services.system.api.*
final case class GetEventsByIdEliminationGroupsMessage(idKey: EventId, viewer: Option[String]) extends APIMessage[List[EliminationGroup]]:
  def plan(connection: Connection): IO[List[EliminationGroup]] = for
    e <- ReadEventMessage(idKey.value).plan(connection)
    _ <- new RepositorySupport(connection).visible(e,viewer)
    groups <- EliminationGroupsTable.list(connection,e.id)
  yield groups.map(EliminationSupport.publicGroup)
