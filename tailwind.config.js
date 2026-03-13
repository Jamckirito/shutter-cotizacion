/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { dark: '#1B3A5C', gold: '#C9A84C', light: '#E8EFF7' }
      }
    }
  },
  plugins: []
}
