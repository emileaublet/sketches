import React, { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronUp, SlidersHorizontal, X } from "lucide-react";
import {
  PenColorMultiselect,
  type PenMultiselectDescriptor,
} from "@/components/PenColorMultiselect";
import { all } from "@/pens";
import type { LevaControlType } from "@/utils/constants";
import { cn } from "@/lib/utils";
import { cx } from "class-variance-authority";

export type ControlSchemaEntry = LevaControlType | PenMultiselectDescriptor;

function isPenMultiselect(
  entry: ControlSchemaEntry,
): entry is PenMultiselectDescriptor {
  return (
    typeof entry === "object" &&
    entry !== null &&
    (entry as { _type?: string })._type === "pen-multiselect"
  );
}

export interface SketchControlsProps {
  schema: Record<string, ControlSchemaEntry>;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function SketchControls({
  schema,
  values,
  onChange,
}: SketchControlsProps) {
  const [open, setOpen] = useState(true);
  // When paperSize changes to a non-Custom value, auto-compute width/height
  useEffect(() => {
    const paperSize = values.paperSize as string | undefined;
    const paperSizeRatio = values.paperSizeRatio as number | undefined;
    if (
      paperSize &&
      paperSize !== "Custom" &&
      paperSizeRatio != null &&
      typeof paperSize === "string"
    ) {
      const parts = paperSize.split(" -- ");
      if (parts[1]) {
        const [w, h] = parts[1].split("x").map(Number);
        if (!Number.isNaN(w) && !Number.isNaN(h)) {
          const width = Math.round(w * paperSizeRatio);
          const height = Math.round(h * paperSizeRatio);
          if (width < 2000 && height < 2000) {
            const currentW = values.width as number | undefined;
            const currentH = values.height as number | undefined;
            if (currentW !== width || currentH !== height) {
              onChange("width", width);
              onChange("height", height);
            }
          }
        }
      }
    }
  }, [
    values.paperSize,
    values.paperSizeRatio,
    values.width,
    values.height,
    onChange,
  ]);

  // Pre-process schema into render items, pairing *Min/*Max keys into range sliders
  type SingleItem = { type: "single"; key: string; def: ControlSchemaEntry };
  type RangeItem = {
    type: "range";
    minKey: string;
    maxKey: string;
    minDef: LevaControlType & {
      value: number;
      min?: number;
      max?: number;
      step?: number;
    };
    maxDef: LevaControlType & {
      value: number;
      min?: number;
      max?: number;
      step?: number;
    };
  };
  type RenderItem = SingleItem | RangeItem;

  const renderItems: RenderItem[] = [];
  const consumed = new Set<string>();

  for (const [key, def] of Object.entries(schema)) {
    if (consumed.has(key)) continue;
    if (!isPenMultiselect(def) && key.endsWith("Min")) {
      const maxKey = key.slice(0, -3) + "Max";
      const maxDef = schema[maxKey];
      const d = def as LevaControlType & { value?: unknown };
      const md = maxDef as LevaControlType & { value?: unknown };
      if (
        maxDef &&
        !isPenMultiselect(maxDef) &&
        typeof d.value === "number" &&
        typeof md.value === "number"
      ) {
        consumed.add(maxKey);
        renderItems.push({
          type: "range",
          minKey: key,
          maxKey,
          minDef: d as RangeItem["minDef"],
          maxDef: md as RangeItem["maxDef"],
        });
        continue;
      }
    }
    renderItems.push({ type: "single", key, def });
  }

  const toLabel = (key: string) =>
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (s) => s.toUpperCase());

