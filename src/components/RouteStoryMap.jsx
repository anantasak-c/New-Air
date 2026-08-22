import React, { useState, useRef, useEffect, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { feature as topoFeature } from 'topojson-client';
import countries110m from 'world-atlas/countries-110m.json';
import {
  ExternalLink,
  Check,
  Share2,
  Radio,
  Moon,
  Sun
} from 'lucide-react';
import {
  calculateMonthlyRosterRouteStats,
  generateFlightradarUrl,
  generateGreatCirclePoints
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
      chip: 'bg-black/45 border-white/[0.08] text-slate-200',
      chipMuted: 'text-slate-400',
      stripBg: 'bg-[#0a0b0e]',
      stripCell: 'border-white/[0.06]',
      stripLabel: 'text-slate-500',
      stripValue: 'text-white',
      unit: 'text-[#d9b98c]',
      ghostBtn: 'border-white/[0.08] text-slate-300 hover:bg-white/[0.04] hover:border-white/[0.16]',
      frBtn: 'border-[#d9b98c]/25 bg-[#d9b98c]/[0.07] text-[#e6cd9a] hover:bg-[#d9b98c]/[0.14]',
      divide: 'divide-white/[0.05]',
      dateMono: 'text-slate-500',
      pairing: 'text-white',
      heading: 'text-white',
      sub: 'text-slate-400',
      empty: 'text-slate-500',
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
    }
  },
  sky: {
    key: 'sky',
    label: 'น้ำเงินขาว',
    page: {
      section: 'bg-white border-slate-200',
      chip: 'bg-white/70 border-slate-200 text-slate-700',
      chipMuted: 'text-slate-500',
      stripBg: 'bg-slate-50',
      stripCell: 'border-slate-200',
      stripLabel: 'text-slate-400',
      stripValue: 'text-slate-900',
      unit: 'text-blue-600',
      ghostBtn: 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400',
      frBtn: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
      divide: 'divide-slate-100',
      dateMono: 'text-slate-400',
      pairing: 'text-slate-800',
      heading: 'text-slate-900',
      sub: 'text-slate-500',
      empty: 'text-slate-400',
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
    }
  }
};

const meanLongitude = (airports) =>
  airports.reduce((sum, ap) => sum + ap.lng, 0) / airports.length;

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
  const [themeKey, setThemeKey] = useState('obsidian');
  const mapRef = useRef(null);
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

    // Hairline great-circle edges (faint glow + 0.5px core — nodes are the hero)
    const circles = [];
    arcs.forEach(({ from, to, count }) => {
      const circle = generateGreatCirclePoints(from, to, 96);
      circles.push(circle);
      const pts = circle.map((p) => [p.lat, p.lng]);
      L.polyline(pts, {
        color: m.arcGlow,
        weight: 3,
        opacity: m.arcGlowOpacity,
        lineCap: 'round',
        interactive: false
      }).addTo(map);
      L.polyline(pts, {
        color: m.arcCore,
        weight: 0.5 + Math.min(count - 1, 3) * 0.25,
        opacity: 1,
        lineCap: 'round',
        interactive: false
      }).addTo(map);
    });

    // Glowing nodes sized by visit frequency (home base breathes); tap for details
    const bounds = [];
    const meanLng = meanLongitude(stats.uniqueAirports);
    stats.uniqueAirports.forEach((ap) => {
      const isHome = ap.code === HOME_BASE;
      const visits = visitCounts[ap.code] || 1;
      const size = isHome ? 16 : visits >= 4 ? 12 : visits >= 2 ? 10 : 9;
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
        .bindPopup(
          `<div class="rm-pop"><span class="rm-pop-code">${ap.code}</span> ${ap.thai || ap.name}<span class="rm-pop-count">ไป ${visits} ครั้ง</span></div>`,
          { className: 'rm-pop-pane', closeButton: false, offset: [0, -size - 8] }
        );
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

      {/* Live map */}
      <section className={`relative rounded-[28px] border overflow-hidden ${t.section}`}>
        <div className={`absolute top-3.5 left-3.5 z-[1001] flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-md ${t.chip}`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${t.liveDot}`} />
          <span className="text-[9px] font-bold tracking-[0.22em] uppercase">
            Obsidian Flight Graph
          </span>
          <span className={`text-[10px] font-mono ${t.chipMuted}`}>
            · {stats?.uniqueAirports.length || 0} สนามบิน
          </span>
        </div>

        <button
          type="button"
          onClick={() => setThemeKey(themeKey === 'obsidian' ? 'sky' : 'obsidian')}
          className={`absolute top-3.5 right-3.5 z-[1001] flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition active:scale-95 ${t.chip}`}
          aria-label={`สลับธีมเป็น${themeKey === 'obsidian' ? 'น้ำเงินขาว' : 'ดำทอง'}`}
          title={`สลับธีม${themeKey === 'obsidian' ? 'น้ำเงินขาว' : 'ดำทอง'}`}
        >
          {themeKey === 'obsidian' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div
          ref={mapRef}
          className={`h-[380px] sm:h-[440px] lg:h-[500px] w-full rm-leaflet rm-${themeKey}`}
        />

        {/* Stats strip */}
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

    </div>
  );
}
