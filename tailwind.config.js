/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0A2569',
          'navy-dark': '#061742',
          blue: '#0284C7',
          teal: '#0D9488',
          soft: '#F0F9FF',
          'soft-hover': '#E0F2FE',
          'soft-dark': '#BAE6FD',
        },
        nhs: {
          blue: '#005EB8',
          green: '#007F3B',
          soft: '#E8F5E9',
          border: '#A5D6A7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
