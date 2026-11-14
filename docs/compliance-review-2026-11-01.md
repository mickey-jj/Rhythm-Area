# HW2 作业与课程 Markdown 规范审查

> 此报告是整改前审查，以下位置和统计对应旧代码。后续整改见 [2026-11-01 整改记录](remediation-2026-11-01.md)。

审查日期：2026-11-01（Asia/Shanghai）。本次检查代码、交付文件并重跑已有测试；未重构业务代码，未替学生录制视频。

## 结论与依据

**尚未完全满足要求。** 项目已有完整前后端、11 个业务页面、可复现的业务流程及源码包，但“本人录制”的视频交付尚未完成，并且未满足课程要求目录新提供的严格 Markdown 规范。

本次分别核对两套依据，不能混同：

1. `HW2/HW2.txt`：正式作业的直接交付要求；`HW2/REQUIREMENTS.md` 是项目此前按课件整理的解释。
2. `课程要求/scala-react-functional-course/scala-react-functional-course/SKILL.md` 及其 `references/compliance-rules.md`、`backend-scala.md`、`frontend-react.md`、`review-checklist.md`：本次要求检查的严格代码规范。下文“规则 N”均指 `compliance-rules.md` 的编号。

两套说明存在实际冲突：旧 `REQUIREMENTS.md:98` 允许 Scala `Try`，`:248` 说明课件没有普通 CSS 禁令；新 `SKILL.md:28` 明确禁止 Scala `Try`，新规则 55 则指定 Tailwind。**按新增 Markdown 规范验收时，这两项均不合格；不能据此反推原 HW2.txt 或原课件明确写过这些额外禁令。** 新规范里的具体目录、Message 类和逐表文件要求，也不能伪装成 HW2.txt 的原文。

## 作业直接交付要求

| 要求 | 结果 | 核对证据 |
| --- | --- | --- |
| H2-01：软件前后端系统 | 通过本次代码及接口验收 | React/TypeScript 前端；Scala 3、Cats Effect、http4s、Circe、Doobie/PostgreSQL 后端；真实数据库集成测试 |
| H2-02：10 个左右网页 | 已按约 10 页落实 | `frontend/src/main.tsx:42` 起有 11 个业务路由：首页、规则、认证、我的中心、参赛者、图池、海选、赛程、比赛室、配置、赛务后台；未把不同比赛 ID 或准备状态重复计数。原文未定义数量容差，因此不声称老师已正式认定 11 页合格 |
| H2-03：本人录制且不超过 3 分钟 | 未完成 | `docs/demo-script.md:23`、`:28`、`:30` 明确现有文件为浏览器状态采样编码，仍需学生本人亲录。实测 `hw2-demo.mp4` 为 149.375 秒，时长合格；`hw2-verification-full.mp4` 为 566.25 秒，超过 180 秒 |
| H2-04：完整源代码 | 已核对当前源码包 | `deliverables/rhythm-area-source.zip` 含 128 个条目；前后端、迁移、启动脚本、示例、文档齐全。按现有打包规则检查无遗漏，包内文件哈希与本次审查开始时工作目录一致 |
| H2-05：附件不超过 100M | 通过体积检查 | 源码包 1,057,610 字节；演示视频 1,868,263 字节；完整验收视频 2,420,627 字节。三者合计 5,346,500 字节，低于项目采用的保守 100,000,000 字节口径 |

源码包未发现 `.local`、`node_modules`、`target`、`dist`、数据库密码文件或 `.env`。本审查报告是在核对现有包之后新增，尚未加入该包。最终交付应使用本人亲录的合格视频，不应将 566.25 秒的验收视频作为要求中的三分钟使用流程。

## 新增 Markdown 规范的不符合项

### 1. 后端未采用规定的服务目录和 API Message 执行结构

- 规则：2–4、20、22、24、31–33。
- 位置：`backend/src/main/scala/area/Main.scala:54`、`:83`；`events/Service.scala:28`。
- 证据：后端位于 `area/{events,identity,instance,persistence,rules}`，不是规范规定的 `services/<domain>/{api,objects,routes,tables,utils}`；业务操作集中在服务类及 `Main.scala` 中，没有逐操作 `*Message.scala`、`APIMessage[Response]` 和 `plan(connection): IO[Response]`。路由逐条手写字符串，未采用 Message 类型推导名称及每服务一个 `XXRoutes` 的注册结构。
- 最小直接修正：按现有业务职责迁移模块；将已有操作拆为规范指定的 Message，保留其 IO 组合；将路由注册集中到各业务服务的 Routes，再由顶层合并。仅改目录名不能完成此项。

### 2. SQL 与数据表边界未按规范封装

