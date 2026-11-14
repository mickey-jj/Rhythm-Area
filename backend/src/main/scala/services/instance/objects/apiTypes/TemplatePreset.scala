package services.instance.objects.apiTypes
import services.events.objects.*
import services.events.objects.given
import services.instance.objects.*
final case class TemplatePreset(id: String, presetLabel: String, name: String, tagline: String, description: String, rules: RuleSet, charts: List[Chart], appearance: Option[Appearance], format: Option[String] = None, schemaVersion: Option[Int] = None)
object TemplatePreset:
  given io.circe.Codec.AsObject[TemplatePreset] = io.circe.generic.semiauto.deriveCodec[TemplatePreset]
