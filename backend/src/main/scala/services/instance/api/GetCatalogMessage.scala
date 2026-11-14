package services.instance.api

import cats.effect.{IO, Resource}
import cats.syntax.all.*
import java.sql.Connection
import java.nio.file.{Files, Path}
import io.circe.{Json, Encoder, Decoder}
import io.circe.syntax.*
import io.circe.parser.decode
import services.events.objects.*
import services.events.objects.given
import services.identity.objects.*
import services.instance.objects.*
import services.events.api.*
import services.instance.api.*
import services.identity.api.*
import services.system.api.*
import services.system.utils.*


import services.instance.utils.InputValidation.*
import services.instance.utils.*

final case class GetCatalogMessage(authenticatedUser: User, query: Map[String,String]) extends APIMessage[CatalogPage]:
  def plan(connection: Connection): IO[CatalogPage] =
    import Assets.*
    val root = SystemConfig.root
    (for
        u <- IO.pure(authenticatedUser); _ <- InstanceRequireOwnerMessage(u).plan(connection); allCharts <- catalog
      yield
        val q=query.getOrElse("q","").toLowerCase
        val page=query.get("page").flatMap(_.toIntOption).getOrElse(1).max(1).min(100000)
        val rows=allCharts.filter(c => (c.title+" "+c.artist+" "+c.difficulty_label).toLowerCase.contains(q))
        CatalogPage(rows.size,page,rows.slice((page-1)*50,page*50)))
