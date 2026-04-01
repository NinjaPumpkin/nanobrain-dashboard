"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface MemoryCardAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive";
  loading?: boolean;
}

interface MemoryCardBadge {
  label: string;
  className: string;
}

interface MemoryCardProps {
  type: "fact" | "rule" | "pending";
  title: string;
  content: string;
  badges?: MemoryCardBadge[];
  actions?: MemoryCardAction[];
}

export function MemoryCard({
  title,
  content,
  badges,
  actions,
}: MemoryCardProps) {
  return (
    <Card size="sm">
      <CardContent className="space-y-3">
        {/* Header: title + badges */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-sm font-bold">{title}</h3>
          {badges && badges.length > 0 && (
            <div className="flex shrink-0 gap-1">
              {badges.map((badge) => (
                <Badge
                  key={badge.label}
                  variant="secondary"
                  className={cn("border-0 text-[10px]", badge.className)}
                >
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <p className="line-clamp-3 text-xs text-muted-foreground">{content}</p>

        {/* Actions */}
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant === "destructive" ? "destructive" : "secondary"}
                className="h-7 gap-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                disabled={action.loading}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
