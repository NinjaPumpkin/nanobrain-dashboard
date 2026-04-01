"use client";

import { Activity, Bot, Clock } from "lucide-react";
import { useHealth, useAgentStatus, useAgents, useMetrics } from "@/lib/api";
import { ConnectionStatus } from "@/components/connection-status";
import { HealthIndicator } from "@/components/health-indicator";
import { AgentCard } from "@/components/agent-card";
import { StatCard } from "@/components/stat-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function AgentSkeletons() {
  return (
    <>
      {Array.from({ length: 3 }, (_, i) => (
        <Card key={i} size="sm">
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default function Home() {
  const health = useHealth();
  const agentStatus = useAgentStatus();
  const agents = useAgents();
  const metrics = useMetrics();

  const healthData = health.data;
  const agentsData = agents.data ?? [];
  const heartbeatData = agentStatus.data;
  const metricsData = metrics.data;

  const isConnected = health.isSuccess;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">NanoBrain</h1>
        <ConnectionStatus connected={isConnected} />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard
          title="Agents"
          value={agents.isLoading ? "-" : agentsData.length}
          icon={<Bot className="h-4 w-4" />}
        />
        <StatCard
          title="Tokens Today"
          value={
            metrics.isLoading
              ? "-"
              : formatTokenCount(metricsData?.total_tokens_in ?? 0)
          }
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          title="Uptime"
          value={
            health.isLoading
              ? "-"
              : formatUptime(healthData?.uptime_seconds ?? 0)
          }
          icon={<Clock className="h-4 w-4" />}
        />
      </div>

      {/* System Health */}
      <HealthIndicator health={healthData ?? undefined} isLoading={health.isLoading} />

      {/* Agent Grid */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Agents</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {agents.isLoading ? (
            <AgentSkeletons />
          ) : (
            agentsData.map((agent) => (
              <AgentCard
                key={agent.name}
                agent={agent}
                heartbeat={heartbeatData?.agents?.find(h => h.agentId === agent.id)}
              />
            ))
          )}
          {!agents.isLoading && agentsData.length === 0 && (
            <p className="col-span-full text-sm text-muted-foreground">
              No agents registered
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
