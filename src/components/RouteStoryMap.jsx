import React, { useState, useRef, useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { feature as topoFeature } from 'topojson-client';
import countries110m from 'world-atlas/countries-110m.json';
import {
  Compass,
  Download,
  ExternalLink,
  Check,
  Share2,
  Radio,
  X,
  Sparkles,
  Loader2,
  Moon,
  Sun,
  Maximize2
} from 'lucide-react';
import {
  calculateMonthlyRosterRouteStats,
  generateFlightradarUrl,
  generateGreatCirclePoints,
  projectToWebMercator
} from '../utils/airportEngine';

const HOME_BASE = 'BKK';
const CARTO_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

// Natural Earth names that differ from our airport `country` labels
const COUNTRY_ALIASES = { Macau: ['Macao'] };

const THEMES = {
  obsidian: {
    key: 'obsidian',
    label: 'ดำทอง',
    page: {
      section: 'bg-[#0a0b0e] border-white/[0.06]',
      sectionAlt: 'bg-[#0b0c10] border-white/[0.06]',
      glowBlob: 'bg-[#d9b98c]/[0.07]',
      eyebrow: 'text-[#d9b98c]',
      heading: 'text-white',
      sub: 'text-slate-400/90',
      chip: 'bg-black/45 border-white/[0.08] text-slate-200',
      chipMuted: 'text-slate-400',
      stripBg: 'bg-[#0a0b0e]',
      stripCell: 'border-white/[0.06]',
      stripLabel: 'text-slate-500',
      stripValue: 'text-white',
      unit: 'text-[#d9b98c]',
      cta: 'bg-[#e2c98f] text-[#191204] hover:bg-[#ead8ab] shadow-lg shadow-[#e2c98f]/15',
      ghostBtn: 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04] hover:border-white/[0.16]',
      frBtn: 'border-[#d9b98c]/25 bg-[#d9b98c]/[0.07] text-[#e6cd9a] hover:bg-[#d9b98c]/[0.14]',
      divide: 'divide-white/[0.05]',
      dateMono: 'text-slate-500',
      pairing: 'text-white',
      empty: 'text-slate-500',
      modalBg: 'bg-[#0e0f13] border-white/[0.08]',
      modalText: 'text-white',
      modalMuted: 'text-slate-500',
      modalClose: 'bg-white/[0.06] text-slate-400 hover:text-white',
      modalImgBorder: 'border-white/[0.08]',
      toggleWrap: 'border-white/[0.08] bg-white/[0.03]',
      toggleActive: 'bg-[#e2c98f] text-[#191204]',
      toggleIdle: 'text-slate-400 hover:text-white',
      previewBorder: 'border-white/[0.1]',
      previewGlow: 'shadow-[0_24px_60px_-20px_rgba(217,185,140,0.35)]',
      liveDot: 'bg-[#e2c98f]'
    },
    map: {
      tiles: 'dark_all',
      bg: '#07080b',
      countryFill: 'rgba(217, 185, 140, 0.08)',
      countryStroke: 'rgba(217, 185, 140, 0.45)',
      arcCore: '#eed9ac',
      arcGlow: '#d9b98c',
      arcGlowOpacity: 0.22,
      nodeHome: '#e7cf9e',
      nodeOther: '#f2f4f8',
      nodeGlow: '231, 207, 158',
      nodeOtherGlow: '242, 244, 248',
      label: 'rgba(255, 255, 255, 0.92)',
      labelHome: '#eed9ac',
      particle: '#f5e3b8',
      particleGlow: 'rgba(240, 220, 174, 0.85)'
    },
    poster: {
      bgTop: '#0c0d12',
      bgMid: '#08090d',
      bgBottom: '#050609',
      vignetteTop: 'rgba(5, 6, 9, 0.9)',
      vignetteBottom: 'rgba(5, 6, 9, 0.94)',
      eyebrow: '#d9b98c',
      title: '#ffffff',
      sub: '#9aa2b1',
      statLabel: '#8b93a3',
      statValue: '#ffffff',
      statSub: '#62697a',
      hairline: 'rgba(255, 255, 255, 0.14)',
      footer: '#565e6e'
    }
  },
  sky: {
    key: 'sky',
    label: 'น้ำเงินขาว',
    page: {
      section: 'bg-white border-slate-200',
      sectionAlt: 'bg-white border-slate-200',
      glowBlob: 'bg-blue-500/[0.06]',
      eyebrow: 'text-blue-600',
      heading: 'text-slate-900',
      sub: 'text-slate-500',
      chip: 'bg-white/70 border-slate-200 text-slate-700',
      chipMuted: 'text-slate-500',
      stripBg: 'bg-slate-50',
      stripCell: 'border-slate-200',
      stripLabel: 'text-slate-400',
      stripValue: 'text-slate-900',
      unit: 'text-blue-600',
      cta: 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20',
      ghostBtn: 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400',
      frBtn: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
      divide: 'divide-slate-100',
      dateMono: 'text-slate-400',
      pairing: 'text-slate-800',
      empty: 'text-slate-400',
      modalBg: 'bg-white border-slate-200',
      modalText: 'text-slate-900',
      modalMuted: 'text-slate-500',
      modalClose: 'bg-slate-100 text-slate-400 hover:text-slate-700',
      modalImgBorder: 'border-slate-200',
      toggleWrap: 'border-slate-200 bg-slate-50',
      toggleActive: 'bg-blue-600 text-white',
      toggleIdle: 'text-slate-500 hover:text-slate-800',
      previewBorder: 'border-slate-200',
      previewGlow: 'shadow-[0_24px_60px_-20px_rgba(37,99,235,0.35)]',
      liveDot: 'bg-blue-600'
    },
    map: {
      tiles: 'light_all',
      bg: '#eef2f6',
      countryFill: 'rgba(37, 99, 235, 0.06)',
      countryStroke: 'rgba(37, 99, 235, 0.4)',
      arcCore: '#2563eb',
      arcGlow: '#3b82f6',
      arcGlowOpacity: 0.28,
      nodeHome: '#2563eb',
      nodeOther: '#1e293b',
      nodeGlow: '37, 99, 235',
      nodeOtherGlow: '30, 41, 59',
      label: 'rgba(15, 23, 42, 0.85)',
      labelHome: '#1d4ed8',
      particle: '#93c5fd',
      particleGlow: 'rgba(96, 165, 250, 0.85)'
    },
    poster: {
      bgTop: '#ffffff',
      bgMid: '#f5f8fc',
      bgBottom: '#eef2f8',
      vignetteTop: 'rgba(255, 255, 255, 0.92)',
      vignetteBottom: 'rgba(245, 248, 252, 0.95)',
      eyebrow: '#2563eb',
      title: '#0f172a',
      sub: '#64748b',
      statLabel: '#94a3b8',
      statValue: '#0f172a',
      statSub: '#64748b',
      hairline: 'rgba(15, 23, 42, 0.12)',
      footer: '#94a3b8'
    }
  }
};

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

