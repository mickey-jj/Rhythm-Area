# HW2 项目现行规范

更新：2026-11-01。按本次授权，以新增课程规范替换此前宽松解释。

## 优先级

1. 本人录制 ≤180 秒使用流程、完整前后端源码、约 10 个网页、附件不超过 100M，来自 HW2.txt。
2. [60 条代码规范](docs/course/references/compliance-rules.md)。
3. [课程工作流](docs/course/SKILL.md)、[后端规范](docs/course/references/backend-scala.md)、[前端规范](docs/course/references/frontend-react.md)、[复核清单](docs/course/references/review-checklist.md)。
4. 示例和历史规划。历史课件整理保存在 docs/course/lecture-requirements-2026-10-25.md，仅供溯源，不得覆盖现行规范。

## 执行要求

- 后端代码由 services 下业务域拥有，基础设施由 services/system 拥有；每操作一个 final case class *Message 和 plan(connection): IO[Response]。路由只注册、解码、认证和调用计划。
- 数据库每表独立目录，Table、Initializer 邻接；SQL 私有，公开操作有明确输入并返回 IO，业务步骤使用同一事务连接。
- 对象为 final case class，单文件与 companion 编解码；状态使用封闭类型，领域标识使用不同类型。对象不访问数据库或产生随机数。
- 禁止 Scala var、可变集合、命令式循环、try/catch/finally、Try、业务内手动运行 IO。允许 IO 的 for/yield。
- 前端使用函数组件；复杂页面拥有 index、hooks、objects、functions、components，入口显示业务骨架。核心状态最小化，展示值用纯函数推导。
- 前端接口按服务、逐操作类组织，显式输入及 send；名称由共享规则推导。共享基础设施统一传输和身份处理。
- Tailwind 为样式系统；自定义 CSS 仅限有具体必要且有说明的例外。禁止纯计算中的就地累积、命令式循环；Zustand store 私有，渲染使用订阅。

Tailwind-only、禁止 Try 和具体目录/API 结构来自新增规范，作为本项目现行约束执行；不改写成原 HW2.txt 或课件的逐字规定。

## 界面要求（用户追加）

- 左上角固定使用律竞图标与名称，不随赛事配置变化。
- 赛事首页展示比赛内容；删除重复说明、宣传语和面向开发者的解释。表单约束、操作状态与比赛规则保留必要信息。

## 验证与提交

整改必须重跑 Scala 测试、前端测试、类型检查和生产构建、隔离数据库集成以及规范结构检查；不得用“可编译”代替合规审查。重新生成源码包，排除运行库、密码、依赖及缓存。本人录屏不能由自动化采样视频替代。

结构复核入口：`node scripts/check-course.mjs`；本次整改说明与实际验收见 [docs/remediation-2026-11-01.md](docs/remediation-2026-11-01.md)。此脚本仅补充人工复核，不替代完整规范。
