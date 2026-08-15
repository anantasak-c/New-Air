/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        uber: {
          black: '#000000',
          white: '#ffffff',
          dark: {
            bg: '#000000',
            card: '#141414',
            surface: '#1f1f1f',
            border: '#292929',
            borderSubtle: '#222222',
            textPrimary: '#ffffff',
            textSecondary: '#a6a6a6',
            textMuted: '#6b6b6b',
          },
          light: {
            bg: '#ffffff',
            card: '#ffffff',
            surface: '#f6f6f6',
            border: '#e2e2e2',
            borderSubtle: '#eeeeee',
            textPrimary: '#000000',
            textSecondary: '#545454',
            textMuted: '#757575',
          },
          blue: {
            DEFAULT: '#276ef1',
            hover: '#1e56be',
            light: '#eef3fe',
            darkBg: '#0f2759',
          },
          green: {
            DEFAULT: '#05944f',
            light: '#e6f4ea',
            darkBg: '#0c3820',
          },
          amber: {
            DEFAULT: '#ffc043',
            light: '#fef7e0',
            darkBg: '#423204',
          },
          red: {
            DEFAULT: '#e11900',
            light: '#fce8e6',
            darkBg: '#440f09',
          },
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'Sarabun', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"SF Mono"', 'Consolas', '"Liberation Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'uber-sm': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'uber-card': '0 2px 8px rgba(0, 0, 0, 0.16)',
        'uber-elevated': '0 8px 28px rgba(0, 0, 0, 0.28)',
        'uber-sheet': '0 -4px 32px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'sheet-in': 'sheetIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        sheetIn: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
