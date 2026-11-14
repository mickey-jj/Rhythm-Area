package services.events.api
import cats.effect.IO
import java.sql.Connection
import services.events.objects.*
import services.events.tables.matches.MatchesTable
import services.events.utils.RepositorySupport
import services.system.api.APIMessage

final case class ReadMatchChartsMessage(matchId: MatchId, eventId: EventId) extends APIMessage[List[Chart]]:
  def plan(connection: Connection): IO[List[Chart]] =
    val repo=new RepositorySupport(connection)
    MatchesTable.findChartsSnapshot(connection,matchId.value).flatMap {
      case Some(charts) => IO.pure(repo.readJson[List[Chart]](charts))
      case None => ReadPoolMessage(eventId).plan(connection)
    }
