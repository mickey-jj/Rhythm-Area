package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class DraftStep(id: String, actor: Actor, action: DraftActionKind, count: Int, pool: String, banApplies: Boolean, target: DraftTarget)

object DraftStep:
  given io.circe.Codec.AsObject[DraftStep] = io.circe.generic.semiauto.deriveCodec[DraftStep]
