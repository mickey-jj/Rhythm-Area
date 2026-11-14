package services.instance.api
import cats.effect.IO
import java.sql.Connection
import services.events.objects.{LibraryChart, AppError, ApiError}
import services.identity.objects.User
import services.instance.utils.Assets
import services.system.api.APIMessage
import services.system.utils.SystemConfig

final case class GetChartPresetsByGameMessage(user: User, game: String) extends APIMessage[List[LibraryChart]]:
  def plan(connection: Connection): IO[List[LibraryChart]] = for
    _ <- InstanceRequireOwnerMessage(user).plan(connection)
    _ <- if Set("phigros","rotaeno","arcaea","maimai","maimai-dx","chunithm","paradigm-reboot").contains(game) then IO.unit else IO.raiseError(AppError(404,ApiError("NOT_FOUND","预设不存在")))
    result <- Assets.read[List[LibraryChart]](SystemConfig.root.resolve(s"data/chart-presets/${if game == "maimai-dx" then "maimai" else game}.json"))
  yield result
