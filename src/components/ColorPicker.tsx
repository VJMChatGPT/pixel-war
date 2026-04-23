import { APP_CONFIG, type HexColor } from "@/config/app";
import { cn } from "@/lib/utils";

interface Props {
  value: HexColor;
  onChange: (c: HexColor) => void;
  disabled?: boolean;
  className?: string;
}

export function ColorPicker({ value, onChange, disabled, className }: Props) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-sm">Palette</h3>
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded-md border border-border"
            style={{ background: value, boxShadow: `0 0 10px ${value}55` }}
          />
          <span className="font-mono text-xs uppercase">{value}</span>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {APP_CONFIG.palette.map((c) => {
          const active = c.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={c}
              disabled={disabled}
              onClick={() => onChange(c)}
              className={cn(
                "aspect-square rounded-md border transition-all relative pixelated",
                active
                  ? "scale-110 border-foreground shadow-[0_0_10px_currentColor]"
                  : "border-border/60 hover:scale-105 hover:border-foreground/60",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{ background: c, color: c }}
              aria-label={c}
            />
          );
        })}
      </div>
    </div>
  );
}
