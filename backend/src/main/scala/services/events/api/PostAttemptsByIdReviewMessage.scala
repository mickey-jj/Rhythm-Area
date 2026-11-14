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

final case class PostAttemptsByIdReviewMessage(idKey: AttemptId, user: User, input: ReviewInput) extends APIMessage[Map[String,Boolean]]:
  def plan(connection: Connection): IO[Map[String,Boolean]] =
    val in = input
    val result = {
      val id = idKey.value
      val repo = new RepositorySupport(connection)
      import repo.*
      (for
          initial <- services.events.tables.attempts.AttemptsTable.findServiceReviewattempt(connection, id).flatMap(_.liftTo[IO](AppError(404,ApiError("NOT_FOUND","成绩不存在"))))
          e <- ReadEventMessage(initial._1,true).plan(connection)
          a <- services.events.tables.attempts.AttemptsTable.findServiceReviewattempt(connection,id).flatMap(_.liftTo[IO](AppError(404,ApiError("NOT_FOUND","成绩不存在"))))
          mid <- services.events.tables.attempts.AttemptsTable.findServiceReviewattempt2(connection, id)
          _ <- RequireJudgeMessage(e,user.id,mid).plan(connection)
          ownTeam <- services.events.tables.attempts.AttemptsTable.findServiceReviewattempt3(connection, id, user.id)
          _ <- check(a._2 != user.id && ownTeam==0,403,"SELF_REVIEW","禁止审核本人或本队提交的成绩")
          _ <- check(a._3 == "pending",409,"ALREADY_REVIEWED","此尝试已被审核")
          _ <- check(Set("approved","rejected").contains(in.decision) && in.reason.trim.nonEmpty,400,"INVALID_REVIEW","请选择决定并填写理由")
          _ <- services.events.tables.reviews.ReviewsTable.insertServiceReviewattempt(connection, id, user.id, in.decision, in.reason)
          _ <- services.events.tables.attempts.AttemptsTable.updateServiceReviewattempt(connection, in.decision, id)
          gid <- services.events.tables.attempts.AttemptsTable.groupId(connection,id)
          _ <- gid.traverse_(g=>new EliminationSupport(connection).read(g).flatMap(row=>services.events.tables.elimination_groups.EliminationGroupsTable.save(connection,row.copy(version=row.version+1))))
          _ <- new RankingSupport(connection).synchronize(e)
          _ <- ReadAuditMessage(e.id,user.id,"attempt.review",s"$id · ${in.decision} · ${in.reason}").plan(connection)
        yield ())
    }
    result.as(Map("ok" -> true))
