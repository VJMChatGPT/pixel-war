import { cn } from "@/lib/utils";

interface Props {
  count: number;
  total?: number;
  label?: string;
  variant?: "primary" | "secondary" | "accent";
  className?: string;
}

export function PixelBadge({ count, total, label = "pixels", variant = "primary", className }: Props) {
  const grad = {
    primary: "from-primary/20 to-primary/5 text-primary border-primary/40",
    secondary: "from-secondary/20 to-secondary/5 text-secondary border-secondary/40",
    accent: "from-accent/20 to-accent/5 text-accent border-accent/40",
  }[variant];
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border bg-gradient-to-br font-mono text-sm font-semibold",
        grad,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-sm bg-current shadow-[0_0_6px_currentColor]" />
      <span className="tabular-nums">{count}{total != null && <span className="opacity-60">/{total}</span>}</span>
      <span className="text-[10px] uppercase tracking-[0.18em] opacity-70">{label}</span>
    </div>
  );
}
