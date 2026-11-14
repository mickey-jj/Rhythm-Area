# API · 单赛事实例

2026-11-01：前端已切换为 `/api/rpc/<derived-name>`，名称由 Message/API 类型按统一规则派生。下表是保留的资源接口别名，行为与权限不变；准确对应见 [api-contracts.json](api-contracts.json)。注册由各服务的 Routes 拥有，顶层仅合并。详细结构见 [整改记录](remediation-2026-11-01.md)。

统一前缀 /api。本期中作业默认网页 5184 同源代理到 API 8092；instance.config.json 可配置本机端口。所有写请求要求受信任 Origin；登录后还要 X-Area-CSRF。HttpOnly / SameSite=Strict 会话 Cookie 名称随数据库连接标识隔离，GET /me 返回当前用户与 CSRF 令牌。

错误对象为 {code,message,fieldPath,currentVersion}。未认证 401、越权 403、不存在/未公开/非当前绑定 ID 为 404、状态及版本冲突 409。

## 比赛计时（2026-11-08）

单场重置：`POST /matches/:id/reset` 与 `POST /elimination-groups/:id/reset`，输入 `{expectedVersion,reason}`，版本为比赛 / 晋级轮版本，原因必填。仅当前赛事主办有权执行；裁判账号不能调用重置接口。保留选禁与阵容快照、旧成绩和审计记录，旧成绩标记 superseded；清除当前选禁、阵容、加赛与胜者，回到首曲 / 第一项 BP，计时 ready，必须再次开赛。尚未开赛的依赖场次回到等待来源；已经开赛、选禁或交分的依赖场次、已生成后续阶段会阻止上游重置，返回 409。已归档与历史赛程只读。双败 F1 重置会将尚未开始的 F2 留作历史，在需要时生成新 F2。接口现共 84 个，迁移仍为 11。

每个 StagePlan 及有效 RuleSet 可包含 `timing:{draftSeconds:60,chartSeconds:240}`，两项均为 1–86400 的整数秒。每次 BP 行动使用 draftSeconds，每首演奏及交分使用 chartSeconds。旧配置允许 timing 缺省；未启用的旧场次兼容原交分流程，首次实际开赛后执行服务器计时校验。仅更改 timing 不重排赛程。

| 接口 | 行为与权限 |
| --- | --- |
| GET /matches/:id/clock | 当前赛事可见场次的计时，返回 MatchClockBoard；不泄漏未审成绩 |
| POST /matches/:id/clock | 主办或本场授权裁判；显式 start / pause / resume / restart / next |
| GET /elimination-groups/:id/clock | 多人同曲晋级轮的共享计时 |
| POST /elimination-groups/:id/clock | 主办或赛事裁判控制同曲晋级轮；下一曲要求所有参赛方的本曲已审且没有待审记录 |

写入为 `{action,expectedVersion}`，expectedVersion 使用 **clock.version**，不使用 match.version。响应为 `{clock,serverNow,enabled,canManage}`；clock 包含 matchId、phaseKey、chartIndex（从 0 起）、status、remainingMs、endsAt、version、policy。serverNow / endsAt 均为 Unix 毫秒，status 为 ready / running / paused / expired / finished。过期版本、暂停或到时的非法交分与 BP 均返回 409，越权控制返回 403。

start 只允许 ready；pause 只允许 running；resume 只允许 paused；restart 只允许 paused / expired；next 只允许演奏阶段且有下一曲，当前曲须全部审核完毕且没有待审记录。到时等待裁判，不自动选曲或判负。暂停保存剩余时间；恢复沿用当前时长，重新计时与下一曲读取最新有效阶段时长。

开启逐曲计时后，`POST /events/:id/attempts` 的 items / memberScores 使用**截至当前曲的完整累计前缀**。历史已审值与成员名单不可修改，服务器校验前缀、当前曲、计时及阵容；支持个人、团队和同曲晋级轮。`GET /events/:id/attempts` 在原有本人 / 裁判权限内补充 memberScores，供团队回填；公开比分仍仅包含已审成绩。全部曲目审核完成后 clock 变为 finished，赛果仍由裁判显式 finalize。

上述资源别名及 RPC 派生名称见 [api-contracts.json](api-contracts.json)，当前共注册 84 个 API，数据库迁移版本为 11。

## 实例与初始化

