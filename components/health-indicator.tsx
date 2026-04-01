"use client";

import type { HealthStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthIndicatorProps {
  health: HealthStatus | undefined;
  isLoading: boolean;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(" ");
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full",
        ok ? "bg-green-500" : "bg-red-500"
      )}
    />
  );
}

export function HealthIndicator({ health, isLoading }: HealthIndicatorProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to fetch health data
          </p>
        </CardContent>
      </Card>
    );
  }

  const componentEntries = Object.entries(health.components ?? {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health check grid */}
        <div className="grid grid-cols-2 gap-3">
          {componentEntries.map(([name, status]) => (
            <div key={name} className="flex items-center gap-2">
              <StatusDot ok={status === "healthy"} />
              <span className="text-sm capitalize">{name}</span>
            </div>
          ))}
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Uptime</span>
          <span className="font-medium">
            {formatUptime(health.uptime_seconds)}
          </span>
        </div>

        {/* Memory */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Memory</span>
          <span className="font-medium">{health.memory_mb} MB</span>
        </div>
      </CardContent>
    </Card>
  );
}
