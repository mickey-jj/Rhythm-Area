# 基础曲库导入样例

在曲库页选择 Phigros，导入 basic-phigros.csv 或 basic-phigros.json。两份文件为相同的 6 张真实谱面，取自本项目 Phigros 预设。

曲库导入不需要子池或用途字段；最简记录只需 title 与 difficulty / difficulty_label。game_key 取当前游戏，缺少 song_key / chart_key 时按曲名、谱面类型和难度生成稳定键。正式使用时建议保留来源的稳定标识。

支持 JSON 数组及 charts / rows / data 包装、UTF-8 BOM、CSV / TSV、常见中英文列名。artist、game_version、chart_type、level_value 可省略；定数未知为 null，13+ 不当作 13 的定数。合并时空曲师、版本和未知定数保留已有值；替换仅作用于当前游戏曲库。

图池工作台另行保存子池与用途。未分配的曲库记录不会自动进入比赛；曲库替换不修改比赛快照。
