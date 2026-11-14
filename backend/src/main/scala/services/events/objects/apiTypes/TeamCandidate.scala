package services.events.objects.apiTypes
import services.events.objects.CaptainStatus
import services.events.objects.given
import services.identity.objects.User
final case class TeamCandidate(user: User, captainStatus: CaptainStatus, note: String, teamId: Option[String])
object TeamCandidate:
  given io.circe.Codec.AsObject[TeamCandidate] = io.circe.generic.semiauto.deriveCodec[TeamCandidate]
