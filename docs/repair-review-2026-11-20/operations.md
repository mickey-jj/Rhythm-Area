# 运行与部署说明（2026-11-20）

## 本机启动和已有数据升级

继续使用根目录 `Start.cmd`。当前项目的网页 5284、API 8192、PostgreSQL 55534、数据库 `rhythm_area` 由 `instance.config.json` 管理。不要把历史课程文档中的端口作为当前入口。

第一次初始化须在配置页输入部署者持有的初始化码。`scripts/backend.ps1` 在本机 `.local/setup-token` 生成随机码；也可通过 `AREA_SETUP_TOKEN` 提供至少 32 字符的随机值。初始化码不通过 API 下发、不写入源码，完成初始化后不能再创建第二位主办。已有主办账号保持原登录方式。

启动时先使用迁移账号执行建表和授权，再关闭迁移连接池，以 `area_app` 建立日常业务连接。`scripts/database.ps1` 创建不具超级用户、建库、建角色、复制及绕过行级安全权限的业务角色，并生成 `.local/runtime-password`。迁移密码仍在本机 `.local/database-password`；两者均不进入 Git 或源码包。

已有实例通过正常停止、备份、重新启动升级，不清库。迁移账号及必要授权在每次启动时检查，现有赛事、已发布规则、报名和历史成绩保留。归档赛事禁止继续修改规则、重排、审核及改判；没有提供恢复归档流程。

自管数据库可配置 `DB_HOST`、`DB_PORT`、`DB_NAME`、`DB_MIGRATION_USER`、`DB_PASSWORD`、`DB_USER`、`DB_RUNTIME_PASSWORD`。当前授权脚本以 `area_app` 为目标；更换业务角色时，应由数据库管理员提供等效的最小授权。不要把管理账号填作 `DB_USER`。这是数据库角色隔离，同一操作系统进程仍可读取部署者提供的迁移配置；更严格的进程隔离需在部署层单独安排。

## HTTPS、会话和公开托管

前后端默认仅监听本机回环地址。生产环境构建 `frontend/dist`，由正式静态服务器及反向代理提供同源网页和 `/api`。不要把 Vite 开发或预览服务作为公网生产服务器。

将 `APP_ORIGIN` 设为对外的准确 HTTPS 源。HTTPS 配置使用带 `Secure`、`HttpOnly`、`SameSite=Strict`、`Path=/` 的 `__Host-` 会话 Cookie，不设置 Domain。本机 HTTP 保留可工作的开发会话。代理必须终止 HTTPS，不能只改配置后继续向用户提供 HTTP。

不同实例使用不同主机名、独立数据库和部署目录。同一主机的不同端口共享 Cookie 命名空间，端口不是浏览器安全隔离边界。当前登录限速为每账号每 5 分钟 8 次、每连接来源每 5 分钟 300 次，进程内维护；重启会清空，多个进程不共享。反向代理后连接来源可能是代理地址；应用不盲目信任客户端伪造的转发头。多进程或公网大规模部署应在可信入口配置共享限速。

## 私有证据

仅本赛事已通过报名的选手或队员能上传。允许签名符合的 PNG、JPEG、PDF，单文件最多 5 MiB；每账号累计 50 MiB、每天 20 份、每分钟 5 份；每赛事累计 1 GiB、最多 10000 份。配额在赛事锁内核验，包含尚未关联成绩的上传。

上传文件必须完成后才能交分。失败时继续阻止提交，选手可以重试，或明确移除附件后交分；见证说明或外部证据链接始终必填，附件可选。附件读取继续受本人、主办及指定场次裁判权限保护。

证据存放在 `.local/evidence/<数据库名的 SHA-256 前 24 位>/`。同一部署目录的独立实例必须使用不同数据库名。数据库名相同的不同服务器需要独立 `AREA_ROOT`，否则会共享本地文件命名空间。变更数据库端口不会改变附件目录。

启动时及每小时回收未关联成绩且超过 24 小时的附件元数据，并删除当前数据库命名空间中的对应文件及超过 24 小时的无登记 UUID 文件。登记失败不会开始写文件；写入失败会清理部分文件；提交事务最终失败留下的无登记文件由过期回收补偿。

旧版根目录 `.local/evidence/<文件ID>` 中已关联的附件保留兼容读取。清理器不猜测这些旧文件属于哪个数据库，不批量删除未知的历史根目录文件。清理旧部署残留前需备份，并按实际数据库关联逐项核对；本轮没有删除正式历史附件。

## 回归和复现

在项目根目录运行：

```powershell
./scripts/backend.ps1 test
node --test scripts/*.test.mjs
node scripts/check-course.mjs
npm --prefix frontend run build
npm --prefix frontend audit
./scripts/verify-single.ps1 -RepairOnly
./scripts/verify-single.ps1 -Advanced
./scripts/verify-single.ps1 -ResetOnly
./scripts/package.ps1
```

集成脚本为每次运行创建 `area_verify_...` 隔离数据库，结束后只移除自己的测试库和进程，不清空正式库。负载测试只在自己的测试数据库开启查询日志，测量结果写入被 Git 忽略的 `.local/repair-load-result.json`。`AREA_DB_METRICS=1` 可临时输出连接等待毫秒数，默认关闭。

`scripts/start-repair-ui-review.ps1` 启动独立的虚构验收实例（8187/5287），并在 `.local/repair-ui-processes.json` 记录数据库及进程。结束后运行 `scripts/stop-repair-ui-review.ps1`，核对进程启动时间及测试库命名后，只清理该次虚构实例。该实例只用于本地验收；代理故意延迟证据上传且首次返回失败，不能用于生产。脚本中的测试账号仅存在于独立测试库。当前验收不需要重置正式实例。
