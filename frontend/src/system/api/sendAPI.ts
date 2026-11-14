import { getCurrentSessionSnap } from "../../state/session";
import { APIMessage,apiName } from "./APIMessage";
export class ApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}
export function apiUrl(message: APIMessage<unknown>): string {
  const params = new URLSearchParams(message.parameters);
  return `/api/rpc/${apiName(message)}${params.size ? `?${params}` : ""}`;
}
export async function sendAPI<Response>(message: APIMessage<Response>): Promise<Response> {
  const response = await fetch(apiUrl(message), {
    method: message.method, credentials: "same-origin",
    headers: { ...message.headers, ...(message.method !== "GET" ? { "X-Area-CSRF": getCurrentSessionSnap()?.csrf ?? "" } : {}) },
    ...(message.body !== undefined ? { body: message.body } : {}),
  });
  if (response.ok && message.responseKind === "blob") return await response.blob() as Response;
  const data = await response.json().catch(() => ({ message: "服务器响应异常" }));
  if (!response.ok) throw new ApiError(response.status, data.code ?? "NETWORK", data.message ?? "请求失败");
  return data as Response;
}
