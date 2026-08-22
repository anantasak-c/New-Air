# ADR 0005: Obsidian Flight Graph & Dual Themes (ดำทอง / น้ำเงินขาว)

## Status
Accepted

## Context
ADR 0004 shipped the real-world CARTO basemap. User feedback on production:
1. The plane glyph on short hops (CNX–CEI) read as a stray dot and cluttered the node cluster.
2. Country borders on the dark basemap were too faint to see "ประเทศที่เคยไป" (countries visited).
3. The user wanted a more distinctive aesthetic — "อารมณ์ Obsidian graph" — and a light/dark theme pair: **ดำทอง** (black & gold, dark) and **น้ำเงินขาว** (blue & white, light).

An interview (grilling) settled the direction: the 9:16 story card is the hero moment; the page becomes card-forward with a live preview; the map becomes a dark world + luminous graph; plane glyphs are removed; visited countries glow.

## Decision
1. **Card-forward layout**: the 1080×1920 poster renders live on page load (and on roster/theme change, debounced) inside a phone-mockup preview. Buttons: `เซฟ HD` (direct download) and `ดูเต็มจอ` (modal). No separate "generate" step.
2. **Obsidian Flight Graph** (interactive map):
   - Basemap dimmed via CSS tile filter (`brightness(0.7) saturate(0.6)` dark / light-touch filter for sky) so continents read as shadows; the graph carries the visual weight.
   - Airports become glowing orbs sized by visit frequency; home base (BKK) breathes (`rm-breathe` keyframes). IATA labels always visible, flip side near edges/centroid as in ADR 0004.
   - **Plane glyphs removed**; "flights in motion" is expressed by small light particles traveling along the great-circle paths (requestAnimationFrame marker interpolation, one per deduped arc, ≤10, alternating directions).
   - **Visited-country glow**: world-atlas `countries-110m` TopoJSON + `topojson-client` filter countries by airport `country` labels (alias: Macau→Macao); rendered as soft fill + hairline border (gold/blue per theme) on both Leaflet and the canvas poster. 110m resolution keeps the bundle small (~40 KB gzip); Singapore/Hong Kong may be absent at 110m — acceptable, pins still mark them.
3. **Dual themes** (`THEMES` palette object in `RouteStoryMap.jsx`): `obsidian` (CARTO `dark_all` + champagne gold) and `sky` (CARTO `light_all` + blue). One palette drives page Tailwind classes, Leaflet colors, particle colors, and poster inks — including the exported card, which always matches the active theme. Filenames embed the theme key.
4. **Full-bleed poster**: the 9:16 card drops the boxed layout — map fills the entire canvas (region fitted into a 1080×1150 band, tiles composited across the full 1920px), top/bottom vignettes for floating header/stats, single-row stats with hairline separators.

## Consequences
- **Positive**: the dot complaint is resolved structurally (no more plane icons); visited countries are unmistakable; two saleable themes from one palette object; zero-step card preview.
- **Negative**: bundle grows to ~738 KB min / ~220 KB gzip (world-atlas); poster generation now loads more tiles (full-bleed, up to ~40) per render; theme switch rebuilds the Leaflet map (visible but fast).
- **Follow-ups**: code-split RouteStoryMap + world-atlas via dynamic `import()`; consider caching composited poster tiles between theme switches; unit tests for `fitWebMercatorBox` / country matching.