| 接口 | 行为 |
| --- | --- |
| GET /health | PostgreSQL 实际 SELECT 1 |
| GET /instance | needsSetup、hasEvent、published、isOwner、可见的当前 event、appearance、demoLoaded；匿名不返回草稿和私有配置 |
| POST /instance/setup | 一次性创建主办并登录；行锁确保并发唯一，不接受已有旧版用户库自动升权 |
| POST /instance/event | 主办定义本部署唯一赛事；第二次返回 SINGLE_EVENT_ONLY |
| GET /instance/export | 主办取得规则/图池/外观/文案白名单 JSON，不包含人员、报名、证据、会话与成绩 |
| POST /instance/demo-data | 主办明确选择载入本地虚构人员，要求未发布、仅主办一位用户、没有报名、从未载入过 |
| GET /templates | 主办配置页的空白与可选本地示例；不向公众提供模板中心 |
| GET /catalog、GET /catalog/snapshot | 主办主动读取可选 PRP 本地元数据，基础启动不依赖该文件 |
| GET /events、POST /events | 已关闭，返回 410；没有多赛事运营 API |

## 当前赛事的业务接口

保留内部 eventId 作为领域关系和记录标识，**只允许当前 instance_settings.event_id**。不能通过猜测另一 ID 读取赛事或比赛。账号存储、报名与审核均属于当前实例数据库。

| 接口 | 行为 |
| --- | --- |
| POST /auth/login、register、logout；GET /me | 本地账号与会话；普通注册在当前赛事发布后开放 |
| GET /events/:id；PUT /events/:id | 查询当前赛事，主办保存配置；修改带 expectedVersion，开赛后允许更改赛制并重排未完成赛程、保留已完成记录 |
| POST /events/:id/validate、simulate、publish | 纯规则校验、相同引擎模拟 BP/曲序、冻结发布 |
| GET /events/:id/pool、entries、rankings、schedule | 当前赛事公开查询；不返回未审名单、证据与私有审核理由 |
| POST /events/:id/entries；POST /entries/:id/review | 当前用户报名、主办审核与理由；开启正赛后名单冻结 |
| POST /events/:id/generate | 带版本生成单败、种子与轮空 |
| GET /matches/:id、/matches/:id/scores | 当前赛事的比赛状态与已审比分；原始证据仍私有 |
| POST /matches/:id/draft-actions | 当前行动方/主办代操作；版本、幂等键、候选集检查；随机结果一次性持久化 |
| POST /events/:id/attempts；GET /events/:id/attempts | 完整有序成绩尝试；只有本人或当前主办可读私有说明 |
| POST /attempts/:id/review | 必须给理由，禁止自审与重复审核 |
| POST /matches/:id/finalize | 带版本；待审拒绝；精确计分，事务内确认并晋级或生成同分加赛 |
| POST /events/:id/archive | 仅已结束赛事、主办和匹配版本；保留结果与审核 |
| GET /events/:id/audit | 仅当前主办读本赛事审计 |

实例定义和保存输入：{name,tagline,description,rules,charts,appearance?,expectedVersion?}。appearance={brandName,accentColor,contact}，颜色必须为 #RRGGBB。发布后 ruleVersion 表示当前已发布规则版本，version 用于当前状态的乐观锁，二者独立。

BP 输入为 {expectedVersion,chartKey,idempotencyKey}。旧版本重试返回 409，不承诺回放原成功响应。交分为 {entryId,matchId,items:[{slotId,value}],evidenceNote}，分数使用十进制字符串；海选 slotId 为 qualifier 子池谱面键，正赛为稳定演奏槽 ID。

已接入下列 v0.3 接口；下游已开始实际操作时的上游改判仍拒绝，以免覆盖实际比赛。

## v0.3 执行与赛务接口

| 接口 | 行为与权限 |
| --- | --- |
| GET /events/:id/stages | 当前阶段运行状态、参与名单、正式名次 |
| POST /events/:id/stages/:stageId/qualification | 主办在同名次组内记录附加赛排序；检查版本与完整名单 |
| POST /events/:id/qualifier-order | 海选资格同分排序；保存成绩快照，原分变化后失效 |
| GET /events/:id/versions；GET /events/:id/versions/:version | 主办读取保存历史与配置；恢复通过新一次 PUT 生成新版本 |
| GET/POST /events/:id/teams；POST /events/:id/teams/join | 建队与邀请码加入；成员唯一性；提交报名后冻结 |
| GET/POST /matches/:id/lineups | 读取/保存逐曲阵容；仅本队队长，版本检查；交分后冻结 |
| POST /events/:id/attempts | 支持 memberScores[{slotId,userId,value}] 和 evidenceId；聚合由服务端执行 |
| POST /events/:id/evidence | 原始文件请求体，X-File-Name 为 URI 编码文件名；5MB、PNG/JPEG/PDF |
| GET /evidence/:id | 上传者与对应裁判私有读取；禁止匿名与无关用户 |
| GET/POST /events/:id/judges | 主办按 username 分配/撤销；可限定 matchId |
| GET /matches/:id/permissions | 本人对当前场的裁判权限 |
| POST /matches/:id/appeals | 本场参赛方提出申诉，理由必填，不可重复待办 |
| GET /events/:id/appeals | 本人或对应裁判可读范围 |
| POST /appeals/:id/decision | uphold/replay/reject；禁止本人处理；记录理由与版本 |
| POST /matches/:id/replay | expectedVersion、reason、可选 winnerId；重赛或有依据改判，保留旧记录 |

