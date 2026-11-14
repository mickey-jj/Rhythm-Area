package services.events.objects.apiTypes
import services.events.objects.{TeamFormationStatus,TeamDraftOrder}
import services.events.objects.given
final case class TeamDraftView(status: TeamFormationStatus, teamOrder: List[String], order: TeamDraftOrder, pickIndex: Int, version: Int, picks: List[TeamPick], activeTeamId: Option[String] = None)
object TeamDraftView:
  given io.circe.Codec.AsObject[TeamDraftView] = io.circe.generic.semiauto.deriveCodec[TeamDraftView]
