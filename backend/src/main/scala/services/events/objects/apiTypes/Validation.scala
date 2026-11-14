package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Validation(valid: Boolean, issues: List[Issue], summary: List[String])

object Validation:
  given io.circe.Codec.AsObject[Validation] = io.circe.generic.semiauto.deriveCodec[Validation]
