package services.instance.routes
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
import services.system.utils.SystemConfig

import services.system.routes.{ApiName, ResourceAlias}

object InstanceRoutes:
  val aliases: Map[String, services.system.routes.ResourceAlias] = Map(
    ApiName.of[services.instance.api.GetChartPresetsMessage] -> ResourceAlias(org.http4s.Method.GET, "/chart-presets"),
    ApiName.of[services.instance.api.GetChartPresetsByGameMessage] -> ResourceAlias(org.http4s.Method.GET, "/chart-presets/:game"),
    ApiName.of[services.instance.api.GetInstanceMessage] -> ResourceAlias(org.http4s.Method.GET, "/instance"),
    ApiName.of[services.instance.api.PostInstanceDemoDataMessage] -> ResourceAlias(org.http4s.Method.POST, "/instance/demo-data"),
    ApiName.of[services.instance.api.GetInstanceExportMessage] -> ResourceAlias(org.http4s.Method.GET, "/instance/export"),
    ApiName.of[services.instance.api.GetTemplatesMessage] -> ResourceAlias(org.http4s.Method.GET, "/templates"),
    ApiName.of[services.instance.api.GetCatalogMessage] -> ResourceAlias(org.http4s.Method.GET, "/catalog"),
    ApiName.of[services.instance.api.GetCatalogSnapshotMessage] -> ResourceAlias(org.http4s.Method.GET, "/catalog/snapshot"),
    ApiName.of[services.instance.api.InstanceSetupMessage] -> ResourceAlias(org.http4s.Method.POST, "/instance/setup")
  )
  def apply(connection: Connection): HttpRoutes[IO] =
    val identity = new services.identity.routes.IdentityBoundary(connection)
    import identity.*
    def respond[A: io.circe.Encoder](value: IO[A]): IO[Response[IO]] = value.flatMap(v => Ok(v.asJson))
    HttpRoutes.of[IO] {
      case req @ GET -> Root / "api" / "chart-presets" => for
        authenticated <- auth(req)
        response <- respond(GetChartPresetsMessage(authenticated.user).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "chart-presets" / game => for
        authenticated <- auth(req)
        response <- respond(GetChartPresetsByGameMessage(authenticated.user,game).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "instance" => for
        viewer <- current(req)
        response <- respond(GetInstanceMessage(viewer.map(_.user.id)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "instance" / "setup" => for
        _ <- origin(req)
        c <- req.asJsonDecode[services.identity.objects.Credentials]
        user <- InstanceSetupMessage(c).plan(connection)
        response <- loggedIn(user)
      yield response
      case req @ POST -> Root / "api" / "instance" / "demo-data" => for
        user <- write(req)
        response <- respond(PostInstanceDemoDataMessage(user).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "instance" / "export" => for
        authenticated <- auth(req)
        response <- respond(GetInstanceExportMessage(authenticated.user).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "templates" => for
        authenticated <- auth(req)
        response <- respond(GetTemplatesMessage(authenticated.user).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "catalog" => for
        authenticated <- auth(req)
        response <- respond(GetCatalogMessage(authenticated.user, req.params).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "catalog" / "snapshot" => for
        authenticated <- auth(req)
        response <- respond(GetCatalogSnapshotMessage(authenticated.user).plan(connection))
      yield response
    }
