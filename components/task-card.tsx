"use client";

import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  User,
} from "lucide-react";

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-500/15 text-yellow-500" },
  "in-progress": {
    label: "In Progress",
    className: "bg-blue-500/15 text-blue-500",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/15 text-emerald-500",
  },
  failed: { label: "Failed", className: "bg-red-500/15 text-red-500" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-500/15 text-red-400" },
  medium: { label: "Med", className: "bg-yellow-500/15 text-yellow-400" },
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
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

function formatDueDate(dateStr: string): string {
  const due = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.ceil(
    (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `${diffDays}d left`;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const status = STATUS_CONFIG[task.status] ?? {
    label: task.status,
    className: "bg-muted text-muted-foreground",
  };
  const priority = PRIORITY_CONFIG[task.priority] ?? {
    label: task.priority,
    className: "bg-muted text-muted-foreground",
  };

  const subtasksDone = task.subtasks?.filter((s) => s.done).length ?? 0;
  const subtasksTotal = task.subtasks?.length ?? 0;
  const subtaskPct = subtasksTotal > 0 ? subtasksDone / subtasksTotal : 0;

  const isOverdue =
    task.dueDate &&
    task.status !== "completed" &&
    new Date(task.dueDate) < new Date();

  return (
    <Card
      size="sm"
      className={cn(
        onClick && "cursor-pointer transition-colors hover:ring-foreground/20"
      )}
      onClick={onClick}
    >
      <CardContent className="space-y-3">
        {/* Header: title + status badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-bold">{task.title}</h3>
          <Badge
            variant="secondary"
            className={cn("shrink-0 border-0 text-[10px]", status.className)}
          >
            {status.label}
          </Badge>
        </div>

        {/* Description snippet */}
        {task.description && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}

        {/* Meta row: priority + assignee */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge
            variant="secondary"
            className={cn("border-0 text-[10px]", priority.className)}
          >
            {priority.label}
          </Badge>
          {task.assignee && (
            <span className="flex items-center gap-1 truncate">
              <User className="size-3 shrink-0" />
              {task.assignee}
            </span>
          )}
        </div>

        {/* Subtask progress bar */}
        {subtasksTotal > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {subtasksDone === subtasksTotal ? (
                  <CheckCircle2 className="size-3 text-emerald-500" />
                ) : (
                  <Circle className="size-3" />
                )}
                Subtasks
              </span>
              <span>
                {subtasksDone}/{subtasksTotal}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  subtaskPct === 1 ? "bg-emerald-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(100, subtaskPct * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer: due date + updated */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {task.dueDate ? (
            <span
              className={cn(
                "flex items-center gap-1",
                isOverdue && "text-red-400"
              )}
            >
              <Calendar className="size-3" />
              {formatDueDate(task.dueDate)}
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {formatRelativeTime(task.updatedAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