- 规则：7–9、34–38。
- 位置：`backend/src/main/scala/area/Main.scala:37`、`:79`、`:90`、`:241`；`events/Service.scala:30`；`persistence/Repository.scala:15`、`:28`。
- 证据：SQL 分布在启动/路由、业务服务、统一 Repository 等处；迁移由 Main 统一执行；未按每表建立 `XXTable.scala`、`XXTableInitializer.scala`，也没有规定的相邻私有 `*Sql` 和公开 `IO[T]` 操作组合。`Repository.readJson` 等内部辅助方法仍为公开方法。
- 最小直接修正：按表归属抽取 SQL、行映射和初始化，将路由与业务流程改为调用公开表操作；隐藏辅助函数，并保留当前事务原子性。
- 边界说明：Doobie 的 `ConnectionIO` 本身也是效果描述，不能仅因采用 Doobie 就判定“不纯”；本项不合格来自新增规范要求的明确结构和接口形状。

### 3. 数据对象未按 final、单对象单文件及 companion 编解码要求组织

- 规则：14、15、24。
- 位置：`backend/src/main/scala/area/events/Model.scala:4`；`rules/Model.scala:4`；`identity/Identity.scala:9`；`events/Teams.scala:12`。
- 证据：一个 Model.scala 聚合多个业务对象，多数使用普通 `case class`，不是 `final case class`；部分事件/身份结构依赖调用侧 `io.circe.generic.auto.*`，而未在同名 companion 中显式提供编解码；API 专用类型未放入 `objects/apiTypes/`。
- 最小直接修正：按有意义的对象拆文件，类型改为 `final case class`，同名 companion 持有 codecs，分离 API 专用结构。

### 4. 有限状态和领域标识符仍大量使用无区分的 String

- 规则：19；SKILL 的领域类型与封闭状态原则。
- 位置：`backend/src/main/scala/area/events/Model.scala:5`、`:7`、`:16`；`rules/Model.scala:10`、`:14`、`:19`；`frontend/src/domain/types.ts:12`、`:37`、`:47`、`:87`、`:152`。
- 证据：赛事、报名、比赛状态，赛制 kind，行动 actor/action，参赛模式等均为开放字符串。虽然定义了 EventId、EntryId、ChartId、MatchId、RuleVersion 包装，除 EntryId 用于部分对阵计算外，主要业务接口仍接收多个 String，无法由编译器阻止标识符混用。运行时 Set 校验不能代替封闭类型。
- 最小直接修正：Scala 使用 enum/领域 ID，TypeScript 使用字面量联合；在 JSON/SQL 边界做统一转换，使无效状态在进入业务前被拒绝。

### 5. 前端 API 未按业务服务及逐操作类型组织

- 规则：48–53。
- 位置：`frontend/src/api/client.ts:13`；`pages/EventEditorPage.tsx:120`、`:134`。
- 证据：当前以通用 `api<T>(path, method, body?: unknown)` 和页面内手写路径调用服务；没有每个操作对应的具体 API 类、显式请求字段及 `send(): Promise<Response>`，也没有与后端共用的名称推导约定。
- 最小直接修正：保留通用传输、CSRF 与会话逻辑作为基础设施，按服务增加具体操作调用类及响应类型，移除页面内散布的接口路径。

### 6. 复杂页面的目录与状态协调未落实到规定结构

- 规则：40–44、60。
- 位置：`frontend/src/pages/EventEditorPage.tsx:41`、`:59`、`:120`、`:165`、`:267`；`features/event-editor/RulePanels.tsx:646`。
- 证据：配置页虽然已经拆出若干可见区域，但 639 行页面仍同时持有表单、多个异步操作、保存/自动保存逻辑和大量 JSX；页面专属区域放在独立 features 目录，未形成要求的页面目录 `index.tsx/hooks/objects/functions/components`。`busy` 用任意字符串，多组 pending/error/dialog 状态独立组合，未给这个复杂异步页面建立明确状态类型。
- 最小直接修正：将配置页专属代码收归同一页面目录，抽出协调 hook 和纯计算；入口只展示主要区域；为复杂操作建立小而明确的状态联合。此项依据实际混合职责，不是自行发明文件行数上限。

### 7. 样式系统未使用规定的 Tailwind

- 规则：55。
- 位置：`frontend/package.json:12`；`frontend/src/main.tsx:23`；`frontend/src/styles.css:1`。
- 证据：未声明 Tailwind 依赖/集成，主要使用约 6002 行自定义 CSS 和语义 class；这不是一项有必要理由的小范围例外。
- 最小直接修正：若以新增 Markdown 为验收标准，接入 Tailwind 并迁移常规样式，仅保留确有必要且写明理由的 CSS。
- 依据边界：这是新增规则 55 的不符合项；旧 REQUIREMENTS 和原 HW2.txt 不能作为“老师禁止普通 CSS”的证据。

