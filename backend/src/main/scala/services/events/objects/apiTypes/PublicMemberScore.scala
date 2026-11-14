package services.events.objects.apiTypes
final case class PublicMemberScore(userId: String, displayName: String, value: String)
object PublicMemberScore:
  given io.circe.Codec.AsObject[PublicMemberScore] = io.circe.generic.semiauto.deriveCodec[PublicMemberScore]
