package services.events.objects.apiTypes
final case class TeamCandidateInput(note: String)
object TeamCandidateInput:
  given io.circe.Codec.AsObject[TeamCandidateInput] = io.circe.generic.semiauto.deriveCodec[TeamCandidateInput]
