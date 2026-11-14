package services.identity.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class User(id: String, username: String, displayName: String)

object User:
  given io.circe.Codec.AsObject[User] = io.circe.generic.semiauto.deriveCodec[User]
