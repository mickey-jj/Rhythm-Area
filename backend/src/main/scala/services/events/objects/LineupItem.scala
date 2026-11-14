package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class LineupItem(slotId: String, userIds: List[String])

object LineupItem:
  given io.circe.Codec.AsObject[LineupItem] = io.circe.generic.semiauto.deriveCodec[LineupItem]
