// ============================================================================
//  BrandHeader — แถบโลโก้ด้านบนสุดของแอป
//  ใช้ร่วมกัน 3 จุด: Onboarding / Home intro / Home main
//
//  ตามคู่มือ CI กองทุนพัฒนาสื่อฯ:
//    - โลโก้รองพื้นขาว เด่นชัด
//    - ไม่ใช้กรอบเส้น stroke
//    - ไม่บีบ/ยืด/หมุน — ใช้ aspect ratio ของไฟล์จริง
// ============================================================================

import TMFLogo from './TMFLogo';

export default function BrandHeader() {
  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3
                       flex items-center justify-between gap-3">
      {/* โลโก้กองทุนฯ — ใหญ่ ชัดเจน (left) */}
      <div className="flex-shrink-0">
        <TMFLogo variant="bare" width={120} />
      </div>

      {/* ชื่อโปรเจกต์ — right, ขนาดสมดุลกับโลโก้ */}
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
