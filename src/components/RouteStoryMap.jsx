import React, { useState, useRef, useEffect } from 'react';
import { 
  Plane, 
  MapPin, 
  Share2, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  Compass, 
  Globe, 
  Camera, 
  ArrowRight,
  Radio,
  Eye,
  X
} from 'lucide-react';
import { 
  calculateMonthlyRosterRouteStats, 
  generateFlightradarUrl,
  AIRPORT_DATABASE
} from '../utils/airportEngine';

export default function RouteStoryMap({ flights = [] }) {
  const [stats, setStats] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [storyPreviewModal, setStoryPreviewModal] = useState(false);
  const canvasRef = useRef(null);
  const storyCanvasRef = useRef(null);

  useEffect(() => {
    const computed = calculateMonthlyRosterRouteStats(flights);
    setStats(computed);
  }, [flights]);

  // Project lat/lng to SVG/Canvas 2D coordinates
  // Centered on Asia-Pacific (Lat 0 to 45N, Lng 90E to 145E)
  const projectCoordinates = (lat, lng, width, height, padding = 40) => {
    const minLat = -5;
    const maxLat = 45;
    const minLng = 92;
    const maxLng = 145;

    const x = padding + ((lng - minLng) / (maxLng - minLng)) * (width - padding * 2);
    const y = padding + ((maxLat - lat) / (maxLat - minLat)) * (height - padding * 2);

    return { x: Math.max(padding, Math.min(width - padding, x)), y: Math.max(padding, Math.min(height - padding, y)) };
  };

  // Draw Interactive Map on Main Canvas
  useEffect(() => {
    if (!stats || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 1. Dark Aviation Radar Background
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, width, height);

    // 2. Radar Grid Concentric Circles & Latitude Lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    for (let r = 80; r < Math.max(width, height); r += 90) {
      ctx.beginPath();
      ctx.arc(width * 0.4, height * 0.65, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Grid coordinates
    for (let x = 60; x < width; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Draw Flight Great Circle Glowing Arcs
    stats.sectors.forEach((sec, idx) => {
      const p1 = projectCoordinates(sec.fromAp.lat, sec.fromAp.lng, width, height);
      const p2 = projectCoordinates(sec.toAp.lat, sec.toAp.lng, width, height);

      // Arc curvature midpoint
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2 - Math.min(60, Math.abs(p1.x - p2.x) * 0.25);

      // Glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#38bdf8';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
      ctx.stroke();

      ctx.shadowBlur = 0;
    });

    // 4. Draw Airport Pins & Labels
    stats.uniqueAirports.forEach(ap => {
      const p = projectCoordinates(ap.lat, ap.lng, width, height);
      const isHomeBase = ap.code === 'BKK';

      // Airport Outer Pulse
      ctx.beginPath();
      ctx.arc(p.x, p.y, isHomeBase ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = isHomeBase ? '#38bdf8' : '#f59e0b';
      ctx.shadowBlur = 8;
      ctx.shadowColor = isHomeBase ? '#38bdf8' : '#f59e0b';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Center Dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // IATA Code Tag Badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.roundRect ? ctx.roundRect(p.x + 8, p.y - 12, 38, 18, 4) : ctx.rect(p.x + 8, p.y - 12, 38, 18);
      ctx.fill();
      ctx.strokeStyle = isHomeBase ? '#38bdf8' : '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(ap.code, p.x + 13, p.y + 1);
    });

  }, [stats]);

  // Generate 9:16 Instagram / TikTok Story Image
  const generateStoryImage = () => {
    if (!stats || !storyCanvasRef.current) return;
    setIsGeneratingStory(true);

    const canvas = storyCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;  // 1080
    const h = canvas.height; // 1920

    // 1. Sleek Gradient Dark Background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
    bgGradient.addColorStop(0, '#0a0f1d');
    bgGradient.addColorStop(0.5, '#070c18');
    bgGradient.addColorStop(1, '#030712');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    // 2. Top Header & Pilot Identity Badge
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('✈️ CREW FLIGHT LOG • AUGUST 2026', 80, 140);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px -apple-system, sans-serif';
    ctx.fillText('Monthly Route Map', 80, 210);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'normal 26px -apple-system, sans-serif';
    ctx.fillText('เส้นทางบินและสถิติการเดินทางประจำเดือน', 80, 260);

    // 3. Draw High-Res Radar Map Box
    const mapBoxY = 320;
    const mapBoxH = 880;
    const mapBoxW = w - 160;

    // Map Container background
    ctx.fillStyle = '#0b152d';
    ctx.roundRect(80, mapBoxY, mapBoxW, mapBoxH, 32);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Radar concentric rings
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    for (let r = 120; r < 700; r += 140) {
      ctx.beginPath();
      ctx.arc(80 + mapBoxW * 0.35, mapBoxY + mapBoxH * 0.65, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Flight Glowing Arcs on Story Card
    stats.sectors.forEach(sec => {
      const p1 = projectCoordinates(sec.fromAp.lat, sec.fromAp.lng, mapBoxW, mapBoxH, 70);
      const p2 = projectCoordinates(sec.toAp.lat, sec.toAp.lng, mapBoxW, mapBoxH, 70);

      const actualP1 = { x: 80 + p1.x, y: mapBoxY + p1.y };
      const actualP2 = { x: 80 + p2.x, y: mapBoxY + p2.y };
      const midX = (actualP1.x + actualP2.x) / 2;
      const midY = (actualP1.y + actualP2.y) / 2 - Math.min(100, Math.abs(actualP1.x - actualP2.x) * 0.3);

      ctx.shadowBlur = 16;
      ctx.shadowColor = '#00f2fe';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.moveTo(actualP1.x, actualP1.y);
      ctx.quadraticCurveTo(midX, midY, actualP2.x, actualP2.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw Airport Dots on Story Card
    stats.uniqueAirports.forEach(ap => {
      const p = projectCoordinates(ap.lat, ap.lng, mapBoxW, mapBoxH, 70);
      const ax = 80 + p.x;
      const ay = mapBoxY + p.y;
      const isHome = ap.code === 'BKK';

      ctx.beginPath();
      ctx.arc(ax, ay, isHome ? 12 : 9, 0, Math.PI * 2);
      ctx.fillStyle = isHome ? '#38bdf8' : '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.shadowColor = isHome ? '#38bdf8' : '#f59e0b';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Tag
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.roundRect(ax + 14, ay - 20, 68, 34, 8);
      ctx.fill();
      ctx.strokeStyle = isHome ? '#38bdf8' : '#64748b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(ap.code, ax + 24, ay + 4);
    });

    // 4. Bottom 4 Stats Cards
    const statBoxY = 1240;
    const colW = (w - 160 - 24) / 2;

    const drawStatCard = (x, y, label, val, sub, color) => {
      ctx.fillStyle = '#0f172a';
      ctx.roundRect(x, y, colW, 140, 24);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.fillText(label, x + 24, y + 42);

      ctx.fillStyle = color;
      ctx.font = '900 38px monospace';
      ctx.fillText(val, x + 24, y + 94);

      ctx.fillStyle = '#64748b';
      ctx.font = 'normal 18px -apple-system, sans-serif';
      ctx.fillText(sub, x + 24, y + 122);
    };

    drawStatCard(80, statBoxY, '✈️ เที่ยวบิน (Sectors)', `${stats.totalSectors} ไฟลท์`, 'Flown Sectors', '#38bdf8');
    drawStatCard(80 + colW + 24, statBoxY, '🌏 ปลายทาง (Airports)', `${stats.uniqueAirports.length} เมือง`, 'Unique Destinations', '#f59e0b');
    drawStatCard(80, statBoxY + 164, '📏 ระยะทางสะสม (Distance)', `${stats.totalDistanceKm.toLocaleString()} km`, `${stats.totalNauticalMiles.toLocaleString()} NM`, '#10b981');
    drawStatCard(80 + colW + 24, statBoxY + 164, '📡 เรดาร์สด (Live Track)', 'Flightradar24', 'Live ADS-B Integrated', '#a855f7');

    // 5. Footer Branding
    ctx.fillStyle = '#475569';
    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.fillText('Generated with Flight Rest Planner & Flightradar24', 80, 1800);

    setIsGeneratingStory(false);
    setStoryPreviewModal(true);
  };

  // Download Story Canvas as PNG file
  const downloadStoryImageFile = () => {
    if (!storyCanvasRef.current) return;
    const dataUrl = storyCanvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `Crew_Flight_Story_August_2026.png`;
    link.href = dataUrl;
    link.click();
  };

  // Share Flightradar24 tracking link
  const handleShareFlightradar = (flight, idx) => {
    const fr24Url = generateFlightradarUrl(flight.pairing);
    const text = `✈️ ตารางบินของฉัน: ${flight.pairing}\n🗓️ ${flight.date} (Report: ${flight.reportTime || '--:--'} L)\n📡 ติดตามตำแหน่งเครื่องบินสดๆ บน Flightradar24 ได้ที่นี่ครับ:\n${fr24Url}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2500);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto w-full">
      
      {/* 1. Header Banner with 9:16 Story Generator CTA */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0b152d] to-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
            <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
            <span>Flightradar24 Live Radar & Story Map</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            แผนที่เส้นทางบินประจำเดือน (Crew Story Map)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-normal">
            แผนที่เรดาร์เชื่อมโยงทุกไฟลท์ พร้อมระบบแชร์ลิงก์ Flightradar24 สดให้ครอบครัว & เซฟภาพสตอรี่อวดลง IG
          </p>
        </div>

        <button
          type="button"
          onClick={generateStoryImage}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 transition active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span>สร้างภาพสตอรี่ (IG Story 9:16)</span>
        </button>
      </div>

      {/* 2. Interactive Dark Radar Canvas Map */}
      <div className="bg-[#0b1329] rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative">
        
        {/* Map Header Overlay */}
        <div className="absolute top-3.5 left-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/60 text-xs font-bold text-sky-300">
          <Globe className="w-3.5 h-3.5" />
          <span>Great Circle Geodesic Routes (เรดาร์นำร่อง)</span>
        </div>

        <div className="absolute top-3.5 right-4 z-10 flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
            {stats?.uniqueAirports.length || 0} สนามบิน
          </span>
        </div>

        {/* 2D Canvas Map */}
        <div className="w-full flex items-center justify-center p-2 sm:p-4">
          <canvas
            ref={canvasRef}
            width={800}
            height={480}
            className="w-full max-w-full h-auto rounded-2xl"
          />
        </div>

        {/* 3. Monthly Route Stats Ticker */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-800 border-t border-slate-800 bg-slate-950/80 p-3 sm:p-4 text-center">
            <div className="p-2">
              <span className="text-[11px] text-slate-400 font-medium block">✈️ ไฟลท์ทั้งหมด</span>
              <span className="text-lg sm:text-xl font-black text-sky-400 font-mono">{stats.totalSectors} Sectors</span>
            </div>
            <div className="p-2">
              <span className="text-[11px] text-slate-400 font-medium block">🌏 ปลายทาง</span>
              <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">{stats.uniqueAirports.length} เมือง</span>
            </div>
            <div className="p-2">
              <span className="text-[11px] text-slate-400 font-medium block">📏 ระยะทางบินรวม</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono">{stats.totalDistanceKm.toLocaleString()} km</span>
            </div>
            <div className="p-2">
              <span className="text-[11px] text-slate-400 font-medium block">⏱️ Nautical Miles</span>
              <span className="text-lg sm:text-xl font-black text-purple-400 font-mono">{stats.totalNauticalMiles.toLocaleString()} NM</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Flightradar24 Live Tracking Flight List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
              ติดตามไฟลท์สด & แชร์ให้คนอื่น (Flightradar24 Live Track)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            แตะเพื่อเปิดเรดาร์สด / คัดลอกส่งใน LINE
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {flights.filter(f => f.dutyType === 'flight').map((f, idx) => {
            const fr24Url = generateFlightradarUrl(f.pairing);
            const isCopied = copiedIndex === idx;

            return (
              <div key={idx} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 font-mono">{f.date}</span>
                    <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      Report: {f.reportTime || '--:--'} L
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    ✈️ {f.pairing}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={fr24Url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition active:scale-95 shadow-xs"
                  >
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span>เปิด Flightradar24</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleShareFlightradar(f, idx)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition active:scale-95 shadow-2xs"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>คัดลอกข้อความแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5" />
                        <span>แชร์ให้เพื่อน</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hidden 1080x1920 Story Canvas for Export */}
      <canvas
        ref={storyCanvasRef}
        width={1080}
        height={1920}
        className="hidden"
      />

      {/* 5. 9:16 Instagram Story Preview Modal */}
      {storyPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-800 overflow-hidden shadow-2xl p-4 space-y-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <h4 className="text-sm font-bold">พรีวิวภาพ IG Story (9:16)</h4>
              </div>
              <button
                type="button"
                onClick={() => setStoryPreviewModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Story Card Image Preview */}
            <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-black">
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
                className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-sky-500/25 transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>บันทึกภาพลงเครื่อง (HD 1080x1920)</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center">
                บันทึกแล้วนำไปโพสต์ลง Instagram / Facebook / TikTok Story ได้ทันที 📸✨
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
