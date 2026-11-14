package services.events.tables.reviews

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
import org.typelevel.doobie.implicits.*

object ReviewsTable:

  private val insertServiceReviewattemptSql = """insert into reviews(id,attempt_id,reviewer_id,decision,reason) values (gen_random_uuid()::text,?,?,?,?)"""
  def insertServiceReviewattempt(connection: Connection, attemptId: String, reviewerId: String, decision: String, reason: String): IO[Int] =
    Database.run(connection)(org.typelevel.doobie.Update[(String,String,String,String)](insertServiceReviewattemptSql).run((attemptId,reviewerId,decision,reason)))
