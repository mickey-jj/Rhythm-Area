package services.events.objects.apiTypes
import services.events.objects.*
import services.events.objects.given
final case class EliminationGroup(id: String, eventId: String, stageId: String, stageName: String, key: String, round: Int, advance: Int, sources: List[String], participants: List[String], status: EliminationGroupStatus, charts: List[Chart], rules: RuleSet, placements: List[String], version: Int, scheduleState: ScheduleState, reason: String, expectedParticipants: Int = 0)
object EliminationGroup:
  given io.circe.Codec.AsObject[EliminationGroup] = io.circe.generic.semiauto.deriveCodec[EliminationGroup]
