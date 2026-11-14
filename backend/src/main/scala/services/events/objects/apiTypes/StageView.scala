package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class StageView(id: String, name: String, kind: StageKind, status: StageStatus, participants: List[String], placements: List[Placement])

object StageView:
  given io.circe.Codec.AsObject[StageView] = io.circe.generic.semiauto.deriveCodec[StageView]
