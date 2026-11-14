package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class MatchSummary(id: String,eventId: String,round: Int,ordinal: Int,a: Option[Entry],b: Option[Entry],winnerId: Option[String],status: MatchStatus,version: Int,extraRound: Int,stageId: String,stageName: String,bracket: BracketKind,generation: Int,scheduleState: ScheduleState = ScheduleState.Current,stageKind: StageKind = "single")

object MatchSummary:
  given io.circe.Codec.AsObject[MatchSummary] = io.circe.generic.semiauto.deriveCodec[MatchSummary]
