"use client";

import type { Agent, AgentAction, HeartbeatAgent, HeartbeatEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pause, Play, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface AgentDetailDrawerProps {
  agent: Agent | null;
  heartbeat?: HeartbeatAgent;
  heartbeatHistory?: HeartbeatEvent[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: AgentAction, agentName: string) => void;
  actionLoading?: boolean;
}

function formatMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function AgentDetailDrawer({
  agent,
  heartbeat,
  heartbeatHistory,
  open,
  onOpenChange,
  onAction,
  actionLoading,
}: AgentDetailDrawerProps) {
  const [promptExpanded, setPromptExpanded] = useState(false);

  if (!agent) return null;

  const budgetPct =
    agent.budget_monthly_tokens > 0
      ? agent.tokens_used_this_month / agent.budget_monthly_tokens
      : 0;

  const isRunning = !!heartbeat;
  const configEntries = Object.entries(agent.config ?? {});
  const promptTruncated =
    agent.system_prompt && agent.system_prompt.length > 200;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="flex-1">{agent.name}</SheetTitle>
            <Badge variant="secondary" className="text-[10px]">
              {agent.status}
            </Badge>
          </div>
          <SheetDescription className="capitalize">
            {agent.role}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          {/* Token Budget */}
          {agent.budget_monthly_tokens > 0 && (
            <Section title="Token Budget">
              <div className="flex items-center justify-between text-xs">
                <span>
                  {agent.tokens_used_this_month.toLocaleString()} /{" "}
                  {agent.budget_monthly_tokens.toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(budgetPct * 100)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
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
            </Section>
          )}

          {/* Actions */}
          <Section title="Actions">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={actionLoading}
                onClick={() =>
                  onAction(isRunning ? "pause" : "resume", agent.name)
                }
              >
                {isRunning ? (
                  <Pause className="size-3.5" />
                ) : (
                  <Play className="size-3.5" />
                )}
                {isRunning ? "Pause" : "Resume"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={actionLoading}
                onClick={() => onAction("trigger-now", agent.name)}
              >
                <Zap className="size-3.5" />
                Trigger Now
              </Button>
            </div>
          </Section>

          <Separator />

          {/* Configuration */}
          <Section title="Configuration">
            {configEntries.length > 0 ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                {configEntries.map(([key, value]) => (
                  <div key={key} className="col-span-2 flex justify-between">
                    <dt className="text-muted-foreground">{key}</dt>
                    <dd className="text-right font-mono">
                      {String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-xs text-muted-foreground">
                No configuration set
              </p>
            )}
          </Section>

          {/* Tools Allowed */}
          <Section title="Tools Allowed">
            {agent.tools_allowed.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {agent.tools_allowed.map((tool) => (
                  <Badge key={tool} variant="outline" className="text-[10px]">
                    {tool}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No tools configured
              </p>
            )}
          </Section>

          {/* Goals */}
          <Section title="Goals">
            {agent.goals_assigned.length > 0 ? (
              <ul className="list-inside list-disc space-y-1 text-xs">
                {agent.goals_assigned.map((goal, i) => (
                  <li key={i}>{goal}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                No goals assigned
              </p>
            )}
          </Section>

          {/* System Prompt */}
          {agent.system_prompt && (
            <Section title="System Prompt">
              <div
                className={cn(
                  "rounded-md bg-muted/50 p-2 font-mono text-xs leading-relaxed",
                  !promptExpanded && promptTruncated && "line-clamp-5"
                )}
              >
                {agent.system_prompt}
              </div>
              {promptTruncated && (
                <button
                  type="button"
                  onClick={() => setPromptExpanded(!promptExpanded)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {promptExpanded ? (
                    <>
                      <ChevronUp className="size-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-3" /> Show more
                    </>
                  )}
                </button>
              )}
            </Section>
          )}

          <Separator />

          {/* Heartbeat */}
          <Section title="Heartbeat">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span>{isRunning ? "Running" : "Paused"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interval</span>
                <span>{formatMs(agent.heartbeat_interval_ms)}</span>
              </div>
              {heartbeat && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Next wake</span>
                  <span>{formatMs(heartbeat.nextWakeMs)}</span>
                </div>
              )}
            </div>

            {/* History slot -- future-ready */}
            <div className="mt-3">
              <h4 className="mb-1 text-xs font-medium text-muted-foreground">
                History
              </h4>
              {heartbeatHistory && heartbeatHistory.length > 0 ? (
                <ul className="space-y-1 text-xs">
                  {heartbeatHistory.map((event, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{event.action}</span>
                      <span className="text-muted-foreground">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No history available
                </p>
              )}
            </div>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
