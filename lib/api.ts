import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Agent,
  AgentAction,
  BehaviorRule,
  HealthStatus,
  HeartbeatStatus,
  MemoryFact,
  Metrics,
  PendingFact,
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

// Mutation for global heartbeat service control (pause/resume all)
export function useHeartbeatControl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: "pause" | "resume") => {
      return proxyPost("heartbeat", { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["heartbeat-status"] });
      queryClient.invalidateQueries({ queryKey: ["health"] });
    },
  });
}

// --- Memory Hooks ---

export function useMemoryFacts() {
  return useQuery<MemoryFact[]>({
    queryKey: ["memory-facts"],
    queryFn: async () => {
      const res = await proxyFetch("memory/core");
      const facts = res.data?.facts ?? res.facts ?? {};
      return Object.entries(facts).map(([key, value], i) => ({
        id: String(i),
        key,
        value: typeof value === "object" ? JSON.stringify(value) : String(value),
        createdAt: new Date().toISOString(),
      }));
    },
    refetchInterval: 30000,
  });
}

export function useBehaviorRules() {
  return useQuery<BehaviorRule[]>({
    queryKey: ["behavior-rules"],
    queryFn: async () => {
      const res = await proxyFetch("memory/rules");
      return res.data ?? res ?? [];
    },
    refetchInterval: 30000,
  });
}

export function usePendingFacts() {
  return useQuery<PendingFact[]>({
    queryKey: ["pending-facts"],
    queryFn: async () => {
      const res = await proxyFetch("memory/pending");
      return res.data ?? res ?? [];
    },
    refetchInterval: 15000,
  });
}

export function useApproveFact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (factId: string) => {
      return proxyFetch(`memory/pending/${factId}/approve`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-facts"] });
      queryClient.invalidateQueries({ queryKey: ["memory-facts"] });
    },
  });
}

export function useRejectFact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (factId: string) => {
      return proxyFetch(`memory/pending/${factId}/reject`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-facts"] });
    },
  });
}

export function useArchiveRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ruleId: string) => {
      return proxyFetch(`memory/rules/${ruleId}/archive`, { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["behavior-rules"] });
    },
  });
}
