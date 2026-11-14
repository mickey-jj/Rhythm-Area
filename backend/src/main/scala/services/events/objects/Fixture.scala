package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Fixture(key: String, round: Int, ordinal: Int, bracket: BracketKind, a: String, b: String)

object Fixture:
  given io.circe.Codec.AsObject[Fixture] = io.circe.generic.semiauto.deriveCodec[Fixture]
