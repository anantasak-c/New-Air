// Aviation Airport Coordinates Engine & Route Statistics

export const AIRPORT_DATABASE = {
  // Thailand
  BKK: { name: 'Bangkok (Suvarnabhumi)', thai: 'สุวรรณภูมิ', lat: 13.6900, lng: 100.7501, country: '🇹🇭 Thailand' },
  DMK: { name: 'Bangkok (Don Mueang)', thai: 'ดอนเมือง', lat: 13.9126, lng: 100.6067, country: '🇹🇭 Thailand' },
  CNX: { name: 'Chiang Mai', thai: 'เชียงใหม่', lat: 18.7668, lng: 98.9626, country: '🇹🇭 Thailand' },
  URT: { name: 'Surat Thani', thai: 'สุราษฎร์ธานี', lat: 9.1326, lng: 99.1356, country: '🇹🇭 Thailand' },
  HKT: { name: 'Phuket', thai: 'ภูเก็ต', lat: 8.1132, lng: 98.3169, country: '🇹🇭 Thailand' },
  HDY: { name: 'Hat Yai', thai: 'หาดใหญ่', lat: 6.9333, lng: 100.3929, country: '🇹🇭 Thailand' },
  CEI: { name: 'Chiang Rai', thai: 'เชียงราย', lat: 19.9522, lng: 99.8828, country: '🇹🇭 Thailand' },
  UBP: { name: 'Ubon Ratchathani', thai: 'อุบลราชธานี', lat: 15.2514, lng: 104.8703, country: '🇹🇭 Thailand' },
  KBV: { name: 'Krabi', thai: 'กระบี่', lat: 8.0988, lng: 98.9862, country: '🇹🇭 Thailand' },
  USM: { name: 'Koh Samui', thai: 'สมุย', lat: 9.5478, lng: 100.0625, country: '🇹🇭 Thailand' },
  KKC: { name: 'Khon Kaen', thai: 'ขอนแก่น', lat: 16.4665, lng: 102.7839, country: '🇹🇭 Thailand' },
  UTH: { name: 'Udon Thani', thai: 'อุดรธานี', lat: 17.3867, lng: 102.7881, country: '🇹🇭 Thailand' },
  
  // East Asia & Regional
  YNT: { name: 'Yantai Penglai', thai: 'เยียนไถ', lat: 37.6631, lng: 120.9847, country: '🇨🇳 China' },
  TPE: { name: 'Taipei Taoyuan', thai: 'ไทเป', lat: 25.0797, lng: 121.2342, country: '🇹🇼 Taiwan' },
  KHH: { name: 'Kaohsiung', thai: 'เกาสง', lat: 22.5771, lng: 120.3500, country: '🇹🇼 Taiwan' },
  OKA: { name: 'Okinawa Naha', thai: 'โอกินาวา', lat: 26.1958, lng: 127.6458, country: '🇯🇵 Japan' },
  KIX: { name: 'Osaka Kansai', thai: 'โอซาก้า', lat: 34.4347, lng: 135.2442, country: '🇯🇵 Japan' },
  NRT: { name: 'Tokyo Narita', thai: 'โตเกียว นาริตะ', lat: 35.7647, lng: 140.3863, country: '🇯🇵 Japan' },
  HND: { name: 'Tokyo Haneda', thai: 'โตเกียว ฮาเนดะ', lat: 35.5494, lng: 139.7798, country: '🇯🇵 Japan' },
  CTS: { name: 'Sapporo Chitose', thai: 'ซัปโปโร', lat: 42.7752, lng: 141.6923, country: '🇯🇵 Japan' },
  FUK: { name: 'Fukuoka', thai: 'ฟุกุโอกะ', lat: 33.5859, lng: 130.4507, country: '🇯🇵 Japan' },
  NGO: { name: 'Nagoya Chubu', thai: 'นาโกย่า', lat: 34.8584, lng: 136.8054, country: '🇯🇵 Japan' },
  ICN: { name: 'Seoul Incheon', thai: 'โซล อินชอน', lat: 37.4602, lng: 126.4407, country: '🇰🇷 South Korea' },
  PUS: { name: 'Busan Gimhae', thai: 'ปูซาน', lat: 35.1795, lng: 128.9382, country: '🇰🇷 South Korea' },
  HKG: { name: 'Hong Kong', thai: 'ฮ่องกง', lat: 22.3080, lng: 113.9185, country: '🇭🇰 Hong Kong' },
  MFM: { name: 'Macau', thai: 'มาเก๊า', lat: 22.1496, lng: 113.5916, country: '🇲🇴 Macau' },
  PVG: { name: 'Shanghai Pudong', thai: 'เซี่ยงไฮ้', lat: 31.1443, lng: 121.8083, country: '🇨🇳 China' },
  PEK: { name: 'Beijing Capital', thai: 'ปักกิ่ง', lat: 40.0799, lng: 116.6031, country: '🇨🇳 China' },
  PKX: { name: 'Beijing Daxing', thai: 'ปักกิ่ง ต้าซิง', lat: 39.5098, lng: 116.4105, country: '🇨🇳 China' },
  CAN: { name: 'Guangzhou Baiyun', thai: 'กวางโจว', lat: 23.3924, lng: 113.2988, country: '🇨🇳 China' },
  CTU: { name: 'Chengdu Tianfu', thai: 'เฉิงตู', lat: 30.3175, lng: 104.4447, country: '🇨🇳 China' },
  KMG: { name: 'Kunming Changshui', thai: 'คุนหมิง', lat: 25.1019, lng: 102.9292, country: '🇨🇳 China' },
  
  // Southeast Asia & Australia
  SIN: { name: 'Singapore Changi', thai: 'สิงคโปร์', lat: 1.3644, lng: 103.9915, country: '🇸🇬 Singapore' },
  KUL: { name: 'Kuala Lumpur', thai: 'กัวลาลัมเปอร์', lat: 2.7456, lng: 101.7099, country: '🇲🇾 Malaysia' },
  PEN: { name: 'Penang', thai: 'ปีนัง', lat: 5.2971, lng: 100.2768, country: '🇲🇾 Malaysia' },
  SGN: { name: 'Ho Chi Minh', thai: 'โฮจิมินห์', lat: 10.8188, lng: 106.6519, country: '🇻🇳 Vietnam' },
  HAN: { name: 'Hanoi Noi Bai', thai: 'ฮานอย', lat: 21.2212, lng: 105.8072, country: '🇻🇳 Vietnam' },
  DAD: { name: 'Da Nang', thai: 'ดานัง', lat: 16.0439, lng: 108.1994, country: '🇻🇳 Vietnam' },
  DPS: { name: 'Bali Denpasar', thai: 'บาหลี', lat: -8.7482, lng: 115.1672, country: '🇮🇩 Indonesia' },
  CGK: { name: 'Jakarta Soekarno-Hatta', thai: 'จาการ์ตา', lat: -6.1256, lng: 106.6559, country: '🇮🇩 Indonesia' },
  MNL: { name: 'Manila Ninoy Aquino', thai: 'มะนิลา', lat: 14.5086, lng: 121.0194, country: '🇵🇭 Philippines' },
  MEL: { name: 'Melbourne', thai: 'เมลเบิร์น', lat: -37.6690, lng: 144.8410, country: '🇦🇺 Australia' },
  SYD: { name: 'Sydney', thai: 'ซิดนีย์', lat: -33.9399, lng: 151.1753, country: '🇦🇺 Australia' },
  BNE: { name: 'Brisbane', thai: 'บริสเบน', lat: -27.3842, lng: 153.1175, country: '🇦🇺 Australia' },
  PER: { name: 'Perth', thai: 'เพิร์ท', lat: -31.9403, lng: 115.9668, country: '🇦🇺 Australia' },
  
  // Long Haul
  LHR: { name: 'London Heathrow', thai: 'ลอนดอน', lat: 51.4700, lng: -0.4543, country: '🇬🇧 UK' },
  CDG: { name: 'Paris Charles de Gaulle', thai: 'ปารีส', lat: 49.0097, lng: 2.5479, country: '🇫🇷 France' },
  FRA: { name: 'Frankfurt', thai: 'แฟรงก์เฟิร์ต', lat: 50.0379, lng: 8.5622, country: '🇩🇪 Germany' },
  MUC: { name: 'Munich', thai: 'มิวนิก', lat: 48.3537, lng: 11.7750, country: '🇩🇪 Germany' },
  DXB: { name: 'Dubai', thai: 'ดูไบ', lat: 25.2532, lng: 55.3657, country: '🇦🇪 UAE' },
  DOH: { name: 'Doha Hamad', thai: 'โดฮา', lat: 25.2731, lng: 51.6081, country: '🇶🇦 Qatar' }
};

