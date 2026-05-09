import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAvatarStore, fileToResizedDataUrl } from '../store/avatarStore';

const PRESETS = [1, 2, 3, 4];
const PRESET_EMOJI = ['🧒', '👧', '👦', '🧑'];

interface Props {
  preset: number;
  customId?: string;
  onPick: (preset: number, customId?: string) => void;
}

// โฟลเดอร์รูปอวตาร: รวม preset + รูปที่ผู้เล่นอัปโหลดเอง
export default function AvatarFolder({ preset, customId, onPick }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const avatars = useAvatarStore(s => s.avatars);
  const addAvatar = useAvatarStore(s => s.addAvatar);
  const removeAvatar = useAvatarStore(s => s.removeAvatar);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setBusy(true);
    try {
      let last: { id: string } | null = null;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError('รองรับเฉพาะไฟล์รูปภาพ (PNG / JPG / WEBP)');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          setError('รูปใหญ่เกิน 10MB ลองใช้รูปเล็กลง');
          continue;
        }
        const dataUrl = await fileToResizedDataUrl(file);
        const baseName = file.name.replace(/\.[^.]+$/, '').slice(0, 24);
        last = addAvatar(baseName || 'อวตารใหม่', dataUrl);
      }
      // ถ้าอัปโหลดสำเร็จ → เลือกใบล่าสุดให้อัตโนมัติ
      if (last) onPick(0, last.id);
    } catch (err: unknown) {
      setError((err as Error)?.message || 'อัปโหลดไม่สำเร็จ');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('ลบรูปอวตารนี้ไหม?')) return;
    removeAvatar(id);
    // ถ้าลบรูปที่กำลังใช้อยู่ → กลับไป preset 1
    if (customId === id) onPick(1, undefined);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-detective-700">📁 โฟลเดอร์อวตาร</p>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="text-xs font-semibold bg-gradient-to-r from-detective-500 to-detective-600
                     text-white rounded-lg px-3 py-1.5 active:scale-95 shadow-sm
                     disabled:opacity-60"
        >
          {busy ? 'กำลังอัป...' : '＋ อัปโหลดรูป'}
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      {error && (
        <p className="text-xs text-danger-500 bg-danger-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-4 gap-2">
        {/* preset emoji avatars */}
        {PRESETS.map(n => {
          const active = !customId && preset === n;
          return (
            <button
              key={`preset-${n}`}
              type="button"
              onClick={() => onPick(n, undefined)}
              className={`relative aspect-square rounded-2xl text-3xl flex items-center justify-center
                          transition-all border-2 ${
                active
                  ? 'bg-gradient-to-br from-detective-400 to-detective-600 border-detective-500 shadow-md scale-105'
                  : 'bg-white border-detective-100 active:scale-95'
              }`}
            >
              {PRESET_EMOJI[n - 1]}
              {active && (
                <span className="absolute -top-1 -right-1 bg-success-500 text-white text-[10px]
                                 rounded-full w-5 h-5 flex items-center justify-center shadow">
                  ✓
                </span>
              )}
            </button>
          );
        })}

        {/* custom uploaded avatars */}
        <AnimatePresence>
          {avatars.map(av => {
            const active = customId === av.id;
            return (
              <motion.div
                key={av.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => onPick(0, av.id)}
                  className={`relative w-full aspect-square rounded-2xl overflow-hidden
                              border-2 transition-all ${
                    active
                      ? 'border-detective-500 shadow-md scale-105'
                      : 'border-detective-100 active:scale-95'
                  }`}
                >
                  <img src={av.dataUrl} alt={av.name} className="w-full h-full object-cover" />
                  {active && (
                    <span className="absolute -top-1 -right-1 bg-success-500 text-white text-[10px]
                                     rounded-full w-5 h-5 flex items-center justify-center shadow">
                      ✓
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(av.id, e)}
                  className="absolute -bottom-1 -right-1 bg-danger-500 text-white text-[10px]
                             rounded-full w-5 h-5 flex items-center justify-center shadow
                             active:scale-90"
                  aria-label="ลบรูป"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* upload tile */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="aspect-square rounded-2xl border-2 border-dashed border-detective-200
                     bg-detective-50/50 text-detective-500 flex flex-col items-center justify-center
                     active:scale-95 disabled:opacity-50"
        >
          <span className="text-2xl leading-none">＋</span>
          <span className="text-[10px] mt-1">เพิ่มรูป</span>
        </button>
      </div>

      <p className="text-[11px] text-gray-500 leading-relaxed">
        💡 อัปโหลดรูปอนิเมะหรือรูปที่คุณชอบเป็นอวตาร — รองรับ PNG / JPG / WEBP, สูงสุด 10MB ต่อรูป
        <br />
        ระบบจะย่อรูปให้อัตโนมัติ และเก็บไว้ในเครื่องของคุณเท่านั้น
      </p>
    </div>
  );
}
