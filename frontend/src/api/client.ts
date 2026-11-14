import { useQuery,useQueryClient } from "@tanstack/react-query";
import { useCurrentSession } from "../state/session";
import { APIMessage,apiName } from "../system/api/APIMessage";
export { ApiError } from "../system/api/sendAPI";
export function useApi<T>(message: APIMessage<T>, enabled = true, poll: boolean | number = false) {
  const session = useCurrentSession();
  const parameters = message.parameters;
  return useQuery({
    queryKey: [apiName(message), parameters, session?.user.id ?? "anonymous"],
    queryFn: () => message.send(),
    enabled: enabled && ["id", "sid", "version"].every(key => !(key in parameters) || !!parameters[key]),
    retry: false, refetchInterval: typeof poll === "number" ? poll : poll ? 8000 : false,
  });
}
export function useRefresh() { const client = useQueryClient(); return () => client.invalidateQueries(); }
