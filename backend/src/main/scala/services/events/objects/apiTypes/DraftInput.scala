package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class DraftInput(expectedVersion: Int, chartKey: Option[String], idempotencyKey: String)

object DraftInput:
  given io.circe.Codec.AsObject[DraftInput] = io.circe.generic.semiauto.deriveCodec[DraftInput]
