"use client";

import {
  Activity,
  Heart,
  Server,
  Cpu,
  Pause,
  Play,
  BarChart3,
  Coins,
  Zap,
} from "lucide-react";
import { ConnectionStatus } from "@/components/connection-status";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  useHealth,
  useAgentStatus,
  useMetrics,
  useHeartbeatControl,
} from "@/lib/api";

// --- Format helpers ---

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}h ${remainMinutes}m`;
}

// --- Loading skeleton for a section ---

function SectionSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} size="sm">
          <CardContent className="flex flex-col gap-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// --- Main page ---

export default function ServicesPage() {
  const health = useHealth();
  const heartbeat = useAgentStatus();
  const metrics = useMetrics();
  const heartbeatControl = useHeartbeatControl();

  const isConnected = health.data?.status === "healthy";

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Services</h1>
        <ConnectionStatus connected={isConnected} />
      </div>

      {/* Section 1: System Health */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          System Health
        </h2>

        {health.isLoading ? (
          <SectionSkeleton count={6} />
        ) : health.error || !health.data ? (
          <Card size="sm">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Unable to fetch system health data.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard
              icon={
                <span className="relative flex h-3 w-3">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      health.data.status === "healthy"
                        ? "bg-green-400 animate-ping"
                        : "bg-red-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex h-3 w-3 rounded-full ${
                      health.data.status === "healthy"
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  />
                </span>
              }
              title="Status"
              value={health.data.status === "healthy" ? "Healthy" : "Degraded"}
            />
            <StatCard
              icon={<Activity className="h-4 w-4" />}
              title="Uptime"
              value={formatUptime(health.data.uptime_seconds)}
            />
            <StatCard
              icon={<Cpu className="h-4 w-4" />}
              title="Memory"
              value={`${Math.round(health.data.memory_mb)} MB`}
            />
            {Object.entries(health.data.components).map(([name, status]) => (
              <StatCard
                key={name}
                icon={<Server className="h-4 w-4" />}
                title={name}
                value={status}
              />
            ))}
          </div>
        )}
      </section>

      <Separator />

      {/* Section 2: Heartbeat Service */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Heartbeat Service
        </h2>

        {heartbeat.isLoading ? (
          <SectionSkeleton count={3} />
        ) : heartbeat.error || !heartbeat.data ? (
          <Card size="sm">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Unable to fetch heartbeat status.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Status + Control */}
            <div className="flex items-center gap-3">
              <Badge
                variant={heartbeat.data.running ? "default" : "destructive"}
                className="gap-1.5 text-sm px-3 py-1"
              >
                <Heart className="h-3.5 w-3.5" />
                {heartbeat.data.running ? "Running" : "Paused"}
              </Badge>

              <Button
                variant={heartbeat.data.running ? "outline" : "default"}
                size="sm"
                disabled={heartbeatControl.isPending}
                onClick={() =>
                  heartbeatControl.mutate(
                    heartbeat.data!.running ? "pause" : "resume"
                  )
                }
              >
                {heartbeat.data.running ? (
                  <>
                    <Pause className="mr-1.5 h-3.5 w-3.5" />
                    Pause All
                  </>
                ) : (
                  <>
                    <Play className="mr-1.5 h-3.5 w-3.5" />
                    Resume All
                  </>
                )}
              </Button>
            </div>

            {/* Agent heartbeat list */}
            {heartbeat.data.agents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No agents registered in heartbeat service.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {heartbeat.data.agents.map((agent) => (
                  <Card key={agent.agentId} size="sm">
                    <CardContent className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {agent.agentId}
                        </span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {formatMs(agent.intervalMs)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        <span>
                          Next wake:{" "}
                          {agent.nextWakeMs > 0
                            ? formatMs(agent.nextWakeMs)
                            : "now"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <Separator />

      {/* Section 3: Usage Metrics */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Usage Metrics
        </h2>

        {metrics.isLoading ? (
          <SectionSkeleton count={4} />
        ) : metrics.error || !metrics.data ? (
          <Card size="sm">
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Unable to fetch usage metrics.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Summary stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon={<BarChart3 className="h-4 w-4" />}
                title="Tokens In"
                value={formatTokenCount(metrics.data.total_tokens_in)}
              />
              <StatCard
                icon={<BarChart3 className="h-4 w-4" />}
                title="Tokens Out"
                value={formatTokenCount(metrics.data.total_tokens_out)}
              />
              <StatCard
                icon={<Coins className="h-4 w-4" />}
                title="Total Cost"
                value={`$${metrics.data.total_cost_usd.toFixed(4)}`}
              />
              <StatCard
                icon={<Activity className="h-4 w-4" />}
                title="Sample Size"
                value={metrics.data.sample_size}
              />
            </div>

            {/* Cost by model */}
            {Object.keys(metrics.data.cost_by_model).length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-medium text-muted-foreground">
                  Cost by Model
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(metrics.data.cost_by_model).map(
                    ([model, data]) => (
                      <Card key={model} size="sm">
                        <CardContent className="flex flex-col gap-1">
                          <span className="text-sm font-medium truncate">
                            {model}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              {formatTokenCount(data.tokens)} tokens
                            </span>
                            <span>{data.count} requests</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Top 5 tool frequency */}
            {Object.keys(metrics.data.tool_frequency).length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-medium text-muted-foreground">
                  Top Tools
                </h3>
                <Card size="sm">
                  <CardContent className="flex flex-col gap-2">
                    {Object.entries(metrics.data.tool_frequency)
                      .sort(([, a], [, b]) => b - a)
                      .slice(0, 5)
                      .map(([tool, count]) => {
                        const maxCount = Math.max(
                          ...Object.values(metrics.data!.tool_frequency)
                        );
                        const widthPercent = Math.round(
                          (count / maxCount) * 100
                        );
                        return (
                          <div key={tool} className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium truncate">
                                {tool}
                              </span>
                              <span className="text-muted-foreground shrink-0 ml-2">
                                {count}
                              </span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-muted">
                              <div
                                className="h-1.5 rounded-full bg-primary transition-all"
                                style={{ width: `${widthPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