// Calculate Great Circle distance between two lat/lng points (Haversine formula in KM)
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Extract airport IATA codes from pairing text (e.g. "114-1: BKK-CNX-BKK-URT-BKK" or "TPE-OKA1-1")
export function extractRouteAirports(pairingText) {
  if (!pairingText) return [];
  
  // Find all 3-letter uppercase words matching known airport database
  const matches = pairingText.toUpperCase().match(/[A-Z]{3}/g) || [];
  const foundAirports = [];
  
  matches.forEach(code => {
    if (AIRPORT_DATABASE[code]) {
      foundAirports.push(code);
    }
  });

  // If pairing has colon format like "114-1: BKK-CNX-BKK"
  if (foundAirports.length >= 2) {
    return foundAirports;
  }

  // Fallback: If only 1 airport found but pairing contains words like "TPE-OKA"
  const tokens = pairingText.toUpperCase().split(/[-_:\s/]+/);
  const route = [];
  tokens.forEach(tok => {
    if (AIRPORT_DATABASE[tok]) {
      route.push(tok);
    }
  });

  if (route.length >= 2) return route;

  // Default home base BKK if none found
  return foundAirports.length > 0 ? foundAirports : ['BKK'];
}

// Parse entire monthly roster and calculate flight sectors, visited airports, total distance
export function calculateMonthlyRosterRouteStats(flights = []) {
  const activeFlights = flights.filter(f => f.dutyType === 'flight');
  const visitedAirportsSet = new Set(['BKK']);
  const sectors = [];
  let totalDistanceKm = 0;

  activeFlights.forEach((flight, fIdx) => {
    const route = extractRouteAirports(flight.pairing);
    if (route.length >= 2) {
      for (let i = 0; i < route.length - 1; i++) {
        const from = route[i];
        const to = route[i + 1];
        visitedAirportsSet.add(from);
        visitedAirportsSet.add(to);

        const fromAp = AIRPORT_DATABASE[from] || AIRPORT_DATABASE.BKK;
        const toAp = AIRPORT_DATABASE[to] || AIRPORT_DATABASE.CNX;
        const dist = calculateDistanceKm(fromAp.lat, fromAp.lng, toAp.lat, toAp.lng);
        totalDistanceKm += dist;

        sectors.push({
          flightIndex: fIdx,
          flightDate: flight.date,
          pairing: flight.pairing,
          reportTime: flight.reportTime,
          from,
          to,
          fromAp,
          toAp,
          distKm: dist
        });
      }
    } else if (route.length === 1 && route[0] !== 'BKK') {
      // Out-and-back assumption from BKK
      const dest = route[0];
      visitedAirportsSet.add(dest);
      const bkk = AIRPORT_DATABASE.BKK;
      const destAp = AIRPORT_DATABASE[dest] || bkk;
      const dist = calculateDistanceKm(bkk.lat, bkk.lng, destAp.lat, destAp.lng) * 2;
      totalDistanceKm += dist;

      sectors.push({
        flightIndex: fIdx,
        flightDate: flight.date,
        pairing: flight.pairing,
        reportTime: flight.reportTime,
        from: 'BKK',
        to: dest,
        fromAp: bkk,
        toAp: destAp,
        distKm: dist / 2
      });
      sectors.push({
        flightIndex: fIdx,
        flightDate: flight.date,
        pairing: flight.pairing,
        reportTime: flight.reportTime,
        from: dest,
        to: 'BKK',
        fromAp: destAp,
        toAp: bkk,
        distKm: dist / 2
      });
    }
  });

  const uniqueAirports = Array.from(visitedAirportsSet).map(code => ({
    code,
    ...(AIRPORT_DATABASE[code] || { name: code, country: '🌍', lat: 13.69, lng: 100.75 })
  }));

  const uniqueCountriesSet = new Set(uniqueAirports.map(ap => ap.country));

  return {
    totalSectors: sectors.length,
    totalFlights: activeFlights.length,
    totalDistanceKm,
    totalNauticalMiles: Math.round(totalDistanceKm * 0.539957),
    uniqueAirports,
    uniqueCountriesCount: uniqueCountriesSet.size,
    sectors
  };
}

