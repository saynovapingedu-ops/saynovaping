// ============================================================================
//  PageHeader — แถบหัวข้อหน้า (รวม brand pill + back btn + title ใน bar เดียว)
//
//  ใช้แทน <BrandHeader/> + <header> ที่เคยซ้อนกัน 2 แถบ — เหมาะกับทุกหน้า
//  ยกเว้นหน้าแรก (Home) ที่มี layout เฉพาะ
// ============================================================================

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { sfx } from '../lib/sound';
import BrandHeader from './BrandHeader';

interface Props {
  title: string;
  subtitle?: string;
  /** path ที่กดย้อนกลับ — default '/' */
  backTo?: string;
  /** ใช้แทน backTo เมื่อมี onBack handler เอง */
  onBack?: () => void;
  /** sticky บนสุดของหน้า */
  sticky?: boolean;
  /** ปุ่ม/ชิปด้านขวา (เช่น เหรียญ, ลิงก์) — วางข้างชื่อ ก่อนโลโก้แบรนด์ */
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, backTo = '/', onBack, sticky = true, actions }: Props) {
  const nav = useNavigate();

  const handleBack = () => {
    sfx.click();
    if (onBack) onBack();
    else nav(backTo);
  };

  return (
    <header
      className={`${sticky ? 'sticky top-0 z-20' : ''}
                  px-3.5 py-2.5 flex items-center gap-2.5
                  liquid-header rounded-b-[28px]
                  shadow-[0_6px_18px_-10px_rgba(176,138,104,0.5)]
                  pt-[max(0.625rem,calc(env(safe-area-inset-top)+0.3rem))]`}
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        className="bg-[#FFFCF7] hover:bg-detective-50 text-detective-700 w-9 h-9 rounded-2xl
                   flex items-center justify-center shadow-clay-sm
                   active:scale-95 active:shadow-clay-pressed transition-all flex-shrink-0"
        aria-label="กลับ"
      >
        <span className="text-lg leading-none">←</span>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0 px-0.5">
        <h2 className="font-display font-bold text-detective-800 text-sm leading-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[11px] text-slate-500 leading-tight truncate">{subtitle}</p>
        )}
      </div>

      {/* ปุ่ม/ชิปด้านขวา (ออปชัน) — เช่น เหรียญ/ลิงก์ */}
      {actions && (
        <div className="flex items-center gap-1.5 flex-shrink-0">{actions}</div>
      )}

      {/* Brand pill (TMF + SayNo) */}
      <BrandHeader variant="pill" />
    </header>
  );
}
