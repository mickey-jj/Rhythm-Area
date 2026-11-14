package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Windows(registrationOpen: Option[String], registrationClose: Option[String], qualifierClose: Option[String])

object Windows:
  given io.circe.Codec.AsObject[Windows] = io.circe.generic.semiauto.deriveCodec[Windows]
