import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'uber',
    name: 'Uber Dark',
    icon: '🖤',
    description: 'Ink Black #000000 เรียบหรู คมชัด Pro Executive',
    mode: 'dark',
    accentColor: '#ffffff',
    bgClass: 'bg-uber-theme text-white',
    cardClass: 'bg-[#121212] border-[#242424]',
    mascot: null,
    labels: {
      baseTag: 'BKK BASE',
      locationSub: 'Bangkok Base (UTC+7)',
      dutyHeader: 'FLIGHT DUTY & SCHEDULE',
      dutySub: 'ระบุเวลาเริ่มงานและระยะเวลาเดินทาง',
      reportDutyLabel: 'เวลาเริ่มปฏิบัติหน้าที่ (REPORT DUTY TIME)',
      prepTimeLabel: 'เวลาแต่งตัว / เตรียมตัว (PREPARATION)',
      travelTimeLabel: 'เวลาเดินทางไปสถานที่นัด (TRANSIT TIME)',
      calculateBtn: 'คำนวณตารางเวลาและแผนพักผ่อน',
      resetBtn: 'รีเซ็ต',
      wakeupTitle: 'เวลาตื่นนอนที่แนะนำ (WAKE-UP TARGET)',
      wakeupSub: 'แต่งตัว {prep} + เดินทาง {travel}',
      departureTitle: 'เวลาออกจากบ้าน (DEPARTURE)',
      departureSub: 'เผื่อเวลาเดินทาง {travel}',
      arrivalTitle: 'เวลาถึงสถานที่นัดหมาย (ARRIVAL / ON DUTY)',
      arrivalSub: 'พร้อมปฏิบัติหน้าที่ตรงเวลา',
      bedtimeTitle: 'ตารางเวลาเข้านอนแนะนำ (REST SCHEDULE)',
      bedtime8hTag: '8 ชม. (เต็มอิ่ม)',
      bedtime7hTag: '7 ชม. (สบาย)',
      bedtime6hTag: '6 ชม. (มาตรฐาน)',
      bedtime5hTag: '5 ชม. (ขั้นต่ำ)',
      sleepCalcTitle: 'เช็คชั่วโมงการนอนจริง (SLEEP DURATION CHECK)',
      quickCopyBtn: 'Quick Copy สรุปส่งแชท',
      quickCopySuccess: 'คัดลอกเรียบร้อยแล้ว',
      tarotBtn: 'เปิดไพ่ทาโรต์เสริมพลังใจประจำวัน (Daily Flight Tarot)',
      weatherPopupTitle: 'พยากรณ์อากาศช่วงเวลาเดินทาง (กรุงเทพฯ)',
      footerText: 'FLIGHT DUTY & REST PLANNER • UBER PRO EDITION',
    }
  },
  {
    id: 'clean',
    name: 'Minimal Light',
    icon: '🤍',
    description: 'Clean White ขาวบริสุทธิ์ สบายตา คลีนมินิมอล',
    mode: 'light',
    accentColor: '#0f172a',
    bgClass: 'bg-clean-theme text-slate-900',
    cardClass: 'bg-white border-slate-200 shadow-sm',
    mascot: null,
    labels: {
      baseTag: 'กรุงเทพฯ BKK',
      locationSub: 'ฐานการบินกรุงเทพฯ (UTC+7)',
      dutyHeader: 'กำหนดเวลาปฏิบัติหน้าที่',
      dutySub: 'ระบุเวลาเริ่มงานและระยะเวลาที่ต้องใช้',
      reportDutyLabel: 'เวลาเริ่มปฏิบัติหน้าที่ (Report Time)',
      prepTimeLabel: 'เวลาแต่งตัว / เตรียมตัว',
      travelTimeLabel: 'เวลาเดินทางไปสถานที่นัดหมาย',
      calculateBtn: 'คำนวณตารางเวลาพักผ่อน',
      resetBtn: 'รีเซ็ต',
      wakeupTitle: 'เวลาตื่นนอนที่แนะนำ:',
      wakeupSub: 'แต่งตัว {prep} + เดินทาง {travel}',
      departureTitle: 'เวลาออกจากบ้าน',
      departureSub: 'เผื่อเวลาเดินทาง {travel}',
      arrivalTitle: 'เวลาถึงจุดหมาย / หน้างาน',
      arrivalSub: 'เริ่มงานตรงเวลาอย่างราบรื่น',
      bedtimeTitle: 'เวลาเข้านอนแนะนำ (คืนก่อนไฟลท์)',
      bedtime8hTag: 'นอนเต็มอิ่ม 8 ชม.',
      bedtime7hTag: 'นอนสบาย 7 ชม.',
      bedtime6hTag: 'นอน 6 ชม.',
      bedtime5hTag: 'นอน 5 ชม. (ขั้นต่ำ)',
      sleepCalcTitle: 'คำนวณชั่วโมงการนอนตามเวลาที่คุณจะนอนจริง',
      quickCopyBtn: 'Quick Copy สรุปส่งแชท',
      quickCopySuccess: 'คัดลอกเรียบร้อยแล้ว',
      tarotBtn: 'ดูดวงไพ่ทาโรต์ประจำวัน (Daily Flight Tarot)',
      weatherPopupTitle: 'พยากรณ์อากาศช่วงเวลาเดินทาง (กรุงเทพฯ)',
      footerText: 'Flight Duty & Rest Planner • Minimal Edition',
    }
  },
  {
    id: 'bunny',
    name: 'Bunny Cabin Pink',
    icon: '🐰',
    description: 'น้องกระต่ายแอร์โฮสเตส ชมพูพาสเทล สดใสคิ้วท์ๆ',
    mode: 'light',
    accentColor: '#ec4899',
    bgClass: 'bg-bunny-theme text-slate-900',
    cardClass: 'bg-white/95 border-pink-200 shadow-sm backdrop-blur-sm',
    mascot: {
      image: '/assets/mascot_bunny.jpg',
      name: 'น้องกระต่าย Bunny Cabin 🐰',
      quote: 'ขอให้ไฟลท์นี้ราบรื่นและสดใสเหมือนรอยยิ้มเธอนะคะ! เตรียมตัวเป๊ะปังไปด้วยกันน้า 💖',
    },
    labels: {
      baseTag: '🐰 Bunny BKK',
      locationSub: 'เตรียมตัวบินไปกับน้องกระต่าย 💕',
      dutyHeader: '🎀 ข้อมูลเวลาการเดินทางสุด Cute',
      dutySub: 'มาคำนวณเวลาตื่นนอนสุดเป๊ะปังกันน้า!',
      reportDutyLabel: '⏰ เวลาที่ต้องติ๊กต็อกเริ่มงานของเธอ',
      prepTimeLabel: '💄 เวลาแต่งหน้าแต่งตัวสวยๆ / หล่อๆ',
      travelTimeLabel: '🚗 เวลาล้อหมุนเดินทางไปถึงที่นัด',
      calculateBtn: '✨ คำนวณเวลาให้น้องกระต่ายหน่อยน้า ✨',
      resetBtn: '🔄 เริ่มใหม่',
      wakeupTitle: '☀️ เวลาตื่นนอนสุดเป๊ะปังที่แนะนำ:',
      wakeupSub: 'แต่งตัวสวย {prep} + นั่งรถชิลๆ {travel}',
      departureTitle: '💖 เวลาล้อหมุนออกจากบ้าน',
      departureSub: 'เผื่อเวลาเดินทาง {travel} สบายใจ',
      arrivalTitle: '✈️ เวลาถึงจุดหมายเตรียมตัวบิน',
      arrivalSub: 'สวยเป๊ะ พร้อมเริ่มงานลั้ลลา',
      bedtimeTitle: '🌙 ตารางเวลานอนตื่นมาหน้าใสกิ๊ง (คืนก่อนไฟลท์)',
      bedtime8hTag: '✨ นอนเต็มอิ่ม 8 ชม. หน้าเด็ก',
      bedtime7hTag: '💖 นอนสบาย 7 ชม. สดชื่น',
      bedtime6hTag: '⚠️ นอน 6 ชม. พอไหว',
      bedtime5hTag: '🚨 นอน 5 ชม. ดื่มกาแฟเพิ่มนะ',
      sleepCalcTitle: '😴 เช็คชั่วโมงการนอน ดูว่าจะได้นอนกี่ชั่วโมงน้า',
      quickCopyBtn: '💌 ส่งต่อตารางเวลาสุดน่ารัก',
      quickCopySuccess: 'คัดลอกเรียบร้อยแล้วน้า 💕',
      tarotBtn: '🔮 เสี่ยงทายไพ่ทาโรต์นำโชคประจำวันกับน้องกระต่าย',
      weatherPopupTitle: '🌤️ พยากรณ์อากาศสำหรับไฟลท์วันนี้ (กรุงเทพฯ)',
      footerText: '💕 ขอให้การเดินทางของเธอราบรื่นและปลอดภัยเสมอนะคะ 💕',
    }
  },
  {
    id: 'bear',
    name: 'Butter Bear',
    icon: '🐻',
    description: 'กัปตันหมีเนย คาราเมลละมุน อบอุ่นใจ',
    mode: 'light',
    accentColor: '#d97706',
    bgClass: 'bg-bear-theme text-amber-950',
    cardClass: 'bg-white/95 border-amber-200 shadow-sm backdrop-blur-sm',
    mascot: {
      image: '/assets/mascot_bear.jpg',
      name: 'กัปตันหมี Butter Bear 🐻',
      quote: 'จิบกาแฟอุ่นๆ แล้วพร้อมเทคออฟอย่างปลอดภัยครับ พักผ่อนให้เต็มที่นะ ☕',
    },
    labels: {
      baseTag: '🐻 Captain Bear',
      locationSub: 'ฐานบินคาเฟ่กัปตันหมี (UTC+7)',
      dutyHeader: '☕ ตารางเตรียมตัวบินสไตล์กัปตันหมี',
      dutySub: 'วางแผนเวลาพักผ่อนอย่างอบอุ่นและลงตัว',
      reportDutyLabel: '⏰ เวลาเช็คอินเริ่มภารกิจของกัปตัน',
      prepTimeLabel: '🧳 เวลาเตรียมตัว ชงกาแฟ และจัดสัมภาระ',
      travelTimeLabel: '🚗 เวลาออกเดินทางไปยังสนามบิน',
      calculateBtn: '☕ วางแผนเวลาพักผ่อนกับกัปตันหมี',
      resetBtn: '🔄 รีเซ็ต',
      wakeupTitle: '☀️ เวลาตื่นมาชงกาแฟอุ่นๆ รับวันใหม่:',
      wakeupSub: 'จิบกาแฟเตรียมตัว {prep} + เดินทาง {travel}',
      departureTitle: '🚗 เวลาออกเดินทางแบบสบายใจ',
      departureSub: 'เดินทางชิลๆ {travel} ไร้กังวล',
      arrivalTitle: '✈️ เวลาถึงสถานที่นัดหมาย / ท่าอากาศยาน',
      arrivalSub: 'แลนดิ้งตรงเวลา พร้อมลุยงาน',
      bedtimeTitle: '🌙 ตารางเวลาพักผ่อนชาร์จพลังอุ่นใจ',
      bedtime8hTag: '🍯 นอนเต็มอิ่ม 8 ชม. ชาร์จพลังเต็มร้อย',
      bedtime7hTag: '☕ นอน 7 ชม. กำลังสบาย',
      bedtime6hTag: '⚠️ นอน 6 ชม. พักผ่อนพอสมควร',
      bedtime5hTag: '🚨 นอน 5 ชม. ชงกาแฟเพิ่มนะ',
      sleepCalcTitle: '🧸 คำนวณชั่วโมงการนอนชาร์จพลังก่อนขึ้นบิน',
      quickCopyBtn: '☕ คัดลอกตารางบินฉบับกัปตันหมี',
      quickCopySuccess: 'คัดลอกตารางเรียบร้อยครับ ☕',
      tarotBtn: '🔮 เปิดไพ่ทาโรต์นำทางและให้กำลังใจกับกัปตันหมี',
      weatherPopupTitle: '🌤️ พยากรณ์อากาศก่อนขึ้นบิน (กรุงเทพฯ)',
      footerText: '☕ กัปตันหมีขอให้ทุกการเดินทางราบรื่นและอบอุ่นใจเสมอครับ 🐻',
    }
  },
  {
    id: 'cat',
    name: 'Galaxy Cat',
    icon: '🐱',
    description: 'น้องแมวอวกาศ ม่วงลาเวนเดอร์และมนต์สะกดดวงดาว',
    mode: 'dark',
    accentColor: '#a855f7',
    bgClass: 'bg-cat-theme text-purple-100',
    cardClass: 'bg-[#151228]/90 border-purple-800/50 shadow-sm backdrop-blur-sm',
    mascot: {
      image: '/assets/mascot_cat.jpg',
      name: 'น้องแมว Dreamy Galaxy 🐱',
      quote: 'ดวงดาวทุกดวงบนฟากฟ้าจะคอยส่องทางให้การเดินทางของเธอราบรื่นเสมอนะ เมี๊ยว~ ✨',
    },
    labels: {
      baseTag: '✨ Galaxy BKK',
      locationSub: 'สถานีควบคุมการบินห้วงอวกาศ (UTC+7)',
      dutyHeader: '🌌 ภารกิจคำนวณห้วงเวลาแห่งจักรวาล',
      dutySub: 'จัดสรรเวลาพักผ่อนใต้แสงดวงดาวอันเงียบสงบ',
      reportDutyLabel: '⏰ เวลาเริ่มภารกิจท่องจักรวาล (Launch Time)',
      prepTimeLabel: '✨ เวลาแต่งองค์ทรงเครื่องและสะสมพลังงาน',
      travelTimeLabel: '🚀 เวลาขับเคลื่อนยานสู่พิกัดนัดหมาย',
      calculateBtn: '🔮 คำนวณห้วงเวลาพักผ่อนแห่งดวงดาว',
      resetBtn: '🔄 รีเซ็ตห้วงเวลา',
      wakeupTitle: '☀️ เวลาตื่นรับแสงอรุณแห่งดวงดาว:',
      wakeupSub: 'สะสมพลังงาน {prep} + ขับเคลื่อนยาน {travel}',
      departureTitle: '🚀 เวลาทะยานออกจากฐานปฏิบัติการ',
      departureSub: 'ท่องอวกาศ {travel} ถึงพิกัดเป๊ะ',
      arrivalTitle: '🌌 เวลาเข้าเทียบท่า / ถึงสถานที่นัดหมาย',
      arrivalSub: 'เข้าสู่วงโคจรภารกิจอย่างสมบูรณ์แบบ',
      bedtimeTitle: '🌙 ตารางนิทราใต้แสงดวงดาวและทางช้างเผือก',
      bedtime8hTag: '⭐ หลับเต็มอิ่ม 8 ชม. ในห้วงกาแล็กซี่',
      bedtime7hTag: '✨ หลับสบาย 7 ชม. สดใส',
      bedtime6hTag: '⚠️ หลับ 6 ชม. พักผ่อนปานกลาง',
      bedtime5hTag: '🚨 หลับ 5 ชม. ดื่มโพชั่นเพิ่มพลังนะ',
      sleepCalcTitle: '💤 คำนวณห้วงเวลาแห่งการหลับใหลใต้แสงจันทร์',
      quickCopyBtn: '✨ ส่งต่อตารางเวลาแห่งจักรวาล',
      quickCopySuccess: 'ส่งมอบตารางเวลาเรียบร้อยแล้ว เมี๊ยว~ ✨',
      tarotBtn: '🔮 ส่องคำทำนายไพ่ทาโรต์แห่งดวงดาวกับน้องแมวอวกาศ',
      weatherPopupTitle: '🌌 สภาพบรรยากาศก่อนทะยานขึ้นฟ้า (กรุงเทพฯ)',
      footerText: '✨ ขอให้จักรวาลคุ้มครองและมอบความปลอดภัยในทุกการเดินทาง เมี๊ยว~ 🐱',
    }
  },
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(() => {
    return localStorage.getItem('flight_app_theme') || 'uber';
  });

  const activeTheme = THEMES.find(t => t.id === themeId) || THEMES[0];

  useEffect(() => {
    const root = document.documentElement;
    
    THEMES.forEach(t => {
      root.classList.remove(`theme-${t.id}`);
    });
    root.classList.remove('dark');
    root.classList.remove('light');

    root.classList.add(`theme-${activeTheme.id}`);
    if (activeTheme.mode === 'dark') {
      root.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', activeTheme.id === 'cat' ? '#0c0a1a' : '#000000');
    } else {
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', activeTheme.id === 'bunny' ? '#fff0f5' : activeTheme.id === 'bear' ? '#fef9ee' : '#ffffff');
    }

    localStorage.setItem('flight_app_theme', activeTheme.id);
  }, [activeTheme]);

  const setTheme = (id) => {
    if (THEMES.some(t => t.id === id)) {
      setThemeId(id);
    }
  };

  return (
    <ThemeContext.Provider value={{ activeTheme, themeId: activeTheme.id, setTheme, themes: THEMES, labels: activeTheme.labels }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
