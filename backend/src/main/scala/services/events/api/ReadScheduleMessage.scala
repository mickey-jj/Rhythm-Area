package services.events.api

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
import services.events.utils.*

final case class ReadScheduleMessage(e: EventView) extends APIMessage[List[MatchSummary]]:
  def plan(connection: Connection): IO[List[MatchSummary]] =
    val repo = new RepositorySupport(connection)
    import repo.*
    for
        es <- ReadEntriesMessage(e.id).plan(connection)
        rows <- services.events.tables.matches.MatchesTable.findRepositorySchedule(connection, e.id)
    yield rows.map { (id,r,o,a,b,w,s,v,x,sid,br,g,scope,stored) =>
      val rules=readJson[RuleSet](stored)
      val definition=(if scope==ScheduleState.Historical then rules.stages else e.rules.stages).find(_.id==sid).orElse(rules.stages.find(_.id==sid))
      MatchSummary(id,e.id,r,o,a.flatMap(id=>es.find(_.id==id)).map(_.copy(reason="")),b.flatMap(id=>es.find(_.id==id)).map(_.copy(reason="")),w,s,v,x,sid,definition.map(_.name).getOrElse(sid),br,g,scope,definition.map(_.kind).getOrElse("single"))
    }
