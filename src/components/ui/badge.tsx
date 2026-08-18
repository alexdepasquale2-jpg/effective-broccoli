import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "purple" | "cyan" | "pink";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground shadow-sm",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    outline: "border-border/80 text-foreground bg-card/40",
    success: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    warning: "border-amber-500/30 bg-amber-500/15 text-amber-300",
    purple: "border-purple-500/30 bg-purple-500/15 text-purple-300",
    cyan: "border-cyan-500/30 bg-cyan-500/15 text-cyan-300",
    pink: "border-pink-500/30 bg-pink-500/15 text-pink-300",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
