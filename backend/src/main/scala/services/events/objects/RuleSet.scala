package services.events.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class RuleSet(
  schemaVersion: Int, gameKey: String, gameName: String, clientVersion: String, entryMode: EntryMode,
  capacity: Int, metric: Metric, qualifierSelection: QualifierSelection, pendingPolicy: PendingPolicy,
  matchMode: MatchMode, winsRequired: Int, stages: List[Stage], draft: List[DraftStep],
  playOrder: List[PlaySlot], resolution: Resolution, team: TeamPolicy, windows: Option[Windows] = None, draftMode: Option[DraftMode] = None, tieBreak: Option[List[String]] = None, initialWinsA: Option[Int] = None, timing: Option[MatchTiming] = None
)

object RuleSet:
  given io.circe.Codec.AsObject[RuleSet] = io.circe.generic.semiauto.deriveCodec[RuleSet]
