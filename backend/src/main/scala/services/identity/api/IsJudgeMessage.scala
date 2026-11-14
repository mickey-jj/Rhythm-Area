package services.identity.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.api.APIMessage
import services.events.objects.*
final case class IsJudgeMessage(event: EventView, userKey: UserId, matchId: Option[String] = None) extends APIMessage[Boolean]:
  def plan(connection: Connection): IO[Boolean] =
    services.identity.tables.judge_grants.JudgeGrantsTable.findRepositoryIsjudge(connection,event.id,userKey.value,event.id,userKey.value,matchId.getOrElse("")).map(_ || event.ownerId==userKey.value)
