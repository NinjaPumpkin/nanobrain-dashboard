import { useQuery } from "@tanstack/react-query";
import type {
  ApiResponse,
  Agent,
  HealthStatus,
  HeartbeatStatus,
  Metrics,
  Task,
} from "@/lib/types";

// Base fetch helper that calls /api/proxy/* routes
async function proxyFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`/api/proxy/${path}`, options);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// POST helper (most NanoBrain endpoints use POST with action)
async function proxyPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  return proxyFetch<T>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// --- Custom Hooks ---

export function useHealth() {
  return useQuery<ApiResponse<HealthStatus>>({
    queryKey: ["health"],
    queryFn: () => proxyFetch<ApiResponse<HealthStatus>>("health"),
    refetchInterval: 5000,
  });
}

export function useAgentStatus() {
  return useQuery<ApiResponse<HeartbeatStatus>>({
    queryKey: ["heartbeat-status"],
    queryFn: () =>
      proxyPost<ApiResponse<HeartbeatStatus>>("heartbeat", {
        action: "status",
      }),
    refetchInterval: 5000,
  });
}

export function useAgents() {
  return useQuery<ApiResponse<Agent[]>>({
    queryKey: ["agents"],
    queryFn: () =>
      proxyPost<ApiResponse<Agent[]>>("agent-registry", { action: "list" }),
    refetchInterval: 10000,
  });
}

export function useMetrics() {
  return useQuery<ApiResponse<Metrics>>({
    queryKey: ["metrics"],
    queryFn: () => proxyFetch<ApiResponse<Metrics>>("metrics"),
    refetchInterval: 30000,
  });
}

export function useTasks() {
  return useQuery<ApiResponse<Task[]>>({
    queryKey: ["tasks"],
    queryFn: () =>
      proxyPost<ApiResponse<Task[]>>("ai-tasks", { action: "list" }),
    refetchInterval: 10000,
  });
}
