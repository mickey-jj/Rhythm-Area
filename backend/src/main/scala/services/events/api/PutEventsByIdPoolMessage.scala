package services.events.api
import cats.effect.IO
import java.sql.Connection
import services.events.objects.*
import services.events.tables.chart_library.ChartLibraryTable
import services.events.utils.{LibraryMapping, RepositorySupport}
import services.identity.objects.User
import services.identity.api.RequireEventOwnerMessage
import services.system.api.APIMessage

final case class PutEventsByIdPoolMessage(idKey: EventId, user: User, input: PoolAssignmentInput) extends APIMessage[EventView]:
  def plan(connection: Connection): IO[EventView] =
    val repo = new RepositorySupport(connection)
    import repo.*
    for
      _ <- services.instance.tables.instance_settings.InstanceSettingsTable.findServiceUpdate(connection)
      event <- ReadEventMessage(idKey,true).plan(connection)
      _ <- RequireEventOwnerMessage(event,user.id).plan(connection)
      _ <- requireVersion(event.version,input.expectedVersion)
      library <- ChartLibraryTable.findGame(connection,LibraryMapping.gameKey(event.rules.gameKey))
      snapshot <- ReadPoolMessage(idKey).plan(connection)
      byKey = (snapshot.map(LibraryMapping.metadata) ++ library).map(c => c.chart_key -> c).toMap
      _ <- check(input.assignments.size <= 10000 && input.assignments.map(_.chartKey).distinct.size == input.assignments.size,400,"INVALID_POOL","图池上限为 10000 张，谱面标识不可重复")
      _ <- check(input.assignments.forall(a => byKey.contains(a.chartKey) && a.pools.nonEmpty && a.pools.size <= 32 && a.pools.forall(p => p.trim.nonEmpty && p.length <= 80 && !p.contains("|")) && a.roles.nonEmpty),400,"INVALID_ASSIGNMENT","请选择曲库中的谱面、有效子池和谱面用途")
      charts = input.assignments.zipWithIndex.map((a,i) => LibraryMapping.assigned(byKey(a.chartKey).copy(game_key=event.rules.gameKey),a.pools.map(_.trim),a.roles,i+1))
      result <- PutEventsByIdMessage(idKey,user,EventInput(event.name,event.tagline,event.description,event.rules,charts,Some(event.version),None)).plan(connection)
    yield result
