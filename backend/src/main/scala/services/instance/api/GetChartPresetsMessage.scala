package services.instance.api
import cats.effect.IO
import io.circe.Json
import java.sql.Connection
import services.identity.objects.User
import services.instance.utils.Assets
import services.system.api.APIMessage
import services.system.utils.SystemConfig

final case class GetChartPresetsMessage(user: User) extends APIMessage[Json]:
  def plan(connection: Connection): IO[Json] = for
    _ <- InstanceRequireOwnerMessage(user).plan(connection)
    result <- Assets.read[Json](SystemConfig.root.resolve("data/chart-presets/manifest.json"))
  yield result
