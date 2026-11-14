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

final case class GetMatchesByIdLineupsMessage(idKey: MatchId, viewer: Option[User]) extends APIMessage[List[Map[String,String]]]:
  def plan(connection: Connection): IO[List[Map[String,String]]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        m <- IO.pure(viewer).flatMap(s=>GetMatchesByIdMessage(id,s.map(_.id)).plan(connection))
        rows <- services.events.tables.lineups.LineupsTable.findTransport(connection, id)
      yield rows.map((en,s,u)=>Map("entryId"->en,"slotId"->s,"userId"->u)))
