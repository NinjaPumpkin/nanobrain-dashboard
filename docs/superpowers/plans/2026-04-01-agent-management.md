# Agent Management Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/agents` stub with a full Agent Management page featuring filterable agent cards with action buttons and a detail drawer.

**Architecture:** Extend existing `AgentCard` with click/action props. New `AgentDetailDrawer` component using the installed Sheet. Add `useAgentAction` mutation to `lib/api.ts`. Page orchestrates data merging, filtering, and state.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, shadcn/ui (base-nova style, @base-ui/react primitives), TanStack Query v5, Tailwind v4, lucide-react

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `lib/types.ts` | Modify | Add `AgentAction` type, `HeartbeatEvent` interface |
| `lib/api.ts` | Modify | Add `useAgentAction` mutation hook |
| `components/agent-card.tsx` | Modify | Add `onClick`, `onAction` props, action buttons row |
| `components/agent-detail-drawer.tsx` | Create | Sheet-based detail panel for a single agent |
| `app/agents/page.tsx` | Rewrite | Full agent management page with filters, grid, drawer |

---

### Task 1: Add types to `lib/types.ts`

**Files:**
- Modify: `lib/types.ts:85-86` (append after `BehaviorRule`)

- [ ] **Step 1: Add AgentAction and HeartbeatEvent types**

Add these at the end of `lib/types.ts`:

```typescript
// Agent action types for heartbeat control
export type AgentAction = "pause" | "resume" | "trigger-now";

// Future-ready heartbeat history entry (not yet served by VPS)
export interface HeartbeatEvent {
  timestamp: string;
  action: string;
  agentId: string;
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add AgentAction and HeartbeatEvent types"
```

---

### Task 2: Add `useAgentAction` mutation to `lib/api.ts`

**Files:**
- Modify: `lib/api.ts:1` (add `useMutation`, `useQueryClient` imports)
- Modify: `lib/api.ts:87` (append mutation hook)

- [ ] **Step 1: Update imports at top of `lib/api.ts`**

Change line 1 from:
```typescript
import { useQuery } from "@tanstack/react-query";
```
to:
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
```

Also add the `AgentAction` import — change the type import from:
```typescript
import type {
  Agent,
  HealthStatus,
  HeartbeatStatus,
  Metrics,
  Task,
} from "@/lib/types";
```
to:
```typescript
import type {
  Agent,
  AgentAction,
  HealthStatus,
  HeartbeatStatus,
  Metrics,
  Task,
} from "@/lib/types";
```

- [ ] **Step 2: Add the mutation hook at end of `lib/api.ts`**

Append after the `useTasks` hook:

```typescript
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
```

- [ ] **Step 3: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add lib/api.ts
git commit -m "feat: add useAgentAction mutation hook"
```

---

### Task 3: Enhance `AgentCard` with click and action props

**Files:**
- Modify: `components/agent-card.tsx`

The existing `AgentCard` renders a `Card size="sm"` with name, role, status badge, heartbeat info, and token bar. We need to add:
- `onClick` prop (makes card clickable)
- `onAction` callback prop
- Action buttons row at the bottom (Pause/Resume + Trigger Now)

- [ ] **Step 1: Update the interface and imports**

Replace the existing imports and interface (lines 1-11) with:

```typescript
"use client";

import type { Agent, AgentAction, HeartbeatAgent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pause, Play, Zap } from "lucide-react";

interface AgentCardProps {
  agent: Agent;
  heartbeat?: HeartbeatAgent;
  onClick?: () => void;
  onAction?: (action: AgentAction, agentName: string) => void;
  actionLoading?: boolean;
}
```

- [ ] **Step 2: Update the component signature and add the card wrapper**

Replace the `export function AgentCard` line and the opening `<Card size="sm">` with:

