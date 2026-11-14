package services.events.utils

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

private[events] final class RepositorySupport(connection: Connection):
  private val concealmentKey = SystemConfig.password
  private[events] def opaqueChartId(eventId: String, chartKey: String): String = "mystery-"+services.system.objects.TokenDigest(concealmentKey+":"+eventId+":"+chartKey).take(24)
  private[events] def concealed(c: Chart, eventId: String): Chart = c.copy(chart_key=opaqueChartId(eventId,c.chart_key),song_key="hidden",title="未揭晓隐藏曲",artist="",chart_type="hidden",difficulty_label="待揭晓",level_value=None,game_version="",cover_url=None)
  private[events] def readJson[A: Decoder](text: String): A = decode[A](text).fold(e => throw new IllegalStateException(e.getMessage), identity)
  private[events] def json[A: Encoder](a: A): String = a.asJson.noSpaces
  private[events] def check(condition: Boolean, status: Int, code: String, message: String): IO[Unit] =
    if condition then ().pure[IO] else AppError(status,ApiError(code,message)).raiseError[IO,Unit]
  private[events] def requireVersion(actual: Int, expected: Int): IO[Unit] =
    if actual == expected then ().pure[IO] else AppError(409,ApiError("VERSION_CONFLICT","页面已过期，请刷新后重试",currentVersion=Some(actual))).raiseError[IO,Unit]
  private[events] def visible(e: EventView, viewer: Option[String]): IO[Unit] = check(e.status != "draft" || viewer.contains(e.ownerId),404,"NOT_FOUND","赛事尚未公开")
