import React from "react";
import { createPlugin, useInputContext, Components } from "leva/plugin";
import type { DotPen } from "@/pens";
import { all, allPens } from "@/pens";

const { Label } = Components;

function getRgbForPen(pen: DotPen): string {
  try {
    const [familyName, penName] = pen.split(".");
    const family = allPens[familyName as keyof typeof allPens] as {
      pens: Record<string, [number, number, number, number]>;
    };
    if (!family?.pens?.[penName]) return "rgb(128, 128, 128)";
    const [r, g, b] = family.pens[penName];
    return `rgb(${r}, ${g}, ${b})`;
  } catch {
    return "rgb(128, 128, 128)";
  }
}

export type PenFamily = keyof typeof allPens;

export interface PenColorMultiselectInput {
  /** Pen family key (e.g. "zebraSarasa", "staedtlerPens") – when set, available pens come from this family */
  family?: PenFamily;
  /** Explicit list of available pens – used when family is not provided */
  available?: DotPen[];
  /** Currently selected pens – defaults to all available when omitted */
  selected?: DotPen[];
  /** Legacy: { selected, available } shape passed by Leva */
  value?: DotPen[] | { selected: DotPen[]; available: DotPen[] };
  options?: DotPen[];
}

export interface PenColorMultiselectSettings {
  options: DotPen[];
  keys: string[];
  values: DotPen[];
  colors: Record<string, string>;
}

const TOOLTIP_DELAY_MS = 700;

function PenColorMultiselectComponent() {
  const { label, value, onUpdate, settings } =
    useInputContext<PenColorMultiselectSettings>();
  const [tooltip, setTooltip] = React.useState<{
    pen: DotPen;
    x: number;
    y: number;
  } | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggle = (pen: DotPen) => {
    const current = value as DotPen[];
    if (current.includes(pen)) {
      onUpdate(current.filter((p) => p !== pen));
    } else {
      onUpdate([...current, pen]);
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

  const options = settings?.options ?? [];
  const colors = settings?.colors ?? {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", color: "var(--leva-colors-highlight2)" }}>
        <Label>{label}</Label>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          maxHeight: 100,
          overflowY: "auto",
          padding: 2,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={clearTooltip}
      >
        {options.map((pen) => {
          const rgb = colors[pen] ?? "rgb(128, 128, 128)";
          const isSelected = (value as DotPen[]).includes(pen);
          return (
            <button
              key={pen}
              type="button"
              onClick={() => toggle(pen)}
              onMouseEnter={(e) => handleMouseEnter(pen, e)}
              onMouseLeave={clearTooltip}
              style={{
                width: 18,
                height: 18,
                padding: 0,
                margin: 0,
                border: isSelected
                  ? "2px solid var(--leva-colors-accent2)"
                  : "1px solid rgba(0,0,0,0.2)",
                borderRadius: 3,
                backgroundColor: rgb,
                cursor: "pointer",
              }}
            />
          );
        })}
      </div>
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 8,
            top: tooltip.y + 4,
            padding: "2px 6px",
            fontSize: 11,
            background: "var(--leva-colors-elevation2)",
            color: "var(--leva-colors-highlight3)",
            borderRadius: 4,
            pointerEvents: "none",
            zIndex: 10000,
          }}
        >
          {String(tooltip.pen.split(".").pop()).replace(/_/g, " ")}
        </div>
      )}
    </div>
  );
}

export const penColorMultiselect = createPlugin({
  component: PenColorMultiselectComponent,
  normalize: (input: PenColorMultiselectInput) => {
    let options: DotPen[] = [];
    let selected: DotPen[] = [];

    // Leva passes the raw value object as input (not wrapped in input.value)
    const hasAvailable =
      input &&
      typeof input === "object" &&
      "available" in input &&
      Array.isArray((input as { available: DotPen[] }).available);

    if (hasAvailable) {
      options = (input as { available: DotPen[] }).available;
      selected =
        ((input as { selected?: DotPen[] }).selected ?? options) as DotPen[];
    } else if (input?.family && input.family in allPens) {
      options = all(input.family as PenFamily);
      selected =
        (input.selected?.length ? input.selected : options) as DotPen[];
    } else if (input?.options?.length) {
      options = input.options;
      selected = Array.isArray((input as { value?: DotPen[] }).value)
        ? (input as { value: DotPen[] }).value
        : options;
    }

    const keys = options.map((o) => o.split(".").pop() ?? o);
    const values = options;
    const colors = Object.fromEntries(
      options.map((pen) => [pen, getRgbForPen(pen)])
    );

    return {
      value: selected.length ? selected : options,
      settings: { options, keys, values, colors },
    };
  },
  sanitize: (value: any, settings: PenColorMultiselectSettings) => {
    if (!Array.isArray(value)) return settings.options;
    return value.filter((v) => settings.values.includes(v));
  },
  format: (value: string[]) => value,
});
