package services.events.objects

object Defaults:
  val rules: RuleSet = RuleSet(1, "custom-rhythm", "自定义音游", "自定义版本", "solo", 16,
    Metric("分数", "分", 0, "0", "1000000", true), "whole-best", "retain", "total", 2,
    List(Stage("qualifier", "海选", "ranking", 8), Stage("main", "淘汰赛", "single", 1)),
    List(DraftStep("ban-a", "A", "ban", 1, "main", true, "pool"), DraftStep("ban-b", "B", "ban", 1, "main", true, "pool"),
      DraftStep("pick-a", "A", "pick", 1, "main", true, "pool"), DraftStep("pick-b", "B", "pick", 1, "main", true, "pool"),
      DraftStep("random", "referee", "random", 1, "main", false, "pool")),
    List(PlaySlot("song-a", "pick-a:1"), PlaySlot("song-b", "pick-b:1"), PlaySlot("song-r", "random:1")),
    Resolution("extra", "extra", 1, "extra-only", 3, "normal"), TeamPolicy(3, 4, 3, 3, "sum"))

