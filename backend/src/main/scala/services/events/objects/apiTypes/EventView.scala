package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class EventView(id: String, ownerId: String, name: String, tagline: String, description: String, status: EventStatus,
 rules: RuleSet, version: Int, demo: Boolean, poolCount: Long, entryCount: Long, ruleVersion: Int)

object EventView:
  given io.circe.Codec.AsObject[EventView] = io.circe.generic.semiauto.deriveCodec[EventView]
