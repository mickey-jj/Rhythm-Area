package services.events.api
import cats.effect.IO
import cats.syntax.all.*
import java.nio.file.Files
import java.security.MessageDigest
import java.sql.Connection
import services.events.objects.*
import services.events.objects.apiTypes.ArtworkView
import services.events.utils.ArtworkValidation
import services.identity.objects.User
import services.instance.api.InstanceRequireOwnerMessage
import services.system.api.APIMessage
import services.system.utils.SystemConfig

final case class PostLibraryArtworkMessage(user: User, body: fs2.Stream[IO,Byte]) extends APIMessage[ArtworkView]:
  def plan(connection: Connection): IO[ArtworkView] = for
    _ <- InstanceRequireOwnerMessage(user).plan(connection)
    bytes <- body.take(5*1024*1024+1L).compile.toVector
    _ <- IO.raiseUnless(bytes.nonEmpty && bytes.size <= 5*1024*1024)(AppError(413,ApiError("ARTWORK_LIMIT","曲绘大小须为 1 字节至 5 MB")))
    format <- IO.fromOption(ArtworkValidation.format(bytes))(AppError(400,ApiError("ARTWORK_TYPE","请选择 PNG、JPEG 或 WebP 曲绘")))
    digest <- IO.blocking(MessageDigest.getInstance("SHA-256").digest(bytes.toArray).map(b => f"${b & 255}%02x").mkString)
    key = s"$digest.${ArtworkFormat.toString(format)}"
    directory = SystemConfig.root.resolve(".local/artwork")
    _ <- IO.blocking(Files.createDirectories(directory))
    _ <- IO.blocking(Files.write(directory.resolve(key),bytes.toArray))
  yield ArtworkView(key,s"/api/artwork/$key",ArtworkFormat.mime(format),bytes.size.toLong)