const meanLongitude = (airports) =>
  airports.reduce((sum, ap) => sum + ap.lng, 0) / airports.length;

// Largest Web Mercator zoom (2–6) that fits the airports inside fitW x fitH.
// `project` maps lat/lng into that fit-space (region centered).
function fitWebMercatorBox(airports, fitW, fitH) {
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
    if (br.x - tl.x <= fitW * 1.08 && br.y - tl.y <= fitH * 1.05) {
      z = cand;
      break;
    }
  }

  const centerPx = {
    x: (projectToWebMercator(0, minLng, z).x + projectToWebMercator(0, maxLng, z).x) / 2,
    y: (projectToWebMercator(maxLat, 0, z).y + projectToWebMercator(minLat, 0, z).y) / 2
  };
  const originX = centerPx.x - fitW / 2;
  const originY = centerPx.y - fitH / 2;
  const project = (lat, lng) => {
    const p = projectToWebMercator(lat, lng, z);
    return { x: p.x - originX, y: p.y - originY };
  };
  return { z, originX, originY, project };
}

// Visited-country polygons from the world atlas, matched to airport country labels
function buildVisitedCountries(uniqueAirports) {
  if (!uniqueAirports) return [];
  const wanted = new Set();
  uniqueAirports.forEach((ap) => {
    const name = (ap.country || '').split(' ').slice(1).join(' ').trim();
    if (!name) return;
    wanted.add(name);
    (COUNTRY_ALIASES[name] || []).forEach((alias) => wanted.add(alias));
  });
  const all = topoFeature(countries110m, countries110m.objects.countries).features;
  return all.filter((f) => wanted.has(f.properties.name));
}