### 8. 前端纯计算仍采用命令式循环与就地累积

- 依据：SKILL 的 Required functional model；`frontend-react.md` 的 Functional React model 与 Pure display calculations。
- 位置：`frontend/src/domain/rules.ts:17`、`:22`、`:30`、`:82`、`:112`、`:126`；`features/event-editor/RulePanels.tsx:655`。
- 证据：CSV 解析使用可重赋值变量、命令式 for、push 累积；导入校验通过 issues.push、seen.add 累积；渲染中的曲序来源也使用 push。未发现这些操作直接改写 React 现有 state，因此不能夸大成已证实的界面状态破坏，但写法不满足新增规范对不可变、声明式转换的要求。
- 最小直接修正：采用返回新状态的解析/校验折叠，错误列表与候选列表使用 map/flatMap/concat/展开组合，保持现有 CSV 转义等测试覆盖。

### 9. Scala 仍使用新增 SKILL 明确禁止的 Try

- 依据：`SKILL.md:28`，没有独立编号。
- 位置：`backend/src/main/scala/area/rules/Engine.scala:3`、`:9`、`:78`、`:80`；`events/Service.scala:22`；`Main.scala:200`。
- 证据：数值/时间解析、窗口判断、文件名解码使用 `scala.util.Try`。
- 最小直接修正：不抛异常的校验/解析使用明确的领域结果；可能抛异常的外部解析放入合适的 IO 错误边界，转换为类型化失败后再交给纯计算，避免只是将 Try 换成 try/catch。
- 依据边界：旧 REQUIREMENTS 明确允许 Try，所以这是新旧规范差异；本次未把它错误归因为原始课件直接禁令。

## 已满足的关键写法与避免误报

- Scala 主源码未搜索到 `var`、`while`、可变集合引用、直接 `try/catch/finally` 或 `unsafeRunSync/unsafeToFuture`。现有 `for ... yield` 主要组合 IO/ConnectionIO，不能按关键字判违规。
- 服务实际使用 Cats Effect/Doobie 组合数据库效果，并有事务、锁和版本检查；不能因架构格式不符就否认其已有函数式效果边界。
- 会话 Zustand store 私有，仅导出 use/set/get 接口；API 传输层使用快照取得 CSRF，渲染订阅使用 Hook，未发现将快照 getter 用作组件渲染订阅。
- React 使用函数组件。主题、字号、滚动的 DOM 同步位于 effect/交互边界，不因出现 document/window 就自动判错。
- `SchedulePage.tsx:76` 的 sort 与 `editorNavigation.ts:34` 的 reverse 前均先复制数组，不是直接修改共享输入；不作为共享状态突变问题报告。
- 正在使用的 `app/`、通用 UI 组件不是无用脚手架；普通 CSS、使用库的版本、Doobie、11 个页面也不应被编造为原 HW2.txt 的独立禁止项。

## 本次实际验证

| 检查 | 本次结果 |
| --- | --- |
| `npm run build`（frontend） | 通过，含 TypeScript 检查和 Vite 生产构建 |
| `node --test scripts/frontend-rules.test.mjs` | 13/13 通过 |
| `./scripts/backend.ps1 test` | 24/24 通过 |
| `./scripts/verify-single.ps1 -Advanced` | 通过，退出码 0：11 组双实例集成、3/5/8 人完整单败，以及 22 个扩展数据库场景全部通过 |
| 源码包检查 | 128 条目，打包范围内无漏文件，与审查前工作文件哈希一致，无已检查的运行数据/依赖目录 |
| 视频检查 | 读取 MP4 时长元数据：149.375 秒、566.25 秒；未重新逐帧审看或解码 |

首次受限执行时前端构建工具不能读取路径、后端脚本不能定位本机 Java/sbt；在可读取本机已有工具的环境下重跑后均通过。这两次环境访问错误未作为项目代码缺陷。

本次不重复声称浏览器视觉验收已重跑；截图和旧浏览器检查记录属于已有证据。集成脚本使用新建隔离测试数据库，测试端口为 8083/8084，默认停止自己创建的 API 进程并保留测试库。

## 建议处理顺序

1. 完成本人真实操作录屏，确保不超过 180 秒；这是直接交付要求的剩余项。
2. 按新增规则重组后端 Message、Routes 和逐表边界，保持现有事务及测试结果。
3. 落实领域类型、封闭状态和对象/codec 文件组织。
4. 重组前端 API、复杂页面与声明式计算，并按新标准迁移 Tailwind。
5. 同步新旧规范差异、重跑现有测试、重新打包，再核对源码与本人录屏的总大小。
