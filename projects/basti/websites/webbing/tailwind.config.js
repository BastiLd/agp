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
        // Coolors Palette: #03045e bis #caf0f8
        ocean: {
          50: '#caf0f8',  // hellblau
          100: '#ade8f4',
          200: '#90e0ef',
          300: '#48cae4',
          400: '#00b4d8',
          500: '#0096c7',
          600: '#0077b6',
          700: '#023e8a',
          800: '#03045e',  // dunkelblau
        },
        primary: {
          50: '#caf0f8',
          100: '#ade8f4',
          200: '#90e0ef',
          300: '#48cae4',
          400: '#00b4d8',
          500: '#0096c7',
          600: '#0077b6',
          700: '#023e8a',
          800: '#03045e',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

