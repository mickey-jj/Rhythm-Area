package services.instance.utils
import cats.effect.IO
import io.circe.Decoder
import java.nio.file.{Files,Path}
import services.events.objects.Chart
import services.system.utils.SystemConfig
private[instance] object Assets:
  private[instance] def read[A: Decoder](path: Path): IO[A] = IO.blocking(Files.readString(path)).flatMap(s=>IO.fromEither(io.circe.parser.decode[A](s)))
  private[instance] def catalog: IO[List[Chart]] = read[List[Chart]](SystemConfig.root.resolve("data/paradigm-reboot/charts.json"))
