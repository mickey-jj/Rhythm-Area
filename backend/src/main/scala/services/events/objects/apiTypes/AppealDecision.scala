package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class AppealDecision(decision: AppealDecisionKind, reason: String, expectedVersion: Int)

object AppealDecision:
  given io.circe.Codec.AsObject[AppealDecision] = io.circe.generic.semiauto.deriveCodec[AppealDecision]
