package services.events.objects.apiTypes
final case class TeamPick(userId: String, teamId: String, ordinal: Int)
object TeamPick:
  given io.circe.Codec.AsObject[TeamPick] = io.circe.generic.semiauto.deriveCodec[TeamPick]
