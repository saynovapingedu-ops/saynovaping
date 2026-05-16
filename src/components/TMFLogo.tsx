// ============================================================================
//  TMFLogo — โลโก้กองทุนพัฒนาสื่อปลอดภัยและสร้างสรรค์ (Thai Media Fund)
//
//  ปฏิบัติตามคู่มือ CI ของกองทุนฯ:
//    - รองพื้นขาวเสมอเมื่อวางบนพื้นหลังสี
//    - เว้นพื้นที่ว่างรอบโลโก้ (clear space)
//    - ห้าม: ย่อ/ยืดผิดสัดส่วน, หมุน, เปลี่ยนสี, ใส่ stroke, รวมกับโลโก้อื่น
//
//  Source: src/PhotoUse/character/thaiMediaFundLogo/Aw_Thai Media Fund_Logo2021-1.png
//  → คัดลอกไว้ที่ public/brand/tmf-logo.png
// ============================================================================

import { asset } from '../lib/asset';

interface Props {
  /** 'inline' = กล่องขาวเล็กๆ, 'block' = ใหญ่กว่ามี border + caption ใต้, 'bare' = ไม่มีกล่อง (ใช้ใน header ที่ bg ขาวอยู่แล้ว) */
  variant?: 'inline' | 'block' | 'bare';
  /** ความกว้างของรูปโลโก้ (px) — height คำนวณจาก aspect ratio อัตโนมัติ */
  width?: number;
  /** caption ใต้โลโก้ */
  caption?: string;
}

// aspect ratio ของไฟล์ต้นฉบับ 1778 x 1573 → 1.13:1
const LOGO_ASPECT = 1778 / 1573;
const LOGO_SRC = asset('brand/tmf-logo.png');
const LOGO_ALT = 'กองทุนพัฒนาสื่อปลอดภัยและสร้างสรรค์ (Thai Media Fund)';

export default function TMFLogo({ variant = 'inline', width = 120, caption }: Props) {
  const height = Math.round(width / LOGO_ASPECT);

  if (variant === 'bare') {
    // ไม่มีกล่อง — ใช้ใน header ที่พื้นเป็นขาวอยู่แล้ว (เลี่ยงกล่องซ้อนกล่อง)
    return (
      <img
        src={LOGO_SRC}
        alt={LOGO_ALT}
        width={width}
        height={height}
        className="block flex-shrink-0"
        loading="eager"
      />
    );
  }

  if (variant === 'block') {
    return (
      <div className="inline-flex flex-col items-center">
        {/* รองพื้นขาว + clear space — ตามคู่มือ */}
        <div
          className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm"
          style={{ width: width + 24 }}
        >
          <img
            src={LOGO_SRC}
            alt={LOGO_ALT}
            width={width}
            height={height}
            className="block w-full h-auto"
            loading="lazy"
          />
        </div>
        {caption && (
          <p className="text-[10px] text-slate-500 mt-1.5 text-center max-w-[200px] leading-snug">
            {caption}
          </p>
        )}
      </div>
    );
  }

  // inline (default) — กล่องขาวเล็กๆ คู่ข้อความ
  return (
    <div className="inline-flex items-center gap-2 bg-white rounded-xl px-2.5 py-1.5 border border-slate-200">
      <img
        src={LOGO_SRC}
        alt={LOGO_ALT}
        width={width}
        height={height}
        className="block flex-shrink-0"
        loading="lazy"
      />
    </div>
  );
}
