interface Props {
  /** ใช้เป็น seed สำหรับสุ่มสี — ห้ามใช้ข้อมูล PII */
  rank: number;
  size?: number;
  className?: string;
}

// palette ของวงพื้นหลัง — TMF blues + mint + gold (subtle)
const BG_COLORS = [
  '#D6EDFF', // detective-100
  '#ABDAFF', // detective-200
  '#C7F2E5', // mint-100
  '#FEF3C7', // warning-100
  '#EBF6FF', // detective-50
];

/**
 * AnonymousAvatar — silhouette ของ "นักสืบ" สำหรับแถวที่ไม่ใช่ตัวเอง
 * ไม่เปิดเผยข้อมูล PII ใช้แค่ rank (ค่า public อยู่แล้ว) เป็น seed สี
 */
export default function AnonymousAvatar({ rank, size = 36, className = '' }: Props) {
  const bg = BG_COLORS[rank % BG_COLORS.length];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size, backgroundColor: bg }}
      aria-hidden
    >
      {/* แว่นสืบ silhouette — magnifying glass */}
      <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <circle cx="10" cy="10" r="6" stroke="#0072CC" strokeWidth="2" fill="rgba(255,255,255,0.3)" />
        <line x1="14.5" y1="14.5" x2="20" y2="20" stroke="#0072CC" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}
