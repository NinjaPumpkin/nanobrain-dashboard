"use client";

import { useState } from "react";
import { useTasks, useHealth } from "@/lib/api";
import { ConnectionStatus } from "@/components/connection-status";
import { TaskCard } from "@/components/task-card";
import { TaskDetailDrawer } from "@/components/task-detail-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Task } from "@/lib/types";

const STATUS_FILTERS = ["all", "pending", "in-progress", "completed"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function TaskSkeletons() {
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
            <Skeleton className="h-1.5 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function filterTasks(tasks: Task[], filter: StatusFilter): Task[] {
  if (filter === "all") return tasks;
  return tasks.filter((t) => t.status.toLowerCase() === filter);
}

function sortTasks(tasks: Task[]): Task[] {
  const priorityOrder: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  const statusOrder: Record<string, number> = {
    "in-progress": 0,
    pending: 1,
    completed: 2,
    failed: 3,
  };

  return [...tasks].sort((a, b) => {
    // Active tasks first, completed last
    const statusDiff =
      (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9);
    if (statusDiff !== 0) return statusDiff;

    // Higher priority first within same status
    const priorityDiff =
      (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9);
    if (priorityDiff !== 0) return priorityDiff;

    // Most recently updated first
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export default function TasksPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const health = useHealth();
  const tasks = useTasks();

  const tasksData = tasks.data ?? [];
  const isConnected = health.isSuccess;

  const filtered = sortTasks(filterTasks(tasksData, statusFilter));

  // Summary counts for tab badges
  const counts = {
    all: tasksData.length,
    pending: tasksData.filter((t) => t.status === "pending").length,
    "in-progress": tasksData.filter((t) => t.status === "in-progress").length,
    completed: tasksData.filter((t) => t.status === "completed").length,
  };

  function handleCardClick(task: Task) {
    setSelectedTask(task);
    setDrawerOpen(true);
  }

  function handleDrawerOpenChange(open: boolean) {
    setDrawerOpen(open);
    if (!open) setSelectedTask(null);
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Tasks</h1>
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
              <span className="capitalize">
                {filter === "in-progress" ? "Active" : filter}
              </span>
              {!tasks.isLoading && (
                <span className="text-[10px] text-muted-foreground">
                  {counts[filter]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Task Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {tasks.isLoading ? (
          <TaskSkeletons />
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => handleCardClick(task)}
            />
          ))
        )}
        {!tasks.isLoading && filtered.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">
            {statusFilter === "all"
              ? "No tasks found"
              : `No ${statusFilter === "in-progress" ? "active" : statusFilter} tasks`}
          </p>
        )}
      </div>

      {/* Detail Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={handleDrawerOpenChange}
      />
    </div>
  );
}
