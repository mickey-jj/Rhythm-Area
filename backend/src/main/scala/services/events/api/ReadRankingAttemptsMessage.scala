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

final case class ReadRankingAttemptsMessage(idKey: EventId) extends APIMessage[List[Attempt]]:
  def plan(connection: Connection): IO[List[Attempt]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    services.events.tables.attempts.AttemptsTable.findRepositoryRankingattempts(connection, id).flatMap(_.traverse((a,e,s,n) => services.events.tables.attempt_items.AttemptItemsTable.findRepositoryRankingattempts(connection, a).map(items => Attempt(a,e,s,n,items))))
