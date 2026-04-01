import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Agent,
  AgentAction,
  HealthStatus,
  HeartbeatStatus,
  Metrics,
  Task,
} from "@/lib/types";

// Base fetch helper that calls /api/proxy/* routes
// Returns the raw JSON response from the VPS
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function proxyFetch(path: string, options?: RequestInit): Promise<any> {
  const res = await fetch(`/api/proxy/${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// POST helper (most NanoBrain endpoints use POST with action)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function proxyPost(path: string, body: Record<string, unknown>): Promise<any> {
  return proxyFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// --- Custom Hooks ---
// VPS API returns: { success: true, data: { ...fields } }
// We extract the inner data for each hook

export function useHealth() {
  return useQuery<HealthStatus | null>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await proxyFetch("health");
      return res.data ?? res;
    },
    refetchInterval: 5000,
  });
}

export function useAgentStatus() {
  return useQuery<HeartbeatStatus | null>({
    queryKey: ["heartbeat-status"],
    queryFn: async () => {
      const res = await proxyPost("heartbeat", { action: "status" });
      return res.data ?? res;
    },
    refetchInterval: 5000,
  });
}

export function useAgents() {
  return useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await proxyPost("agent-registry", { action: "list" });
      // VPS returns { success, data: { agents: [...] } }
      return res.data?.agents ?? res.agents ?? [];
    },
    refetchInterval: 10000,
  });
}

export function useMetrics() {
  return useQuery<Metrics | null>({
    queryKey: ["metrics"],
    queryFn: async () => {
      const res = await proxyFetch("metrics");
      return res.data ?? res;
    },
    refetchInterval: 30000,
  });
}

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      const res = await proxyPost("ai-tasks", { action: "list" });
      return res.data?.tasks ?? res.tasks ?? [];
    },
    refetchInterval: 10000,
  });
}

// Mutation for agent heartbeat actions (pause, resume, trigger-now)
export function useAgentAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      agentName,
    }: {
      action: AgentAction;
      agentName: string;
    }) => {
      return proxyPost("heartbeat", { action, agentName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["heartbeat-status"] });
    },
  });
}