export default function RouteStoryMap({ flights = [] }) {
  const [stats, setStats] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isDrawingCard, setIsDrawingCard] = useState(false);
  const [storyPreviewModal, setStoryPreviewModal] = useState(false);
  const [themeKey, setThemeKey] = useState('obsidian');
  const mapRef = useRef(null);
  const storyCanvasRef = useRef(null);
  const theme = THEMES[themeKey];

  useEffect(() => {
    setStats(calculateMonthlyRosterRouteStats(flights));
  }, [flights]);

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

  const visitCounts = useMemo(() => {
    const counts = { [HOME_BASE]: 1 };
    if (stats) {
      stats.sectors.forEach((s) => {
        counts[s.from] = (counts[s.from] || 0) + 1;
        counts[s.to] = (counts[s.to] || 0) + 1;
      });
    }
    return counts;
  }, [stats]);

  const visitedCountries = useMemo(
    () => (stats ? buildVisitedCountries(stats.uniqueAirports) : []),
    [stats]
  );

  // ===== Interactive dark-world luminous graph (Leaflet) =====
  useEffect(() => {
    if (!stats || !mapRef.current) return;
    const m = theme.map;

    const map = L.map(mapRef.current, {
      center: [13.69, 118],
      zoom: 4,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false,
      worldCopyJump: true
    });

    L.tileLayer(
      `https://{s}.basemaps.cartocdn.com/${m.tiles}/{z}/{x}/{y}{r}.png`,
      { attribution: CARTO_ATTR, subdomains: 'abcd', maxZoom: 19 }
    ).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Visited countries: soft glow from within + hairline border
    if (visitedCountries.length) {
      L.geoJSON(visitedCountries, {
        style: {
          color: m.countryStroke,
          weight: 1.2,
          opacity: 0.8,
          fillColor: m.arcGlow,
          fillOpacity: m.tiles === 'dark_all' ? 0.07 : 0.06,
          lineJoin: 'round'
        },
        interactive: false
      }).addTo(map);
    }

    // Luminous great-circle edges (glow underlay + bright core)
    const circles = [];
    arcs.forEach(({ from, to, count }) => {
      const circle = generateGreatCirclePoints(from, to, 96);
      circles.push(circle);
      const pts = circle.map((p) => [p.lat, p.lng]);
      L.polyline(pts, {
        color: m.arcGlow,
        weight: 12,
        opacity: m.arcGlowOpacity,
        lineCap: 'round',
        interactive: false
      }).addTo(map);
      L.polyline(pts, {
        color: m.arcCore,
        weight: 3 + Math.min(count - 1, 3),
        opacity: 1,
        lineCap: 'round',
        interactive: false
      }).addTo(map);
    });

    // Glowing nodes sized by visit frequency (home base breathes)
    const bounds = [];
    const meanLng = meanLongitude(stats.uniqueAirports);
    stats.uniqueAirports.forEach((ap) => {
      const isHome = ap.code === HOME_BASE;
      const visits = visitCounts[ap.code] || 1;
      const size = isHome ? 14 : visits >= 4 ? 11 : visits >= 2 ? 9 : 8;
      const glow = isHome ? m.nodeGlow : m.nodeOtherGlow;
      const flipLeft = ap.lng > meanLng + 8;
      L.marker([ap.lat, ap.lng], {
        icon: L.divIcon({
          className: 'rm-node',
          iconSize: [0, 0],
          html: `
            <div class="rm-orb${isHome ? ' rm-orb-home' : ''}" style="width:${size}px;height:${size}px;background:${isHome ? m.nodeHome : m.nodeOther};box-shadow:0 0 ${size * 1.8}px rgba(${glow},0.9),0 0 ${size * 0.7}px rgba(${glow},0.9)"></div>
            <div class="rm-orb-label${isHome ? ' rm-label-home' : ''}${flipLeft ? ' rm-label-flip' : ''}" style="color:${isHome ? m.labelHome : m.label}">${ap.code}</div>`
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

    // Traveling light particles along the routes (subtle life)
    const particles = circles.slice(0, 10).map((pts, i) => {
      const marker = L.marker(pts[0], {
        interactive: false,
        icon: L.divIcon({
          className: 'rm-particle',
          iconSize: [6, 6],
          iconAnchor: [3, 3],
          html: `<div style="background:${m.particle};box-shadow:0 0 10px 2px ${m.particleGlow}"></div>`
        })
      }).addTo(map);
      return { marker, pts, t: (i * 0.37) % 1, speed: 0.05 + (i % 5) * 0.014, reverse: i % 2 === 1 };
    });

    let rafId;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      particles.forEach((p) => {
        p.t = (p.t + p.speed * dt) % 1;
        const t = p.reverse ? 1 - p.t : p.t;
        const f = t * (p.pts.length - 1);
        const i0 = Math.floor(f);
        const i1 = Math.min(p.pts.length - 1, i0 + 1);
        const fr = f - i0;
        const a = p.pts[i0];
        const b = p.pts[i1];
        p.marker.setLatLng([a.lat + (b.lat - a.lat) * fr, a.lng + (b.lng - a.lng) * fr]);
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(mapRef.current);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      map.remove();
    };
  }, [stats, arcs, visitedCountries, visitCounts, theme]);

  // ===== 9:16 full-bleed poster (real basemap composited on canvas) =====
  const drawStoryPoster = async () => {
    if (!stats || !storyCanvasRef.current) return;
    setIsDrawingCard(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;

      const canvas = storyCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;
      const m = theme.map;
      const ink = theme.poster;
      const now = new Date();
      const monthLabel = now
        .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        .toUpperCase();

      // 1. Backdrop gradient
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, ink.bgTop);
      bg.addColorStop(0.55, ink.bgMid);
      bg.addColorStop(1, ink.bgBottom);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      // 2. Full-bleed real basemap (region fitted into a middle band)
      const { z, originX, originY, project } = fitWebMercatorBox(
        stats.uniqueAirports,
        w,
        1150
      );

      ctx.fillStyle = m.bg;
      ctx.fillRect(0, 0, w, h);

      const tileCount = Math.pow(2, z);
      const tx0 = Math.max(0, Math.floor(originX / 256));
      const tx1 = Math.min(tileCount - 1, Math.floor((originX + w) / 256));
      const ty0 = Math.max(0, Math.floor(originY / 256));
      const ty1 = Math.min(tileCount - 1, Math.floor((originY + h) / 256));

      const jobs = [];
      let subIdx = 0;
      for (let ty = ty0; ty <= ty1; ty++) {
        for (let tx = tx0; tx <= tx1; tx++) {
          const sub = 'abcd'[subIdx++ % 4];
          jobs.push(
            new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve({ ok: true, img, tx, ty });
              img.onerror = () => resolve({ ok: false });
              img.src = `https://${sub}.basemaps.cartocdn.com/${m.tiles}/${z}/${tx}/${ty}@2x.png`;
            })
          );
        }
      }
      const tiles = await Promise.all(jobs);
      tiles.forEach((t) => {
        if (!t.ok) return;
        ctx.drawImage(t.img, t.tx * 256 - originX, t.ty * 256 - originY, 256, 256);
      });

      // Top/bottom vignettes so floating text stays legible
      const vt = ctx.createLinearGradient(0, 0, 0, 520);
      vt.addColorStop(0, ink.vignetteTop);
      vt.addColorStop(1, ink.vignetteTop.replace(/[\d.]+\)$/, '0)'));
      ctx.fillStyle = vt;
      ctx.fillRect(0, 0, w, 520);
      const vb = ctx.createLinearGradient(0, h - 620, 0, h);
      vb.addColorStop(0, ink.vignetteBottom.replace(/[\d.]+\)$/, '0)'));
      vb.addColorStop(1, ink.vignetteBottom);
      ctx.fillStyle = vb;
      ctx.fillRect(0, h - 620, w, 620);

      // 3. Visited countries glow
      visitedCountries.forEach((f) => {
        const polys =
          f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
        ctx.beginPath();
        polys.forEach((rings) =>
          rings.forEach((ring) =>
            ring.forEach(([lng, lat], i) => {
              const p = project(lat, lng);
              if (i === 0) ctx.moveTo(p.x, p.y);
              else ctx.lineTo(p.x, p.y);
            })
          )
        );
        ctx.fillStyle = m.countryFill;
        ctx.fill('evenodd');
        ctx.strokeStyle = m.countryStroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // 4. Luminous great-circle edges
      const arcPaths = arcs.map(({ from, to }) =>
        generateGreatCirclePoints(from, to, 96).map((p) => project(p.lat, p.lng))
      );
      arcPaths.forEach((path) => {
        ctx.beginPath();
        path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.strokeStyle = m.arcGlow;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.shadowColor = m.arcGlow;
        ctx.shadowBlur = 26;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.strokeStyle = m.arcCore;
        ctx.lineWidth = 6;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // 5. Glowing nodes + labels (flip label near right edge)
      ctx.textBaseline = 'middle';
      const meanLngExport = meanLongitude(stats.uniqueAirports);
      stats.uniqueAirports.forEach((ap) => {
        const p = project(ap.lat, ap.lng);
        const home = ap.code === HOME_BASE;
        const visits = visitCounts[ap.code] || 1;
        const r = home ? 11 : visits >= 4 ? 8.5 : visits >= 2 ? 7 : 6;
        const glow = home ? m.nodeGlow : m.nodeOtherGlow;

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = home ? m.nodeHome : m.nodeOther;
        ctx.shadowColor = `rgba(${glow}, 0.95)`;
        ctx.shadowBlur = r * 2.4;
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.letterSpacing = '2px';
        ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = home ? m.labelHome : m.label;
        ctx.shadowColor = m.tiles === 'dark_all' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        ctx.shadowBlur = 6;
        const flipLeft = ap.lng > meanLngExport + 8 || p.x > w - 100;
        ctx.textAlign = flipLeft ? 'right' : 'left';
        ctx.fillText(ap.code, flipLeft ? p.x - r - 8 : p.x + r + 8, p.y);
        ctx.textAlign = 'left';
        ctx.letterSpacing = '0px';
        ctx.shadowBlur = 0;
      });

      // 6. Floating header
      ctx.fillStyle = ink.eyebrow;
      ctx.fillRect(90, 128, 220, 2);

      ctx.letterSpacing = '7px';
      ctx.fillStyle = ink.eyebrow;
      ctx.font = '700 25px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`CREW FLIGHT LOG · ${monthLabel}`, 90, 190);
      ctx.letterSpacing = '0px';

      ctx.fillStyle = ink.title;
      ctx.font = '800 66px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Monthly Route Map', 90, 266);

      ctx.fillStyle = ink.sub;
      ctx.font = '400 27px "Plus Jakarta Sans", "Sarabun", sans-serif';
      ctx.fillText('เส้นทางบินและประเทศที่เคยไป ประจำเดือน', 90, 318);

      // 7. Floating stats row
      const statY = 1600;
      const statCells = [
        ['SECTORS', `${stats.totalSectors}`, 'ไฟลท์'],
        ['DESTINATIONS', `${stats.uniqueAirports.length} เมือง`, `${stats.uniqueCountriesCount} ประเทศ`],
        ['DISTANCE', stats.totalDistanceKm.toLocaleString(), 'km'],
        ['RANGE', stats.totalNauticalMiles.toLocaleString(), 'NM']
      ];
      const colW = (w - 180) / 4;
      statCells.forEach(([label, value, unit], i) => {
        const x = 90 + i * colW;
        ctx.letterSpacing = '3px';
        ctx.fillStyle = ink.statLabel;
        ctx.font = '700 19px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(label, x, statY);
        ctx.letterSpacing = '0px';
        ctx.fillStyle = ink.statValue;
        ctx.font = '700 46px "SF Mono", Consolas, monospace';
        ctx.fillText(value, x, statY + 62);
        ctx.fillStyle = ink.statSub;
        ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(unit, x, statY + 108);
        if (i > 0) {
          ctx.strokeStyle = ink.hairline;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - 28, statY - 14);
          ctx.lineTo(x - 28, statY + 112);
          ctx.stroke();
        }
      });

      // 8. Footer
      ctx.strokeStyle = ink.hairline;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(90, 1780);
      ctx.lineTo(w - 90, 1780);
      ctx.stroke();
      ctx.letterSpacing = '4px';
      ctx.fillStyle = ink.footer;
      ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('FLIGHT REST PLANNER × FLIGHTRADAR24', 90, 1826);
      ctx.textAlign = 'right';
      ctx.letterSpacing = '0px';
      ctx.font = '400 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('© OpenStreetMap · © CARTO', w - 90, 1826);
      ctx.textAlign = 'left';
    } finally {
      setIsDrawingCard(false);
    }
  };

  // Live preview: redraw the poster whenever roster or theme changes
  useEffect(() => {
    if (!stats) return;
    const timer = setTimeout(() => {
      drawStoryPoster();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, arcs, visitedCountries, themeKey]);

  const downloadStoryImageFile = () => {
    if (!storyCanvasRef.current) return;
    const now = new Date();
    const stamp = `${now.toLocaleDateString('en-US', { month: 'short' })}_${now.getFullYear()}`;
    const link = document.createElement('a');
    link.download = `Crew_Story_${themeKey}_${stamp}.png`;
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

  const t = theme.page;
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

      {/* HERO: live story card + theme toggle */}
      <section className={`relative overflow-hidden rounded-[28px] border p-5 sm:p-6 ${t.section}`}>
        <div className={`pointer-events-none absolute -top-28 -right-16 h-64 w-64 rounded-full blur-3xl ${t.glowBlob}`} />
        <div className="relative flex flex-col sm:flex-row-reverse items-center sm:items-start gap-5">
          {/* Live 9:16 card preview (phone-mockup) */}
          <div className="shrink-0 w-[190px] sm:w-[210px]">
            <button
              type="button"
              onClick={() => setStoryPreviewModal(true)}
              className={`relative block w-full overflow-hidden rounded-[22px] border ${t.previewBorder} ${t.previewGlow} transition active:scale-[0.98]`}
              aria-label="ขยายดูการ์ดสตอรี่"
            >
              <canvas ref={storyCanvasRef} width={1080} height={1920} className="block w-full h-auto" />
              {isDrawingCard && (
                <span className={`absolute inset-0 flex items-center justify-center gap-2 text-xs font-bold ${themeKey === 'obsidian' ? 'bg-black/45 text-[#e2c98f]' : 'bg-white/45 text-blue-700'} backdrop-blur-[2px]`}>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังวาดแผนที่...
                </span>
              )}
              <span className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[9px] font-bold tracking-wider text-white/90 backdrop-blur-sm">
                <Maximize2 className="w-3 h-3" />
                แตะขยาย
              </span>
            </button>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={downloadStoryImageFile}
                disabled={isDrawingCard || !stats}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold transition active:scale-95 disabled:opacity-60 ${t.cta}`}
              >
                <Download className="w-3.5 h-3.5" />
                เซฟ HD
              </button>
              <button
                type="button"
                onClick={() => setStoryPreviewModal(true)}
                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[11px] font-bold transition active:scale-95 ${t.ghostBtn}`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                ดูเต็มจอ
              </button>
            </div>
          </div>

          {/* Title + theme toggle */}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              <div className="flex-1">
                <div className={`flex items-center justify-center sm:justify-start gap-2.5 ${t.eyebrow}`}>
                  <Compass className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold tracking-[0.28em] uppercase">
                    Flight Route Story · Live Radar
                  </span>
                </div>
                <h2 className={`mt-2.5 text-xl sm:text-2xl font-extrabold tracking-tight ${t.heading}`}>
                  การ์ดสตอรี่เส้นทางบิน
                </h2>
                <p className={`mt-1.5 text-xs sm:text-[13px] leading-relaxed ${t.sub}`}>
                  แผนที่โลกเรืองแสงแบบ Obsidian Graph — โหนดคือสนามบิน เส้นทองคือเส้นทางบิน
                  แสงทองกลางกราฟคือประเทศที่เคยไป พร้อมเรดาร์ Flightradar24 สด
                </p>
              </div>
            </div>

            {/* Theme switcher */}
            <div className={`mt-4 inline-flex items-center gap-1 rounded-full border p-1 ${t.toggleWrap}`}>
              <button
                type="button"
                onClick={() => setThemeKey('obsidian')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${themeKey === 'obsidian' ? t.toggleActive : t.toggleIdle}`}
              >
                <Moon className="w-3.5 h-3.5" />
                ดำทอง
              </button>
              <button
                type="button"
                onClick={() => setThemeKey('sky')}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${themeKey === 'sky' ? t.toggleActive : t.toggleIdle}`}
              >
                <Sun className="w-3.5 h-3.5" />
                น้ำเงินขาว
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Dark world luminous graph */}
      <section className={`relative rounded-[28px] border overflow-hidden ${t.section}`}>
        <div className={`absolute top-3.5 left-3.5 z-[1001] flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md ${t.chip}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${t.liveDot}`} />
          <span className="text-[9px] font-bold tracking-[0.22em] uppercase">
            Obsidian Flight Graph
          </span>
        </div>
        <div className={`absolute top-3.5 right-11 z-[1001] rounded-full border px-2.5 py-1.5 font-mono text-[10px] backdrop-blur-md ${t.chip} ${t.chipMuted}`}>
          {stats?.uniqueAirports.length || 0} สนามบิน
        </div>

        <div
          ref={mapRef}
          className={`h-[380px] sm:h-[440px] lg:h-[500px] w-full rm-leaflet rm-${themeKey}`}
        />

        {stats && (
          <div className={`grid grid-cols-2 sm:grid-cols-4 border-t ${t.stripBg} ${t.stripCell}`}>
            {stripStats.map(([label, value, unit], i) => (
              <div
                key={label}
                className={`px-4 py-3.5 ${t.stripCell} ${
                  ['', 'border-l', 'border-t sm:border-t-0 sm:border-l', 'border-l border-t sm:border-t-0'][i]
                }`}
              >
                <span className={`block text-[9px] font-bold tracking-[0.2em] uppercase ${t.stripLabel}`}>
                  {label}
                </span>
                <span className={`mt-1 block text-base sm:text-lg font-bold font-mono tabular-nums ${t.stripValue}`}>
                  {value}
                  <span className={`ml-1 text-[11px] font-semibold ${t.unit}`}>{unit}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Flightradar24 live tracking list */}
      <section className={`rounded-[28px] border p-5 sm:p-6 ${t.section}`}>
        <div className="flex items-center justify-between gap-3 pb-2">
          <div className="flex items-center gap-2.5">
            <span className="relative flex w-2 h-2">
              <span className={`absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping ${t.liveDot}`} />
              <span className={`relative inline-flex w-2 h-2 rounded-full ${t.liveDot}`} />
            </span>
            <h3 className={`text-sm sm:text-base font-bold tracking-tight ${t.heading}`}>
              ติดตามไฟลท์สด · Flightradar24
            </h3>
          </div>
          <span className={`hidden sm:block text-[11px] ${t.sub}`}>
            แตะเพื่อเปิดเรดาร์สด / แชร์ให้ครอบครัว
          </span>
        </div>

        <div className={`divide-y ${t.divide}`}>
          {flightDuties.map((f, idx) => {
            const fr24Url = generateFlightradarUrl(f.pairing);
            const isCopied = copiedIndex === idx;

            return (
              <div key={idx} className="py-3.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className={`flex items-center gap-2 font-mono text-[11px] ${t.dateMono}`}>
                    <span>{f.date}</span>
                    <span className="h-3 w-px bg-current opacity-15" />
                    <span>RPT {f.reportTime || '--:--'} L</span>
                  </div>
                  <p className={`mt-0.5 text-[15px] font-bold tracking-tight truncate ${t.pairing}`}>
                    {f.pairing}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={fr24Url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11px] font-bold transition active:scale-95 ${t.frBtn}`}
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>เรดาร์สด</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleShareFlightradar(f, idx)}
                    className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-[11px] font-bold transition active:scale-95 ${t.ghostBtn}`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
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
            <p className={`py-6 text-center text-xs ${t.empty}`}>
              ยังไม่มีไฟลท์ในเดือนนี้ — สแกน Roster ก่อนนะครับ
            </p>
          )}
        </div>
      </section>

      {/* Story preview modal */}
      {storyPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className={`rounded-3xl max-w-sm w-full border overflow-hidden shadow-2xl p-4 space-y-4 ${t.modalBg} ${t.modalText}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 ${t.unit}`} />
                <h4 className="text-sm font-bold">พรีวิวการ์ดสตอรี่ (9:16 · โปสเตอร์เต็มผืน)</h4>
              </div>
              <button
                type="button"
                onClick={() => setStoryPreviewModal(false)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition ${t.modalClose}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`rounded-2xl overflow-hidden border ${t.modalImgBorder}`}>
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
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 ${t.cta}`}
              >
                <Download className="w-4 h-4" />
                <span>บันทึกภาพลงเครื่อง (HD 1080×1920)</span>
              </button>
              <p className={`text-[11px] text-center ${t.modalMuted}`}>
                บันทึกแล้วโพสต์ลง Instagram / Facebook / TikTok Story ได้ทันที
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
