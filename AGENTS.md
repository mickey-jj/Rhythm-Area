# HW2 项目约束

开始设计、修改或检查前阅读 REQUIREMENTS.md，然后阅读 docs/course/SKILL.md 和 docs/course/references/compliance-rules.md；触及后端/前端时分别读取 docs/course/references/backend-scala.md 与 docs/course/references/frontend-react.md。完整整改还须按 review-checklist.md 复核。

现行规范于 2026-11-01 按用户要求采用新增课程规范，替换此前宽松解释。禁止以旧规划、旧 REQUIREMENTS、现有代码或样例降低要求。编号以 docs/course/references/compliance-rules.md 为准。

业务保持单赛事模板，保留现有数据与已发布快照，不清空正式库。测试使用新隔离数据库。约 10 页不等于必须恰好 10 页，也不等于 10 个部署服务。

Scala 不使用 var、可变集合、命令式循环、try/catch/finally、Try 或业务内 unsafe 执行；IO for/yield 允许。按服务组织 Message、对象、路由与逐表模块。前端采用 Tailwind、页面属地模块、明确 API 类和不可变数据流。

完整源码与本人亲录 ≤180 秒视频合计保守控制在 100,000,000 字节以内。自动化视频不得称为本人录制。交付前重跑已有功能及结构检查并重新打包。
