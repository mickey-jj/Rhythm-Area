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

final case class GetMatchesByIdScoresMessage(idKey: MatchId, viewer: Option[User]) extends APIMessage[List[PublicScore]]:
  def plan(connection: Connection): IO[List[PublicScore]] =
    val id = idKey.value
    val repo = new RepositorySupport(connection)
    import repo.*
    (for
        s <- IO.pure(viewer)
        m <- GetMatchesByIdMessage(id,s.map(_.id)).plan(connection)
        values <- services.events.tables.attempt_items.AttemptItemsTable.findTransport(connection, id)
        members <- services.events.tables.attempt_member_scores.AttemptMemberScoresTable.findPublicMatch(connection,id)
      yield m.slots.map { slot =>
        def value(entryId: Option[String]): Option[String] = values.find(v => v._1 == slot.id && entryId.contains(v._2)).map(_._3)
        def memberValues(entryId: Option[String]): List[services.events.objects.apiTypes.PublicMemberScore] =
          val sequence=values.find(v=>v._1==slot.id && entryId.contains(v._2)).map(_._4)
          members.filter(v=>v._1==slot.id && entryId.contains(v._2) && sequence.contains(v._6)).map(v=>services.events.objects.apiTypes.PublicMemberScore(v._3,v._4,v._5))
        PublicScore(slot.id,value(m.a.map(_.id)),value(m.b.map(_.id)),memberValues(m.a.map(_.id)),memberValues(m.b.map(_.id)))
      })
