/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // สีธีมเกม Health Detective — เพิ่ม shade ให้ใช้งาน gradient ได้
        detective: {
          50:  '#F4F2FE',
          100: '#E5E1FB',
          200: '#CBC4F4',
          300: '#A89DEC',
          400: '#7E70DE',
          500: '#5F52CC',  // ม่วงหลัก (สดขึ้น)
          600: '#4B3FB0',
          700: '#3A308F',
          800: '#2A2370',
        },
        success: {
          50: '#E8F8F0',
          100: '#C7EFD8',
          400: '#3DBA8A',
          500: '#1D9E75',
          600: '#168261',
        },
        warning: {
          50: '#FEF7EC',
          100: '#FCE8C2',
          400: '#E5973C',
          500: '#BA7517',
          600: '#9F6310',
        },
        danger: {
          50: '#FCEDE8',
          100: '#F8D5C9',
          400: '#E07452',
          500: '#D85A30',
          600: '#B84A24',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'sans-serif'],
        display: ['"Bai Jamjuree"', '"IBM Plex Sans Thai"', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm':    '0 4px 16px -4px rgba(95, 82, 204, 0.25)',
        'glow':       '0 8px 24px -8px rgba(95, 82, 204, 0.45)',
        'glow-lg':    '0 12px 36px -10px rgba(95, 82, 204, 0.55)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%':      { opacity: '0.7', transform: 'scale(1.05)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        'pop': {
          '0%':   { transform: 'scale(0.85)', opacity: '0' },
          '60%':  { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 6s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
        'float':      'float 4s ease-in-out infinite',
        'pop':        'pop 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
