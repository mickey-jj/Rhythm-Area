package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.Side.given
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
enum Decision:
  case Winner(side: Side, a: String, b: String)
  case Pending(reason: String)
  case ExtraRound(scope: TieScope)

object Decision:
  given io.circe.Codec.AsObject[Decision] = io.circe.generic.semiauto.deriveCodec[Decision]
