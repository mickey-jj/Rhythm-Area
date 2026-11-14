package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class TeamPolicy(min: Int, max: Int, perChart: Int, maxAppearances: Int, aggregation: Aggregation,
  captainSelection: Option[CaptainSelection] = None, formation: Option[TeamFormation] = None,
  captainCount: Option[Int] = None, draftOrder: Option[TeamDraftOrder] = None)

object TeamPolicy:
  given io.circe.Codec.AsObject[TeamPolicy] = io.circe.generic.semiauto.deriveCodec[TeamPolicy]
