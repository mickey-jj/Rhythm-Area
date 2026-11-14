package services.events.objects
import io.circe.{Decoder, Encoder}

enum ScheduleState:
  case Current, Historical

object ScheduleState:
  def toString(value: ScheduleState): String = value match
    case ScheduleState.Current => "current"
    case ScheduleState.Historical => "historical"
  def fromString(value: String): Either[String,ScheduleState] = value match
    case "current" => Right(ScheduleState.Current)
    case "historical" => Right(ScheduleState.Historical)
    case other => Left(s"Unknown schedule state: $other")
  given Encoder[ScheduleState] = Encoder.encodeString.contramap(toString)
  given Decoder[ScheduleState] = Decoder.decodeString.emap(fromString)
  given org.typelevel.doobie.Get[ScheduleState] = org.typelevel.doobie.Get[String].temap(fromString)
  given org.typelevel.doobie.Put[ScheduleState] = org.typelevel.doobie.Put[String].contramap(toString)
