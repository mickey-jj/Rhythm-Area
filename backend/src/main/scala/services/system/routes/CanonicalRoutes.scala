package services.system.routes
import cats.effect.IO
import org.http4s.*
final case class ResourceAlias(method: Method, pattern: String)
object CanonicalRoutes:
  private val aliases =
    services.identity.routes.IdentityRoutes.aliases ++
    services.instance.routes.InstanceRoutes.aliases ++
    services.events.routes.EventsRoutes.aliases ++
    SystemRoutes.aliases

  def resolve(request: Request[IO]): Request[IO] =
    request.uri.path.renderString.stripPrefix("/api/rpc/") match
      case name if request.uri.path.renderString.startsWith("/api/rpc/") =>
        aliases.get(name).filter(_.method==request.method).map { alias =>
          val path=alias.pattern.split("/").map(segment=>if segment.startsWith(":") then request.params.getOrElse(segment.drop(1), "") else segment).mkString("/")
          request.withUri(request.uri.withPath(Uri.Path.unsafeFromString("/api"+path)))
        }.getOrElse(request)
      case _ => request
