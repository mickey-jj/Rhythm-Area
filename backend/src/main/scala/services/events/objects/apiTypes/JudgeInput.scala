package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class JudgeInput(username: String, matchId: Option[String], remove: Boolean)

object JudgeInput:
  given io.circe.Codec.AsObject[JudgeInput] = io.circe.generic.semiauto.deriveCodec[JudgeInput]
