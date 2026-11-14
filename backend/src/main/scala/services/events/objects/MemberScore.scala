package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class MemberScore(slotId: String, userId: String, value: String)

object MemberScore:
  given io.circe.Codec.AsObject[MemberScore] = io.circe.generic.semiauto.deriveCodec[MemberScore]
