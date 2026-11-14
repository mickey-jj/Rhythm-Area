package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class StagePlan(metric: Metric, matchMode: MatchMode, winsRequired: Int, draft: List[DraftStep], playOrder: List[PlaySlot], resolution: Resolution, draftMode: Option[DraftMode] = None, tieBreak: Option[List[String]] = None, timing: Option[MatchTiming] = None)

object StagePlan:
  given io.circe.Codec.AsObject[StagePlan] = io.circe.generic.semiauto.deriveCodec[StagePlan]
