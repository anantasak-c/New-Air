import React, { useState, useRef, useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  Camera,
  Download,
  ExternalLink,
  Check,
  Share2,
  Radio,
  X,
  Sparkles,
  Loader2,
  Globe
} from 'lucide-react';
import {
  calculateMonthlyRosterRouteStats,
  generateFlightradarUrl,
  generateGreatCirclePoints,
  calculateInitialBearing,
  projectToWebMercator
} from '../utils/airportEngine';

const GOLD = '#d9b98c';
const GOLD_BRIGHT = '#eed9ac';
const GOLD_PIN = '#e7cf9e';
const HOME_BASE = 'BKK';
// The lucide plane path points to the top-right (NE), so rotate by -45°
// to make 0° equal true north.
const PLANE_ICON_OFFSET = -45;
const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';
const PLANE_SVG_PATH =
  'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z';

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

// Midpoint of a great-circle point list plus the local heading there,
// measured between two samples straddling the midpoint.
function arcMidpointInfo(points) {
  const mid = points[Math.floor(points.length / 2)];
  const before = points[Math.max(0, Math.floor(points.length / 2) - 4)];
  const after = points[Math.min(points.length - 1, Math.floor(points.length / 2) + 4)];
  return { mid, heading: calculateInitialBearing(before, after) };
}

const meanLongitude = (airports) =>
  airports.reduce((sum, ap) => sum + ap.lng, 0) / airports.length;

// Pick the largest Web Mercator zoom (2–6) that fits the airports inside the
// canvas map box and return a lat/lng -> box-pixel projector.
function fitWebMercatorBox(airports, box) {
  const lats = airports.map((a) => a.lat);
  const lngs = airports.map((a) => a.lng);
  const minLat = Math.min(...lats) - 3;
  const maxLat = Math.max(...lats) + 3;
  const minLng = Math.min(...lngs) - 4;
  const maxLng = Math.max(...lngs) + 4;

  let z = 2;
  for (let cand = 6; cand >= 2; cand--) {
    const tl = projectToWebMercator(maxLat, minLng, cand);
    const br = projectToWebMercator(minLat, maxLng, cand);
    if (br.x - tl.x <= box.w * 1.08 && br.y - tl.y <= box.h * 1.05) {
      z = cand;
      break;
    }
  }

  const centerPx = {
    x:
      (projectToWebMercator(0, minLng, z).x + projectToWebMercator(0, maxLng, z).x) / 2,
    y:
      (projectToWebMercator(maxLat, 0, z).y + projectToWebMercator(minLat, 0, z).y) / 2
  };
  const originX = centerPx.x - box.w / 2;
  const originY = centerPx.y - box.h / 2;
  const toBox = (lat, lng) => {
    const p = projectToWebMercator(lat, lng, z);
    return { x: box.x + p.x - originX, y: box.y + p.y - originY };
  };
  return { z, originX, originY, toBox };
}

// Load one CARTO retina tile with CORS so the export canvas stays untainted
function loadTile(z, tx, ty, sub) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve({ ok: true, img, tx, ty });
    img.onerror = () => resolve({ ok: false });
    img.src = `https://${sub}.basemaps.cartocdn.com/dark_all/${z}/${tx}/${ty}@2x.png`;
  });
}

