/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          DEFAULT: '#D0FD3E', // Vert fluo
          hover: '#b8e62c',
        },
        dark: {
          900: '#0C0C0C', // Fond très sombre
          800: '#1C1C1E', // Fond des cartes
          700: '#2C2C2E', // Bordures légères
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8E8E93',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}