const toRad = (deg) => (deg * Math.PI) / 180;
const normalizeLngDelta = (delta) => ((delta + 540) % 360) - 180;

// Generate points along the true Great Circle path between two coordinates
// using spherical linear interpolation (slerp). Longitude comes from
// atan2(y, x) of the interpolated unit vector (unwrapped relative to the
// departure meridian) so the path never straight-lines across meridians.
export function generateGreatCirclePoints(from, to, segments = 48) {
  const φ1 = toRad(from.lat);
  const λ1 = toRad(from.lng);
  const φ2 = toRad(to.lat);
  const λ2 = toRad(to.lng);
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.sin((φ2 - φ1) / 2) ** 2 +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin((λ2 - λ1) / 2) ** 2
    )
  );

  const points = [];
  if (d === 0) return [{ lat: from.lat, lng: from.lng }, { lat: to.lat, lng: to.lng }];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const A = Math.sin((1 - t) * d) / Math.sin(d);
    const B = Math.sin(t * d) / Math.sin(d);
    const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
    const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
    const z = A * Math.sin(φ1) + B * Math.sin(φ2);
    let lng = (Math.atan2(y, x) * 180) / Math.PI;
    if (lng - from.lng > 180) lng -= 360;
    if (lng - from.lng < -180) lng += 360;
    points.push({
      lat: (Math.atan2(z, Math.sqrt(x * x + y * y)) * 180) / Math.PI,
      lng
    });
  }
  return points;
}

