import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCertNameStore } from '../store/certNameStore';
import { sfx } from '../lib/sound';

interface Props {
  open: boolean;
  onClose: () => void;
  /** ข้อความหัวเรื่อง (default ถามใส่ชื่อ) */
  title?: string;
  /** subtitle เสริม เช่น ตอนผ่านเกณฑ์เกียรติบัตร */
  subtitle?: string;
}

/**
 * CertNameDialog — modal กรอก "ชื่อ-นามสกุลจริง" สำหรับเกียรติบัตร
 * ใช้ซ้ำได้ทั้ง popup จบด่าน, หน้า Certificate, หน้า Profile
 * - ชื่อจริงเก็บ local-only + เข้ารหัส (certNameStore)
 * - ต้องติ๊ก consent ก่อนบันทึก
 */
export default function CertNameDialog({ open, onClose, title, subtitle }: Props) {
  const realName = useCertNameStore(s => s.realName);
  const setRealName = useCertNameStore(s => s.setRealName);
  const clearRealName = useCertNameStore(s => s.clearRealName);

  const [name, setName] = useState(realName);
  const [consent, setConsent] = useState(!!realName);

  // sync ค่าเริ่มต้นเมื่อเปิด modal ใหม่
  const [lastOpen, setLastOpen] = useState(false);
  if (open && !lastOpen) {
    setName(realName);
    setConsent(!!realName);
    setLastOpen(true);
  } else if (!open && lastOpen) {
    setLastOpen(false);
  }

  const canSave = name.trim().length >= 2 && consent;

  const handleSave = () => {
    if (!canSave) return;
    setRealName(name);
    sfx.buy();
    onClose();
  };

  const handleSkip = () => {
    sfx.click();
    onClose();
  };

  const handleClear = () => {
    clearRealName();
    setName('');
    setConsent(false);
    sfx.click();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            onClick={e => e.stopPropagation()}
            className="liquid-modal rounded-[28px] w-full max-w-sm p-5"
          >
            <div className="text-center mb-3">
              <div className="icon-tile bg-warning-50 text-warning-600 mx-auto mb-2">🏆</div>
              <p className="font-display font-bold text-lg text-detective-700">
                {title || 'ชื่อบนเกียรติบัตร'}
              </p>
              {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            </div>

            <label className="text-sm font-semibold text-gray-700">ชื่อ-นามสกุล (สำหรับเกียรติบัตร)</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={60}
              placeholder="เช่น สมชาย ใจดี"
              className="w-full p-3 mt-1 mb-3 rounded-2xl bg-[#F3EADD] shadow-clay-pressed
                         focus:bg-[#FBF6EE] outline-none transition-all"
            />

            <label className="flex items-start gap-2.5 mb-4 cursor-pointer surface-soft p-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 w-5 h-5 accent-detective-500 flex-shrink-0"
              />
              <span className="text-xs text-gray-700 leading-relaxed">
                ยินยอมให้แสดงชื่อจริงบนเกียรติบัตร — เก็บ
                <b className="text-detective-700">ในเครื่องนี้เท่านั้น</b>
                (เข้ารหัสไว้ ไม่ส่งออก) ลบได้ทุกเมื่อ
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleSkip}
                className="py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold active:scale-95"
              >
                ใช้ชื่อเล่นก็พอ
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="btn-sunny disabled:opacity-50 py-2.5"
              >
                บันทึก
              </button>
            </div>

            {realName && (
              <button
                onClick={handleClear}
                className="w-full text-center text-danger-500 underline text-xs mt-3 active:opacity-70"
              >
                ลบชื่อจริงออก (ใช้ชื่อเล่นแทน)
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
