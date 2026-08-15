// Open-Meteo Service for Bangkok Weather Forecast
export const WMO_WEATHER_MAP = {
  0: { label: "ท้องฟ้าโปร่ง แจ่มใส", icon: "Sun", color: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
  1: { label: "ฟ้าโปร่ง มีเมฆเล็กน้อย", icon: "SunMedium", color: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
  2: { label: "มีเมฆเป็นบางส่วน", icon: "CloudSun", color: "text-sky-500", bg: "bg-sky-50 border-sky-200" },
  3: { label: "มีเมฆมาก ท้องฟ้าครึ้ม", icon: "Cloud", color: "text-slate-500", bg: "bg-slate-50 border-slate-200" },
  45: { label: "มีหมอกบางในตอนเช้า", icon: "CloudFog", color: "text-slate-400", bg: "bg-slate-50 border-slate-200" },
  48: { label: "หมอกหนา ทัศนวิสัยลดลง", icon: "CloudFog", color: "text-slate-400", bg: "bg-slate-50 border-slate-200" },
  51: { label: "ฝนตกปรอยๆ เล็กน้อย", icon: "CloudDrizzle", color: "text-blue-400", bg: "bg-blue-50 border-blue-200" },
  53: { label: "ฝนปรอยปานกลาง", icon: "CloudDrizzle", color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  55: { label: "ฝนปรอยหนาแน่น", icon: "CloudDrizzle", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  61: { label: "ฝนตกเล็กน้อย", icon: "CloudRain", color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  63: { label: "ฝนตกปานกลาง", icon: "CloudRain", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  65: { label: "ฝนตกหนัก", icon: "CloudRain", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  80: { label: "ฝนตกเป็นช่วงๆ", icon: "CloudRain", color: "text-blue-500", bg: "bg-blue-50 border-blue-200" },
  81: { label: "ฝนตกค่อนข้างหนัก", icon: "CloudRain", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  82: { label: "ฝนตกหนักมาก", icon: "CloudRain", color: "text-blue-700", bg: "bg-blue-50 border-blue-200" },
  95: { label: "พายุฝนฟ้าคะนอง", icon: "CloudLightning", color: "text-purple-600", bg: "bg-purple-50 border-purple-200" },
  96: { label: "พายุฝนฟ้าคะนองและลมแรง", icon: "CloudLightning", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  99: { label: "พายุฝนฟ้าคะนองรุนแรง", icon: "CloudLightning", color: "text-purple-800", bg: "bg-purple-50 border-purple-200" },
};

export async function fetchBangkokTomorrowWeather() {
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=Asia%2FBangkok'
    );
    if (!res.ok) throw new Error('Failed to fetch weather data');
    const data = await res.json();

    const daily = data.daily;
    // Index 1 represents tomorrow, index 0 is today
    const tomorrowIndex = daily.time.length > 1 ? 1 : 0;
    
    const weatherCode = daily.weathercode[tomorrowIndex];
    const maxTemp = Math.round(daily.temperature_2m_max[tomorrowIndex]);
    const minTemp = Math.round(daily.temperature_2m_min[tomorrowIndex]);
    const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[tomorrowIndex] : 0;
    const dateStr = daily.time[tomorrowIndex];

    const weatherInfo = WMO_WEATHER_MAP[weatherCode] || {
      label: "สภาพอากาศปกติ",
      icon: "Sun",
      color: "text-amber-500",
      bg: "bg-amber-50 border-amber-200"
    };

    // Travel tip based on weather
    let travelTip = "การเดินทางราบรื่น ไม่มีอุปสรรคสำคัญ";
    if (rainProb >= 60 || weatherCode >= 61) {
      travelTip = "มีโอกาสฝนตก แนะนำพกร่มและเผื่อเวลาเดินทางเพิ่ม 15-20 นาที";
    } else if (maxTemp >= 35) {
      travelTip = "อากาศค่อนข้างร้อน ดื่มน้ำบ่อยๆ และเตรียมผ้าเย็นติดตัว";
    }

    return {
      success: true,
      city: "กรุงเทพฯ (Bangkok)",
      date: dateStr,
      weatherCode,
      label: weatherInfo.label,
      iconName: weatherInfo.icon,
      color: weatherInfo.color,
      bg: weatherInfo.bg,
      maxTemp,
      minTemp,
      rainProb,
      travelTip,
    };
  } catch (error) {
    console.error("Open-Meteo weather fetch error:", error);
    // Return friendly fallback
    return {
      success: false,
      city: "กรุงเทพฯ (Bangkok)",
      date: "พรุ่งนี้",
      weatherCode: 1,
      label: "ฟ้าโปร่ง แดดสดใส",
      iconName: "SunMedium",
      color: "text-amber-500",
      bg: "bg-amber-50 border-amber-200",
      maxTemp: 34,
      minTemp: 26,
      rainProb: 20,
      travelTip: "เดินทางสะดวก ไม่มีฝนตกหนัก",
    };
  }
}
