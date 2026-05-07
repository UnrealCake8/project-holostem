/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#e3e8bf',
          violet: '#6d7950',
        },
        brand: {
          black: '#050704',
          olive: '#3e4b2f',
          leaf: '#52613a',
          sage: '#b8c49a',
          cream: '#e3e8bf',
        },
      },
      boxShadow: {
        glow: '0 0 30px rgba(227, 232, 191, 0.22)',
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
