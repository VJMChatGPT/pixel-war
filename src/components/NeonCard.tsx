import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

interface NeonCardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "primary" | "secondary" | "accent" | "none";
  shimmer?: boolean;
}

export const NeonCard = forwardRef<HTMLDivElement, NeonCardProps>(
  ({ className, glow = "none", shimmer = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-[var(--radius)] bg-gradient-card border-neon scanlines",
          shimmer && "border-shimmer",
          glow === "primary" && "shadow-[0_0_30px_-8px_hsl(var(--primary)/0.5)]",
          glow === "secondary" && "shadow-[0_0_30px_-8px_hsl(var(--secondary)/0.5)]",
          glow === "accent" && "shadow-[0_0_30px_-8px_hsl(var(--accent)/0.5)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NeonCard.displayName = "NeonCard";
