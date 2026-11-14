# 曲绘难度边框 · 2026-11-06

边框随游戏与难度标签选择，实际映射位于 `frontend/src/domain/difficultyAppearance.ts`。同一曲绘在不同难度上使用不同边框。未知游戏或未知标签采用中性灰 `#76838f`。

以下色号来自游戏查分工具或社区 Wiki 的实际界面源码，作为本项目的显示映射；社区界面的色号不等于游戏厂商公布的统一品牌规范。

| 游戏 | 难度与色号 | 查阅来源 |
| --- | --- | --- |
| Paradigm: Reboot | DETECTED `#3b82f6`；INVADED `#ef4444`；MASSIVE `#a855f7`；REBOOT `#f97316` | [PRP 公开查分站](https://prp.icel.site/)，其 [界面样式](https://prp.icel.site/assets/index-BYxt4T-m.css) 的难度变量 |
| Phigros | EZ `#10b22f`；HD `#0075b8`；IN `#cf1313`；AT `#383838` | [Phigros-rks-Image-Maker 源码](https://github.com/Tb114/Phigros-rks-Image-Maker/blob/main/main.py) 的难度配色 |
| Rotaeno | I `#32cd32`；II `#0099ff`；III `#ff6600`；IV `#9400d3`；IV-α `#b38cdb` | [Rotaeno Wiki 曲目目录](https://wikiwiki.jp/rotaeno/%E6%A5%BD%E6%9B%B2%E4%B8%80%E8%A6%A7) 的难度表头背景色 |
| Arcaea | Past `#00bfff`；Present `#3cb371`；Future `#c71585`；Eternal `#6a5acd`；Beyond `#b22222` | [Arcaea Wiki 标题目录](https://wikiwiki.jp/arcaea/%E3%82%BF%E3%82%A4%E3%83%88%E3%83%AB%E9%A0%86) 的表头具名颜色，换算为十六进制 |
| maimai DX | BASIC `#22bb5b`；ADVANCED `#fb9c2d`；EXPERT `#f64861`；MASTER `#9e45e2`；Re:MASTER `#ba67f8`；UTAGE `#ea3de8` | [落雪查分器前端 color.ts](https://github.com/Lxns-Network/maimai-prober-frontend/blob/main/src/utils/color.ts) 的成绩卡背景色 |
| CHUNITHM | BASIC `#00a681`；ADVANCED `#f47900`；EXPERT `#e92828`；MASTER `#891ade`；ULTIMA `#656568`；WORLD'S END `#0e2d38` | [落雪查分器前端 color.ts](https://github.com/Lxns-Network/maimai-prober-frontend/blob/main/src/utils/color.ts) 的成绩卡背景色 |

标签兼容罗马数字、大小写、分隔符、希腊 α 以及 PST/PRS/FTR/ETR/BYD 等缩写。颜色依据标签本身，不按曲名散列。MASSIVE 的浏览器实测边框为 `rgb(168, 85, 247)`。
