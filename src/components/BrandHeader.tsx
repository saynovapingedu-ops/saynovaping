// ============================================================================
//  BrandHeader — แถบโลโก้ของแอป (รองรับ 2 รูปแบบ)
//    - variant 'bar'  : แถบเต็มกว้าง พื้นขาว ใช้ใน Onboarding / Home intro
//    - variant 'pill' : Floating Pill สำหรับลอยบนพื้นหลังสี (ใช้ใน Home main)
//
//  ตามคู่มือ CI กองทุนพัฒนาสื่อฯ:
//    - โลโก้รองพื้นขาว เด่นชัด
//    - ไม่ใช้กรอบเส้น stroke / ไม่บีบ/ยืด/หมุน
// ============================================================================

import TMFLogo from './TMFLogo';

interface Props {
  variant?: 'bar' | 'pill';
}

export default function BrandHeader({ variant = 'bar' }: Props) {
  if (variant === 'pill') {
    // Sponsor Badge — TMF logo (ซ้าย) | SayNo text (ขวา) — สลิม ไม่มีไอคอน
    return (
      <div className="inline-flex items-center gap-2 bg-white rounded-full
                      pl-2.5 pr-3 py-1
                      shadow-[0_8px_20px_-4px_rgba(0,0,0,0.18)]">
        {/* ฝั่งซ้าย: โลโก้กองทุนฯ (มาเป็นอันดับแรก) */}
        <TMFLogo variant="bare" width={48} />

        {/* เส้นคั่นแนวตั้ง */}
        <div className="w-px h-7 bg-slate-200" />

        {/* ฝั่งขวา: SayNo ข้อความล้วน — หนา ชัด */}
        <div className="leading-none">
          <p className="font-display font-extrabold text-detective-700 text-sm leading-none tracking-tight">
            SayNo
          </p>
          <p className="text-[10px] font-bold text-slate-600 mt-0.5 leading-none">
            สู้บุหรี่ไฟฟ้า
          </p>
        </div>
      </div>
    );
  }

  // default 'bar' — แถบเต็มกว้าง (Onboarding / Home intro)
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3
                       flex items-center justify-between gap-3">
      <div className="flex-shrink-0">
        <TMFLogo variant="bare" width={120} />
      </div>

      <div className="text-right">
        <p className="font-display font-extrabold text-detective-700 text-xl leading-tight">
          🚭 SayNo
        </p>
        <p className="font-display font-bold text-slate-700 text-base leading-tight">
          : สู้บุหรี่ไฟฟ้า
        </p>
      </div>
    </header>
  );
}
