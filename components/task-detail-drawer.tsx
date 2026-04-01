"use client";

import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  User,
} from "lucide-react";

interface TaskDetailDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  medium: { label: "Medium", className: "bg-yellow-500/15 text-yellow-400" },
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
};

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDueDate(dateStr: string): { text: string; overdue: boolean } {
  const due = new Date(dateStr);
  const now = new Date();
  const overdue = due < now;
  return {
    text: due.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    overdue,
  };
}

export function TaskDetailDrawer({
  task,
  open,
  onOpenChange,
}: TaskDetailDrawerProps) {
  if (!task) return null;

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

  const due = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle className="flex-1">{task.title}</SheetTitle>
            <Badge
              variant="secondary"
              className={cn("border-0 text-[10px]", status.className)}
            >
              {status.label}
            </Badge>
          </div>
          <SheetDescription>
            <Badge
              variant="secondary"
              className={cn("border-0 text-[10px]", priority.className)}
            >
              {priority.label} priority
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          {/* Description */}
          {task.description && (
            <Section title="Description">
              <p className="text-sm leading-relaxed text-foreground/90">
                {task.description}
              </p>
            </Section>
          )}

          {/* Metadata */}
          <Section title="Details">
            <div className="space-y-2 text-xs">
              {task.assignee && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="size-3" />
                    Assignee
                  </span>
                  <span>{task.assignee}</span>
                </div>
              )}
              {due && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="size-3" />
                    Due Date
                  </span>
                  <span
                    className={cn(
                      due.overdue &&
                        task.status !== "completed" &&
                        "text-red-400"
                    )}
                  >
                    {due.text}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3" />
                  Created
                </span>
                <span>{formatDate(task.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3" />
                  Updated
                </span>
                <span>{formatDate(task.updatedAt)}</span>
              </div>
            </div>
          </Section>

          <Separator />

          {/* Subtasks */}
          <Section title={`Subtasks (${subtasksDone}/${subtasksTotal})`}>
            {subtasksTotal > 0 ? (
              <>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      subtaskPct === 1 ? "bg-emerald-500" : "bg-primary"
                    )}
                    style={{
                      width: `${Math.min(100, subtaskPct * 100)}%`,
                    }}
                  />
                </div>
                <ul className="space-y-1.5">
                  {task.subtasks!.map((sub) => (
                    <li key={sub.id} className="flex items-start gap-2 text-xs">
                      {sub.done ? (
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <Circle className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          sub.done && "text-muted-foreground line-through"
                        )}
                      >
                        {sub.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No subtasks</p>
            )}
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
