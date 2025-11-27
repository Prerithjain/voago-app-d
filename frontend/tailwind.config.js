/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: '#233048',
        teal: '#8aa6a2',
        sand: '#e7dccb',
        coral: '#f2a08a',
        white: '#FFFFFF',
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}
