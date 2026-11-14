package services.system.routes
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import io.circe.Json
import io.circe.syntax.*
import services.events.objects.*
import services.identity.objects.*
import services.events.api.*
import services.instance.api.*
import services.identity.api.*
import org.http4s.*
import org.http4s.circe.*
import org.http4s.dsl.io.*
import org.typelevel.ci.CIString
import services.system.api.*
import services.system.utils.SystemConfig

object SystemRoutes:
  val aliases: Map[String, services.system.routes.ResourceAlias] = Map(
    ApiName.of[services.system.api.GetHealthMessage] -> ResourceAlias(org.http4s.Method.GET, "/health")
  )
  def apply(connection: Connection): HttpRoutes[IO] =
    val identity = new services.identity.routes.IdentityBoundary(connection)
    import identity.*
    def respond[A: io.circe.Encoder](value: IO[A]): IO[Response[IO]] = value.flatMap(v => Ok(v.asJson))
    HttpRoutes.of[IO] {
      case GET -> Root / "api" / "health" => respond(GetHealthMessage().plan(connection))
    }
