# Agent Management Page — Design Spec

**Date**: 2026-04-01
**Session**: 2 of NanoBrain Command Center Dashboard
**Status**: Approved

## Goal

Replace the `/agents` stub with a full Agent Management page: browsable agent cards with status/tokens/heartbeat, inline action buttons (pause, resume, trigger), and a detail drawer showing config, tools, goals, system prompt, and heartbeat info.

## Architecture

### Page: `app/agents/page.tsx`

- Header: "Agents" h1 + `<ConnectionStatus>`
- Status filter: shadcn `Tabs` — All / Active / Paused / Idle
- Agent grid: `grid-cols-1 sm:grid-cols-2 gap-3`
- Loading state: skeleton cards (same pattern as home page)
- Empty state: message when no agents match current filter
- Data: `useAgents()` + `useAgentStatus()`, merged by `agent.id === heartbeat.agentId`

### Component: `components/agent-card.tsx` (enhanced)

Existing card is extended with:

- `onClick` prop → opens detail drawer (the whole card is clickable)
- `onAction` prop → `(action: AgentAction, agentName: string) => void`
- Action buttons row at card bottom: **Pause/Resume** toggle + **Trigger Now**
  - `variant="outline" size="sm"`
  - `e.stopPropagation()` to prevent opening drawer
  - Pause/Resume toggles based on heartbeat presence (has heartbeat = running → show Pause; no heartbeat = paused → show Resume)
- Hover: `cursor-pointer` + subtle ring/border highlight
- Icons: `Pause`, `Play`, `Zap` from lucide-react

### Component: `components/agent-detail-drawer.tsx` (new)

Uses `Sheet` (side="right"). Props: `{ agent: Agent | null, heartbeat?: HeartbeatAgent, open: boolean, onOpenChange: (open: boolean) => void, onAction: (action: AgentAction, agentName: string) => void }`.

Sections (top to bottom):

1. **Header** (`SheetHeader`): Agent name as `SheetTitle`, role + status badges
2. **Token Budget**: Full-width progress bar with "X / Y tokens" label. Same color thresholds as card (red >90%, yellow >70%).
3. **Actions**: Pause/Resume + Trigger Now buttons (larger than card versions)
4. **Configuration**: Key-value pairs from `agent.config` rendered as a definition list. Handles empty config gracefully.
5. **Tools Allowed**: `agent.tools_allowed[]` as `Badge` chips. Shows "No tools configured" if empty.
6. **Goals**: `agent.goals_assigned[]` as a bulleted list. Shows "No goals assigned" if empty.
7. **System Prompt**: `agent.system_prompt` in a scrollable monospace block, truncated with expand toggle if >200 chars.
8. **Heartbeat**: Current interval (`formatMs`), next wake (`formatMs`), running status. Below: reserved slot that accepts `HeartbeatEvent[]` — renders "No history available" when empty/undefined.

### Mutations: `lib/api.ts` additions

```ts
type AgentAction = "pause" | "resume" | "trigger-now";

function useAgentAction(): UseMutationResult
  // POST /api/proxy/heartbeat { action, agentName }
  // onSuccess: invalidate ["agents"] and ["agent-status"] query keys
  // Returns the mutation object for loading/error states
```

### Types: `lib/types.ts` additions

```ts
export type AgentAction = "pause" | "resume" | "trigger-now";

// Future-ready, not used yet
export interface HeartbeatEvent {
  timestamp: string;
  action: string;
  agentId: string;
}
```

## Data Flow

```
Page mounts
  → useAgents() fetches agent list (refetch 10s)
  → useAgentStatus() fetches heartbeat status (refetch 5s)
  → Merge: for each agent, find matching heartbeat by agentId
  → Apply status filter tab
  → Render AgentCard grid

Card click
  → Set selectedAgent state
  → Open Sheet drawer

Action button (card or drawer)
  → Call useAgentAction().mutate({ action, agentName })
  → Optimistic: disable button, show loading
  → onSuccess: queries invalidate, UI refreshes
  → onError: show error state on button (red flash or similar)
```

## File Changes Summary

| File | Change |
|---|---|
| `app/agents/page.tsx` | Full rewrite from stub |
| `components/agent-card.tsx` | Add onClick, onAction, action buttons |
| `components/agent-detail-drawer.tsx` | New file |
| `lib/api.ts` | Add `useAgentAction` mutation |
| `lib/types.ts` | Add `AgentAction`, `HeartbeatEvent` |

## Design Constraints

- Mobile-first: all layouts work on 375px+ width
- Dark mode only (forced via layout.tsx)
- Sheet max-width: `sm:max-w-sm` (existing default)
- No new dependencies — everything uses installed packages
- Matches existing card grid pattern from home page
- `proxyPost` helper already exists in `lib/api.ts` — reuse it

## Testing Strategy

- Manual verification against live VPS API via proxy
- Verify all three actions (pause/resume/trigger) produce correct API calls
- Verify filter tabs correctly filter agents by status
- Verify drawer opens/closes, shows all agent fields
- Verify loading and error states render correctly
