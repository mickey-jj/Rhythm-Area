import { apiUrl,sendAPI } from "./sendAPI";
export abstract class APIMessage<Response> {
  declare readonly responseType: Response;
  abstract readonly method: "GET" | "POST" | "PUT";
  abstract get parameters(): Record<string, string>;
  get responseKind(): "json" | "blob" { return "json"; }
  get url(): string { return apiUrl(this); }
  get payload(): unknown { return undefined; }
  get body(): BodyInit | undefined { return this.payload === undefined ? undefined : JSON.stringify(this.payload); }
  get headers(): Record<string,string> { return { "Content-Type": "application/json" }; }
  send(): Promise<Response> { return sendAPI(this); }
}
export function apiName(message: object): string {
  return message.constructor.name.replace(/API$/, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}
