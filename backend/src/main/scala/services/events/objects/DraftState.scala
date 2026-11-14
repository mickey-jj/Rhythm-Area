package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class DraftState(actions: List[DraftAction])

object DraftState:
  given io.circe.Codec.AsObject[DraftState] = io.circe.generic.semiauto.deriveCodec[DraftState]
