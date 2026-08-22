# ADR 0004: Real-World Basemap (Leaflet + CARTO Dark Matter) for Route Story Map

## Status
Accepted

## Context
ADR 0003 shipped the Route Story Map with a hand-drawn canvas "radar" background: concentric circles, a grid, and positioned airport dots. While functional, it showed **no real geography** — users could not recognize continents, coastlines, or country shapes, which weakened both the everyday radar experience and the shareable 9:16 story card. The UI also mixed a loud blue-gradient style and a light-themed flight list that clashed with the app's dark "Minimal Luxury" theme.

Requirements for the upgrade:
1. A **real world map** (actual coastlines/countries, Flightradar24 dark-radar look) with pan/zoom.
2. A **refined, elegant UI** consistent with the app's dark luxury design system.
3. The 9:16 (1080×1920) story card export must survive — ideally *with* the real basemap baked in.

## Decision
1. **Interactive map: Leaflet + CARTO Dark Matter raster tiles** (`dark_all`, free, no API key, retina via `{r}` → `@2x`).
   - Great-circle arcs drawn as slerp-interpolated polylines (new `generateGreatCirclePoints` in `airportEngine.js`); repeated sectors deduplicate into one arc whose weight scales with frequency.
   - Airport pins are `L.divIcon`s (gold home base / ice-white destinations) with tooltips; small rotated plane glyphs mark arc midpoints (new `calculateInitialBearing`).
   - Zoom control bottom-right, dark attribution theme via CSS overrides in `index.css`.
2. **Story card export: Web Mercator tile compositing on canvas** (new `projectToWebMercator` in `airportEngine.js`).
   - The generator picks the largest zoom (2–6) that fits the route bounds, fetches CARTO `@2x` tiles with `crossOrigin="anonymous"` (CARTO sends `Access-Control-Allow-Origin: *`, so `toDataURL` stays untainted), and draws them clipped into a rounded map box before arcs/pins/stats.
   - Missing tiles degrade gracefully — the box is pre-filled with the page background color, so partial offline still produces a valid card. Attribution (`© OpenStreetMap · © CARTO`) is printed on both the interactive map and the export.
   - Airport labels flip to the left of the pin when east of the route centroid or near the right edge, preventing East-Asia label collisions (HND/NRT/KIX).
3. **UI redesign: dark-luxury system** — near-black `#0b0c10` cards, hairline `white/6%` borders, champagne-gold accent (`#d9b98c`/`#e2c98f`), small-caps letterspaced eyebrows, mono tabular stats strip, and a dark unified flight list (replacing the white card). Share button now prefers `navigator.share` (LINE in-app share sheet) with clipboard fallback.

## Consequences
- **Positive**: Real geography on both screen and export; consistent premium theme; interactive pan/zoom; export no longer depends on custom map-drawing code; deduped arcs reduce visual clutter on busy rosters.
- **Negative**: Tile loading requires network (offline shows a dark box with arcs/pins only); Leaflet adds ~150 KB to the bundle (single-chunk warning >500 KB already flagged by Vite); CARTO free tiles are rate-limited for very heavy use — acceptable for personal crew use.
- **Follow-ups**: Consider code-splitting `RouteStoryMap` via dynamic `import()`; unit tests for `generateGreatCirclePoints` / `projectToWebMercator` if a test runner is introduced.
