package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class MatchDecision(expectedVersion: Int, reason: String, winnerId: Option[String])

object MatchDecision:
  given io.circe.Codec.AsObject[MatchDecision] = io.circe.generic.semiauto.deriveCodec[MatchDecision]
