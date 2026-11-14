package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Audit(id: Long, action: String, detail: String, at: String)

object Audit:
  given io.circe.Codec.AsObject[Audit] = io.circe.generic.semiauto.deriveCodec[Audit]
