"use client";

import { useState } from "react";
import {
  useMemoryFacts,
  useBehaviorRules,
  usePendingFacts,
  useApproveFact,
  useRejectFact,
  useArchiveRule,
  useHealth,
} from "@/lib/api";
import { ConnectionStatus } from "@/components/connection-status";
import { MemoryCard } from "@/components/memory-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Shield, Clock, Check, X, Archive } from "lucide-react";

const TAB_FILTERS = ["facts", "rules", "pending"] as const;
type TabFilter = (typeof TAB_FILTERS)[number];

const TAB_ICONS: Record<TabFilter, React.ReactNode> = {
  facts: <Brain className="size-3" />,
  rules: <Shield className="size-3" />,
  pending: <Clock className="size-3" />,
};

function MemorySkeletons() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <Card key={i} size="sm">
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export default function MemoryPage() {
  const [activeTab, setActiveTab] = useState<TabFilter>("facts");

  const health = useHealth();
  const facts = useMemoryFacts();
  const rules = useBehaviorRules();
  const pending = usePendingFacts();
  const approveFact = useApproveFact();
  const rejectFact = useRejectFact();
  const archiveRule = useArchiveRule();

  const isConnected = health.isSuccess;

  const factsData = facts.data ?? [];
  const rulesData = rules.data ?? [];
  const pendingData = pending.data ?? [];

  const counts: Record<TabFilter, number> = {
    facts: factsData.length,
    rules: rulesData.length,
    pending: pendingData.length,
  };

  const isLoading =
    (activeTab === "facts" && facts.isLoading) ||
    (activeTab === "rules" && rules.isLoading) ||
    (activeTab === "pending" && pending.isLoading);

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Memory</h1>
        <ConnectionStatus connected={isConnected} />
      </div>

      {/* Tab Filters */}
      <Tabs
        defaultValue="facts"
        onValueChange={(v) => setActiveTab(v as TabFilter)}
      >
        <TabsList>
          {TAB_FILTERS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="gap-1.5">
              {TAB_ICONS[tab]}
              <span className="capitalize">{tab}</span>
              {!isLoading && (
                <span className="text-[10px] text-muted-foreground">
                  {counts[tab]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {isLoading ? (
          <MemorySkeletons />
        ) : (
          <>
            {/* Facts Tab */}
            {activeTab === "facts" &&
              factsData.map((fact) => (
                <MemoryCard
                  key={fact.id}
                  type="fact"
                  title={fact.key}
                  content={fact.value}
                  badges={
                    fact.category
                      ? [
                          {
                            label: fact.category,
                            className:
                              "bg-blue-500/15 text-blue-500",
                          },
                        ]
                      : undefined
                  }
                />
              ))}
            {activeTab === "facts" && !facts.isLoading && factsData.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">
                No memory facts stored
              </p>
            )}

            {/* Rules Tab */}
            {activeTab === "rules" &&
              rulesData.map((rule) => (
                <MemoryCard
                  key={rule.id}
                  type="rule"
                  title={`Rule #${rule.id}`}
                  content={rule.rule}
                  badges={[
                    rule.active
                      ? {
                          label: "Active",
                          className: "bg-emerald-500/15 text-emerald-500",
                        }
                      : {
                          label: "Inactive",
                          className: "bg-muted text-muted-foreground",
                        },
                  ]}
                  actions={[
                    {
                      label: "Archive",
                      icon: <Archive className="size-3" />,
                      onClick: () => archiveRule.mutate(rule.id),
                      variant: "destructive",
                      loading: archiveRule.isPending,
                    },
                  ]}
                />
              ))}
            {activeTab === "rules" && !rules.isLoading && rulesData.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">
                No behavior rules defined
              </p>
            )}

            {/* Pending Tab */}
            {activeTab === "pending" &&
              pendingData.map((pf) => (
                <MemoryCard
                  key={pf.id}
                  type="pending"
                  title={pf.key}
                  content={pf.value}
                  badges={[
                    {
                      label: pf.source,
                      className: "bg-purple-500/15 text-purple-500",
                    },
                  ]}
                  actions={[
                    {
                      label: "Approve",
                      icon: <Check className="size-3" />,
                      onClick: () => approveFact.mutate(pf.id),
                      loading: approveFact.isPending,
                    },
                    {
                      label: "Reject",
                      icon: <X className="size-3" />,
                      onClick: () => rejectFact.mutate(pf.id),
                      variant: "destructive",
                      loading: rejectFact.isPending,
                    },
                  ]}
                />
              ))}
            {activeTab === "pending" && !pending.isLoading && pendingData.length === 0 && (
              <p className="col-span-full text-sm text-muted-foreground">
                No pending facts to review
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
