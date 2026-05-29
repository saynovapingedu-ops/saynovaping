interface Props {
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Ribbon — โบว์ทอง 2 หาง ใช้ใต้ title ของใบประกาศ
 * pure SVG path (ไม่มี <text>) — รองรับ html-to-image toPng()
 */
export default function Ribbon({ width = 120, height = 28, className = '' }: Props) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 28"
      className={className}
      aria-hidden
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))' }}
    >
      {/* ribbon center band — gold gradient */}
      <defs>
        <linearGradient id="ribbon-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* หาง ribbon ซ้าย */}
      <path
        d="M 6 8 L 28 8 L 24 16 L 28 24 L 6 24 L 10 16 Z"
        fill="#D97706"
      />
      {/* หาง ribbon ขวา */}
      <path
        d="M 114 8 L 92 8 L 96 16 L 92 24 L 114 24 L 110 16 Z"
        fill="#D97706"
      />
      {/* center band */}
      <rect x="24" y="4" width="72" height="20" rx="3" fill="url(#ribbon-gold)" />
      {/* highlight line บน band */}
      <rect x="24" y="6" width="72" height="2" rx="1" fill="rgba(255,255,255,0.4)" />
      {/* center decorative diamond */}
      <path d="M 60 9 L 64 14 L 60 19 L 56 14 Z" fill="rgba(255,255,255,0.7)" />
    </svg>
  );
}
