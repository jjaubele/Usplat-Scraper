import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "bg-blue-600 text-white",
        variant === "secondary" && "bg-neutral-100 text-neutral-800",
        variant === "outline" && "border border-neutral-300 text-neutral-700",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
