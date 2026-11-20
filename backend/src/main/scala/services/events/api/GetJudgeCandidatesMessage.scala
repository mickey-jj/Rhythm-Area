package services.events.api

import cats.effect.IO
import java.sql.Connection
import services.events.objects.EventId
import services.identity.objects.User
import services.identity.api.RequireEventOwnerMessage
import services.identity.tables.users.UsersTable
import services.system.api.APIMessage

final case class GetJudgeCandidatesMessage(idKey: EventId,user: User,search: String) extends APIMessage[List[User]]:
  def plan(connection: Connection): IO[List[User]] = for
    event <- ReadEventMessage(idKey.value).plan(connection)
    _ <- RequireEventOwnerMessage(event,user.id).plan(connection)
    candidates <- UsersTable.searchJudges(connection,search.trim.toLowerCase.take(50))
  yield candidates
