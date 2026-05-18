/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ============================================================
        //  ธีม Thai Media Fund — โทนฟ้าหลัก เขียวเป็น accent
        //  อ้างอิงสีออฟฟิเชียลจากคู่มือตราสัญลักษณ์ กองทุนพัฒนาสื่อฯ
        //    - ฟ้าอ่อน (#ABDAFF) — pixel/digital
        //    - ฟ้า (#008FFF) — สีหลัก
        //    - เขียว (#2BCAAB) — ใบไม้
        //    - ดำ (#000) — ตัวหนังสือ
        // ============================================================
        // 'detective' = ฟ้า TMF (วงรอบสีหลักของแบรนด์)
        detective: {
          50:  '#EBF6FF',
          100: '#D6EDFF',
          200: '#ABDAFF',  // TMF light blue
          300: '#80C7FF',
          400: '#4DAEFF',
          500: '#008FFF',  // TMF primary blue
          600: '#0072CC',
          700: '#005599',
          800: '#003C73',
        },
        // 'warning' = เหลืองทองอุ่น (ใช้แค่ achievement — Certificate / badges)
        warning: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        // 'candy' = ชมพู (legacy — ใช้น้อย เก็บไว้กันโค้ดเก่าพัง)
        candy: {
          50:  '#FFF0F7',
          100: '#FFD9EB',
          200: '#FFBADB',
          400: '#FF7AB6',
          500: '#EC4899',
          600: '#DB2777',
        },
        // 'mint' = เขียว TMF — accent ของแบรนด์
        mint: {
          50:  '#E8FAF5',
          100: '#C7F2E5',
          200: '#9DE8D3',
          400: '#4FD8B9',
          500: '#2BCAAB',  // TMF green
          600: '#1FA88E',
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
        // ฟอนต์ทางการ — ใช้กับ Certificate, เอกสารทางการ
        // ตามคู่มือ TMF: "Sukhumvit Set" (license proprietary AIS) →
        // ถ้าไม่มีในเครื่อง fallback ไป Noto Sans Thai (ใกล้เคียงที่สุด)
        official: ['"Sukhumvit Set"', '"Noto Sans Thai"', '"IBM Plex Sans Thai"', 'sans-serif'],
      },
      boxShadow: {
        // Glow ใช้สี TMF blue
        'glow-sm':    '0 4px 16px -4px rgba(0, 143, 255, 0.25)',
        'glow':       '0 8px 24px -8px rgba(0, 143, 255, 0.40)',
        'glow-lg':    '0 12px 36px -10px rgba(0, 143, 255, 0.50)',
        'glow-gold':  '0 8px 24px -8px rgba(245, 158, 11, 0.45)',
        'glow-pink':  '0 8px 24px -8px rgba(236, 72, 153, 0.45)',
        'glow-mint':  '0 8px 24px -8px rgba(43, 202, 171, 0.45)',
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
