package services.events.objects.apiTypes

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class TeamView(id: String, name: String, captainId: String, code: Option[String], entryId: Option[String], frozen: Boolean, members: List[User])

object TeamView:
  given io.circe.Codec.AsObject[TeamView] = io.circe.generic.semiauto.deriveCodec[TeamView]
