package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class AttemptInput(entryId: String, matchId: Option[String], items: List[ScoreItem], evidenceNote: String, memberScores: Option[List[MemberScore]] = None, evidenceId: Option[String] = None, groupId: Option[String] = None)

object AttemptInput:
  given io.circe.Codec.AsObject[AttemptInput] = io.circe.generic.semiauto.deriveCodec[AttemptInput]
