package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.RankingBoard
import services.events.utils.*
import services.system.api.*
final case class GetEventsByIdRankingBoardMessage(idKey: EventId, viewer: Option[String]) extends APIMessage[RankingBoard]:
  def plan(connection: Connection): IO[RankingBoard] = for
    e <- ReadEventMessage(idKey.value,true).plan(connection)
    _ <- new RepositorySupport(connection).visible(e,viewer)
    board <- new RankingSupport(connection).synchronize(e).flatMap(_.liftTo[IO](AppError(404,ApiError("NO_RANKING","本赛事没有排名赛阶段"))))
    canManage = viewer.contains(e.ownerId) && e.status == "registration"
    decision <- if canManage then QualificationSupport.decision(connection, e.id, board.rankings) else IO.pure(None)
  yield board.copy(
    canManage = canManage,
    qualificationDecision = decision,
    rankings = board.rankings.map(row => row.copy(entry = row.entry.copy(reason = ""), attemptIds = Nil))
  )
