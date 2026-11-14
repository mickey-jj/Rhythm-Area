package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class MatchSlot(id: String, chartKey: String, ordinal: Int, extraRound: Int)

object MatchSlot:
  given io.circe.Codec.AsObject[MatchSlot] = io.circe.generic.semiauto.deriveCodec[MatchSlot]
