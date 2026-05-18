// ============================================================================
//  PageHeader — แถบหัวข้อหน้า (รวม brand pill + back btn + title ใน bar เดียว)
//
//  ใช้แทน <BrandHeader/> + <header> ที่เคยซ้อนกัน 2 แถบ — เหมาะกับทุกหน้า
//  ยกเว้นหน้าแรก (Home) ที่มี layout เฉพาะ
// ============================================================================

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
}

export default function PageHeader({ title, subtitle, backTo = '/', onBack, sticky = true }: Props) {
  const nav = useNavigate();

  const handleBack = () => {
    sfx.click();
    if (onBack) onBack();
    else nav(backTo);
  };

  return (
    <header
      className={`${sticky ? 'sticky top-0 z-20' : ''}
                  px-3 py-2 flex items-center gap-2
                  pt-[max(0.5rem,calc(env(safe-area-inset-top)+0.25rem))]`}
      style={{
        background: 'linear-gradient(135deg, #D6EDFF 0%, #ABDAFF 100%)',
      }}
    >
      {/* Back button */}
      <button
        onClick={handleBack}
        className="bg-white/80 hover:bg-white text-detective-700 w-9 h-9 rounded-2xl
                   flex items-center justify-center shadow-sm active:scale-95 transition-all
                   flex-shrink-0"
        aria-label="กลับ"
      >
        <span className="text-lg leading-none">←</span>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0 px-1">
        <h2 className="font-display font-bold text-detective-800 text-sm leading-tight truncate">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] text-detective-700/70 leading-tight truncate">{subtitle}</p>
        )}
      </div>

      {/* Brand pill (TMF + SayNo) */}
      <BrandHeader variant="pill" />
    </header>
  );
}
