⏺ Here's my plan. No code yet, just architecture and trade-offs.

  What stripedRows actually is

  So I lock the vocabulary before redesigning:

  1. Strip subdivision — polygon cut into horizontal strips of random height
  (wingRowHeightMin..Max), each strip with a small random tilt (paintStripedField).
  2. Bundled hatching per strip — line segments in clusters of length
  bundleLengthMin..Max, separated by gaps gapMin..Max. Each bundle has its own
  length+spacing roll. → that's your "short segments" feel.
  3. Per-line jitter — each line offset by ±jitter in x/y. → hand-drawn quality.
  4. Position-weighted color — each line independently picks a color from wingColors
   via a soft 1D gradient + colorRandomness knob. → that's your "color passes
  overlap."
  5. Mirrored across suture — palette reversed for the right wing.

  That whole pipeline is in creature.ts:258 paintStripedField → drawClippedLineField
   (line 635). It's the engine I want to keep and reuse.

  ---
  Core idea

  Every other elytra pattern stops being a canvas-fill operation and instead becomes
   a modulator on top of the same stripedRows line-bundle pass. The texture (strip
  rows, bundle lengths, jitter, mirror) stays identical across all patterns. What
  changes per pattern is which color each line picks and (for chevrons only) the
  line angle within a strip.

  Two modulators:

  - PatternColorField(x, y) → "base" | "accent" — replaces the gradient color picker
   inside drawClippedLineField. For each line about to be drawn, sample the field at
   the line's midpoint; pick from wingColors accordingly (the same multi-pen,
  position-weighted picker is still used per side of the field, so individual lines
  straddling an edge can get the wrong color → soft, hand-drawn boundary).
  - PatternAngleField(stripIndex) → angleOffset — applied at the paintStripedField
  level. For most patterns it's 0 (pure stripedRows tilt). For chevrons it's ±α per
  row.

  That's the entire architecture. Everything else is just expressing each existing
  pattern as one of those two fields.

  ---
  Per-pattern translation

  ┌─────────────────────┬─────────────────────────────────┬─────────────────────┐
  │       Pattern       │          Color field           │     Angle field      │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ solid               │ constant accent (or constant   │ none                 │
  │                     │ base)                          │                      │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ longitudinalStripes │ x bucketed mod 2               │ none                 │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ transverseBands     │ y bucketed mod 2               │ none                 │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ dotsGrid            │ inside any grid circle?        │ none                 │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ dotsRandom          │ inside any random circle?      │ none                 │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ dotsClustered       │ inside any clustered circle?   │ none                 │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ jaguar              │ inside patch blob OR inside    │ none                 │
  │                     │ ring annulus?                  │                      │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ patches             │ inside any blob polygon?       │ none                 │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ marginBand          │ outside inset polygon?         │ none                 │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ centralStripe       │ inside trapezoid?              │ none                 │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ tearDrops           │ inside any bezier teardrop?    │ none                 │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ vChevrons           │ row index mod 2                │ +α even rows, −α odd │
  │                     │                                │  rows                │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ mixed               │ composed: layer A then layer B │ compose if either is │
  │                     │  with precedence               │  chevron             │
  ├─────────────────────┼────────────────────────────────┼──────────────────────┤
  │ stripedRows         │ unchanged (uses gradient       │ unchanged            │
  │                     │ picker)                        │                      │
  └─────────────────────┴────────────────────────────────┴──────────────────────┘

  The geometric helpers in patterns.ts (pointInPolygon, dot placement, blob
  construction, trapezoid corners) are kept and reused to build each color field. We
   just stop using them for ctx.fill() and instead use them for "which color does
  this line want?"

  ---
  Implementation stages

  Stage 1 — Refactor the line engine.
  drawClippedLineField currently picks color via a position-weighted gradient.
  Generalize to take a pickColor(x, y, lineIdx) → colorString callback. Existing
  gradient becomes the default callback. This is the only intrusive change to the
  engine.

  Stage 2 — Build PatternColorField per pattern.
  A small file alongside patterns.ts that translates each pattern into (x, y) →
  "base" | "accent". Internally it uses the same geometry generation already in
  patterns.ts (with the same RNG seed, so dots/patches land where they always have);
   we just freeze the geometry into a list of primitives once and query it per line.

  Stage 3 — Plumb the field into the elytra pipeline.
  Replace the dispatch at creature.ts:1749. Instead of "if not stripedRows, call
  canvas painter," it becomes: "always call paintStripedField, and pass a color
  picker built from the chosen PatternColorField." stripedRows keeps its gradient
  picker.

  Stage 4 — vChevrons special case.
  Only pattern needing angle modulation. Either (a) reuse paintStripedField with the
   per-row tilt clamp lifted and a ±α swing instead of small jitter, or (b) add a
  paintChevronField variant. (a) is cleaner; the maxTilt clamp would just need to be
   parameterized.

  Stage 5 — mixed.
  Compose two color fields with a precedence rule (overlay wins where both fire).
  Single render pass — no need for a second sweep.

  Stage 6 — Drop the fill fork for elytra.
  Currently style === "fill" short-circuits to a solid ctx.fill(). Once everything
  is line-based, that branch becomes dead for elytra and should be removed
  (renderStyle still controls body/legs/head density, just not elytra anymore — or
  we redefine fill for elytra as "denser bundles, thicker stroke").

  ---
  Decisions I need from you before implementing

  1. Pen palette for accent. Right now accentColor is a single string
  (wingColors[1]). Do you want accent to also be a multi-pen sub-palette so the
  accent regions themselves get the same gradient treatment (e.g., dots that fade
  across two yellows)? Cheap to add a second multiselect.
  2. Boundary handling at pattern edges. Two options:
    - Crisp — line takes its midpoint's color, hard edges. Reads as a "printed
  pattern hand-hatched."
    - Feathered — within ~`bundleSpacingof an edge, randomize the swap so individual
   lines on either side bleed slightly. Reads more "organic." I'd default crisp +
  add apatternFeather: 0..1` knob (0 = crisp, 1 = wide bleed).
  3. Bundle that straddles a pattern edge. Two options:
    - Pick color per-line (already what stripedRows does for its gradient) — bundles
   can have mixed colors, edges look soft.
    - Pick color per-bundle — bundles stay one-color, edges look crisper but
  potentially blocky.
  Per-line is closer to your stated preference ("color passes overlap").
  4. Chevron angle. What ±α reads best? I'd start at ±25° and expose chevronAngle as
   a knob.
  5. Scope. Only elytra, or do you want pronotum (stripedColumns + variants) and
  head (fan + variants) on the same engine? They have the same architectural smell.
  I'd extend the system to all three for consistency, but it's strictly more work.
  6. renderStyle: "fill" for elytra. Keep as "denser/thicker lines," or remove the
  fork entirely and have renderStyle only affect body parts that aren't elytra? My
  pick: redefine for elytra as a density multiplier, since that gives you a "fuller"
   wing without changing the line vocabulary.

  ---
  Risks worth flagging

  - All non-stripedRows wings will look different from before. If you're emotionally
   attached to any of the current fill-mode patterns, get a side-by-side before
  merging.
  - vChevrons legibility. With short bundled segments at ±25°, the V's read less
  like solid bands and more like cross-hatched zones. That's the stripedRows
  aesthetic but it may obscure the chevron read at small wing sizes. May need to
  bump bundle lengths up for that pattern only.
  - Performance. Every line does a pointInPolygon against pattern primitives. For
  dotsRandom/dotsClustered (≤50 circles) it's nothing. For jaguar blobs (~5 polygons
   of ~10 verts) also nothing. No spatial index needed.
  - Seed stability. Pattern geometry currently rolls with p.random() mid-render.
  Once it's converted to a queryable field, the geometry must be generated once and
  frozen before the line pass — small refactor, but easy to break seed parity if not
   careful. Worth a "before/after with same seed" QA pass.

  ---
  Tell me on (1)–(6) and I'll write the implementation plan as a stepwise,
  executable doc (or just go).

