/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Existant (conservé pour la migration progressive)
        neon: {
          DEFAULT: '#D0FD3E',
          hover: '#b8e62c',
        },
        dark: {
          900: '#0C0C0C',
          800: '#1C1C1E',
          700: '#2C2C2E',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#8E8E93',
        },
        // Nouveau : Light mode
        'bg-1': '#f1f4fb',
        'pr-1': '#ffee8c',
        'tx-1': '#1b1d1f',
        'tx-secondary': '#9ca3b0',
        'bg-2': '#dde0e7',
        'surface': '#e6e8ed',
        'tx-2': '#3d4149',
        'tx-3': '#989da6',
        'dark-text': '#1f2021',
        'border-light': '#e6e8ed',
        // Nouveau : Dark mode additions
        'gold': '#ffee8c',
        'text-light': '#f1f4fb',
      },
      fontFamily: {
        sans: ['Figtree', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['PT Serif', 'Georgia', 'serif'],
        grotesk: ['Overused Grotesk', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '12': '12px',
        '16': '16px',
      },
    },
  },
  plugins: [],
}
