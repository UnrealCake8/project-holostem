/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#52f4ff',
          violet: '#8b5cf6',
        },
      },
      boxShadow: {
        glow: '0 0 30px rgba(82, 244, 255, 0.22)',
      },
      animation: {
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: 0.9 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
