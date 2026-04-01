"use client";

import type { Agent, HeartbeatAgent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AgentCardProps {
  agent: Agent;
  heartbeat?: HeartbeatAgent;
}

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

function formatMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function AgentCard({ agent, heartbeat }: AgentCardProps) {
  const budgetPct =
    agent.budget_monthly_tokens > 0
      ? agent.tokens_used_this_month / agent.budget_monthly_tokens
      : 0;

  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        {/* Header: name + role badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold">{agent.name}</h3>
            <p className="truncate text-xs text-muted-foreground capitalize">
              {agent.role}
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {agent.status}
          </Badge>
        </div>

        {/* Heartbeat info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Last updated</span>
          <span>{formatRelativeTime(agent.updated_at)}</span>
        </div>

        {heartbeat && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Next wake</span>
            <span>{formatMs(heartbeat.nextWakeMs)}</span>
          </div>
        )}

        {/* Token budget bar */}
        {agent.budget_monthly_tokens > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tokens</span>
              <span>
                {agent.tokens_used_this_month.toLocaleString()} /{" "}
                {agent.budget_monthly_tokens.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  budgetPct > 0.9
                    ? "bg-red-500"
                    : budgetPct > 0.7
                      ? "bg-yellow-500"
                      : "bg-primary"
                )}
                style={{ width: `${Math.min(100, budgetPct * 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
