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

final case class EventValidateInputMessage(input: EventInput) extends APIMessage[Unit]:
  def plan(connection: Connection): IO[Unit] =
    val repo = new RepositorySupport(connection)
    import repo.*
    check(input.charts.forall(c => ArtworkValidation.validSource(c.cover_url)),400,"INVALID_ARTWORK","曲绘地址无效") *>
    check(input.appearance.forall(Appearance.valid),400,"INVALID_APPEARANCE","标识必填，主题色须为 #RRGGBB，联系信息不超过 500 字") *>
        check(input.name.trim.nonEmpty && input.name.length <= 100 && input.description.length <= 12000 && input.charts.size <= 10000,400,"INVALID_INPUT","名称必填，且请遵守字段与 10000 张图池容量限制") *>
        check(input.charts.forall(c => c.chart_key.nonEmpty && c.song_key.nonEmpty && c.title.nonEmpty && c.game_key == input.rules.gameKey) && input.charts.map(_.chart_key).distinct.size == input.charts.size,400,"INVALID_POOL","图池含空键、重复键或其他游戏谱面")