export default function RouteStoryMap({ flights = [] }) {
  const [stats, setStats] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyPreviewModal, setStoryPreviewModal] = useState(false);
  const mapRef = useRef(null);
  const storyCanvasRef = useRef(null);

  useEffect(() => {
    setStats(calculateMonthlyRosterRouteStats(flights));
  }, [flights]);

  // Deduplicate repeated sectors (BKK-CNX flown 5x renders as one arc)
  const arcs = useMemo(() => {
    if (!stats) return [];
    const map = new Map();
    stats.sectors.forEach((sec) => {
      const key = `${sec.from}-${sec.to}`;
      const reverse = `${sec.to}-${sec.from}`;
      const k = map.has(reverse) ? reverse : key;
      const existing = map.get(k);
      if (existing) existing.count += 1;
      else map.set(k, { from: sec.fromAp, to: sec.toAp, count: 1 });
    });
    return Array.from(map.values());
  }, [stats]);

  const flightDuties = useMemo(
    () => flights.filter((f) => f.dutyType === 'flight'),
    [flights]
  );

  // Real-world interactive map (CARTO Dark Matter basemap, Flightradar24 style)
  useEffect(() => {
    if (!stats || !mapRef.current) return;

    const map = L.map(mapRef.current, {
      center: [13.69, 118],
      zoom: 4,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false,
      worldCopyJump: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: CARTO_ATTR,
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    arcs.forEach(({ from, to, count }) => {
      const circle = generateGreatCirclePoints(from, to, 64);
      const pts = circle.map((p) => [p.lat, p.lng]);
      L.polyline(pts, { color: GOLD, weight: 7, opacity: 0.12, lineCap: 'round' }).addTo(map);
      L.polyline(pts, {
        color: GOLD_BRIGHT,
        weight: 1.6 + Math.min(count - 1, 3) * 0.7,
        opacity: 0.9,
        lineCap: 'round'
      }).addTo(map);

      const { mid, heading } = arcMidpointInfo(circle);
      L.marker(mid, {
        interactive: false,
        icon: L.divIcon({
          className: 'rm-plane-icon',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="${GOLD_BRIGHT}" style="transform: rotate(${heading + PLANE_ICON_OFFSET}deg)"><path d="${PLANE_SVG_PATH}"/></svg>`
        })
      }).addTo(map);
    });

    const bounds = [];
    const meanLng = meanLongitude(stats.uniqueAirports);
    stats.uniqueAirports.forEach((ap) => {
      const isHome = ap.code === HOME_BASE;
      const flipLeft = ap.lng > meanLng + 8;
      L.marker([ap.lat, ap.lng], {
        icon: L.divIcon({
          className: 'rm-pin',
          iconSize: [0, 0],
          html: `<div class="rm-pin-dot${isHome ? ' rm-pin-home' : ''}"></div><div class="rm-pin-label${isHome ? ' rm-label-home' : ''}${flipLeft ? ' rm-label-flip' : ''}">${ap.code}</div>`
        })
      })
        .addTo(map)
        .bindTooltip(`${ap.code} · ${ap.thai || ap.name}`, {
          direction: 'top',
          offset: [0, -8],
          className: 'rm-tip'
        });
      bounds.push([ap.lat, ap.lng]);
    });

    map.fitBounds(L.latLngBounds(bounds).pad(0.22), { maxZoom: 6, animate: false });

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapRef.current);

    return () => {
      ro.disconnect();
      map.remove();
    };
  }, [stats, arcs]);

  // Compose the 1080x1920 story card with a real basemap rendered onto canvas
  const generateStoryImage = async () => {
    if (!stats || !storyCanvasRef.current) return;
    setIsGeneratingStory(true);

    try {
      if (document.fonts?.ready) await document.fonts.ready;

      const canvas = storyCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const now = new Date();
      const monthLabel = now
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        .toUpperCase();

      // 1. Deep charcoal gradient backdrop
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0c0d12');
      bg.addColorStop(0.55, '#08090d');
      bg.addColorStop(1, '#050609');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      const goldGlow = ctx.createRadialGradient(w * 0.85, -120, 0, w * 0.85, -120, 520);
      goldGlow.addColorStop(0, 'rgba(217, 185, 140, 0.10)');
      goldGlow.addColorStop(1, 'rgba(217, 185, 140, 0)');
      ctx.fillStyle = goldGlow;
      ctx.fillRect(0, 0, w, 420);

      // 2. Header
      const accent = ctx.createLinearGradient(90, 0, 300, 0);
      accent.addColorStop(0, GOLD);
      accent.addColorStop(1, 'rgba(217, 185, 140, 0)');
      ctx.fillStyle = accent;
      ctx.fillRect(90, 112, 210, 2);

      ctx.letterSpacing = '6px';
      ctx.fillStyle = GOLD;
      ctx.font = '700 23px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`CREW FLIGHT LOG · ${monthLabel}`, 90, 168);
      ctx.letterSpacing = '0px';

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 64px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Monthly Route Map', 90, 240);

      ctx.fillStyle = '#9aa2b1';
      ctx.font = '400 26px "Plus Jakarta Sans", "Sarabun", sans-serif';
      ctx.fillText('เส้นทางบินและสถิติการเดินทางประจำเดือน', 90, 292);

      // 3. Real world map box — composite CARTO tiles via Web Mercator projection
      const box = { x: 90, y: 345, w: 900, h: 880, r: 36 };

      ctx.save();
      roundedRect(ctx, box.x, box.y, box.w, box.h, box.r);
      ctx.clip();

      ctx.fillStyle = '#0d0f14';
      ctx.fillRect(box.x, box.y, box.w, box.h);

      const { z, originX, originY, toBox } = fitWebMercatorBox(stats.uniqueAirports, box);

      const tileCount = Math.pow(2, z);
      const tx0 = Math.max(0, Math.floor(originX / 256));
      const tx1 = Math.min(tileCount - 1, Math.floor((originX + box.w) / 256));
      const ty0 = Math.max(0, Math.floor(originY / 256));
      const ty1 = Math.min(tileCount - 1, Math.floor((originY + box.h) / 256));

      const tileJobs = [];
      let subIdx = 0;
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          tileJobs.push(loadTile(z, tx, ty, 'abcd'[subIdx++ % 4]));
        }
      }
      const tiles = await Promise.all(tileJobs);
      tiles.forEach((t) => {
        if (!t.ok) return;
        ctx.drawImage(
          t.img,
          box.x + t.tx * 256 - originX,
          box.y + t.ty * 256 - originY,
          256,
          256
        );
      });

      // Edge fade so the basemap blends into the card
      const fade = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
      fade.addColorStop(0, 'rgba(8, 9, 13, 0.55)');
      fade.addColorStop(0.16, 'rgba(8, 9, 13, 0)');
      fade.addColorStop(0.84, 'rgba(8, 9, 13, 0)');
      fade.addColorStop(1, 'rgba(8, 9, 13, 0.62)');
      ctx.fillStyle = fade;
      ctx.fillRect(box.x, box.y, box.w, box.h);

      // 4. Great circle arcs with glow (geometry computed once, reused for glyphs)
      const arcGeometries = arcs.map(({ from, to }) => {
        const circle = generateGreatCirclePoints(from, to, 64);
        return {
          path: circle.map((p) => toBox(p.lat, p.lng)),
          ...arcMidpointInfo(circle)
        };
      });

      arcGeometries.forEach(({ path }) => {
        ctx.beginPath();
        path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.strokeStyle = 'rgba(217, 185, 140, 0.30)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.shadowColor = GOLD;
        ctx.shadowBlur = 22;
        ctx.stroke();

        ctx.beginPath();
        path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.strokeStyle = GOLD_BRIGHT;
        ctx.lineWidth = 3.5;
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 5. Aircraft glyphs at arc midpoints
      const planePath = new Path2D(PLANE_SVG_PATH);
      arcGeometries.slice(0, 8).forEach(({ mid, heading }) => {
        const m = toBox(mid.lat, mid.lng);

        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(((heading + PLANE_ICON_OFFSET) * Math.PI) / 180);
        ctx.scale(0.85, 0.85);
        ctx.translate(-12, -12);
        ctx.fillStyle = '#f0dcae';
        ctx.shadowColor = 'rgba(230, 205, 154, 0.9)';
        ctx.shadowBlur = 12;
        ctx.fill(planePath);
        ctx.restore();
      });

      // 6. Airport pins + IATA labels
      ctx.textBaseline = 'middle';
      const meanLngExport = meanLongitude(stats.uniqueAirports);
      stats.uniqueAirports.forEach((ap) => {
        const p = toBox(ap.lat, ap.lng);
        const home = ap.code === HOME_BASE;
        const flipLeft = ap.lng > meanLngExport + 8 || p.x > box.x + box.w - 90;

        ctx.beginPath();
        ctx.arc(p.x, p.y, home ? 10 : 7.5, 0, Math.PI * 2);
        ctx.fillStyle = home ? GOLD_PIN : '#f2f4f8';
        ctx.shadowColor = home ? 'rgba(231, 207, 158, 0.95)' : 'rgba(242, 244, 248, 0.85)';
        ctx.shadowBlur = 16;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, home ? 10 : 7.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(10, 11, 14, 0.55)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.letterSpacing = '2px';
        ctx.font = '700 21px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = home ? GOLD_BRIGHT : 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.textAlign = flipLeft ? 'right' : 'left';
        ctx.fillText(ap.code, flipLeft ? p.x - 16 : p.x + 16, p.y);
        ctx.textAlign = 'left';
        ctx.letterSpacing = '0px';
        ctx.shadowBlur = 0;
      });

      ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(190, 197, 210, 0.55)';
      ctx.textAlign = 'right';
      ctx.fillText('© OpenStreetMap · © CARTO', box.x + box.w - 16, box.y + box.h - 16);
      ctx.textAlign = 'left';
      ctx.restore();

      // Gold hairline frame around the map
      roundedRect(ctx, box.x, box.y, box.w, box.h, box.r);
      ctx.strokeStyle = 'rgba(217, 185, 140, 0.28)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 7. Stats grid 2x2
      const statY = 1280;
      const cardW = (box.w - 24) / 2;
      const cardH = 150;
      const statCards = [
        ['SECTORS FLOWN', `${stats.totalSectors}`, 'ไฟลท์ในเดือนนี้', '#ffffff'],
        ['DESTINATIONS', `${stats.uniqueAirports.length} เมือง`, `${stats.uniqueCountriesCount} ประเทศ`, '#ffffff'],
        ['TOTAL DISTANCE', `${stats.totalDistanceKm.toLocaleString()} km`, `${stats.totalNauticalMiles.toLocaleString()} NM`, '#ffffff'],
        ['LIVE TRACKING', 'Flightradar24', 'พร้อมแชร์เรดาร์สด', GOLD_BRIGHT]
      ];

      statCards.forEach(([label, value, sub, color], i) => {
        const x = box.x + (i % 2) * (cardW + 24);
        const y = statY + Math.floor(i / 2) * (cardH + 24);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
        roundedRect(ctx, x, y, cardW, cardH, 28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.letterSpacing = '3px';
        ctx.fillStyle = '#8b93a3';
        ctx.font = '700 19px "Plus Jakarta Sans", "Sarabun", sans-serif';
        ctx.fillText(label, x + 30, y + 44);
        ctx.letterSpacing = '0px';

        ctx.fillStyle = color;
        ctx.font = '700 42px "SF Mono", Consolas, monospace';
        ctx.fillText(value, x + 30, y + 95);

        ctx.fillStyle = '#62697a';
        ctx.font = '400 19px "Plus Jakarta Sans", "Sarabun", sans-serif';
        ctx.fillText(sub, x + 30, y + 126);
      });

      // 8. Footer
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(90, 1698);
      ctx.lineTo(990, 1698);
      ctx.stroke();

      ctx.letterSpacing = '3px';
      ctx.fillStyle = '#565e6e';
      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('FLIGHT REST PLANNER × FLIGHTRADAR24', 90, 1750);
      ctx.letterSpacing = '0px';

      setStoryPreviewModal(true);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const downloadStoryImageFile = () => {
    if (!storyCanvasRef.current) return;
    const now = new Date();
    const stamp = `${now.toLocaleDateString('en-US', { month: 'short' })}_${now.getFullYear()}`;
    const link = document.createElement('a');
    link.download = `Crew_Story_${stamp}.png`;
    link.href = storyCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleShareFlightradar = async (flight, idx) => {
    const fr24Url = generateFlightradarUrl(flight.pairing);
    const text = `✈️ ตารางบินของฉัน: ${flight.pairing}\n🗓️ ${flight.date} (Report: ${flight.reportTime || '--:--'} L)\n📡 ติดตามตำแหน่งเครื่องบินสดๆ บน Flightradar24 ได้ที่นี่ครับ:\n${fr24Url}`;

    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2500);
    }
  };

  const stripStats = stats
    ? [
        ['SECTORS', `${stats.totalSectors}`, 'ไฟลท์'],
        ['DESTINATIONS', `${stats.uniqueAirports.length}`, 'เมือง'],
        ['DISTANCE', stats.totalDistanceKm.toLocaleString(), 'km'],
        ['RANGE', stats.totalNauticalMiles.toLocaleString(), 'NM']
      ]
    : [];

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full">

      {/* Header */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/[0.06] bg-[#0b0c10] p-5 sm:p-7">
        <div className="pointer-events-none absolute -top-28 -right-16 h-64 w-64 rounded-full bg-[#d9b98c]/[0.07] blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5 text-[#d9b98c]">
              <Compass className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold tracking-[0.28em] uppercase">
                Flight Route Story · Live Radar
              </span>
            </div>
            <h2 className="mt-2.5 text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              แผนที่เส้นทางบินประจำเดือน
            </h2>
            <p className="mt-1.5 text-xs sm:text-[13px] text-slate-400/90 leading-relaxed max-w-md">
              แผนที่โลกจริงเชื่อมโยงทุกไฟลท์แบบ Great Circle พร้อมลิงก์เรดาร์ Flightradar24
              และการ์ดสตอรี่ 9:16 สำหรับ IG / TikTok
            </p>
          </div>

          <button
            type="button"
            onClick={generateStoryImage}
            disabled={isGeneratingStory || !stats}
            className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#e2c98f] text-[#191204] text-xs sm:text-sm font-bold shadow-lg shadow-[#e2c98f]/15 hover:bg-[#ead8ab] transition active:scale-95 disabled:opacity-60"
          >
            {isGeneratingStory ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            <span>{isGeneratingStory ? 'กำลังประกอบภาพแผนที่จริง...' : 'สร้างภาพสตอรี่ (IG 9:16)'}</span>
          </button>
        </div>
      </section>

      {/* Real world map */}
      <section className="relative rounded-[28px] border border-white/[0.06] bg-[#0b0c10] overflow-hidden">
        <div className="absolute top-3.5 left-3.5 z-[1001] flex items-center gap-2 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/[0.08]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e2c98f] animate-pulse" />
          <span className="text-[9px] font-bold tracking-[0.22em] text-slate-200 uppercase">
            Live World Radar
          </span>
        </div>
        <div className="absolute top-3.5 right-11 z-[1001] text-[10px] font-mono text-slate-400 bg-black/45 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/[0.08]">
          {stats?.uniqueAirports.length || 0} สนามบิน
        </div>

        <div ref={mapRef} className="h-[380px] sm:h-[440px] lg:h-[500px] w-full rm-leaflet" />

        {/* Stats strip */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/[0.06] bg-[#0a0b0e]">
            {stripStats.map(([label, value, unit], i) => (
              <div
                key={label}
                className={`px-4 py-3.5 border-white/[0.06] ${
                  ['', 'border-l', 'border-t sm:border-t-0 sm:border-l', 'border-l border-t sm:border-t-0'][i]
                }`}
              >
                <span className="block text-[9px] font-bold tracking-[0.2em] text-slate-500 uppercase">
                  {label}
                </span>
                <span className="mt-1 block text-base sm:text-lg font-bold text-white font-mono tabular-nums">
                  {value}
                  <span className="ml-1 text-[11px] font-semibold text-[#d9b98c]">{unit}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Flightradar24 live tracking list */}
      <section className="rounded-[28px] border border-white/[0.06] bg-[#0b0c10] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-[#e2c98f] opacity-60 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-[#e2c98f]" />
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
              ติดตามไฟลท์สด · Flightradar24
            </h3>
          </div>
          <span className="hidden sm:block text-[11px] text-slate-500">
            แตะเพื่อเปิดเรดาร์สด / แชร์ให้ครอบครัว
          </span>
        </div>

        <div className="divide-y divide-white/[0.05]">
          {flightDuties.map((f, idx) => {
            const fr24Url = generateFlightradarUrl(f.pairing);
            const isCopied = copiedIndex === idx;

            return (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                    <span>{f.date}</span>
                    <span className="h-3 w-px bg-white/10" />
                    <span>RPT {f.reportTime || '--:--'} L</span>
                  </div>
                  <p className="mt-0.5 text-[15px] font-bold text-white tracking-tight truncate">
                    {f.pairing}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={fr24Url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#d9b98c]/25 bg-[#d9b98c]/[0.07] text-[#e6cd9a] text-[11px] font-bold hover:bg-[#d9b98c]/[0.14] transition active:scale-95"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>เรดาร์สด</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleShareFlightradar(f, idx)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/[0.08] text-slate-300 text-[11px] font-bold hover:bg-white/[0.04] hover:border-white/[0.16] transition active:scale-95"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>แชร์</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
          {flightDuties.length === 0 && (
            <p className="py-6 text-center text-xs text-slate-500">
              ยังไม่มีไฟลท์ในเดือนนี้ — สแกน Roster ก่อนนะครับ
            </p>
          )}
        </div>
      </section>

      {/* Hidden 1080x1920 story canvas for export */}
      <canvas ref={storyCanvasRef} width={1080} height={1920} className="hidden" />

      {/* Story preview modal */}
      {storyPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#0e0f13] rounded-3xl max-w-sm w-full border border-white/[0.08] overflow-hidden shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e2c98f]" />
                <h4 className="text-sm font-bold">พรีวิวภาพสตอรี่ (9:16 · แผนที่โลกจริง)</h4>
              </div>
              <button
                type="button"
                onClick={() => setStoryPreviewModal(false)}
                className="w-7 h-7 rounded-full bg-white/[0.06] text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-white/[0.08] bg-black">
              <img
                src={storyCanvasRef.current?.toDataURL('image/png')}
                alt="Crew Story Card"
                className="w-full h-auto object-cover max-h-[60vh] rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={downloadStoryImageFile}
                className="w-full py-3 rounded-xl bg-[#e2c98f] text-[#191204] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#ead8ab] transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>บันทึกภาพลงเครื่อง (HD 1080×1920)</span>
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                บันทึกแล้วโพสต์ลง Instagram / Facebook / TikTok Story ได้ทันที
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
