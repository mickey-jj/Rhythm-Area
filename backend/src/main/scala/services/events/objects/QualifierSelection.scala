package services.events.objects

type QualifierSelection = "whole-best" | "per-chart-best" | "last-approved"
object QualifierSelection:
  val values: Set[String] = Set("whole-best","per-chart-best","last-approved")
  def fromString(value: String): Either[String, QualifierSelection] =
    val normalized = value.trim.toLowerCase
    Either.cond(values(normalized), normalized.asInstanceOf[QualifierSelection], s"Unsupported QualifierSelection: $value")
  def toString(value: QualifierSelection): String = value

  given qualifierSelectionCodec: io.circe.Codec[QualifierSelection] = io.circe.Codec.from(io.circe.Decoder.decodeString.emap(QualifierSelection.fromString),io.circe.Encoder.encodeString.contramap(QualifierSelection.toString))
  given qualifierSelectionGet: org.typelevel.doobie.Get[QualifierSelection] = org.typelevel.doobie.Get[String].temap(QualifierSelection.fromString)
  given qualifierSelectionPut: org.typelevel.doobie.Put[QualifierSelection] = org.typelevel.doobie.Put[String].contramap(QualifierSelection.toString)
