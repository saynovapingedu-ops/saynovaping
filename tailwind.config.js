/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ============================================================
        //  ธีมสีสดใสน่ารัก — สำหรับเยาวชน ม.ต้น
        //  ม่วงสด + เหลืองทองอุ่น + ชมพู/มินต์เป็น accent
        // ============================================================
        // 'detective' = ม่วงสดใส (vivid violet) — เป็นมิตร เด็กเข้าถึงง่าย
        detective: {
          50:  '#F5F0FF',
          100: '#EBE0FF',
          200: '#D6C2FF',
          300: '#B79CFF',
          400: '#9B73FF',
          500: '#8B5CF6',  // ม่วงสดใส (violet-500)
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
        },
        // 'warning' = เหลืองทองอุ่น (sunny amber)
        warning: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',  // ส้มทอง (amber-500)
          600: '#D97706',
        },
        // 'candy' = ชมพูเค้กลูกอม — accent สดใส
        candy: {
          50:  '#FFF0F7',
          100: '#FFD9EB',
          200: '#FFBADB',
          400: '#FF7AB6',
          500: '#EC4899',  // pink-500
          600: '#DB2777',
        },
        // 'mint' = ฟ้ามินต์ — accent สดชื่น
        mint: {
          50:  '#ECFEFF',
          100: '#CFFAFE',
          200: '#A5F3FC',
          400: '#22D3EE',
          500: '#06B6D4',  // cyan-500
          600: '#0891B2',
        },
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
        },
        danger: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          400: '#FB7185',
          500: '#EF4444',
          600: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'sans-serif'],
        display: ['"Bai Jamjuree"', '"IBM Plex Sans Thai"', 'sans-serif'],
      },
      boxShadow: {
        'glow-sm':    '0 4px 16px -4px rgba(139, 92, 246, 0.30)',
        'glow':       '0 8px 24px -8px rgba(139, 92, 246, 0.50)',
        'glow-lg':    '0 12px 36px -10px rgba(139, 92, 246, 0.60)',
        'glow-gold':  '0 8px 24px -8px rgba(245, 158, 11, 0.55)',
        'glow-pink':  '0 8px 24px -8px rgba(236, 72, 153, 0.55)',
        'glow-mint':  '0 8px 24px -8px rgba(6, 182, 212, 0.55)',
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
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':      { transform: 'rotate(3deg)' },
        },
        'rainbow': {
          '0%':   { filter: 'hue-rotate(0deg)' },
          '100%': { filter: 'hue-rotate(360deg)' },
        },
      },
      animation: {
        'pulse-slow': 'pulse-slow 6s ease-in-out infinite',
        'shimmer':    'shimmer 2.5s linear infinite',
        'float':      'float 4s ease-in-out infinite',
        'pop':        'pop 0.4s ease-out',
        'wiggle':     'wiggle 2s ease-in-out infinite',
        'rainbow':    'rainbow 6s linear infinite',
      },
    },
  },
  plugins: [],
};