  return (
    <div className="flex flex-col h-full items-end gap-1">
      <div
        className={cx(
          "controls-scroll overflow-y-auto border border-border bg-background/90 backdrop-blur-sm shadow-lg flex flex-col gap-5",
          "w-full rounded-t-lg md:w-[340px] md:rounded-lg",
          open ? "pb-3" : "pb-0",
        )}
      >
        <div
          className={cx(
            "sticky items-center flex justify-between top-0 bg-background/90 backdrop-blur-sm z-10 pl-3 text-sm font-medium",
            open ? "border-b" : "border-none",
          )}
        >
          Controls
          <Button
            variant="ghost"
            size="icon"
            className="opacity-50 hover:opacity-100 transition-opacity"
            onClick={() => setOpen((o) => !o)}
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>
        {open &&
          renderItems.map((item) => {
            // ── Range (two-thumb) slider for *Min/*Max pairs ──
            if (item.type === "range") {
              const { minKey, maxKey, minDef, maxDef } = item;
              const rangeMin = Math.min(minDef.min ?? 0, maxDef.min ?? 0);
              const rangeMax = Math.max(minDef.max ?? 100, maxDef.max ?? 100);
              const step = minDef.step ?? maxDef.step ?? 1;
              const minVal =
                typeof values[minKey] === "number"
                  ? (values[minKey] as number)
                  : minDef.value;
              const maxVal =
                typeof values[maxKey] === "number"
                  ? (values[maxKey] as number)
                  : maxDef.value;
              // Derive label from the shared prefix (e.g. "columnWidth" → "Column Width")
              const prefix = minKey.slice(0, -3); // strip "Min"
              const label = toLabel(prefix);
              return (
                <div key={minKey} className="space-y-1 px-3">
                  <div className="flex items-center justify-between">
                    <Label className="mb-1 text-xs text-muted-foreground">
                      {label}
                    </Label>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {minVal} – {maxVal}
                    </span>
                  </div>
                  <Slider
                    value={[minVal, maxVal]}
                    min={rangeMin}
                    max={rangeMax}
                    step={step}
                    onValueChange={([a, b]) => {
                      onChange(minKey, a);
                      onChange(maxKey, b);
                    }}
                  />
                </div>
              );
            }

            // ── Single controls ──
            const { key, def } = item;

            if (isPenMultiselect(def)) {
              const options =
                def.available ?? (def.family ? all(def.family) : []);
              const value =
                (values[key] as import("@/pens").DotPen[] | undefined) ??
                def.selected ??
                options;
              return (
                <div key={key} className="space-y-1 px-3">
                  <PenColorMultiselect
                    label={def.label ?? key}
                    options={options}
                    value={Array.isArray(value) ? value : options}
                    onChange={(v) => onChange(key, v)}
                  />
                </div>
              );
            }

            const defWithValue = def as LevaControlType & { value?: unknown };
            const value = values[key] ?? defWithValue.value;
            const label = toLabel(key);

            // number with min/max/step → Slider + Input
            if (
              typeof defWithValue.value === "number" &&
              "min" in defWithValue &&
              "max" in defWithValue
            ) {
              const min = defWithValue.min ?? 0;
              const max = defWithValue.max ?? 100;
              const step = defWithValue.step ?? 1;
              const numValue =
                typeof value === "number" ? value : defWithValue.value;
              return (
                <div key={key} className="space-y-1 px-3">
                  <div className="flex items-center justify-between">
                    <Label className="mb-1 text-xs text-muted-foreground">
                      {label}
                    </Label>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {numValue}
                    </span>
                  </div>
                  <Slider
                    value={[numValue]}
                    min={min}
                    max={max}
                    step={step}
                    onValueChange={([v]) => onChange(key, v)}
                  />
                </div>
              );
            }

            // boolean → Switch
            if (typeof defWithValue.value === "boolean") {
              const boolValue = value === true;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-2 px-3"
                >
                  <Label className="mb-1 text-xs text-muted-foreground">
                    {label}
                  </Label>
                  <Switch
                    checked={boolValue}
                    onCheckedChange={(v) => onChange(key, v)}
                  />
                </div>
              );
            }

            // string with options → Select
            if (
              typeof defWithValue.value === "string" &&
              "options" in defWithValue &&
              Array.isArray(defWithValue.options)
            ) {
              const strValue = String(value ?? defWithValue.value);
              return (
                <div key={key} className="space-y-1 px-3">
                  <Label className="mb-1 text-xs text-muted-foreground">
                    {label}
                  </Label>
                  <Select
                    value={strValue}
                    onValueChange={(v) => onChange(key, v)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {defWithValue.options.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-xs">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            // string (no options) → Input text
            if (typeof defWithValue.value === "string") {
              return (
                <div key={key} className="space-y-1">
                  <Label className="mb-1 text-xs text-muted-foreground">
                    {label}
                  </Label>
                  <Input
                    className="h-8 text-xs"
                    value={String(value ?? "")}
                    onChange={(e) => onChange(key, e.target.value)}
                  />
                </div>
              );
            }

            // [number, number] (range) — skip
            return null;
          })}
      </div>
    </div>
  );
}
