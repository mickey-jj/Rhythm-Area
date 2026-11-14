package services.events.api

import cats.effect.{IO, Resource}
import cats.syntax.all.*
import java.sql.Connection
import java.nio.file.{Files, Path}
import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
import services.events.api.*
import services.instance.api.*
import services.identity.api.*
import services.system.api.*
import services.system.utils.*
import services.events.utils.*

final case class GetEventsByIdRankingsMessage(idKey: EventId, viewer: Option[User]) extends APIMessage[List[RankingRow]]:
  def plan(connection: Connection): IO[List[RankingRow]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    val service = new ServiceSupport(connection)
    (for
        e <- ReadEventMessage(id,true).plan(connection)
        _ <- visible(e,viewer.map(_.id))
        _ <- new RankingSupport(connection).synchronize(e)
        snapshot <- services.events.tables.qualifier_snapshots.QualifierSnapshotsTable.findTransport(connection, id)
        rows <- snapshot.map(s=>IO.pure(readJson[List[RankingRow]](s))).getOrElse(service.rankingsTx(e))
      yield rows.map(row=>row.copy(entry=row.entry.copy(reason=""),attemptIds=Nil)))
