# 新增课程规范整改记录 · 2026-11-01

按用户要求，项目已采用新增课程规范，替换旧版宽松解释。规范入口为根目录 `REQUIREMENTS.md` 和 `AGENTS.md`，完整规则随源码保存在 `docs/course/`。原审查报告 `compliance-review-2026-11-01.md` 保留为整改前历史，不能作为当前代码状态。

本轮没有变更单赛事模板的产品范围，不清空正式数据库、不载入正式演示人员，也不修改已发布规则。旧实现和改前源码保存在本机 `.local/remediation/`，不会进入提交包。

## 原审查九项的处理

| 原问题 | 实际整改及核对入口 |
| --- | --- |
| 服务归属、Message 与路由 | 后端主源码归入 `services/{events,identity,instance,system}`。逐操作 `final case class *Message`，`plan(connection): IO[Response]`。每个服务的 `*Routes` 持有本服务注册，顶层仅合并。已将 24 个重复转发计划并入实际执行消息；复用的查询、权限和多步骤计划保留。 |
| SQL 与表边界 | 每个实际表拥有同目录 Table 和 Initializer；私有 `*Sql` 紧邻公开 IO 方法，参数为具体类型，不接收任意 SQL。业务计划复用同一事务连接。 |
| 对象聚合和编解码 | 有意义的对象独立文件，final case class 与同名 companion codecs 邻接；API 专用结构位于 `objects/apiTypes`。版本历史、模板、模拟结果等有明确响应结构。 |
| 开放状态与混用 ID | 状态采用 Scala/TypeScript 有限字面量联合和统一 companion 转换；事件、报名、比赛、谱面、尝试、证据、用户 ID 有独立领域类型。边界测试验证无效状态拒绝及不同 ID 不能错传。 |
| 前端通用路径调用 | `apis/events`、`apis/identity`、`apis/instance`、`apis/system` 下逐操作类显式声明输入和 `send()`，共享基础设施处理名称、传输、会话、CSRF 与二进制响应。55 个前端接口对应后端注册。 |
| 复杂页面混合职责 | 配置、比赛室、赛务后台分别拥有页面目录、协调 hook、状态类型和业务区域组件；入口展示业务骨架。页内纯计算留在页面，确实跨页复用的计分/队伍控件保留共享。 |
| 样式系统 | 接入 Tailwind Vite 插件，组件布局、交互和响应式样式转为 Tailwind utilities。自定义 CSS 的具体例外见下节。 |
| 前端就地累积 | CSV、导入校验、曲序来源改为不可变折叠、映射和展开；原有 BOM、引号、换行、重复键及整次导入原子性测试继续通过。 |
| Scala Try | 删除 Try；数值和时间使用显式校验结果，外部文件/数据库/密码计算留在 IO、Resource 边界。没有以 try/catch 替换。 |

## 服务与信任边界

| 服务 | 责任及主要持久化归属 |
| --- | --- |
| events | 配置、图池、报名、BP、尝试、计分、晋级、团队、证据和申诉；events/entries/matches/attempts 等赛事表 |
| identity | 用户、密码、会话及角色/权限；users、sessions、judge_grants、event_judges |
| instance | 单例部署绑定、初始化、预设和可复用配置；instance_settings |
| system | 进程启动、连接、事务、迁移协调、请求边界和健康检查；schema_migrations，以及 PostgreSQL 时钟/健康/UUID 查询分组 |

`system_clock`、`system_health` 是基础数据库函数查询分组，不声称数据库里有两张同名业务表；因此没有伪造建表语句。各真实表的建表、索引、约束和升级仍在该表 Initializer。迁移按原有 1–4 版本顺序执行。

外部 Cookie 经 identity 的 `IdentityBoundary` 解析并校验后，才把可信用户传入业务消息。普通前端不能以请求中的 userId 冒充当前用户。会话信息仅用于确有需要的会话响应；普通业务查询不接收整套通用请求上下文。

`Database.transaction` 使用同一个 JDBC 连接，成功提交，失败或取消回滚。HTTP 错误转换位于事务之外，避免把失败转换为 400 响应后错误提交部分写入。集成回归包含“已经完成 BP 的比赛申请无效重赛，返回 400 且整个比赛状态保持不变”。

## API 命名与保留接口

当前前端使用 `/api/rpc/<derived-name>`。两端共同约定去掉 Message/API 后缀，将驼峰名称转为小写连字符。后端使用类型信息派生，前端使用类名派生；生产构建启用 `keepNames`，防止压缩改变接口名。

既有 `/api/events/:id` 等资源接口继续兼容，供原有消费者及历史接口使用。各服务 Routes 注册 Message 类型和资源别名，`CanonicalRoutes` 只合并、转换，不重复维护业务执行或权限逻辑。完整对应表见 `api-contracts.json`。前端身份字段与后端可信身份的差异发生在路由信任边界，不强行对齐。

