package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.nio.file.Files
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.ArtworkView
import services.system.api.APIMessage
import services.system.utils.SystemConfig

final case class GetArtworkByKeyMessage(key: String) extends APIMessage[ArtworkView]:
  def plan(connection: Connection): IO[ArtworkView] = for
    _ <- IO.raiseUnless(key.matches("[a-f0-9]{64}\\.(png|jpg|webp)"))(AppError(404,ApiError("NOT_FOUND","曲绘不存在")))
    path = SystemConfig.root.resolve(".local/artwork").resolve(key)
    exists <- IO.blocking(Files.isRegularFile(path))
    _ <- IO.raiseUnless(exists)(AppError(404,ApiError("NOT_FOUND","曲绘不存在")))
    format <- IO.fromEither(ArtworkFormat.fromString(key.split("\\.").last).leftMap(message => AppError(404,ApiError("NOT_FOUND",message))))
    size <- IO.blocking(Files.size(path))
  yield ArtworkView(key,s"/api/artwork/$key",ArtworkFormat.mime(format),size)
