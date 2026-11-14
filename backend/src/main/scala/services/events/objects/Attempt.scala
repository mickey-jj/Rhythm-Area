package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Attempt(id: String, entryId: String, status: AttemptStatus, sequence: Long, items: List[ScoreItem])

object Attempt:
  given io.circe.Codec.AsObject[Attempt] = io.circe.generic.semiauto.deriveCodec[Attempt]
