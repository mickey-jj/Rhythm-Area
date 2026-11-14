# Rhythm Area 独立项目验证

日期：2026-11-14。

## 来源与命名

- 从同级“期中作业”目录建立独立源码副本。来源目录没有 Git 仓库，因此本项目建立新的 Git 历史。
- 将文本内容和路径中的旧英文名称统一替换为 Area / AREA / area，涵盖界面品牌、包名、模板格式、导出文件名、数据库角色、环境变量、Cookie、CSRF 请求头、脚本和文档引用。
- 初始副本逐一核对了 921 个来源文件；除命名替换、忽略规则、README 说明和独立实例配置外，没有其他内容差异。历史截图作为原验证资料保留。
- 未复制原实例数据库、上传文件、密码、日志、录屏、提交归档或进程记录。原作业与原运行数据保留在原目录。

## 新实例

| 项目 | 配置 |
| --- | --- |
| 网页 | http://127.0.0.1:5284/ |
| API 端口 | 8192 |
| PostgreSQL 端口 | 55534 |
| 数据库 | rhythm_area |

配置以根目录 `instance.config.json` 为准。首次启动由使用者建立自己的主办账号。

## 已完成验证

| 检查 | 结果 |
| --- | --- |
| Node 前端领域测试 | 47 / 47 通过 |
| Scala / MUnit 测试 | 52 / 52 通过 |
| TypeScript 与 Vite 生产构建 | 通过 |
| 课程结构检查 | 通过：373 个 Scala 文件、247 个前端文件、84 个 API 注册 |
| `verify-single.ps1 -Advanced` | 通过；使用新项目独立数据库集群和随机命名测试库 |
| 旧英文名称扫描 | 版本管理中的文本和路径无残留 |
| Git 忽略规则 | 数据库、密码、环境文件、依赖、编译产物、视频和归档均被排除；锁文件与迁移保留 |
| 凭据检查 | 未发现真实访问令牌或私钥；测试中的虚构无效凭据是边界测试数据 |
| 源码打包 | 通过；生成归档并检查其不含运行目录、依赖、编译产物和 Git 元数据 |

扩展集成覆盖首次初始化并发、双实例隔离、报名与身份、库与图池、发布后规则维护、八类排名赛场景、七种组队组合、同曲晋级与重排、单败 / 双败 / 循环 / 多阶段、加赛与先胜、隐藏曲与裁判指定、资格晋级、个人 / 团队比赛计时及同曲组计时。测试完成后由脚本关闭测试 API 并清理本轮创建的随机测试库。

## 复现

在项目根目录的 PowerShell 7 中运行：

```powershell
node --experimental-strip-types --experimental-specifier-resolution=node --test scripts/*.test.mjs
node scripts/check-course.mjs
npm.cmd --prefix frontend run build
./scripts/backend.ps1 'test;writeRuntimeClasspath'
./scripts/verify-single.ps1 -Advanced
./scripts/package.ps1
```

源码归档位于 `deliverables/rhythm-area-source.zip`，按 `.gitignore` 仅保存在本地，不提交到仓库。