GET schedule 返回轻量 MatchSummary，避免循环赛复制整份图池与候选；实际操作前读取 GET /matches/:id 获取版本、合法候选与实际曲序。密封选择在 GET 和 POST 返回中对无权用户遮蔽，候选也不泄漏对手选择。神秘随机曲揭晓前遮蔽公开图池及比赛候选的标题、作者、谱面标识与难度。

请求体硬上限 6MB，证据单文件上限 5MB；JSON 图池仍限制 3000 张，前端导入文件限制 2.5MB。所有写请求继续使用同源、会话和 CSRF 检查。


## 2026-11-07：可修改赛制、团队组队、多人晋级轮

`PUT /events/:id` 接受运行中规则修改；使用 expectedVersion。实际规则或分池成员变更重排未完成赛程，历史结果通过原比赛 ID 读取。比赛返回 scheduleState=current/historical，原曲目快照保留。完整行为和样例见 midterm-teams-double-2026-11-07.md。

TeamPolicy 可选字段：captainSelection=random/appointed/application/free，formation=free/draft/random，captainCount，draftOrder=snake/round-robin。缺省保持原自由组队行为。

- GET /events/:id/team-formation：队伍、候选选手、轮选状态与当前选人队伍。
- POST /events/:id/team-candidates：{note}，加入候选名单或更新公开简介。
- POST /events/:id/captains/apply：{note}；POST /events/:id/captains/decision：{userId,decision:approved/rejected}。
- POST /events/:id/captains/draw：主办随机抽取队长，抽取后不能重复重抽。
- POST /events/:id/team-draft/start：主办开始轮选；POST /events/:id/team-draft/pick：{userId,expectedVersion}。
- POST /events/:id/teams/random：主办随机均衡分队；POST /events/:id/teams/:tid/join：在公开大厅加入队伍；POST /events/:id/teams/leave：未报名普通成员退队。
- GET /events/:id/elimination-groups：多人晋级轮；GET /elimination-groups/:id：共同曲目、参赛方、已审核成绩及权限。
- 原成绩提交接口可增加 groupId，且不能同时传 matchId；沿用审核、证据与逐人成绩。多人轮成绩不会混入初始海选排名。
- POST /elimination-groups/:id/finalize：{expectedVersion,order,reason}。全部成绩完整且无待审才可确认；同分须填写依据，禁止越过确定名次。

所有新增接口保留同名规则派生的 RPC 入口，对应消息清单见 api-contracts.json。

### 排名赛阶段与实时榜单（2026-11-08）

`Stage.ranking` 可选：`{startMode,endMode,startAt,deadline,durationSeconds,targetCount,targetScore}`。开始方式为 `publish/manual/scheduled`；截止方式为 `manual/fixed/duration/threshold`。时间输入采用带时区的 ISO 字符串；运行状态中的 `startedAt/endsAt/closedAt/serverNow` 使用毫秒时间戳。旧 `windows.qualifierClose` 在未配置阶段策略时仍可解码，编辑器将其移入该排名赛阶段。

- `GET /events/:id/ranking-board`：返回阶段、服务器时间、运行状态、达标方数、已审排行榜和管理权限；待审分值与证据不公开。运行状态为 `waiting/open/closed`。
- `POST /events/:id/ranking-control`：主办使用 `{action:start/close/reopen,expectedVersion}` 开始、停止或重新开放收分；版本属于排名赛运行状态，不是赛事配置版本。
- 自动截止由服务端统一核对；达标计数仅含完整已审成绩，同一报名方只计一次。停止状态保持，除非主办明确重新开放；重新开放须满足当前截止条件尚未达成。
- `POST /events/:id/generate`：结束收分后先审核待审记录，再按完整成绩确认排名；手动截止的旧赛制全员完成时可直接确认。实际报名不足容量时，按实际名额处理。未完成者不晋级，历史成绩与待审证据保留。
- `StagePlan` 增加可选 `draftMode`、`tieBreak`；对局阶段直接拥有完整规则。旧缺省字段按原有效规则读取，语义相同的展开不会触发赛程重排。仅调整图池标记顺序也不会触发重排。
