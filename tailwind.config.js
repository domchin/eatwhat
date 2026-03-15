/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF5252',
        secondary: '#4ECDC4',
        accent: '#FFD166',
      },
      boxShadow: {
        card: '0 8px 32px -4px rgba(0,0,0,0.12), 0 4px 12px -2px rgba(0,0,0,0.08)',
        'card-lg': '0 20px 60px -8px rgba(0,0,0,0.2), 0 8px 24px -4px rgba(0,0,0,0.12)',
        'btn': '0 4px 14px 0 rgba(255,82,82,0.35)',
      },
    },
  },
  plugins: [],
}
