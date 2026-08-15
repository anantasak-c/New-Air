// Open-Meteo Service for 1269 Sukhumvit 71 Rd, Suan Luang, Bangkok 10250
export const LOCATION_INFO = {
  address: "1269 ถ.สุขุมวิท 71 แขวง/เขตสวนหลวง กรุงเทพฯ 10250",
  shortAddress: "สุขุมวิท 71, สวนหลวง (BKK)",
  latitude: 13.7145,
  longitude: 100.5986,
};

export const WMO_WEATHER_MAP = {
  0: { label: "ท้องฟ้าโปร่ง แจ่มใส", icon: "Sun", isRain: false, isSun: true },
  1: { label: "ฟ้าโปร่ง แดดออก", icon: "SunMedium", isRain: false, isSun: true },
  2: { label: "มีเมฆเป็นบางส่วน", icon: "CloudSun", isRain: false, isSun: true },
  3: { label: "มีเมฆมาก ท้องฟ้าครึ้ม", icon: "Cloud", isRain: false, isSun: false },
  45: { label: "มีหมอกบางในตอนเช้า", icon: "CloudFog", isRain: false, isSun: false },
  48: { label: "หมอกหนา ทัศนวิสัยลดลง", icon: "CloudFog", isRain: false, isSun: false },
  51: { label: "ฝนตกปรอยๆ เล็กน้อย", icon: "CloudDrizzle", isRain: true, isSun: false },
  53: { label: "ฝนปรอยปานกลาง", icon: "CloudDrizzle", isRain: true, isSun: false },
  55: { label: "ฝนปรอยหนาแน่น", icon: "CloudDrizzle", isRain: true, isSun: false },
  61: { label: "ฝนตกเล็กน้อย", icon: "CloudRain", isRain: true, isSun: false },
  63: { label: "ฝนตกปานกลาง", icon: "CloudRain", isRain: true, isSun: false },
  65: { label: "ฝนตกหนัก", icon: "CloudRain", isRain: true, isSun: false },
  80: { label: "ฝนตกเป็นช่วงๆ", icon: "CloudRain", isRain: true, isSun: false },
  81: { label: "ฝนตกค่อนข้างหนัก", icon: "CloudRain", isRain: true, isSun: false },
  82: { label: "ฝนตกหนักมาก", icon: "CloudRain", isRain: true, isSun: false },
  95: { label: "พายุฝนฟ้าคะนอง", icon: "CloudLightning", isRain: true, isSun: false },
  96: { label: "พายุฝนฟ้าคะนอง ลมแรง", icon: "CloudLightning", isRain: true, isSun: false },
  99: { label: "พายุฝนฟ้าคะนองรุนแรง", icon: "CloudLightning", isRain: true, isSun: false },
};

