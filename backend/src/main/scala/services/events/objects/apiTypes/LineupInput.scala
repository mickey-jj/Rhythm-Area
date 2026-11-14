package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class LineupInput(entryId: String, items: List[LineupItem], expectedVersion: Int)

object LineupInput:
  given io.circe.Codec.AsObject[LineupInput] = io.circe.generic.semiauto.deriveCodec[LineupInput]
