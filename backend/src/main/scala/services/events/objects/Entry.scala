package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Entry(id: String, eventId: String, userId: String, displayName: String, status: EntryStatus, seed: Option[Int], reason: String)

object Entry:
  given io.circe.Codec.AsObject[Entry] = io.circe.generic.semiauto.deriveCodec[Entry]
