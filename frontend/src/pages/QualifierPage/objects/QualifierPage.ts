import type { useQualifierPage } from "../hooks/useQualifierPage";
export type QualifierReady = Extract<ReturnType<typeof useQualifierPage>, { status: "ready" }>;
