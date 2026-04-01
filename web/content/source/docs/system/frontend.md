---
tags: [system, frontend, react, visualization]
type: system
related:
  - "[[architecture-overview]]"
  - "[[terrain-generation]]"
  - "[[configuration]]"
---

# Frontend

A Next.js 16 / React 19 dashboard for interactive terrain exploration. Statically exported — no server-side rendering or API calls.

## Component Tree

```
<Home>                          app/page.tsx
  └─ <Dashboard>                components/Dashboard.tsx (client component)
      ├─ Header                 Title, version, tagline
      ├─ Left sidebar
      │   ├─ <ScenarioSelector> components/ScenarioSelector.tsx
      │   └─ <PolicySelector>   components/PolicySelector.tsx
      ├─ Center
      │   └─ <TerrainMap>       components/TerrainMap.tsx (canvas 640×640)
      │       └─ <SiteTooltip>  components/SiteTooltip.tsx
      └─ Right sidebar
          ├─ <SeedControl>      components/SeedControl.tsx
          └─ <LayerToggle>      components/LayerToggle.tsx
```

## State Management

All state lives in `Dashboard.tsx` via `useState`:

| State | Type | Purpose |
|-------|------|---------|
| `seed` | `number` | Controls terrain RNG |
| `activeLayer` | `LayerName` | Which terrain field to visualise |
| `selectedPolicy` | `string \| null` | Currently selected MAB policy |
| `selectedScenario` | `string \| null` | Currently selected scenario |
| `hoveredSite` | `Site \| null` | Site under cursor |

Terrain generation is memoised:

```typescript
const { terrain, sites } = useMemo(() => {
  const config = { ...DEFAULT_CONFIG, seed };
  const terrain = generateTerrain(config);
  const sites = selectCandidateSites(terrain, 15, 0.12);
  return { terrain, sites };
}, [seed]);
```

## Canvas Rendering Pipeline

`TerrainMap.tsx` renders a 640×640 pixel canvas in five layers:

1. **Elevation point cloud** — each land cell drawn as a dot, coloured by active layer value
2. **Contour lines** — marching squares at 9 elevation levels [0.1–0.9], interpolated edge crossings
3. **River trace** — find source (max flux × elevation), trace downstream, draw thick stroke
4. **Coast boundary** — dotted line along coast cells
5. **Site markers** — hollow circles with crosshairs, labelled "S0"..."S14", hover highlights

Additional elements: corner registration marks, scale ticks, coordinate labels.

## Layer System

Six terrain layers selectable via `LayerToggle`:

| Layer | Field | Colour Ramp |
|-------|-------|-------------|
| Elevation | `elevation` | Dark → bright green |
| Arability | `arability` | Dark → amber |
| Resource Rent | `resourceRent` | Dark → red |
| Defensibility | `defensibility` | Dark → blue |
| Port Quality | `portQuality` | Dark → cyan |
| Suitability | `suitability` | Dark → white |

## Styling

- **Theme**: Dark mode with custom Tailwind tokens (`bg-void`, `text-text`, `border-border`, `text-accent`)
- **Font**: JetBrains Mono (Google Fonts import)
- **Aesthetic**: Monochrome terminal / Palantir-style with scanline overlay, small-caps headers, tabular numbers
- **CSS**: Tailwind CSS v4 with `@theme` directive for custom properties

## Data Sources

- **Policies**: `web/lib/data/policies.ts` — 10 entries with name, label, type, description
- **Scenarios**: `web/lib/data/scenarios.ts` — 9 entries with name, label, description, horizon, override count
- **Terrain**: `web/lib/terrain/generate.ts` — client-side generation (see [[terrain-generation]])
- **Perlin noise**: `web/lib/terrain/perlin.ts` — seeded PRNG (`mulberry32`) + gradient noise
- **Colours**: `web/lib/terrain/colors.ts` — per-layer colour ramps

## Build

```bash
cd web
npm install
npm run dev          # Development server (localhost:3000)
npm run build        # Static export to out/
```

`next.config.ts` sets `output: "export"` for static deployment. No API routes.
