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

final case class EvidenceReadMessage(user: User,idKey: EvidenceId) extends APIMessage[EvidenceView]:
  def plan(connection: Connection): IO[EvidenceView] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        row <- services.events.tables.evidence_files.EvidenceFilesTable.findEvidenceRead(connection, id).flatMap(_.liftTo[IO](AppError(404,ApiError("NOT_FOUND","证据不存在"))))
        e <- ReadEventMessage(row._1).plan(connection)
        references <- services.events.tables.attempts.AttemptsTable.findEvidenceRead(connection, id)
        judgeAllowed <- references.traverse(mid=>IsJudgeMessage(e,user.id,mid).plan(connection)).map(_.contains(true))
        _ <- check(row._2==user.id || e.ownerId==user.id || judgeAllowed,403,"PRIVATE_EVIDENCE","仅上传者与对应裁判可读取证据")
      yield EvidenceView(id,row._3,row._4,row._5))
