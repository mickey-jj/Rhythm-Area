package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class PublicScore(slotId: String, aValue: Option[String], bValue: Option[String], aMembers: List[PublicMemberScore] = Nil, bMembers: List[PublicMemberScore] = Nil)

object PublicScore:
  given io.circe.Codec.AsObject[PublicScore] = io.circe.generic.semiauto.deriveCodec[PublicScore]
