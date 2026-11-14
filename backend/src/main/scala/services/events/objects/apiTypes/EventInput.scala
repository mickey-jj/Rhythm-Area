package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class EventInput(name: String, tagline: String, description: String, rules: RuleSet, charts: List[Chart], expectedVersion: Option[Int], appearance: Option[services.instance.objects.Appearance])

object EventInput:
  given io.circe.Codec.AsObject[EventInput] = io.circe.generic.semiauto.deriveCodec[EventInput]
