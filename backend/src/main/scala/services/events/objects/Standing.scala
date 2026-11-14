package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Standing(entryId: String, total: Option[String], complete: Boolean, attemptIds: List[String])

object Standing:
  given io.circe.Codec.AsObject[Standing] = io.circe.generic.semiauto.deriveCodec[Standing]
