package services.instance.objects

import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
final case class Appearance(brandName: String, accentColor: String, contact: String)

object Appearance:
  val default = Appearance("律竞", "#a3edd1", "")
  def valid(a: Appearance): Boolean = a.brandName.trim.nonEmpty && a.brandName.length <= 50 && a.accentColor.matches("#[0-9a-fA-F]{6}") && a.contact.length <= 500
  given io.circe.Codec.AsObject[Appearance] = io.circe.generic.semiauto.deriveCodec[Appearance]
