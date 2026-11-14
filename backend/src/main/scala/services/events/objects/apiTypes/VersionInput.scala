package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class VersionInput(expectedVersion: Int)

object VersionInput:
  given io.circe.Codec.AsObject[VersionInput] = io.circe.generic.semiauto.deriveCodec[VersionInput]
