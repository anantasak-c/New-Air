import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'uber',
    name: 'Uber Dark',
    icon: '🖤',
    description: 'Ink Black #000000 เรียบหรู คมชัด OLED',
    mode: 'dark',
    accentColor: '#ffffff',
    bgClass: 'bg-black text-white',
    cardClass: 'bg-[#121212] border-[#222222]',
    mascot: null,
  },
  {
    id: 'clean',
    name: 'Minimal Light',
    icon: '🤍',
    description: 'Clean White ขาวบริสุทธิ์ สบายตา',
    mode: 'light',
    accentColor: '#0f172a',
    bgClass: 'bg-[#f8f9fa] text-slate-900',
    cardClass: 'bg-white border-slate-200',
    mascot: null,
  },
  {
    id: 'bunny',
    name: 'Bunny Pink',
    icon: '🐰',
    description: 'น้องกระต่ายแอร์โฮสเตส ชมพูพาสเทล',
    mode: 'light',
    accentColor: '#ec4899',
    bgClass: 'bg-[#fff0f5] text-slate-900',
    cardClass: 'bg-white/95 border-pink-200 shadow-pink-100',
    mascot: {
      image: '/assets/mascot_bunny.jpg',
      name: 'น้องกระต่าย Bunny Cabin',
      quote: 'ขอให้ไฟลท์นี้ราบรื่นและสดใสเหมือนรอยยิ้มเธอนะคะ 💖',
    },
  },
  {
    id: 'bear',
    name: 'Butter Bear',
    icon: '🐻',
    description: 'กัปตันหมีเนย คาราเมลนุ่มละมุน',
    mode: 'light',
    accentColor: '#d97706',
    bgClass: 'bg-[#fef9ee] text-amber-950',
    cardClass: 'bg-white/95 border-amber-200 shadow-amber-100',
    mascot: {
      image: '/assets/mascot_bear.jpg',
      name: 'กัปตันหมี Butter Bear',
      quote: 'จิบกาแฟอุ่นๆ แล้วพร้อมเทคออฟอย่างปลอดภัยครับ ☕',
    },
  },
  {
    id: 'cat',
    name: 'Galaxy Cat',
    icon: '🐱',
    description: 'น้องแมวอวกาศ ม่วงลาเวนเดอร์และดวงดาว',
    mode: 'dark',
    accentColor: '#a855f7',
    bgClass: 'bg-[#0c0a1a] text-purple-100',
    cardClass: 'bg-[#151228] border-purple-900/60 shadow-purple-950',
    mascot: {
      image: '/assets/mascot_cat.jpg',
      name: 'น้องแมว Dreamy Star',
      quote: 'ดาวทุกดวงส่องทางให้การเดินทางของเธอราบรื่นเสมอนะ ✨',
    },
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
    
    // Remove all old theme classes
    THEMES.forEach(t => {
      root.classList.remove(`theme-${t.id}`);
    });
    root.classList.remove('dark');
    root.classList.remove('light');

    // Add current theme classes
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
    <ThemeContext.Provider value={{ activeTheme, themeId: activeTheme.id, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
