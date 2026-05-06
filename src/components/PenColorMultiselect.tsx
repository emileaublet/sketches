import React from "react";
import type { DotPen } from "@/pens";
import { allPens } from "@/pens";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function getRgbForPen(pen: DotPen): string {
  try {
    const [familyName, penName] = pen.split(".");
    const family = allPens[familyName as PenFamily];
    const pens = family?.pens as Record<string, number[]> | undefined;
    const rgba = pens?.[penName];
    if (!rgba || rgba.length < 3) return "rgb(128, 128, 128)";
    const [r, g, b] = rgba;
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return "rgb(128, 128, 128)";
  }
}

export type PenFamily = keyof typeof allPens;

export interface PenColorMultiselectProps {
  label: string;
  options: DotPen[];
  value: DotPen[];
  onChange: (value: DotPen[]) => void;
}

const TOOLTIP_DELAY_MS = 700;

export function PenColorMultiselect({
  label,
  options,
  value,
  onChange,
}: PenColorMultiselectProps) {
  const [tooltip, setTooltip] = React.useState<{
    pen: DotPen;
    x: number;
    y: number;
  } | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = (pen: DotPen) => {
    if (value.includes(pen)) {
      onChange(value.filter((p) => p !== pen));
    } else {
      onChange([...value, pen]);
    }
  };

  const handleMouseEnter = (pen: DotPen, e: React.MouseEvent) => {
    timerRef.current = setTimeout(() => {
      setTooltip({
        pen,
        x: e.clientX,
        y: e.clientY,
      });
    }, TOOLTIP_DELAY_MS);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip) {
      setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null));
    }
  };

  const clearTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setTooltip(null);
  };

  const colors = React.useMemo(
    () => Object.fromEntries(options.map((pen) => [pen, getRgbForPen(pen)])),
    [options],
  );

  return (
    <div className="flex flex-col gap-1 w-full">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div
        className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto p-0.5"
        onMouseMove={handleMouseMove}
        onMouseLeave={clearTooltip}
      >
        {options.map((pen) => {
          const rgb = colors[pen] ?? "rgb(128, 128, 128)";
          const isSelected = value.includes(pen);
          return (
            <button
              key={pen}
              type="button"
              onClick={() => toggle(pen)}
              onMouseEnter={(e) => handleMouseEnter(pen, e)}
              onMouseLeave={clearTooltip}
              className={cn(
                "size-[18px] p-0 rounded-sm cursor-pointer border shrink-0",
                isSelected
                  ? "border-2 border-primary"
                  : "border border-black/20",
              )}
              style={{ backgroundColor: rgb }}
            />
          );
        })}
      </div>
      {tooltip && (
        <div
          className="fixed py-0.5 px-1.5 text-[11px] bg-muted text-muted-foreground rounded pointer-events-none z-[10000]"
          style={{ left: tooltip.x + 8, top: tooltip.y + 4 }}
        >
          {String(tooltip.pen.split(".").pop()).replace(/_/g, " ")}
        </div>
      )}
    </div>
  );
}

export type PenMultiselectDescriptor = {
  _type: "pen-multiselect";
  family?: PenFamily;
  available?: DotPen[];
  selected?: DotPen[];
  label?: string;
};

export function penColorMultiselect(
  config: Omit<PenMultiselectDescriptor, "_type">,
): PenMultiselectDescriptor {
  return { _type: "pen-multiselect", ...config };
}