证据上传是显式文件输入，读取使用 `EvidenceReadAPI` 和二进制响应；权限检查仍由后端完成，不将服务器文件路径作为响应字段。

## 页面与 CSS 例外

- `EventEditorPage`：协调保存、预检、校验、模拟和发布；`objects/EditorState` 声明 setup/sign-in/loading/error/ready 视图和操作状态，视图由原有核心状态推导，不再新增重复状态，`functions` 提供导航与选择计算，组件按配置业务区域拆分。
- `MatchRoomPage`：hook 建立 loading/error/empty/ready 状态；组件表达对阵、选禁、曲序、交分、密封揭晓和确认赛果。
- `OrganizerConsolePage`：审核 hook 管理查询和操作，审核标签为封闭类型；报名、成绩、裁判、资格排序及申诉为可见区域。

简单页面不为形式对称创建空文件。共享 `components/ui` 保留通用控件；队伍中心和交分控件确实被多个页面使用。私有 Zustand 会话 store 只公开所需订阅、更新及基础设施快照入口。

`styles.css` 仅保留主题色板/字号变量、文档默认值和旋转关键帧。赛事自定义主题色、跟随系统/日夜偏好及标准字/大字需要运行时切换，使用 CSS 变量和少量文档级样式是这里的具体必要性。组件布局和交互没有保留旧的全局 CSS 类规则或运行时 CSS 映射框架。Tailwind 按 [官方 Vite 安装方式](https://tailwindcss.com/docs/installation/using-vite) 集成。

## 验证

| 检查 | 结果 |
| --- | --- |
| 结构检查 | `node scripts/check-course.mjs`：267 个 Scala 主源码、124 个前端文件、55 个接口对应检查通过 |
| 后端编译和单元测试 | 28/28 通过；覆盖非法状态、API 名称、领域 ID、日期，以及原有规则和 2–256 人赛制 |
| 前端测试 | 13/13 通过 |
| TypeScript / 生产构建 | 通过；保留一个构建产物大于 500kB 的体积提示，不影响构建成功 |
| 最终独立数据库验收 | 通过：12 组双实例检查（含失败重赛事务回滚）、3/5/8 人完整单败、22 个扩展场景；使用 canonical 接口，证据上传/读取同时检查原始 PNG 字节和越权 403 |
| 浏览器 | 在独立 UI 实例完成初始化、登录、预设、修改、保存、校验、模拟；检查日夜、标准/大字、1700×550 短窗口及 390×844 窄屏菜单 |

结构脚本只检查目录、接口对应及禁用模式，是完整人工复核和实际测试的补充，不代表仅凭脚本证明全部 60 条规范。测试使用新建独立数据库，并为本轮执行保存编译快照，后续开发编译不会更换正在测试的类。

复现命令（项目根目录，PowerShell）：

```powershell
node scripts/check-course.mjs
./scripts/backend.ps1 test
node --test scripts/frontend-rules.test.mjs
npm --prefix frontend run build
$env:AREA_TEST_TRANSPORT='rpc'
./scripts/verify-single.ps1 -Advanced
./scripts/package.ps1
```

截图：

- [夜间配置页与短窗口](remediation-editor-dark.jpg)
- [日间配置页](remediation-editor-light.jpg)
- [390px 窄屏菜单](remediation-mobile-menu.jpg)
- [恢复后的本地首页](remediation-restored-home.png)

## 本地运行与数据保留

最终版本已在原 5174/8082 端口启动，网页和 canonical 健康/实例接口可用。启动前后对 events、instance_settings、users、entries、matches、rule_revisions 六张关键表比较记录数及全部行内容摘要，一致。浏览器复核匿名首页和配置页登录提示，没有更改正式数据。隔离测试进程已停止，测试数据库保留。

数据库上次中断后的恢复超过了原 60 秒启动等待，本轮等待其自动恢复完成后继续；启动脚本的等待上限改为 300 秒，未清库或删除恢复文件。

## 作业提交边界

项目保持 11 个业务页面，按“约 10 页”安排；初始化/准备状态不额外计页。本轮已重新生成 `deliverables/rhythm-area-source.zip`，含 479 个文件。逐项 SHA-256 与现有工作目录一致，未遗漏打包范围内的源码；没有 `.local`、密码、数据库、node_modules、target、dist 和缓存。源码包及已有两份视频合计约 5.8 MB，留有本人录屏的空间。

**仍需学生本人录制 ≤180 秒的使用流程视频。** 现有约 149 秒演示是自动化网页状态采样，不能改称本人录制；完整验收视频约 566 秒不能替代三分钟流程。源码与本人录屏附件合计继续保守控制在 100,000,000 字节以下。录制提纲见 `demo-script.md`。
