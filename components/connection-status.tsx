"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  connected: boolean;
  lastChecked?: Date;
}

export function ConnectionStatus({
  connected,
  lastChecked,
}: ConnectionStatusProps) {
  return (
    <Badge
      variant={connected ? "default" : "destructive"}
      className="gap-1.5 text-xs"
    >
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          connected
            ? "bg-green-400 animate-pulse"
            : "bg-red-400"
        )}
      />
      {connected ? "Connected" : "VPS Unreachable"}
    </Badge>
  );
}