// Initial bearing (degrees from true north) from point `from` toward point `to`
export function calculateInitialBearing(from, to) {
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const dLng = toRad(normalizeLngDelta(to.lng - from.lng));
  const y = Math.sin(dLng) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

// Web Mercator projection: lng/lat -> global pixel coordinates at a zoom level
// (256px tiles). Used to composite real basemap tiles onto the story canvas.
export function projectToWebMercator(lat, lng, zoom) {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const rad = (clampedLat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale;
  return { x, y };
}

// Generate Flightradar24 direct tracking URL
export function generateFlightradarUrl(pairingText, flightNumber) {
  // If flight number is e.g. "114-1", airline might be TG114 or VZ114
  // Let's create smart direct search url
  const cleanMatch = (pairingText || '').match(/([A-Z]{0,3}\s*\d{3,4})/i);
  const code = flightNumber || (cleanMatch ? cleanMatch[0].replace(/\s+/g, '') : null);

  if (code) {
    return `https://www.flightradar24.com/data/flights/${code.toLowerCase()}`;
  }

  // Fallback to airport radar map or live search
  const airports = extractRouteAirports(pairingText);
  if (airports.length >= 2) {
    return `https://www.flightradar24.com/data/airports/${airports[0].toLowerCase()}`;
  }

  return 'https://www.flightradar24.com';
}
