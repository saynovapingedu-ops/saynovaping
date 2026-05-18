// ============================================================================
//  BrandHeader — แถบโลโก้ของแอป
//    - variant 'bar'  : แถบเต็มกว้าง พื้นขาว ใช้บนหน้า Onboarding / Knowledge / Profile ฯลฯ
//    - variant 'pill' : Floating Pill สำหรับลอยบนพื้นหลังสี (ใช้ใน Home main)
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

export default function BrandHeader({ variant = 'bar' }: Props) {
  if (variant === 'pill') {
    // Floating Sponsor Badge — TMF logo ใหญ่ + ชื่อแอปเล็กข้างขวา
    return (
      <div className="inline-flex items-center gap-2 bg-white rounded-2xl
                      pl-2 pr-3 py-1.5
                      shadow-[0_8px_20px_-4px_rgba(0,0,0,0.18)]">
        {/* TMF logo — เน้นใหญ่ ตามคู่มือ CI */}
        <TMFLogo variant="bare" width={70} />

        {/* เส้นคั่นแนวตั้ง */}
        <div className="w-px h-8 bg-slate-200" />

        {/* SayNo — text เล็กลง */}
        <div className="leading-none">
          <p className="font-display font-extrabold text-detective-700 text-[11px] leading-none tracking-tight">
            SayNo
          </p>
          <p className="text-[9px] font-bold text-slate-500 mt-0.5 leading-none">
            สู้บุหรี่ไฟฟ้า
          </p>
        </div>
      </div>
    );
  }

  // default 'bar' — แถบเต็มกว้าง
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3
                       flex items-center justify-between gap-3">
      {/* TMF logo — ใหญ่ เป็นโลโก้หลัก */}
      <div className="flex-shrink-0">
        <TMFLogo variant="bare" width={150} />
      </div>

      {/* SayNo — text เล็กลง อยู่ขวาเป็น secondary */}
      <div className="text-right">
        <p className="font-display font-extrabold text-detective-700 text-sm leading-tight">
          SayNo
        </p>
        <p className="text-[11px] font-semibold text-slate-500 leading-tight">
          สู้บุหรี่ไฟฟ้า
        </p>
      </div>
    </header>
  );
}