✻ Sautéed for 2m 24s

❯ 1. yes select more colors
  2. yes do both + option
  3. don't know, do whatever you want
  4. good
  5. yeah, elytra and pronotum. Head should always be fan though you can remove all
   the other options.
  6. remove "fill"

⏺ Locked-in plan. Decisions baked in:

  - (1) New wingAccentColors + pronotumAccentColors multiselect palettes — accent
  regions also get the gradient/multi-pen treatment.
  - (2) Crisp by default, with patternFeather: 0..1 knob.
  - (3) Per-line color sampling (matches stripedRows behavior — bundles can mix at
  edges).
  - (4) chevronAngle knob, default ±25°.
  - (5) Scope = elytra + pronotum. Head loses everything except fan (clean removal
  of solid, dots, stripes, the head-pattern dropdown disappears).
  - (6) renderStyle: "fill" removed entirely.

  ---
  Implementation plan — line-based pattern engine

  Phase 0 — Pre-flight

  Snapshot a few reference seeds (same archetype roll, all current patterns) before
  touching anything. After implementation, render the same seeds and diff
  side-by-side. This is the only honest QA for "does it still feel like bibitte?"

  Phase 1 — Engine generalization

  File: src/sketches/bibitte/creature.ts

  1. Extract LineFieldOptions.colorRandomness + palette → a ColorPicker callback
  type:
  ColorPicker = (x: number, y: number, lineIdx: number) => string
  2. Add colorPicker?: ColorPicker to LineFieldOptions. When set, it overrides the
  existing weighted-gradient picker inside drawClippedLineField.
  3. Default behavior unchanged (existing gradient picker becomes the fallback when
  colorPicker is absent). stripedRows keeps using the gradient — zero visual change
  for that pattern.
  4. Add angleOverride?: (stripIndex: number) => number to paintStripedField. When
  set, it replaces the small random tilt. Default behavior unchanged.

  These are the only intrusive engine changes.

  Phase 2 — PatternColorField module

  New file: src/sketches/bibitte/patternFields.ts

  Define the interface:

  PatternRegion = {
    containsAccent(x, y): boolean
    edgeDistance(x, y): number   // for feathering (signed; >0 = inside, <0 =
  outside)
  }

  Each pattern returns one PatternRegion. Implementations reuse the existing
  geometry from patterns.ts (lifted out of the painter functions into pure
  region-builders so they can be shared):

  ┌──────────────────────────────┬──────────────────────────────────────────────┐
  │           Pattern            │                 Region check                 │
  ├──────────────────────────────┼──────────────────────────────────────────────┤
  │ solid                        │ always true (or always false, configurable)  │
  ├──────────────────────────────┼──────────────────────────────────────────────┤
  │ longitudinalStripes          │ floor((x - bx) / stripeUnit) % 2 === 0       │
  ├──────────────────────────────┼──────────────────────────────────────────────┤
  │ transverseBands              │ floor((y - by) / bandUnit) % 2 === 0         │
  ├──────────────────────────────┼──────────────────────────────────────────────┤
  │ dotsGrid / dotsRandom /      │ spatial hash of circle list, point in any    │
  │ dotsClustered                │ disc                                         │
  ├──────────────────────────────┼──────────────────────────────────────────────┤
  │ jaguar                       │ inside any blob polygon OR inside any ring   │
  │                              │ annulus                                      │
  ├──────────────────────────────┼──────────────────────────────────────────────┤
  │ patches                      │ inside any blob polygon                      │
  ├──────────────────────────────┼──────────────────────────────────────────────┤
  │ marginBand                   │ NOT inside inset polygon                     │
  ├──────────────────────────────┼──────────────────────────────────────────────┤
  │ centralStripe                │ inside the trapezoid                         │
  ├──────────────────────────────┼──────────────────────────────────────────────┤
  │ tearDrops                    │ inside any teardrop bezier (tessellate to    │
  │                              │ polygon for pointInPolygon)                  │
  └──────────────────────────────┴──────────────────────────────────────────────┘

  edgeDistance = signed distance to the nearest region boundary, used by the feather
   logic. For pattern types where exact distance is expensive (bezier teardrops),
  approximate by sampling the polygonized boundary.

  Phase 3 — Build the colorPicker factory

  Same file:

  buildPatternColorPicker({
    region: PatternRegion,
    basePalette: string[],
    accentPalette: string[],
    feather: number,        // 0..1 knob from constants
    colorRandomness: number,
    rng: p5SVG,
  })

  Returns a ColorPicker. Internal logic per call:

  1. Sample region.containsAccent(x, y) → picks accentPalette or basePalette.
  2. If feather > 0 AND |edgeDistance| < featherRadius → flip the choice with a
  probability that ramps from 0 at featherRadius to 0.5 at the boundary. This gives
  the soft-edge stripedRows quality on demand.
  3. Inside the chosen palette, run the same position-weighted gradient picker
  stripedRows uses (1D gradient along bundle perpendicular axis + colorRandomness).
  So multi-pen accent palettes also get pen blending.

  featherRadius derived from bundleSpacing × feather knob.

  Phase 4 — Wire elytra through the new system

  File: src/sketches/bibitte/creature.ts around line 1749

  1. Drop the if (style === "fill") branch entirely (decision 6). All elytra
  rendering goes through paintStripedField.
  2. Replace the pattern !== "stripedRows" fork with:
    - stripedRows: use the existing default gradient picker. Unchanged.
    - vChevrons: see Phase 5.
    - All others: build a PatternRegion for the polygon, build a ColorPicker from
  it, pass to paintStripedField via the new colorPicker field.
    - mixed: build TWO regions, compose them via precedence, pass single composed
  picker.
  3. Geometry generation (random dot/blob placement) now happens once per wing
  render, before the line pass, so seed parity holds. The painters in patterns.ts
  get split into buildRegion() (deterministic, no drawing) + (legacy) paint() — only
   the former gets called.

  Phase 5 — vChevrons special case

  1. Use paintStripedField with angleOverride(stripIndex) = chevronAngle *
  (stripIndex % 2 === 0 ? 1 : -1) (radians).
  2. Color picker: (x, y, _, stripIdx) => stripIdx % 2 === 0 ? accent : base (with
  optional feathering across strip seams via the same feather knob).
  3. The current paintStripedField clamps maxTilt so adjacent boundaries can't cross
   — that clamp is fine for the boundary tilt between rows, but the angle of lines
  within a strip is where ±α lives. Those are independent in the existing code
  (baseField.angle + avgTilt), so we set baseField.angle = chevronAngle for even
  strips and -chevronAngle for odd. Confirm during implementation that the
  strip-boundary tilt doesn't clash with the line angle.
  4. For the chevron read to be legible, force adjacent rows to keep boundary tilt
  small (already done by maxTilt clamp — leave it).

  Phase 6 — Pronotum, mirroring elytra

  Files: src/sketches/bibitte/creature.ts around line 1556 + patterns.ts

  paintStripedColumns already does the same row/strip thing for stripedColumns
  (axis="columns"). Apply the same engine changes:

  1. Drop pronotum's style === "fill" branch.
  2. Pronotum patterns (solid, longitudinalStripes, transverseBands, dotsGrid,
  dotsRandom, marginBand, centralStripe) all get PatternRegion builders. Same
  factory.
  3. Add pronotumAccentColors to constants + UI.
  4. Pronotum re-uses wingDensity-style line bundling? Currently uses
  pronotumColumnWidthMin/Max for strip widths, bundleLengthMin/Max shared with body.
   Keep that — no new knobs needed beyond accent palette.

  Phase 7 — Head simplification

  Files: src/sketches/bibitte/patterns.ts, creature.ts, bibitte-01.ts, archetypes.ts

  1. Remove HeadPattern union members "solid", "dots", "stripes". Keep only "fan".
  2. Remove paintHeadPattern entirely (only "fan" is left, and "fan" is already the
  legacy-path default that returns false → falls through to existing fan render).
  3. Remove headPattern from constants, constantsProps, Constants type, and from
  archetypes.ts headPatterns.
  4. Remove headPattern from BibitteRenderParams and the call to it.
  5. Don't remove headDensity — fan still uses it.

  Phase 8 — Remove renderStyle: "fill" (decision 6)

  Files: creature.ts, bibitte-01.ts

  This is the most invasive cut. style === "fill" appears in many places (body,
  pronotum, elytra, head, legs). Approach:

  1. Search-replace audit: grep -n "style === \"fill\"\\|renderStyle" and enumerate
  every fork.
  2. For each fork, the fill path goes away — only the line path survives.
  3. Body and legs already render lines for surface texture; the "fill" branch was a
   solid ctx.fill() of the body silhouette under those lines. Decide: do you want
  the silhouette outline to remain, or only the hatching? My recommendation: keep a
  thin outline stroke (so body shapes are still legible at low density) and remove
  only the solid fill.
  4. Remove renderStyle from Constants, constantsProps, BibitteRenderParams, all
  call sites.

  Phase 9 — New constants & UI

  Additions to bibitte-01.ts:

  // Pattern (line-mode) controls
  patternFeather: 0,         // 0..1 — soft pattern edges
  chevronAngle: 25,          // degrees (converted to radians at use)
  wingAccentColors: [...],   // multiselect, defaults to a contrasting subset
  pronotumAccentColors: [...]

  UI panel placement: under the existing wing/pronotum density controls, before
  color pickers.

  Removals:

  - renderStyle
  - headPattern

  Phase 10 — Visual QA pass

  1. Render the snapshot seeds from Phase 0 with the new system.
  2. For each pattern, eyeball: does it read as the same pattern? Are bundles short
  enough? Is jitter present? Are accent regions getting their gradient?
  3. Tune chevronAngle, default patternFeather, default wingAccentColors based on
  results.
  4. Pen-plot a single test sheet (one of each pattern) to validate that real ink
  doesn't change the read.

  ---
  Risks I'm flagging again before we start

  - Phase 8 is the highest-risk surgery — renderStyle: "fill" is woven through the
  whole creature renderer. If you'd rather defer that to a follow-up commit, I'd do
  Phases 1-7 first, then 8 separately. Let me know.
  - mixed precedence — when overlay region overlaps base region, overlay wins.
  Document that clearly in code comments so future-you doesn't get confused why some
   "mixed" samples look like a single overlay.
  - Seed parity isn't free — splitting patterns.ts into buildRegion (pure) + paint
  (legacy) means moving p.random() calls. If we get the order wrong, identical seeds
   will produce different geometry. I'll write a dedicated test seed list and diff
  geometry hashes before/after the split.

  ---
  Execution order I'd recommend

  If you say go:
  1. Phase 1 (engine generalization) — small, additive, no behavior change.
  2. Phase 2-3 (pattern fields + picker factory) — pure additions.
  3. Phase 4 (wire elytra) — first visible change. Pause for visual review.
  4. Phase 5 (chevrons) — second visible change. Pause for review.
  5. Phase 6 (pronotum) — repeat for the other surface.
  6. Phase 7 (head simplification) — small cleanup.
  7. Phase 8 (fill removal) — biggest cut, save for last when nothing else relies on
   it.
  8. Phase 9 (UI knobs) — interleaved with 4-7 as the knobs become needed.
  9. Phase 10 (QA).
