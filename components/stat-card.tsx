import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{icon}</span>
          {trend && trend !== "neutral" && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-green-500",
                trend === "down" && "text-red-500"
              )}
            >
              {trend === "up" ? "\u2191" : "\u2193"}
            </span>
          )}
        </div>
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        <span className="text-xs text-muted-foreground">{title}</span>
        {subtitle && (
          <span className="text-xs text-muted-foreground/70">{subtitle}</span>
        )}
      </CardContent>
    </Card>
  );
}
