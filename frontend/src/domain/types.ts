import type { RankingPolicy } from "./ranking";
export type BracketKind = "winners" | "losers" | "final" | "reset" | "round-robin";
export type ReviewDecision = "accepted" | "approved" | "rejected";
export type AppealDecisionKind = "uphold" | "replay" | "reject";
export type Actor = "A" | "B" | "referee";
export type Action = "ban" | "pick" | "random" | "assign" | "remove";
export type EntryMode = "solo" | "team";
export type StageKind = "ranking" | "single" | "double" | "round-robin";
export type MatchMode = "total" | "first-to";
export type QualifierSelection = "whole-best" | "per-chart-best" | "last-approved";
export type PendingPolicy = "retain" | "hide";
export type DraftMode = "open" | "sealed";
export type TiePolicy = "extra" | "manual";
export type TieScope = "extra-only" | "cumulative";
export type FinalPolicy = "normal" | "reset" | "advantage";
export type Aggregation = "sum" | "average";
export type EventStatus = "draft" | "registration" | "running" | "completed" | "archived";
export type EntryStatus = "pending" | "accepted" | "rejected" | "withdrawn";
export type MatchStatus = "waiting" | "drafting" | "awaiting-reveal" | "playing" | "finalized" | "bye" | "empty" | "cancelled";
export type AttemptStatus = "pending" | "approved" | "rejected" | "superseded";
export type StageStatus = "pending" | "running" | "completed" | "qualification-tie";

export type Metric = {
  name: string;
  unit: string;
  decimals: number;
  minimum: string;
  maximum: string;
  higherWins: boolean;
};
export type DraftStep = {
  id: string;
  actor: Actor;
  action: Action;
  count: number;
  pool: string;
  banApplies: boolean;
  target: "pool" | "picked";
};
export type Chart = {
  game_key: string;
  game_version: string;
  song_key: string;
  title: string;
  artist: string;
  chart_key: string;
  chart_type: string;
  difficulty_label: string;
  level_value: number | null;
  pool_tag: string;
  role: string;
  display_order: number;
  cover_url?: string | null;
};
export type RuleSet = {
  schemaVersion: number;
  gameKey: string;
  gameName: string;
  clientVersion: string;
  entryMode: EntryMode;
  capacity: number;
  metric: Metric;
  qualifierSelection: QualifierSelection;
  pendingPolicy: PendingPolicy;
  matchMode: MatchMode;
  winsRequired: number;
  stages: {
    id: string;
    name: string;
    kind: StageKind;
    advance: number;
    plan?: StagePlan | null;
    ranking?: RankingPolicy | null;
  }[];
  draft: DraftStep[];
  playOrder: { id: string; source: string }[];
  resolution: {
    tie: TiePolicy;
    extraPool: string;
    extraCount: number;
    scope: TieScope;
    maxExtraRounds: number;
    finalPolicy: FinalPolicy;
  };
  team: {
    captainSelection?: "random" | "appointed" | "application" | "free" | null;
    formation?: "free" | "draft" | "random" | null;
    captainCount?: number | null;
    draftOrder?: "snake" | "round-robin" | null;
    min: number;
    max: number;
    perChart: number;
    maxAppearances: number;
    aggregation: Aggregation;
  };
  windows?: {
    registrationOpen: string | null;
    registrationClose: string | null;
    qualifierClose: string | null;
  } | null;
  draftMode?: DraftMode | null;
  tieBreak?: string[] | null;
  initialWinsA?: number | null;
  timing?: {draftSeconds:number;chartSeconds:number} | null;
};
export type StagePlan = Pick<
  RuleSet,
  "metric" | "matchMode" | "winsRequired" | "draft" | "playOrder" | "resolution" | "draftMode" | "tieBreak" | "timing"
>;
export type Event = {
  id: string;
  ownerId: string;
  name: string;
  tagline: string;
  description: string;
  status: EventStatus;
  rules: RuleSet;
  version: number;
  demo: boolean;
  ruleVersion: number;
  poolCount: number;
  entryCount: number;
};
export type EventInput = Pick<
  Event,
  "name" | "tagline" | "description" | "rules"
> & { charts: Chart[]; expectedVersion?: number; appearance?: Appearance };
export type Template = {
  id: string;
  name: string;
  description: string;
  rules: RuleSet;
  charts: Chart[];
  presetLabel?: string;
  tagline?: string;
  appearance?: Appearance;
};
export type Appearance = {
  brandName: string;
  accentColor: string;
  contact: string;
};
export type Instance = {
  needsSetup: boolean;
  hasEvent: boolean;
  published: boolean;
  isOwner: boolean;
  isJudge: boolean;
  event: Event | null;
  appearance: Appearance;
  demoLoaded: boolean;
};
export type User = { id: string; username: string; displayName: string };
export type Session = { user: User; csrf: string };
export type Entry = {
  id: string;
  eventId: string;
  userId: string;
  displayName: string;
  status: EntryStatus;
  seed: number | null;
  reason: string;
};
export type Issue = { fieldPath: string; message: string };
export type Validation = { valid: boolean; issues: Issue[]; summary: string[] };
export type DraftAction = {
  stepId: string;
  actor: Actor;
  action: Action;
  chartKey: string;
  slotId: string;
};
export type Match = {
  scheduleState?: "current" | "historical";
  stageKind?: StageKind;
  id: string;
  eventId: string;
  round: number;
  ordinal: number;
  a: Entry | null;
  b: Entry | null;
  winnerId: string | null;
  status: MatchStatus;
  version: number;
  extraRound: number;
  rules: RuleSet;
  actions: DraftAction[];
  slots: {
    id: string;
    chartKey: string;
    ordinal: number;
    extraRound: number;
  }[];
  candidates: Chart[];
  currentStep: DraftStep | null;
  stageId: string;
  stageName: string;
  bracket: BracketKind;
  generation: number;
};
export type Attempt = {
  submittedAt?: number | null;
  memberScores?:{slotId:string;userId:string;value:string}[];
  groupId?: string | null;
  id: string;
  eventId: string;
  matchId: string | null;
  entryId: string;
  displayName: string;
  submittedBy: string;
  status: AttemptStatus;
  sequence: number;
  evidenceNote: string;
  evidenceId: string | null;
  items: { slotId: string; value: string }[];
  reason: string | null;
};
export type Ranking = {
  entry: Entry;
  total: string | null;
  complete: boolean;
  rank: number | null;
};
export type Audit = { id: number; action: string; detail: string; at: string };
export const statusNames: Record<string, string> = {
  draft: "草稿",
  registration: "报名中",
  running: "进行中",
  completed: "已结束",
  archived: "已归档",
  pending: "待审核",
  accepted: "已通过",
  rejected: "已驳回",
  withdrawn: "已撤回",
  approved: "已通过",
  waiting: "等待对手",
  drafting: "选禁曲中",
  playing: "演奏 / 交分",
  "awaiting-reveal": "等待裁判揭晓",
  finalized: "已确认",
  bye: "轮空晋级",
  empty: "空分支",
  superseded: "已由重赛替代",
  "qualification-tie": "晋级待定",
};
export const actionNames: Record<string, string> = {
  ban: "禁曲",
  pick: "选曲",
  random: "随机抽曲",
  assign: "裁判指定",
  remove: "删除已选曲",
};
export const actorNames: Record<string, string> = {
  A: "A 方",
  B: "B 方",
  referee: "裁判",
};

export type StageRun = { id: string; name: string; kind: StageKind; status: StageStatus; participants: string[]; placements: { entryId: string; rank: number; wins: number; losses: number }[] };
