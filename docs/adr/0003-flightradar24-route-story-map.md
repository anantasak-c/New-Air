# ADR 0003: Flightradar24 Integration & Crew Route Story Map Generator

## Status
Accepted

## Context
Flight crew (pilots and cabin crew) take pride in their monthly flight destinations and frequently share their flight routes on social media (Instagram Stories, Facebook, TikTok). Furthermore, family members and loved ones need a fast, frictionless way to track active flights in real-time without cumbersome search steps.

## Decision
We will build a comprehensive **Flightradar24 & Route Story Map Subsystem**:
1. **Airport & Geodesic Calculation Engine (`src/utils/airportEngine.js`)**:
   - Comprehensive database of major Asian, European, and Global airports (BKK, DMK, CNX, URT, HKT, HDY, CEI, YNT, TPE, OKA, KIX, NRT, HND, ICN, SIN, KUL, SGN, HAN, DPS, MEL, SYD, etc.).
   - Parses flight pairings (e.g. `114-1: BKK-CNX-BKK-URT-BKK` or `TPE-OKA1-1: BKK-TPE-OKA-TPE`) into route waypoint sequences.
   - Calculates Great Circle geodesic distances (Haversine formula) in kilometers and nautical miles.
2. **Interactive Dark Radar Route Map (`src/components/RouteStoryMap.jsx`)**:
   - High-contrast aviation radar dark map.
   - Animated or glowing Great Circle flight arcs connecting city pairs.
   - Dynamic airport pin markers with IATA labels.
   - Flight statistics summary card:
     - ✈️ Total Flights / Sectors
     - 🌍 Unique Destinations & Countries
     - 📏 Total Distance Flown (km)
3. **1-Click 9:16 Instagram Story Image Generator**:
   - Renders a clean 1080x1920 (9:16) Story image using HTML5 Canvas / DOM image export for direct download and posting to social media.
4. **Flightradar24 Live Radar Sharing (`src/utils/flightradarUtils.js`)**:
   - Generates direct tracking deep-links: `https://www.flightradar24.com/data/flights/{flight_number}` or live radar search URLs.
   - Provides a 1-click **"📤 แชร์ให้ครอบครัวติดตามไฟลท์สด (LINE)"** button formatting clean messages with direct Flightradar24 radar links.

## Consequences
- **Positive**:
  - Delivers viral social-sharing value for flight crew.
  - Zero external API costs or rate limits by utilizing built-in airport coordinates.
  - Real-time family reassurance via seamless Flightradar24 deep-links.
