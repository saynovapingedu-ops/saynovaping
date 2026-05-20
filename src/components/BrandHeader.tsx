// ============================================================================
//  BrandHeader — แถบโลโก้ของแอป
//    - variant 'bar'  : แถบเต็มกว้าง พื้นฟ้าอ่อน + Pill ลอยขวา (เหมือนหน้าแรก)
//    - variant 'pill' : Floating Pill เปล่าๆ ใช้ลอยบนพื้นสี (Home main)
//
//  ตามคู่มือ CI กองทุนพัฒนาสื่อฯ:
//    - โลโก้รองพื้นขาวเสมอ
//    - เว้นพื้นที่ว่างรอบโลโก้
//    - ห้ามใส่ stroke / บีบ-ยืด / หมุน / เปลี่ยนสี
//    - โลโก้กองทุนต้องเด่นชัด (สำคัญที่สุด เพราะเป็นผู้สนับสนุน)
// ============================================================================

import TMFLogo from './TMFLogo';

interface Props {
  variant?: 'bar' | 'pill';
}

// Pill เดียวกันใช้ทั้ง variant pill และครอบใน bar
function LogoPill() {
  return (
    <div className="inline-flex items-center gap-2.5 bg-white rounded-2xl
                    pl-2.5 pr-3 py-1.5 border border-detective-100
                    shadow-[0_4px_16px_-6px_rgba(0,143,255,0.22)]">
      {/* TMF logo — เน้นใหญ่ + clear space รอบโลโก้ */}
      <TMFLogo variant="bare" width={70} />

      {/* เส้นคั่นแนวตั้ง */}
      <div className="w-px h-8 bg-slate-200" />

      {/* SayNo — text เล็กลง */}
      <div className="leading-tight">
        <p className="font-display font-extrabold text-detective-700 text-[11px] leading-tight tracking-tight">
          SayNo
        </p>
        <p className="text-[9px] font-bold text-slate-500 mt-0.5 leading-tight">
          สู้บุหรี่ไฟฟ้า
        </p>
      </div>
    </div>
  );
}

export default function BrandHeader({ variant = 'bar' }: Props) {
  if (variant === 'pill') {
    return <LogoPill />;
  }

  // 'bar' — แถบฟ้าอ่อน + Pill ลอยขวา (โทนเดียวกับ PageHeader)
  return (
    <header
      className="px-4 py-2.5 flex items-center justify-end relative
                 bg-detective-50/90 backdrop-blur-md border-b border-detective-100
                 pt-[max(0.625rem,calc(env(safe-area-inset-top)+0.3rem))]"
    >
      <LogoPill />
    </header>
  );
}
