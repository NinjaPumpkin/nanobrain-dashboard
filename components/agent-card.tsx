"use client";

import type { Agent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgentCardProps {
  agent: Agent;
  heartbeat?: {
    status: string;
    lastRun: string;
    nextRun: string;
    consecutiveErrors: number;
  };
}

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string }
> = {
  running: { color: "bg-green-500", label: "Running" },
  paused: { color: "bg-yellow-500", label: "Paused" },
  error: { color: "bg-red-500", label: "Error" },
  idle: { color: "bg-gray-400", label: "Idle" },
};

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 0) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

export function AgentCard({ agent, heartbeat }: AgentCardProps) {
  const statusKey = heartbeat?.status ?? agent.status;
  const statusInfo = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.idle;
  const errors = heartbeat?.consecutiveErrors ?? 0;

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        {/* Header: name + model badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold">{agent.name}</h3>
            <p className="truncate text-xs text-muted-foreground">
              {agent.role}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {agent.model}
          </Badge>
        </div>

        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full",
                statusInfo.color
              )}
            />
            <span className="text-xs">{statusInfo.label}</span>
          </div>
          {errors > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              {errors} error{errors > 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Last heartbeat */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last heartbeat</span>
          <span>
            {heartbeat?.lastRun
              ? formatRelativeTime(heartbeat.lastRun)
              : agent.lastHeartbeat
                ? formatRelativeTime(agent.lastHeartbeat)
                : "N/A"}
          </span>
        </div>

        {/* Token budget bar */}
        {agent.tokenBudget && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tokens</span>
              <span>
                {agent.tokenBudget.used.toLocaleString()} /{" "}
                {agent.tokenBudget.limit.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  agent.tokenBudget.used / agent.tokenBudget.limit > 0.9
                    ? "bg-red-500"
                    : agent.tokenBudget.used / agent.tokenBudget.limit > 0.7
                      ? "bg-yellow-500"
                      : "bg-primary"
                )}
                style={{
                  width: `${Math.min(
                    100,
                    (agent.tokenBudget.used / agent.tokenBudget.limit) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
