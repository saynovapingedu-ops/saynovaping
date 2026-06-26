import type { PointerEvent } from 'react';

// ============================================================================
//  GamePad — ปุ่มควบคุมกลางสำหรับมินิเกม (ใช้แทนการ "ปัด/สไลด์" ที่ทำให้
//  เบราว์เซอร์/LIFF เด้งออกจากแอป) — ดีไซน์เคลย์ ปุ่มใหญ่กดง่าย
//    · LRPad = ซ้าย/ขวา (เกมเลื่อนแนวนอน)
//    · DPad  = 4 ทิศ (งู/เขาวงกต)
//  รองรับทั้ง "แตะ" (onPress อย่างเดียว) และ "กดค้าง" (onPress + onRelease)
// ============================================================================

const BTN =
  'flex items-center justify-center h-12 rounded-[16px] bg-[#FFFCF7] text-2xl font-bold ' +
  'text-detective-700 shadow-clay-sm active:shadow-clay-pressed active:translate-y-px ' +
  'select-none touch-none disabled:opacity-40 transition-shadow';

function holdHandlers(onPress: () => void, onRelease?: () => void) {
  return {
    onPointerDown: (e: PointerEvent) => { e.preventDefault(); onPress(); },
    onPointerUp: () => onRelease?.(),
    onPointerLeave: () => onRelease?.(),
    onPointerCancel: () => onRelease?.(),
  };
}

interface LRProps {
  onLeft: () => void;
  onRight: () => void;
  /** ถ้ามี = โหมดกดค้าง (ปล่อยแล้วหยุด) */
  onRelease?: () => void;
  disabled?: boolean;
}

export function LRPad({ onLeft, onRight, onRelease, disabled }: LRProps) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-3 max-w-[360px] mx-auto">
      <button type="button" disabled={disabled} className={BTN} aria-label="ซ้าย"
        {...holdHandlers(onLeft, onRelease)}>◀</button>
      <button type="button" disabled={disabled} className={BTN} aria-label="ขวา"
        {...holdHandlers(onRight, onRelease)}>▶</button>
    </div>
  );
}

interface DProps {
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
  onRelease?: () => void;
  disabled?: boolean;
}

export function DPad({ onUp, onDown, onLeft, onRight, onRelease, disabled }: DProps) {
  const cell = `${BTN} w-14`;
  return (
    <div className="mt-3 mx-auto w-[184px] select-none">
      <div className="flex justify-center mb-2">
        <button type="button" disabled={disabled} className={cell} aria-label="ขึ้น"
          {...holdHandlers(onUp, onRelease)}>▲</button>
      </div>
      <div className="flex justify-center gap-2">
        <button type="button" disabled={disabled} className={cell} aria-label="ซ้าย"
          {...holdHandlers(onLeft, onRelease)}>◀</button>
        <button type="button" disabled={disabled} className={cell} aria-label="ลง"
          {...holdHandlers(onDown, onRelease)}>▼</button>
        <button type="button" disabled={disabled} className={cell} aria-label="ขวา"
          {...holdHandlers(onRight, onRelease)}>▶</button>
      </div>
    </div>
  );
}