```typescript
export function AgentCard({
  agent,
  heartbeat,
  onClick,
  onAction,
  actionLoading,
}: AgentCardProps) {
  const budgetPct =
    agent.budget_monthly_tokens > 0
      ? agent.tokens_used_this_month / agent.budget_monthly_tokens
      : 0;

  const isRunning = !!heartbeat;

  return (
    <Card
      size="sm"
      className={cn(
        onClick && "cursor-pointer transition-colors hover:ring-foreground/20"
      )}
      onClick={onClick}
    >
```

Keep the existing `<CardContent>` and all its children unchanged.

- [ ] **Step 3: Add action buttons row before closing `</CardContent>`**

Insert this block right before the closing `</CardContent>` tag (after the token budget bar section):

```typescript
        {/* Action buttons */}
        {onAction && (
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="xs"
              disabled={actionLoading}
              onClick={(e) => {
                e.stopPropagation();
                onAction(isRunning ? "pause" : "resume", agent.name);
              }}
            >
              {isRunning ? (
                <Pause className="size-3" />
              ) : (
                <Play className="size-3" />
              )}
              {isRunning ? "Pause" : "Resume"}
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={actionLoading}
              onClick={(e) => {
                e.stopPropagation();
                onAction("trigger-now", agent.name);
              }}
            >
              <Zap className="size-3" />
              Trigger
            </Button>
          </div>
        )}
```

- [ ] **Step 4: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Verify home page still renders correctly**

