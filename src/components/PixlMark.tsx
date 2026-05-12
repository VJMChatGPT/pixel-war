import { markPaths, tokenTicker } from "@/config/brand";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
  alt?: string;
};

export function PixlMark({ size = 32, className, alt }: Props) {
  const src = size > 48 ? markPaths.lg : markPaths.sm;

  return (
    <img
      src={src}
      alt={alt ?? `${tokenTicker} mark`}
      width={size}
      height={size}
      className={cn("inline-block pixelated", className)}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
      }}
      draggable={false}
    />
  );
}
