/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0E1116',
        sidebar: '#12161C',
        panel: '#151A21',
        raised: '#1B222C',
        line: '#232A34',
        mute: '#8B95A3',
        accent: '#3DD6B5',
        danger: '#FF6B6B',
        warn: '#FFC857',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
