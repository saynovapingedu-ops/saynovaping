import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import AvatarFolder from '../components/AvatarFolder';

export default function Onboarding() {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [grade, setGrade] = useState('');
  const [school, setSchool] = useState('');
  const [avatar, setAvatar] = useState(1);
  const [customAvatarId, setCustomAvatarId] = useState<string | undefined>(undefined);
  const [consent, setConsent] = useState(false);
  const navigate = useNavigate();
  const initProfile = usePlayerStore(s => s.initProfile);
  const setInitialized = usePlayerStore(s => s.setInitialized);

  const handlePickAvatar = (preset: number, customId?: string) => {
    if (customId) {
      setCustomAvatarId(customId);
      // เก็บค่า preset เดิมไว้เผื่อผู้เล่นกลับมา fallback
    } else {
      setAvatar(preset);
      setCustomAvatarId(undefined);
    }
  };

  const handleFinish = () => {
    initProfile({
      nickname: nickname.trim() || 'นักสืบ',
      grade,
      school: school.trim(),
      avatar,
      customAvatarId,
      consentAt: new Date().toISOString(),
    });
    setInitialized(true);
    navigate('/');
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-md mx-auto relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-detective-300/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 -right-20 w-64 h-64 bg-warning-500/20 rounded-full blur-3xl" />
      </div>

      <div className="flex justify-center gap-2 mb-6">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === step
                ? 'w-12 bg-gradient-to-r from-detective-500 to-detective-600 shadow-glow-sm'
                : i < step
                ? 'w-6 bg-detective-300'
                : 'w-6 bg-detective-100'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col items-center text-center justify-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="text-8xl mb-4 drop-shadow-lg"
            >
              🔍
            </motion.div>
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-detective-700 via-detective-500
                           to-warning-500 bg-clip-text text-transparent mb-2">
              นักสืบสุขภาพ
            </h1>
            <p className="text-gray-600 mb-1 font-medium">ภารกิจปกป้องลมหายใจ</p>
            <div className="card-hero mt-6 mx-2">
              <p className="text-sm text-gray-700 leading-relaxed">
                เกมฝึกทักษะปฏิเสธบุหรี่ไฟฟ้า สำหรับเยาวชน ม.ต้น
                <br/>เล่นจบ 8 ด่าน รับ Certificate ดิจิทัล 🏆
              </p>
            </div>
            <button onClick={() => setStep(1)} className="btn-primary mt-8 w-full text-base">
              เริ่มเลย →
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col">
            <h2 className="text-2xl font-display font-bold text-detective-700 mb-1">ตั้งชื่อนักสืบ</h2>
            <p className="text-sm text-gray-500 mb-5">ใช้ชื่อเล่นได้ ไม่ต้องใส่ชื่อจริง</p>

            <label className="text-sm font-semibold text-gray-700">ชื่อในเกม</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              placeholder="เช่น นักสืบเอ"
              className="w-full p-3 mt-1 mb-4 rounded-xl border-2 border-detective-100 bg-white/90
                         focus:border-detective-500 focus:shadow-glow-sm outline-none transition-all"
            />

            <label className="text-sm font-semibold text-gray-700">ชั้นเรียน</label>
            <div className="grid grid-cols-3 gap-2 mt-1 mb-4">
              {['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'].map(g => (
                <button key={g} onClick={() => setGrade(g)}
                  className={`py-2.5 rounded-xl font-semibold border-2 transition-all active:scale-95 ${
                    grade === g
                      ? 'bg-gradient-to-br from-detective-500 to-detective-600 text-white border-detective-500 shadow-glow-sm'
                      : 'bg-white/90 text-gray-600 border-detective-100 hover:border-detective-300'
                  }`}>{g}</button>
              ))}
            </div>

            <label className="text-sm font-semibold text-gray-700">โรงเรียน (ถ้ามี)</label>
            <input
              value={school}
              onChange={e => setSchool(e.target.value)}
              maxLength={50}
              placeholder="ไม่บังคับ"
              className="w-full p-3 mt-1 mb-4 rounded-xl border-2 border-detective-100 bg-white/90
                         focus:border-detective-500 focus:shadow-glow-sm outline-none transition-all"
            />

            <label className="text-sm font-semibold text-gray-700 mb-2 block">เลือกอวตาร</label>
            <div className="mb-6">
              <AvatarFolder preset={avatar} customId={customAvatarId} onPick={handlePickAvatar} />
            </div>

            <button onClick={() => setStep(2)} disabled={!nickname.trim() || !grade}
              className="btn-primary w-full mt-auto">
              ต่อไป →
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col">
            <h2 className="text-xl font-display font-bold text-detective-700 mb-3">ความเป็นส่วนตัว</h2>
            <div className="card text-sm text-gray-700 leading-relaxed space-y-2 mb-4">
              <p>• เกมนี้เก็บเฉพาะ <b>ชื่อในเกม / ชั้นเรียน / โรงเรียน</b> ที่คุณกรอกเอง</p>
              <p>• ไม่เก็บชื่อจริง อีเมล เบอร์โทร หรือข้อมูลส่วนตัวอื่นใด</p>
              <p>• ID ผู้ใช้ถูก <b>เข้ารหัส</b> (SHA-256) ก่อนเก็บ — ระบุตัวคุณกลับไม่ได้</p>
              <p>• ข้อมูลใช้เพื่อบันทึก progress และออก certificate เท่านั้น</p>
              <p>• สามารถลบข้อมูลได้ในหน้าโปรไฟล์</p>
            </div>

            <label className="flex items-start gap-3 mb-6 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="mt-1 w-5 h-5 accent-detective-500" />
              <span className="text-sm text-gray-700">
                ฉันอ่านและเข้าใจ ยินยอมให้เก็บข้อมูลตามที่ระบุ
              </span>
            </label>

            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← กลับ</button>
              <button onClick={handleFinish} disabled={!consent} className="btn-primary flex-1">
                เริ่มเล่น
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
