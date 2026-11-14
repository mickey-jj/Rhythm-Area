package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class RuleVersion(value: Int)

object RuleVersion:
  given io.circe.Codec.AsObject[RuleVersion] = io.circe.generic.semiauto.deriveCodec[RuleVersion]
