package services.identity.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Session(user: User, csrf: String)

object Session:
  given io.circe.Codec.AsObject[Session] = io.circe.generic.semiauto.deriveCodec[Session]
