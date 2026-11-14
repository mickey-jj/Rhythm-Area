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

final case class PostEventsByIdStagesBySidQualificationMessage(idKey: EventId, sid: String, user: User, input: QualificationInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    val competition = new CompetitionSupport(connection)
    (for
        u <- IO.pure(user); in <- IO.pure(input)
        _ <- (for e <- ReadEventMessage(id,true).plan(connection); _ <- competition.resolveTx(u.id,e,sid,in) yield ())
      yield Map("ok"->true))
