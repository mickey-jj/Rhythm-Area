package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Outcome(key: String, a: Option[String], b: Option[String], winner: Option[String], status: MatchStatus)

object Outcome:
  given io.circe.Codec.AsObject[Outcome] = io.circe.generic.semiauto.deriveCodec[Outcome]
