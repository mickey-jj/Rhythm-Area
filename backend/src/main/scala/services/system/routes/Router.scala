package services.system.routes
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import org.http4s.*
import services.events.objects.*
object Router:
  def apply(connection: Connection): HttpApp[IO] =
    val http = (services.identity.routes.IdentityRoutes(connection) <+> services.instance.routes.InstanceRoutes(connection) <+> services.events.routes.EventsRoutes(connection) <+> SystemRoutes(connection)).orNotFound
    http
