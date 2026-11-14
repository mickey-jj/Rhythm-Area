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

final case class PostEventsByIdEvidenceMessage(idKey: EventId, user: User, body: fs2.Stream[IO,Byte], filename: String) extends APIMessage[EvidenceView]:
  def plan(connection: Connection): IO[EvidenceView] =
    val eidKey = idKey
    val name = filename
    val eid = eidKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    for
        _ <- (for e <- ReadEventMessage(eid).plan(connection); _ <- check(e.status!="draft" && e.status!="archived",409,"CLOSED","当前不可上传证据") yield ())
        bytes <- body.take((5*1024*1024)+1L).compile.toVector
        _ <- IO.raiseUnless(bytes.nonEmpty && bytes.size<=(5*1024*1024))(AppError(413,ApiError("FILE_LIMIT","单份证据须为 1 字节至 5MB")))
        signature=bytes.take(8).map(b=>b & 255).toList
        mime=if signature.take(4)==List(137,80,78,71) then "image/png" else if signature.take(3)==List(255,216,255) then "image/jpeg" else if signature.take(5)==List(37,80,68,70,45) then "application/pdf" else ""
        _ <- IO.raiseUnless(mime.nonEmpty)(AppError(400,ApiError("FILE_TYPE","只接受签名有效的 PNG、JPEG 或 PDF，不接受 HTML、脚本或可执行文件")))
        id <- NewIdMessage().plan(connection)
        _ <- IO.blocking(Files.createDirectories(SystemConfig.root.resolve(".local/evidence")))
        _ <- fs2.Stream.emits(bytes).covary[IO].through(fs2.io.file.Files[IO].writeAll(fs2.io.file.Path.fromNioPath(SystemConfig.root.resolve(".local/evidence").resolve(id)))).compile.drain
        safeName=name.take(150).replaceAll("[\\p{Cntrl}/\\\\]","_")
        _ <- services.events.tables.evidence_files.EvidenceFilesTable.insertEvidenceUpload(connection, id, eid, user.id, safeName, mime, bytes.size)
    yield EvidenceView(id,safeName,mime,bytes.size)
