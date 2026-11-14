package services.identity.objects
final case class SessionGrant(token: String, session: Session)
object SessionGrant:
  given io.circe.Codec.AsObject[SessionGrant] = io.circe.generic.semiauto.deriveCodec[SessionGrant]