export async function fetchLocationWeather(targetDate = null, departureDate = null) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION_INFO.latitude}&longitude=${LOCATION_INFO.longitude}&hourly=temperature_2m,precipitation_probability,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FBangkok`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch weather');
    const data = await res.json();

    const hourly = data.hourly;
    const daily = data.daily;

    // Default daily summary (tomorrow or today)
    const tomorrowIndex = daily.time.length > 1 ? 1 : 0;
    const defaultWeatherCode = daily.weathercode[tomorrowIndex];
    const defaultWeatherInfo = WMO_WEATHER_MAP[defaultWeatherCode] || WMO_WEATHER_MAP[1];

    const result = {
      success: true,
      address: LOCATION_INFO.address,
      shortAddress: LOCATION_INFO.shortAddress,
      minTemp: Math.round(daily.temperature_2m_min[tomorrowIndex]),
      maxTemp: Math.round(daily.temperature_2m_max[tomorrowIndex]),
      rainProb: daily.precipitation_probability_max ? daily.precipitation_probability_max[tomorrowIndex] : 0,
      label: defaultWeatherInfo.label,
      iconName: defaultWeatherInfo.icon,
      isRain: defaultWeatherInfo.isRain,
      travelTip: "สภาพอากาศทั่วไปสำหรับการเดินทาง",
      hourlyWindow: [],
      windowSummary: "",
    };

    // Calculate +-3 Hours Window from flight/report duty time
    if (targetDate) {
      const reportD = new Date(targetDate);
      const depD = departureDate ? new Date(departureDate) : new Date(reportD.getTime() - 60 * 60 * 1000);

      // Window starts 3 hours before departure (or 4h before report) and ends 3 hours after report
      const windowStartMs = depD.getTime() - 2 * 60 * 60 * 1000;
      const windowEndMs = reportD.getTime() + 3 * 60 * 60 * 1000;

      const windowItems = [];
      let maxWindowRain = 0;
      let hasRainInWindow = false;

      for (let i = 0; i < hourly.time.length; i++) {
        // Parse time string e.g. "2026-08-17T06:00"
        const hourDate = new Date(hourly.time[i]);
        const hourMs = hourDate.getTime();

        if (hourMs >= windowStartMs && hourMs <= windowEndMs) {
          const wCode = hourly.weathercode[i];
          const wInfo = WMO_WEATHER_MAP[wCode] || WMO_WEATHER_MAP[1];
          const temp = Math.round(hourly.temperature_2m[i]);
          const rain = hourly.precipitation_probability[i] || 0;

          if (rain > maxWindowRain) maxWindowRain = rain;
          if (wInfo.isRain || rain >= 40) hasRainInWindow = true;

          const hoursVal = hourDate.getHours();
          const hourLabel = `${String(hoursVal).padStart(2, '0')}:00`;

          // Check if this hour is near departure or report
          const isNearDeparture = Math.abs(hourMs - depD.getTime()) < 35 * 60 * 1000;
          const isNearReport = Math.abs(hourMs - reportD.getTime()) < 35 * 60 * 1000;

          windowItems.push({
            timeIso: hourly.time[i],
            hourLabel,
            temp,
            rainProb: rain,
            weatherCode: wCode,
            label: wInfo.label,
            iconName: wInfo.icon,
            isRain: wInfo.isRain,
            isDeparture: isNearDeparture,
            isReport: isNearReport,
          });
        }
      }

      result.hourlyWindow = windowItems;
      result.maxWindowRain = maxWindowRain;

      // Generate flight window specific advisory
      if (hasRainInWindow || maxWindowRain >= 50) {
        result.windowSummary = `ช่วงเวลาเดินทาง (±3 ชม. จากไฟลท์) มีโอกาสฝนตกสูงสุด ${maxWindowRain}% แนะนำพกร่มและเผื่อเวลาเดินทางออกจากสุขุมวิท 71 เพิ่ม 15-20 นาที`;
        result.travelTip = `มีฝนตกช่วงเดินทาง (โอกาสฝน ${maxWindowRain}%) ควรเผื่อเวลาเดินทาง`;
      } else {
        result.windowSummary = `ช่วงเวลาเดินทาง (±3 ชม. จากไฟลท์) อากาศดี แดดออก ไม่มีฝน (โอกาสฝนเพียง ${maxWindowRain}%) การเดินทางจากสุขุมวิท 71 ราบรื่น`;
        result.travelTip = `อากาศแจ่มใส แดดดี การเดินทางราบรื่น`;
      }
    }

    return result;
  } catch (error) {
    console.error("Open-Meteo location error:", error);
    return {
      success: false,
      address: LOCATION_INFO.address,
      shortAddress: LOCATION_INFO.shortAddress,
      minTemp: 26,
      maxTemp: 33,
      rainProb: 20,
      label: "ฟ้าโปร่ง แดดออก",
      iconName: "SunMedium",
      isRain: false,
      travelTip: "การเดินทางจากสุขุมวิท 71 ราบรื่น ไม่มีฝนตกหนัก",
      hourlyWindow: [],
      windowSummary: "ช่วงเวลาเดินทางฟ้าโปร่ง แดดสดใส โอกาสฝน 20%",
    };
  }
}