Run: `npm run dev`
Open `http://localhost:3000` — agent cards should look identical (no `onClick`/`onAction` props passed from home page, so buttons don't appear).

- [ ] **Step 6: Commit**

```bash
git add components/agent-card.tsx
git commit -m "feat: add click and action props to AgentCard"
```

---

### Task 4: Create `AgentDetailDrawer` component

**Files:**
- Create: `components/agent-detail-drawer.tsx`

This component uses the Sheet (right side) to show full agent details. It receives the agent, heartbeat, open state, and action callback.

- [ ] **Step 1: Create the drawer component**

Create `components/agent-detail-drawer.tsx` with this content:

```typescript
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

            {/* History slot — future-ready */}
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
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/agent-detail-drawer.tsx
git commit -m "feat: add AgentDetailDrawer component"
```

---

### Task 5: Build the Agents page

**Files:**
- Rewrite: `app/agents/page.tsx`

This is the main orchestrator. It:
1. Fetches agents + heartbeat status
2. Merges heartbeat data per agent
3. Filters by status tab (All / Active / Paused / Idle)
4. Renders a grid of enhanced AgentCards
5. Manages selected agent state for the detail drawer
6. Wires up the `useAgentAction` mutation

- [ ] **Step 1: Rewrite `app/agents/page.tsx`**

Replace the entire file with:

```typescript
"use client";

import { useState } from "react";
import { useAgents, useAgentStatus, useAgentAction } from "@/lib/api";
import { useHealth } from "@/lib/api";
import { ConnectionStatus } from "@/components/connection-status";
import { AgentCard } from "@/components/agent-card";
import { AgentDetailDrawer } from "@/components/agent-detail-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Agent, AgentAction } from "@/lib/types";

const STATUS_FILTERS = ["all", "active", "paused", "idle"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function AgentSkeletons() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} size="sm">
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-6 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function filterAgents(agents: Agent[], filter: StatusFilter): Agent[] {
  if (filter === "all") return agents;
  return agents.filter(
    (a) => a.status.toLowerCase() === filter
  );
}

export default function AgentsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const health = useHealth();
  const agents = useAgents();
  const agentStatus = useAgentStatus();
  const agentAction = useAgentAction();

  const agentsData = agents.data ?? [];
  const heartbeatData = agentStatus.data;
  const isConnected = health.isSuccess;

  const filteredAgents = filterAgents(agentsData, statusFilter);

  function handleCardClick(agent: Agent) {
    setSelectedAgent(agent);
    setDrawerOpen(true);
  }

  function handleAction(action: AgentAction, agentName: string) {
    agentAction.mutate({ action, agentName });
  }

  function handleDrawerOpenChange(open: boolean) {
    setDrawerOpen(open);
    if (!open) setSelectedAgent(null);
  }

  const selectedHeartbeat = selectedAgent
    ? heartbeatData?.agents?.find((h) => h.agentId === selectedAgent.id)
    : undefined;

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Agents</h1>
        <ConnectionStatus connected={isConnected} />
      </div>

      {/* Status Filter Tabs */}
      <Tabs
        defaultValue="all"
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
      >
        <TabsList>
          {STATUS_FILTERS.map((filter) => (
            <TabsTrigger key={filter} value={filter} className="capitalize">
              {filter}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {agents.isLoading ? (
          <AgentSkeletons />
        ) : (
          filteredAgents.map((agent) => (
            <AgentCard
              key={agent.name}
              agent={agent}
              heartbeat={heartbeatData?.agents?.find(
                (h) => h.agentId === agent.id
              )}
              onClick={() => handleCardClick(agent)}
              onAction={handleAction}
              actionLoading={agentAction.isPending}
            />
          ))
        )}
        {!agents.isLoading && filteredAgents.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">
            {statusFilter === "all"
              ? "No agents registered"
              : `No ${statusFilter} agents`}
          </p>
        )}
      </div>

      {/* Detail Drawer */}
      <AgentDetailDrawer
        agent={selectedAgent}
        heartbeat={selectedHeartbeat}
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
        onAction={handleAction}
        actionLoading={agentAction.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Verify page renders**

Run: `npm run dev`
Open `http://localhost:3000/agents`
Expected:
- Header with "Agents" + connection status badge
- Filter tabs (All / Active / Paused / Idle)
- Agent cards with action buttons (Pause/Resume + Trigger)
- Clicking a card opens the detail drawer from the right
- Drawer shows all sections (tokens, config, tools, goals, prompt, heartbeat)
- Action buttons in drawer work (pause/resume/trigger)
- Filter tabs filter the grid

- [ ] **Step 4: Verify home page is unaffected**

Open `http://localhost:3000`
Expected: Agent cards render exactly as before (no action buttons, not clickable)

- [ ] **Step 5: Commit**

```bash
git add app/agents/page.tsx
git commit -m "feat: build Agent Management page with filters, actions, and detail drawer"
```

---

### Task 6: Handle Tabs `onValueChange` compatibility

**Files:**
- Modify: `app/agents/page.tsx` (if needed)

The shadcn Tabs component wraps `@base-ui/react/tabs`. Base UI's `TabsPrimitive.Root` uses `onValueChange` for tab selection. Verify this works.

- [ ] **Step 1: Check Tabs API**

The `Tabs` component passes all props to `TabsPrimitive.Root` which is `@base-ui/react/tabs`. Base UI Tabs uses `onValueChange(value: string | number)` callback. If the build succeeds in Task 5, this step is a no-op.

If `onValueChange` doesn't exist on the Base UI Tabs API, the alternative is to use `value` + state control:

```typescript
<Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
```

- [ ] **Step 2: Verify tab switching works in browser**

Click each tab (All, Active, Paused, Idle) and confirm:
- The active tab visual state changes
- The agent grid filters correctly
- Switching back to "All" shows all agents

- [ ] **Step 3: Commit if changes were needed**

```bash
git add app/agents/page.tsx
git commit -m "fix: ensure Tabs onValueChange compatibility with base-ui"
```

---

### Task 7: Final verification and cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Full manual test checklist**

1. `/agents` — page loads, shows all agents with action buttons
2. Filter tabs — each tab filters correctly
3. Pause button — sends pause action, card updates on refetch
4. Resume button — sends resume action, card updates on refetch
5. Trigger button — sends trigger-now action
6. Card click — opens detail drawer from right
7. Drawer — shows token bar, config, tools, goals, system prompt, heartbeat
8. System prompt — expand/collapse works for long prompts
9. Drawer actions — pause/resume/trigger work from drawer
10. Drawer close — X button and overlay click both close
11. `/` (home) — agent cards unchanged, no action buttons
12. Mobile — page works on narrow viewport (375px)

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "feat: complete Agent Management page — Session 2"
```
