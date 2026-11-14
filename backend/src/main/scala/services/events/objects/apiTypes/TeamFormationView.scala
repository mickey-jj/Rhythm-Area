package services.events.objects.apiTypes
final case class TeamFormationView(teams: List[TeamView], candidates: List[TeamCandidate], draft: Option[TeamDraftView])
object TeamFormationView:
  given io.circe.Codec.AsObject[TeamFormationView] = io.circe.generic.semiauto.deriveCodec[TeamFormationView]
