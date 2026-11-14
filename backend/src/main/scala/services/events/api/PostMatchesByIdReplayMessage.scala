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

final case class PostMatchesByIdReplayMessage(idKey: MatchId, user: User, input: MatchDecision) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val midKey = idKey
    val in = input
    val result = {
      val mid = midKey.value
      val repo = new RepositorySupport(connection)
      import repo.*
      val operations = new OperationsSupport(connection)
      (for
          m <- GetMatchesByIdMessage(mid,Some(user.id)).plan(connection); e <- ReadEventMessage(m.eventId,true).plan(connection); _ <- operations.replayTx(user,e,mid,in)
        yield ())
    }
    result.as(Map("ok" -> true))
