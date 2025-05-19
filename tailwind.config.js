/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#B91C1C', // red-700
          light: '#DC2626', // red-600
          dark: '#991B1B', // red-800
        },
        secondary: {
          DEFAULT: '#78350F', // amber-900
          light: '#92400E', // amber-800
          dark: '#713F12', // amber-950
        },
        success: {
          DEFAULT: '#16A34A', // green-600
          light: '#22C55E', // green-500
          dark: '#15803D', // green-700
        },
        warning: {
          DEFAULT: '#EAB308', // yellow-500
          light: '#FACC15', // yellow-400
          dark: '#CA8A04', // yellow-600
        },
        danger: {
          DEFAULT: '#DC2626', // red-600
          light: '#EF4444', // red-500
          dark: '#B91C1C', // red-700
        },
      },
      fontFamily: {
        sans: [
          'Inter', 
          'system-ui', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'sans-serif'
        ],
        serif: [
          'Georgia', 
          'Cambria', 
          'Times New Roman', 
          'Times', 
          'serif'
        ],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};