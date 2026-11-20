package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class AttemptView(id: String, eventId: String, matchId: Option[String], entryId: String, displayName: String,
 submittedBy: String, status: AttemptStatus, sequence: Long, evidenceNote: String, items: List[ScoreItem], reason: Option[String], evidenceId: Option[String], groupId: Option[String] = None, memberScores: List[MemberScore] = Nil, submittedAt: Option[Long] = None)

object AttemptView:
  given io.circe.Codec.AsObject[AttemptView] = io.circe.generic.semiauto.deriveCodec[AttemptView]
