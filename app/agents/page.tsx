"use client";

import { useState } from "react";
import { useAgents, useAgentStatus, useAgentAction, useHealth } from "@/lib/api";
import { ConnectionStatus } from "@/components/connection-status";
import { AgentCard } from "@/components/agent-card";
import { AgentDetailDrawer } from "@/components/agent-detail-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const counts = STATUS_FILTERS.reduce(
    (acc, f) => ({
      ...acc,
      [f]: f === "all"
        ? agentsData.length
        : agentsData.filter((a) => a.status.toLowerCase() === f).length,
    }),
    {} as Record<StatusFilter, number>
  );

  const filteredAgents = filterAgents(agentsData, statusFilter);

  function handleCardClick(agent: Agent) {
    setSelectedAgent(agent);
    setDrawerOpen(true);
  }

  const [pendingAgent, setPendingAgent] = useState<string | null>(null);

  function handleAction(action: AgentAction, agentName: string) {
    setPendingAgent(agentName);
    agentAction.mutate(
      { action, agentName },
      { onSettled: () => setPendingAgent(null) }
    );
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
            <TabsTrigger key={filter} value={filter} className="gap-1.5">
              <span className="capitalize">{filter}</span>
              {!agents.isLoading && (
                <span className="text-[10px] text-muted-foreground">
                  {counts[filter]}
                </span>
              )}
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
              key={agent.id}
              agent={agent}
              heartbeat={heartbeatData?.agents?.find(
                (h) => h.agentId === agent.id
              )}
              onClick={() => handleCardClick(agent)}
              onAction={handleAction}
              actionLoading={agentAction.isPending && pendingAgent === agent.name}
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
        actionLoading={
          agentAction.isPending && pendingAgent === selectedAgent?.name
        }
      />
    </div>
  );
}
