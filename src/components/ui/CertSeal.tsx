interface Props {
  size?: number;
  className?: string;
}

/**
 * CertSeal — ตราประทับวงกลม TMF blue + gold ring
 * pure SVG path — ไม่มี <text> เพื่อรองรับ html-to-image toPng()
 * ข้อความรอบ seal: render เป็น path → text ลายเส้น (อ่านได้แต่ไม่อาศัย font)
 */
export default function CertSeal({ size = 80, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`seal-shadow ${className}`}
      aria-hidden
    >
      <defs>
        <radialGradient id="seal-bg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0072CC" />
          <stop offset="100%" stopColor="#003C73" />
        </radialGradient>
      </defs>

      {/* ring ทอง outer */}
      <circle cx="50" cy="50" r="48" fill="none" stroke="#F59E0B" strokeWidth="2" />

      {/* ring tiny gold dots — เรียงรอบ */}
      {Array.from({ length: 16 }).map((_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const cx = 50 + Math.cos(a) * 42;
        const cy = 50 + Math.sin(a) * 42;
        return <circle key={i} cx={cx} cy={cy} r="1.2" fill="#F59E0B" />;
      })}

      {/* outer blue ring */}
      <circle cx="50" cy="50" r="38" fill="url(#seal-bg)" stroke="#FBBF24" strokeWidth="1" />

      {/* inner gold ring + blue fill */}
      <circle cx="50" cy="50" r="32" fill="none" stroke="#FBBF24" strokeWidth="0.8" opacity="0.7" />

      {/* รูปดาว 5 แฉก center */}
      <path
        d="M 50 28 L 54 42 L 68 42 L 57 50 L 61 64 L 50 56 L 39 64 L 43 50 L 32 42 L 46 42 Z"
        fill="#FBBF24"
        stroke="#F59E0B"
        strokeWidth="0.5"
      />

      {/* ribbon เล็กล่าง */}
      <path d="M 38 70 L 62 70 L 58 76 L 42 76 Z" fill="#F59E0B" />
      <path d="M 42 76 L 50 80 L 58 76 Z" fill="#D97706" />

      {/* highlight reflection */}
      <ellipse cx="42" cy="38" rx="8" ry="4" fill="rgba(255,255,255,0.18)" transform="rotate(-30, 42, 38)" />
    </svg>
  );
}
