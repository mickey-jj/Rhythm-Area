package services.events.routes
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import io.circe.Json
import io.circe.syntax.*
import services.events.objects.*
import services.events.objects.apiTypes.LibraryArtworkInput
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

object EventsRoutes:
  val aliases: Map[String, services.system.routes.ResourceAlias] = Map(
    ApiName.of[services.events.api.PostMatchesByIdResetMessage] -> ResourceAlias(org.http4s.Method.POST,"/matches/:id/reset"),
    ApiName.of[services.events.api.PostEliminationGroupsByIdResetMessage] -> ResourceAlias(org.http4s.Method.POST,"/elimination-groups/:id/reset"),
    ApiName.of[services.events.api.GetEliminationGroupsByIdClockMessage] -> ResourceAlias(org.http4s.Method.GET,"/elimination-groups/:id/clock"),
    ApiName.of[services.events.api.PostEliminationGroupsByIdClockMessage] -> ResourceAlias(org.http4s.Method.POST,"/elimination-groups/:id/clock"),
    ApiName.of[services.events.api.GetMatchesByIdClockMessage] -> ResourceAlias(org.http4s.Method.GET,"/matches/:id/clock"),
    ApiName.of[services.events.api.PostMatchesByIdClockMessage] -> ResourceAlias(org.http4s.Method.POST,"/matches/:id/clock"),
    ApiName.of[services.events.api.GetEventsByIdRankingBoardMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/ranking-board"),
    ApiName.of[services.events.api.PostEventsByIdRankingControlMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/ranking-control"),
    ApiName.of[services.events.api.GetEventsByIdEliminationGroupsMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/elimination-groups"),
    ApiName.of[services.events.api.GetEliminationGroupsByIdMessage] -> ResourceAlias(org.http4s.Method.GET, "/elimination-groups/:id"),
    ApiName.of[services.events.api.PostEliminationGroupsByIdFinalizeMessage] -> ResourceAlias(org.http4s.Method.POST, "/elimination-groups/:id/finalize"),
    ApiName.of[services.events.api.GetEventsByIdTeamFormationMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/team-formation"),
    ApiName.of[services.events.api.PostEventsByIdTeamCandidatesMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/team-candidates"),
    ApiName.of[services.events.api.PostEventsByIdCaptainsApplyMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/captains/apply"),
    ApiName.of[services.events.api.PostEventsByIdCaptainsDecisionMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/captains/decision"),
    ApiName.of[services.events.api.PostEventsByIdCaptainsDrawMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/captains/draw"),
    ApiName.of[services.events.api.PostEventsByIdTeamDraftStartMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/team-draft/start"),
    ApiName.of[services.events.api.PostEventsByIdTeamDraftPickMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/team-draft/pick"),
    ApiName.of[services.events.api.PostEventsByIdTeamsRandomMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/teams/random"),
    ApiName.of[services.events.api.PostEventsByIdTeamsByTidJoinMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/teams/:tid/join"),
    ApiName.of[services.events.api.PostEventsByIdTeamsLeaveMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/teams/leave"),
    ApiName.of[services.events.api.PostLibraryArtworkMessage] -> ResourceAlias(org.http4s.Method.POST, "/library/artwork"),
    ApiName.of[services.events.api.PutLibraryArtworkMessage] -> ResourceAlias(org.http4s.Method.PUT, "/library/artwork"),
    ApiName.of[services.events.api.GetArtworkByKeyMessage] -> ResourceAlias(org.http4s.Method.GET, "/artwork/:key"),
    ApiName.of[services.events.api.GetLibraryMessage] -> ResourceAlias(org.http4s.Method.GET, "/library"),
    ApiName.of[services.events.api.PutLibraryMessage] -> ResourceAlias(org.http4s.Method.PUT, "/library"),
    ApiName.of[services.events.api.PutEventsByIdPoolMessage] -> ResourceAlias(org.http4s.Method.PUT, "/events/:id/pool"),
    ApiName.of[services.events.api.PostInstanceEventMessage] -> ResourceAlias(org.http4s.Method.POST, "/instance/event"),
    ApiName.of[services.events.api.GetEventsByIdMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id"),
    ApiName.of[services.events.api.PutEventsByIdMessage] -> ResourceAlias(org.http4s.Method.PUT, "/events/:id"),
    ApiName.of[services.events.api.PostEventsByIdValidateMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/validate"),
    ApiName.of[services.events.api.PostEventsByIdSimulateMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/simulate"),
    ApiName.of[services.events.api.PostEventsByIdPublishMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/publish"),
    ApiName.of[services.events.api.PostEventsByIdReopenMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/reopen"),
    ApiName.of[services.events.api.GetEventsByIdPoolMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/pool"),
    ApiName.of[services.events.api.GetEventsByIdEntriesMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/entries"),
    ApiName.of[services.events.api.PostEventsByIdEntriesMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/entries"),
    ApiName.of[services.events.api.PostEntriesByIdReviewMessage] -> ResourceAlias(org.http4s.Method.POST, "/entries/:id/review"),
    ApiName.of[services.events.api.GetEventsByIdScheduleMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/schedule"),
    ApiName.of[services.events.api.GetEventsByIdTeamsMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/teams"),
    ApiName.of[services.events.api.PostEventsByIdTeamsMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/teams"),
    ApiName.of[services.events.api.PostEventsByIdTeamsJoinMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/teams/join"),
    ApiName.of[services.events.api.PostMatchesByIdLineupsMessage] -> ResourceAlias(org.http4s.Method.POST, "/matches/:id/lineups"),
    ApiName.of[services.events.api.GetMatchesByIdLineupsMessage] -> ResourceAlias(org.http4s.Method.GET, "/matches/:id/lineups"),
    ApiName.of[services.events.api.GetEventsByIdJudgesMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/judges"),
    ApiName.of[services.events.api.PostEventsByIdJudgesMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/judges"),
    ApiName.of[services.events.api.PostMatchesByIdReplayMessage] -> ResourceAlias(org.http4s.Method.POST, "/matches/:id/replay"),
    ApiName.of[services.events.api.PostMatchesByIdAppealsMessage] -> ResourceAlias(org.http4s.Method.POST, "/matches/:id/appeals"),
    ApiName.of[services.events.api.GetEventsByIdAppealsMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/appeals"),
    ApiName.of[services.events.api.PostAppealsByIdDecisionMessage] -> ResourceAlias(org.http4s.Method.POST, "/appeals/:id/decision"),
    ApiName.of[services.events.api.PostEventsByIdEvidenceMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/evidence"),
    ApiName.of[services.events.api.GetEventsByIdStagesMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/stages"),
    ApiName.of[services.events.api.PostEventsByIdStagesBySidQualificationMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/stages/:sid/qualification"),
    ApiName.of[services.events.api.PostEventsByIdGenerateMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/generate"),
    ApiName.of[services.events.api.GetMatchesByIdPermissionsMessage] -> ResourceAlias(org.http4s.Method.GET, "/matches/:id/permissions"),
    ApiName.of[services.events.api.GetMatchesByIdMessage] -> ResourceAlias(org.http4s.Method.GET, "/matches/:id"),
    ApiName.of[services.events.api.GetMatchesByIdScoresMessage] -> ResourceAlias(org.http4s.Method.GET, "/matches/:id/scores"),
    ApiName.of[services.events.api.PostMatchesByIdDraftActionsMessage] -> ResourceAlias(org.http4s.Method.POST, "/matches/:id/draft-actions"),
    ApiName.of[services.events.api.PostMatchesByIdFinalizeMessage] -> ResourceAlias(org.http4s.Method.POST, "/matches/:id/finalize"),
    ApiName.of[services.events.api.PostMatchesByIdRevealMessage] -> ResourceAlias(org.http4s.Method.POST, "/matches/:id/reveal"),
    ApiName.of[services.events.api.GetEventsByIdAttemptsMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/attempts"),
    ApiName.of[services.events.api.PostEventsByIdAttemptsMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/attempts"),
    ApiName.of[services.events.api.PostAttemptsByIdReviewMessage] -> ResourceAlias(org.http4s.Method.POST, "/attempts/:id/review"),
    ApiName.of[services.events.api.GetEventsByIdRankingsMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/rankings"),
    ApiName.of[services.events.api.PostEventsByIdQualifierOrderMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/qualifier-order"),
    ApiName.of[services.events.api.GetEventsByIdVersionsMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/versions"),
    ApiName.of[services.events.api.GetEventsByIdVersionsByVersionMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/versions/:version"),
    ApiName.of[services.events.api.PostEventsByIdArchiveMessage] -> ResourceAlias(org.http4s.Method.POST, "/events/:id/archive"),
    ApiName.of[services.events.api.GetEventsByIdAuditMessage] -> ResourceAlias(org.http4s.Method.GET, "/events/:id/audit"),
    ApiName.of[services.events.api.EvidenceReadMessage] -> ResourceAlias(org.http4s.Method.GET, "/evidence/:id")
  )
  def apply(connection: Connection): HttpRoutes[IO] =
    val identity = new services.identity.routes.IdentityBoundary(connection)
    import identity.*
    def respond[A: io.circe.Encoder](value: IO[A]): IO[Response[IO]] = value.flatMap(v => Ok(v.asJson))
    HttpRoutes.of[IO] {
      case req @ POST -> Root / "api" / "matches" / id / "reset" => for
        user <- write(req)
        input <- req.asJsonDecode[services.events.objects.apiTypes.MatchResetInput]
        response <- respond(PostMatchesByIdResetMessage(id,user,input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "elimination-groups" / id / "reset" => for
        user <- write(req)
        input <- req.asJsonDecode[services.events.objects.apiTypes.MatchResetInput]
        response <- respond(PostEliminationGroupsByIdResetMessage(id,user,input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "ranking-board" => for
        viewer <- current(req)
        response <- respond(GetEventsByIdRankingBoardMessage(id,viewer.map(_.user.id)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "ranking-control" => for
        user <- write(req)
        input <- req.asJsonDecode[services.events.objects.apiTypes.RankingControlInput]
        response <- respond(PostEventsByIdRankingControlMessage(id,user,input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "elimination-groups" => for
        viewer <- current(req)
        response <- respond(GetEventsByIdEliminationGroupsMessage(id,viewer.map(_.user.id)).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "elimination-groups" / id => for
        viewer <- current(req)
        response <- respond(GetEliminationGroupsByIdMessage(id,viewer.map(_.user.id)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "elimination-groups" / id / "finalize" => for
        user <- write(req)
        input <- req.asJsonDecode[services.events.objects.apiTypes.EliminationFinalizeInput]
        response <- respond(PostEliminationGroupsByIdFinalizeMessage(id,user,input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "team-formation" => for
        viewer <- current(req)
        response <- respond(GetEventsByIdTeamFormationMessage(id,viewer.map(_.user.id)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "team-candidates" => for
        user <- write(req)
        input <- req.asJsonDecode[services.events.objects.apiTypes.TeamCandidateInput]
        response <- respond(PostEventsByIdTeamCandidatesMessage(id,user,input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "captains" / "apply" => for
        user <- write(req)
        input <- req.asJsonDecode[services.events.objects.apiTypes.TeamCandidateInput]
        response <- respond(PostEventsByIdCaptainsApplyMessage(id,user,input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "captains" / "decision" => for
        user <- write(req)
        input <- req.asJsonDecode[services.events.objects.apiTypes.CaptainDecisionInput]
        response <- respond(PostEventsByIdCaptainsDecisionMessage(id,user,input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "captains" / "draw" => for
        user <- write(req)
        response <- respond(PostEventsByIdCaptainsDrawMessage(id,user).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "team-draft" / "start" => for
        user <- write(req)
        response <- respond(PostEventsByIdTeamDraftStartMessage(id,user).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "team-draft" / "pick" => for
        user <- write(req)
        input <- req.asJsonDecode[services.events.objects.apiTypes.TeamPickInput]
        response <- respond(PostEventsByIdTeamDraftPickMessage(id,user,input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "teams" / "random" => for
        user <- write(req)
        response <- respond(PostEventsByIdTeamsRandomMessage(id,user).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "teams" / tid / "join" => for
        user <- write(req)
        response <- respond(PostEventsByIdTeamsByTidJoinMessage(id,tid,user).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "teams" / "leave" => for
        user <- write(req)
        response <- respond(PostEventsByIdTeamsLeaveMessage(id,user).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "library" / "artwork" => for
        user <- write(req)
        response <- respond(PostLibraryArtworkMessage(user,req.body).plan(connection))
      yield response
      case req @ PUT -> Root / "api" / "library" / "artwork" => for
        user <- write(req)
        input <- req.asJsonDecode[LibraryArtworkInput]
        response <- respond(PutLibraryArtworkMessage(user,input).plan(connection))
      yield response
      case GET -> Root / "api" / "artwork" / key => for
        file <- GetArtworkByKeyMessage(key).plan(connection)
      yield Response[IO](Status.Ok).withBodyStream(fs2.io.file.Files[IO].readAll(fs2.io.file.Path.fromNioPath(SystemConfig.root.resolve(".local/artwork").resolve(file.key)))).putHeaders(Header.Raw(CIString("Content-Type"),file.mime),Header.Raw(CIString("Cache-Control"),"public, max-age=31536000, immutable"),Header.Raw(CIString("X-Content-Type-Options"),"nosniff"))
      case req @ GET -> Root / "api" / "library" => for
        authenticated <- auth(req)
        response <- respond(GetLibraryMessage(authenticated.user, req.params.getOrElse("game", "paradigm-reboot")).plan(connection))
      yield response
      case req @ PUT -> Root / "api" / "library" => for
        user <- write(req)
        input <- req.asJsonDecode[LibraryImportInput]
        response <- respond(PutLibraryMessage(user,input).plan(connection))
      yield response
      case req @ PUT -> Root / "api" / "events" / id / "pool" => for
        user <- write(req)
        input <- req.asJsonDecode[PoolAssignmentInput]
        response <- respond(PutEventsByIdPoolMessage(id,user,input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "instance" / "event" => for
        user <- write(req)
        input <- req.asJsonDecode[EventInput]
        response <- respond(PostInstanceEventMessage(user, input).plan(connection))
      yield response

      case GET -> Root / "api" / "events" => Gone(ApiError("SINGLE_EVENT_ONLY","本部署只有一场赛事，请读取 /api/instance").asJson)
      case POST -> Root / "api" / "events" => Gone(ApiError("SINGLE_EVENT_ONLY","请使用本实例的配置入口").asJson)
      case req @ GET -> Root / "api" / "events" / id => for
        viewer <- current(req)
        response <- respond(GetEventsByIdMessage(id, viewer.map(_.user.id)).plan(connection))
      yield response
      case req @ PUT -> Root / "api" / "events" / id => for
        user <- write(req)
        input <- req.asJsonDecode[EventInput]
        response <- respond(PutEventsByIdMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "validate" => for
        user <- write(req)
        response <- respond(PostEventsByIdValidateMessage(id, user).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "simulate" => for
        user <- write(req)
        response <- respond(PostEventsByIdSimulateMessage(id, user).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "publish" => for
        user <- write(req)
        input <- req.asJsonDecode[VersionInput]
        response <- respond(PostEventsByIdPublishMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "reopen" => for
        user <- write(req)
        input <- req.asJsonDecode[VersionInput]
        response <- respond(PostEventsByIdReopenMessage(id, user, input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "pool" => for
        viewer <- current(req)
        response <- respond(GetEventsByIdPoolMessage(id, viewer.map(_.user), req.params).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "entries" => for
        viewer <- current(req)
        response <- respond(GetEventsByIdEntriesMessage(id, viewer.map(_.user)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "entries" => for
        user <- write(req)
        input <- req.asJsonDecode[EntryInput]
        response <- respond(PostEventsByIdEntriesMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "entries" / id / "review" => for
        user <- write(req)
        input <- req.asJsonDecode[ReviewInput]
        response <- respond(PostEntriesByIdReviewMessage(id, user, input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "schedule" => for
        viewer <- current(req)
        response <- respond(GetEventsByIdScheduleMessage(id, viewer.map(_.user)).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "teams" => for
        viewer <- current(req)
        response <- respond(GetEventsByIdTeamsMessage(id, viewer.map(_.user)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "teams" => for
        user <- write(req)
        input <- req.asJsonDecode[TeamInput]
        response <- respond(PostEventsByIdTeamsMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "teams" / "join" => for
        user <- write(req)
        input <- req.asJsonDecode[TeamInput]
        response <- respond(PostEventsByIdTeamsJoinMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "matches" / id / "lineups" => for
        user <- write(req)
        input <- req.asJsonDecode[LineupInput]
        response <- respond(PostMatchesByIdLineupsMessage(id, user, input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "matches" / id / "lineups" => for
        viewer <- current(req)
        response <- respond(GetMatchesByIdLineupsMessage(id, viewer.map(_.user)).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "judges" => for
        authenticated <- auth(req)
        response <- respond(GetEventsByIdJudgesMessage(id, authenticated.user).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "judges" => for
        user <- write(req)
        input <- req.asJsonDecode[JudgeInput]
        response <- respond(PostEventsByIdJudgesMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "matches" / id / "replay" => for
        user <- write(req)
        input <- req.asJsonDecode[MatchDecision]
        response <- respond(PostMatchesByIdReplayMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "matches" / id / "appeals" => for
        user <- write(req)
        input <- req.asJsonDecode[AppealInput]
        response <- respond(PostMatchesByIdAppealsMessage(id, user, input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "appeals" => for
        authenticated <- auth(req)
        viewer <- current(req)
        response <- respond(GetEventsByIdAppealsMessage(id, authenticated.user, viewer.map(_.user)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "appeals" / id / "decision" => for
        user <- write(req)
        input <- req.asJsonDecode[AppealDecision]
        response <- respond(PostAppealsByIdDecisionMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "evidence" => for
        user <- write(req)
        filename <- IO.fromOption(req.headers.get(CIString("X-File-Name")).map(_.head.value))(new IllegalArgumentException("Missing filename")).flatMap(s => IO(java.net.URLDecoder.decode(s,"UTF-8")).handleError(_ => "evidence"))
        response <- respond(PostEventsByIdEvidenceMessage(id, user, req.body, filename).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "evidence" / id => for
        u <- auth(req); file <- EvidenceReadMessage(u.user,id).plan(connection)
      yield Response[IO](Status.Ok).withBodyStream(fs2.io.file.Files[IO].readAll(fs2.io.file.Path.fromNioPath(SystemConfig.root.resolve(".local/evidence").resolve(file.id)))).putHeaders(Header.Raw(CIString("Content-Type"),file.mime),Header.Raw(CIString("Content-Disposition"),"inline; filename=evidence"),Header.Raw(CIString("Cache-Control"),"private, no-store"),Header.Raw(CIString("X-Content-Type-Options"),"nosniff"))
      case req @ GET -> Root / "api" / "events" / id / "stages" => for
        viewer <- current(req)
        response <- respond(GetEventsByIdStagesMessage(id, viewer.map(_.user)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "stages" / sid / "qualification" => for
        user <- write(req)
        input <- req.asJsonDecode[QualificationInput]
        response <- respond(PostEventsByIdStagesBySidQualificationMessage(id, sid, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "generate" => for
        user <- write(req)
        input <- req.asJsonDecode[VersionInput]
        response <- respond(PostEventsByIdGenerateMessage(id, user, input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "matches" / id / "permissions" => for
        authenticated <- auth(req)
        response <- respond(GetMatchesByIdPermissionsMessage(id, authenticated.user).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "elimination-groups" / id / "clock" => for
        viewer <- current(req)
        response <- respond(GetEliminationGroupsByIdClockMessage(id,viewer.map(_.user.id)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "elimination-groups" / id / "clock" => for
        user <- write(req)
        input <- req.asJsonDecode[services.events.objects.apiTypes.MatchClockInput]
        response <- respond(PostEliminationGroupsByIdClockMessage(id,user,input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "matches" / id / "clock" => for
        viewer <- current(req)
        response <- respond(GetMatchesByIdClockMessage(id,viewer.map(_.user.id)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "matches" / id / "clock" => for
        user <- write(req)
        input <- req.asJsonDecode[services.events.objects.apiTypes.MatchClockInput]
        response <- respond(PostMatchesByIdClockMessage(id,user,input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "matches" / id => for
        viewer <- current(req)
        response <- respond(GetMatchesByIdMessage(id, viewer.map(_.user.id)).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "matches" / id / "scores" => for
        viewer <- current(req)
        response <- respond(GetMatchesByIdScoresMessage(id, viewer.map(_.user)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "matches" / id / "draft-actions" => for
        user <- write(req)
        input <- req.asJsonDecode[DraftInput]
        response <- respond(PostMatchesByIdDraftActionsMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "matches" / id / "finalize" => for
        user <- write(req)
        input <- req.asJsonDecode[VersionInput]
        response <- respond(PostMatchesByIdFinalizeMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "matches" / id / "reveal" => for
        user <- write(req)
        input <- req.asJsonDecode[VersionInput]
        response <- respond(PostMatchesByIdRevealMessage(id, user, input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "attempts" => for
        authenticated <- auth(req)
        viewer <- current(req)
        response <- respond(GetEventsByIdAttemptsMessage(id, authenticated.user, viewer.map(_.user)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "attempts" => for
        user <- write(req)
        input <- req.asJsonDecode[AttemptInput]
        response <- respond(PostEventsByIdAttemptsMessage(id, user, input).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "attempts" / id / "review" => for
        user <- write(req)
        input <- req.asJsonDecode[ReviewInput]
        response <- respond(PostAttemptsByIdReviewMessage(id, user, input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "rankings" => for
        viewer <- current(req)
        response <- respond(GetEventsByIdRankingsMessage(id, viewer.map(_.user)).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "qualifier-order" => for
        user <- write(req)
        input <- req.asJsonDecode[QualificationInput]
        response <- respond(PostEventsByIdQualifierOrderMessage(id, user, input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "versions" => for
        authenticated <- auth(req)
        response <- respond(GetEventsByIdVersionsMessage(id, authenticated.user).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "versions" / IntVar(version) => for
        authenticated <- auth(req)
        response <- respond(GetEventsByIdVersionsByVersionMessage(id, version, authenticated.user).plan(connection))
      yield response
      case req @ POST -> Root / "api" / "events" / id / "archive" => for
        user <- write(req)
        input <- req.asJsonDecode[VersionInput]
        response <- respond(PostEventsByIdArchiveMessage(id, user, input).plan(connection))
      yield response
      case req @ GET -> Root / "api" / "events" / id / "audit" => for
        authenticated <- auth(req)
        response <- respond(GetEventsByIdAuditMessage(id, authenticated.user).plan(connection))
      yield response
    }
