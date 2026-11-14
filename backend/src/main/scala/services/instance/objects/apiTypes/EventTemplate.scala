package services.instance.objects.apiTypes
import services.events.objects.*
import services.events.objects.given
import services.instance.objects.*
final case class EventTemplate(format: String, schemaVersion: Int, name: String, tagline: String, description: String, rules: RuleSet, charts: List[Chart], appearance: Appearance)
object EventTemplate:
  given io.circe.Codec.AsObject[EventTemplate] = io.circe.generic.semiauto.deriveCodec[EventTemplate]
