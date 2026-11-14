package services.system.api
import cats.effect.IO
import cats.syntax.all.*
import java.sql.Connection
import services.system.tables.schema_migrations.SchemaMigrationsTable
final case class InitializeDatabaseMessage() extends NoRequestMessage[Unit]:
  def plan(connection: Connection): IO[Unit] = for
    exists <- SchemaMigrationsTable.exists(connection)
    _ <- if exists then IO.unit else
      services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV1(connection) *>
        services.identity.tables.users.UsersTableInitializer.initializeV1(connection) *>
        services.identity.tables.sessions.SessionsTableInitializer.initializeV1(connection) *>
        services.events.tables.events.EventsTableInitializer.initializeV1(connection) *>
        services.events.tables.rule_revisions.RuleRevisionsTableInitializer.initializeV1(connection) *>
        services.events.tables.pool_entries.PoolEntriesTableInitializer.initializeV1(connection) *>
        services.events.tables.entries.EntriesTableInitializer.initializeV1(connection) *>
        services.events.tables.matches.MatchesTableInitializer.initializeV1(connection) *>
        services.events.tables.draft_actions.DraftActionsTableInitializer.initializeV1(connection) *>
        services.events.tables.play_slots.PlaySlotsTableInitializer.initializeV1(connection) *>
        services.events.tables.attempts.AttemptsTableInitializer.initializeV1(connection) *>
        services.events.tables.attempt_items.AttemptItemsTableInitializer.initializeV1(connection) *>
        services.events.tables.reviews.ReviewsTableInitializer.initializeV1(connection) *>
        services.events.tables.results.ResultsTableInitializer.initializeV1(connection) *>
        services.events.tables.audit_logs.AuditLogsTableInitializer.initializeV1(connection)
    v2 <- SchemaMigrationsTable.applied(connection,2)
    _ <- if v2 then IO.unit else
      services.instance.tables.instance_settings.InstanceSettingsTableInitializer.initializeV2(connection) *>
        services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV2(connection)
    v3 <- SchemaMigrationsTable.applied(connection,3)
    _ <- if v3 then IO.unit else
      services.events.tables.matches.MatchesTableInitializer.initializeV3(connection) *>
        services.events.tables.competition_stages.CompetitionStagesTableInitializer.initializeV3(connection) *>
        services.identity.tables.event_judges.EventJudgesTableInitializer.initializeV3(connection) *>
        services.identity.tables.judge_grants.JudgeGrantsTableInitializer.initializeV3(connection) *>
        services.events.tables.appeals.AppealsTableInitializer.initializeV3(connection) *>
        services.events.tables.teams.TeamsTableInitializer.initializeV3(connection) *>
        services.events.tables.team_members.TeamMembersTableInitializer.initializeV3(connection) *>
        services.events.tables.lineups.LineupsTableInitializer.initializeV3(connection) *>
        services.events.tables.evidence_files.EvidenceFilesTableInitializer.initializeV3(connection) *>
        services.events.tables.attempts.AttemptsTableInitializer.initializeV3(connection) *>
        services.events.tables.attempt_items.AttemptItemsTableInitializer.initializeV3(connection) *>
        services.events.tables.match_history.MatchHistoryTableInitializer.initializeV3(connection) *>
        services.events.tables.attempt_member_scores.AttemptMemberScoresTableInitializer.initializeV3(connection) *>
        services.events.tables.qualification_orders.QualificationOrdersTableInitializer.initializeV3(connection) *>
        services.events.tables.qualifier_snapshots.QualifierSnapshotsTableInitializer.initializeV3(connection) *>
        services.events.tables.draft_history.DraftHistoryTableInitializer.initializeV3(connection) *>
        services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV3(connection)
    v4 <- SchemaMigrationsTable.applied(connection,4)
    _ <- if v4 then IO.unit else
      services.events.tables.chart_reveals.ChartRevealsTableInitializer.initializeV4(connection) *>
        services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV4(connection)
    v5 <- SchemaMigrationsTable.applied(connection,5)
    _ <- if v5 then IO.unit else
      services.events.tables.chart_library.ChartLibraryTableInitializer.initializeV5(connection) *>
        services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV5(connection)
    v6 <- SchemaMigrationsTable.applied(connection,6)
    _ <- if v6 then IO.unit else
      services.events.tables.matches.MatchesTableInitializer.initializeV6(connection) *>
        services.events.tables.competition_stages.CompetitionStagesTableInitializer.initializeV6(connection) *>
        services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV6(connection)
    v7 <- SchemaMigrationsTable.applied(connection,7)
    _ <- if v7 then IO.unit else
      services.events.tables.team_candidates.TeamCandidatesTableInitializer.initializeV7(connection) *>
        services.events.tables.team_drafts.TeamDraftsTableInitializer.initializeV7(connection) *>
        services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV7(connection)
    v8 <- SchemaMigrationsTable.applied(connection,8)
    _ <- if v8 then IO.unit else
      services.events.tables.elimination_groups.EliminationGroupsTableInitializer.initializeV8(connection) *>
        services.events.tables.attempts.AttemptsTableInitializer.initializeV8(connection) *>
        services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV8(connection)
    v9 <- SchemaMigrationsTable.applied(connection,9)
    _ <- if v9 then IO.unit else
      services.events.tables.ranking_sessions.RankingSessionsTableInitializer.initializeV9(connection) *>
        services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV9(connection)
    v10 <- SchemaMigrationsTable.applied(connection,10)
    _ <- if v10 then IO.unit else services.events.tables.match_clocks.MatchClocksTableInitializer.initializeV10(connection) *> services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV10(connection)
    v11 <- SchemaMigrationsTable.applied(connection,11)
    _ <- if v11 then IO.unit else services.events.tables.group_clocks.GroupClocksTableInitializer.initializeV11(connection) *> services.system.tables.schema_migrations.SchemaMigrationsTableInitializer.initializeV11(connection)
  yield ()
