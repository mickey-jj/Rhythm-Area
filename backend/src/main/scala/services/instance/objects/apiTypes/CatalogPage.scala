package services.instance.objects.apiTypes
import services.events.objects.*
import services.events.objects.given
import services.instance.objects.*
final case class CatalogPage(total: Int, page: Int, items: List[Chart])
object CatalogPage:
  given io.circe.Codec.AsObject[CatalogPage] = io.circe.generic.semiauto.deriveCodec[CatalogPage]
