package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.*
import services.events.utils.*
import services.identity.api.IsJudgeMessage
import services.system.api.*
final case class GetEliminationGroupsByIdMessage(idKey: EliminationGroupId, viewer: Option[String]) extends APIMessage[EliminationRoom]:
  def plan(connection: Connection): IO[EliminationRoom] =
    val support=new EliminationSupport(connection)
    for
      group <- support.read(idKey.value)
      e <- ReadEventMessage(group.eventId).plan(connection)
      _ <- new RepositorySupport(connection).visible(e,viewer)
      entries <- group.participants.traverse(id=>ReadEntryMessage(id).plan(connection).map(_.copy(reason="")))
      attempts <- support.attempts(group.id)
      judge <- viewer.traverse(id=>IsJudgeMessage(e,id,None).plan(connection)).map(_.contains(true))
    yield EliminationRoom(EliminationSupport.publicGroup(group),entries,EliminationSupport.standings(group,attempts),judge)
