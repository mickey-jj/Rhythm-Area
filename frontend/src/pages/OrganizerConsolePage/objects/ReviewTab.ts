export const reviewTabs = [["entries", "报名审核"], ["scores", "成绩审核"], ["schedule", "开启正赛"], ["audit", "操作记录"]] as const;
export type ReviewTab = typeof reviewTabs[number][0];
