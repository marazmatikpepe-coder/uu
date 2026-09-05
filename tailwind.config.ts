import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        panel: '#12121a',
        panel2: '#181822',
        accent: '#7c5cff',
        accent2: '#5cc9ff',
        border: 'rgba(255,255,255,0.08)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(124, 92, 255, 0.35)',
        soft: '0 8px 30px rgba(0,0,0,0.35)',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 2.4s ease-in-out infinite',
        breathe: 'breathe 4s ease-in-out infinite',
        fadeUp: 'fadeUp 0.25s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
