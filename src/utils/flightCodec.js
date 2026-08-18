// Compact Tuple Encoder / Decoder for Flight Data (Stateless & Under 300 chars)

export function compressFlights(flights) {
  // Map to compact array: [date, pairing, reportTime, dutyType]
  const compact = flights.map(f => [
    f.date || '',
    (f.pairing || '').replace(/:\s*BKKBKK/g, ''), // strip redundant airport codes
    f.reportTime || '',
    f.dutyType ? f.dutyType[0] : 'f' // 'f'light, 's'tandby, 'r'est, 'l'eave
  ]);
  const jsonStr = JSON.stringify(compact);
  return Buffer.from(unescape(encodeURIComponent(jsonStr))).toString('base64');
}

export function decompressFlights(base64Str) {
  try {
    const jsonStr = decodeURIComponent(escape(atob(base64Str)));
    const parsed = JSON.parse(jsonStr);

    if (!Array.isArray(parsed)) return [];

    // Check if it's the compact tuple array
    if (parsed.length > 0 && Array.isArray(parsed[0])) {
      return parsed.map(([date, pairing, reportTime, typeChar]) => {
        let dutyType = 'flight';
        if (typeChar === 's') dutyType = 'standby';
        else if (typeChar === 'r') dutyType = 'rest';
        else if (typeChar === 'l') dutyType = 'leave';

        return {
          date,
          pairing,
          reportTime: reportTime || null,
          releaseTime: null,
          dutyType
        };
      });
    }

    // Fallback if legacy object format
    return parsed;
  } catch (e) {
    console.error('Failed to decompress flights:', e);
    return [];
  }
}
