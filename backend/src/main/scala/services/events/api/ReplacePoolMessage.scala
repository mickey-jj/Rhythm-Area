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

final case class ReplacePoolMessage(idKey: EventId, charts: List[Chart]) extends APIMessage[Unit]:
  def plan(connection: Connection): IO[Unit] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    services.events.tables.pool_entries.PoolEntriesTable.deleteRepositoryReplacepool(connection, id) *> charts.zipWithIndex.traverse_ { (input,index) =>
          val c = input.copy(display_order=index+1)
          services.events.tables.pool_entries.PoolEntriesTable.insertRepositoryReplacepool(connection, id, c.chart_key, c.song_key, c.game_key, json(c), c.display_order)
        }
