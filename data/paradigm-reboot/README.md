# 范式：起源总图池

来源：[Paradigm: Reboot Prober 定数表](https://prp.icel.site/#/songs)，公开接口为 `GET https://api.prp.icel.site/api/v2/songs`。本批于 2026-10-26 获取，完整保留接口返回的全部难度和全部赛季。准确获取时间、文件 SHA-256 与校验结果见 `manifest.json`。

本批共有 **434 首曲目、1,326 张谱面**：DETECTED 434、INVADED 434、MASSIVE 434、REBOOT 24。定数范围为 1.0–17.4；源数据中最高谱面版本为 4.12.0。这里的“总图池”指该查分器当次公开接口的全部记录，不能据此保证与所有地区、客户端中的全部内容完全一致。

## 文件与导入

| 文件 | 用途 |
| --- | --- |
| `charts.csv` | 按 HW2 `DETAILED_PLAN.md` S05 的 12 列推荐格式生成；一行一张谱面；UTF-8 BOM、CRLF、标准双引号转义 |
| `charts.json` | 与 CSV 相同的 JSON 对象数组；数值字段保持 JSON number，空用途保持空字符串 |
| `source.json` | API 原始响应快照，保留定数拟合值、音符数、谱师、曲包、BPM、时长、曲绘文件名等全部源字段 |
| `manifest.json` | 来源、时间、计数、版本语义、曲名变体与文件校验值 |
| `sync.mjs` | 使用 Node.js 内置功能重新获取或离线重建，无第三方依赖 |

HW2 已开始实现：后端可读取本地完整快照，创建向导提供完整元数据导入，演示种子从中选择 18 张谱面并创建独立赛事池快照。CSV/JSON 前端预检后，随草稿保存事务原子写入；尚未提供独立的服务端 import-preview/commit API。不会自动联网更新或更改已冻结赛事池。

## 字段约定

| 导入列 | 约定 |
| --- | --- |
| `game_key` | 固定 `paradigm-reboot` |
| `game_version` | 原样保留源字段 `version`。这是源站对该谱面的版本标记，通常表示加入版本；**不可当成当前客户端版本或地区标识，也不可用“必须等于赛事版本”筛掉旧版本加入的谱面**。建立领域模型时建议命名为 `introduced_version`，赛事目标版本另存 |
| `song_key` | `prp-song-<song_id>`，以来源 ID 关联曲目，不按曲名合并 |
| `title` / `artist` | 保留该张谱面的显示曲名及作者，支持同一 song ID 的不同演唱版本 |
| `chart_key` | `prp-chart-<id>`，稳定谱面外部键；与 `song_key` 分开 |
| `chart_type` | 此次导入的本地分类固定 `standard`，源接口本身没有这个字段；具体难度由下一列表达 |
| `difficulty_label` | `DETECTED` / `INVADED` / `MASSIVE` / `REBOOT`；保留完整名称 |
| `level_value` | 源字段 `level`，作为定数；**不使用**社区拟合字段 `fitting_level` 替代 |
| `pool_tag` | 固定 `all`，表示总图池；赛事可以再分子池 |
| `role` | 留空，表示尚未设置赛事用途。Pick、Ban、Random、加赛等资格应由主办配置；导入器须允许此处为空 |
| `display_order` | 从 1 开始，保留 API 原始返回顺序 |

关联完整元数据时，去掉 `chart_key` 的 `prp-chart-` 前缀，以整数匹配 `source.json` 的 `id`。源字段 `b15` 是抓取当时的新赛季标记，会随赛季变化，不能作为永久属性。`cover` 仅是文件名，不是完整图片地址；此次没有下载音乐、谱面文件或曲绘。

## 已发现的导入注意点

- 源 `song_id=430` 下，`chart_id=1308`（REBOOT）显示为 **Antikythera [Vocal Version] / technoplanet feat. 木下珠子**，其他三张谱面显示为 **Antikythera / technoplanet**。这是原数据的谱面级显示差异，已原样保留。数据库应在 Chart 上保存显示覆盖值，避免逐行 upsert Song 时把四张谱面的曲名覆盖成同一个版本。
- 906 张谱面没有 `fitting_level`，源快照保持 `null`；全部 1,326 张都有正式 `level`。不要把缺失拟合值填成 0。
- 已验证全部谱面必填字段、谱面 ID 唯一性、`song_id + difficulty` 唯一性；未发现重复或缺字段。数据准确性仍以源站及游戏内显示为准。
- 导入后为赛事生成独立快照，记录 `provider=prp`、来源 ID、获取时间与源文件哈希；更新总库时保留已冻结的赛事图池。

## 更新与复现

在仓库根目录运行（Node.js 22+，需能访问公开 API）：

```powershell
node HW2/data/paradigm-reboot/sync.mjs
```

仅从已保存的源快照重建 CSV、JSON 和清单，不联网：

```powershell
node HW2/data/paradigm-reboot/sync.mjs --offline
```

脚本先验证完整响应，再生成文件；遇到重复键、未知难度或缺失关键字段会报错，需检查上游变更。更新会替换本目录的当前快照；需要保留历史版本时先按获取日期归档本目录。
