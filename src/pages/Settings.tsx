import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { useAdminStore } from '../store/adminStore';
import { sfx } from '../lib/sound';
import { startBgm, stopBgm } from '../lib/bgm';
import PageHeader from '../components/PageHeader';
import { SCENARIO_META } from '../scenarios';

interface ToggleProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: () => void;
  emoji: string;
}

function Toggle({ label, description, value, onToggle, emoji }: ToggleProps) {
  return (
    <button
      onClick={() => { sfx.click(); onToggle(); }}
      className="w-full card flex items-center gap-3 active:scale-[0.99] transition-all"
    >
      <span className="text-2xl">{emoji}</span>
      <div className="flex-1 text-left min-w-0">
        <p className="font-semibold text-detective-700">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <div
        className={`w-12 h-7 rounded-full p-0.5 transition-colors flex-shrink-0 ${
          value ? 'bg-gradient-to-r from-detective-500 to-detective-600' : 'bg-gray-300'
        }`}
      >
        <div
          className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  );
}

export default function Settings() {
  const nav = useNavigate();
  const s = useSettingsStore();
  const admin = useAdminStore();

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState(false);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (admin.loginTeacher(passcode)) {
      sfx.correct();
      setShowAdminModal(false);
      nav('/teacher-admin');
    } else {
      sfx.wrong();
      setPassError(true);
    }
  };

  return (
    <div className="min-h-full pb-8 relative">
      <PageHeader title="⚙️ ตั้งค่า" backTo="/" />

      <main className="max-w-md md:max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <p className="text-xs text-gray-500 px-1">เสียงและการสั่น</p>
        <Toggle
          emoji="🔊"
          label="เสียงประกอบ"
          description="คลิก / ตอบถูก-ผิด / ได้คะแนน"
          value={s.soundEnabled}
          onToggle={s.toggleSound}
        />
        <Toggle
          emoji="🎵"
          label="เพลงประกอบ"
          description="เพลงนักสืบเบาๆ ขณะเล่น — สังเคราะห์ในเครื่อง ไม่กินเน็ต"
          value={s.musicEnabled}
          onToggle={() => {
            const next = !s.musicEnabled;
            s.toggleMusic();
            if (next) startBgm();
            else stopBgm();
          }}
        />
        <Toggle
          emoji="📳"
          label="สั่นมือถือ"
          description="สั่นเบาๆ ตอนเลือกหรือได้แบดจ์"
          value={s.vibrationEnabled}
          onToggle={s.toggleVibration}
        />
        <Toggle
          emoji="🔊"
          label="อ่านบทสนทนาออกเสียง"
          description="โชว์ปุ่ม 'ฟังเสียง' ใต้บทสนทนา (ต้องมีเสียงไทยในเครื่อง)"
          value={s.ttsEnabled}
          onToggle={s.toggleTts}
        />

        <p className="text-xs text-gray-500 px-1 pt-3">การแสดงผล</p>
        <div className="card">
          <p className="font-semibold text-detective-700 mb-2 flex items-center gap-2">
            <span className="text-xl">🅰️</span> ขนาดตัวอักษร
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['sm', 'md', 'lg'] as const).map(size => (
              <button
                key={size}
                onClick={() => { sfx.click(); s.setFontSize(size); }}
                className={`py-2 rounded-xl font-semibold transition-all ${
                  s.fontSize === size
                    ? 'bg-gradient-to-br from-detective-500 to-detective-600 text-white shadow-glow-sm'
                    : 'bg-white border-2 border-detective-100 text-gray-600'
                }`}
              >
                <span className={size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'}>
                  Aa
                </span>
                <p className="text-[10px] mt-0.5">
                  {size === 'sm' ? 'เล็ก' : size === 'md' ? 'ปกติ' : 'ใหญ่'}
                </p>
              </button>
            ))}
          </div>
        </div>

        <Toggle
          emoji="🎬"
          label="ลดการเคลื่อนไหว"
          description="ปิดกระดาษโปรยฉลองและเอฟเฟ็กต์เคลื่อนไหว — ดีสำหรับคนเวียนหัว"
          value={s.reducedMotion}
          onToggle={s.toggleReducedMotion}
        />

        {/* Section: Teacher Admin Access */}
        <p className="text-xs text-gray-500 px-1 pt-3">สำหรับครู / อาจารย์</p>
        <button
          onClick={() => {
            sfx.click();
            if (admin.isTeacherAuthenticated) {
              nav('/teacher-admin');
            } else {
              setShowAdminModal(true);
            }
          }}
          className="w-full card flex items-center gap-3 active:scale-[0.99] transition-all bg-gradient-to-r from-sky-50 to-indigo-50/40 border-2 border-detective-200 hover:border-detective-400"
        >
          <span className="text-2xl">👨‍🏫</span>
          <div className="flex-1 text-left min-w-0">
            <p className="font-bold text-detective-800 flex items-center gap-1.5">
              <span>แดชบอร์ดอาจารย์ (Teacher Admin)</span>
              <span className="text-[10px] bg-detective-600 text-white px-2 py-0.2 rounded-full font-bold">
                🔒 ป้องกันด้วยรหัสผ่าน
              </span>
            </p>
            <p className="text-xs text-slate-600">
              ดูพัฒนาการของนักเรียน (Pre/Post-test), รายงานคะแนน Google Sheets, และตั้งค่าระบบ
            </p>
          </div>
          <span className="text-detective-500 font-bold">→</span>
        </button>

        <p className="text-xs text-gray-500 px-1 pt-3">เกี่ยวกับ</p>
        <div className="card text-sm text-gray-700 space-y-1">
          <p className="flex justify-between"><span>เวอร์ชัน</span><span className="font-mono font-bold text-detective-700">v2.4.0 (Research Edition)</span></p>
          <p className="flex justify-between"><span>มินิเกม</span><span>16 รูปแบบ (ปฏิเสธ, โน้มน้าว, วิ่งหลบ, จับคู่ ฯลฯ)</span></p>
          <p className="flex justify-between"><span>ด่านทั้งหมด</span><span>{SCENARIO_META.length} ด่าน (บทหลัก 8 ด่าน + บทเสริม 12 ด่าน)</span></p>
        </div>

        {/* === TMF funding credit === */}
        <div className="card border-2 border-detective-200 bg-detective-50/60 text-center mt-2">
          <p className="text-xs text-slate-700 leading-relaxed">
            โครงการ <b className="text-detective-700">"SayNo:สู้บุหรี่ไฟฟ้า"</b>
            <br/>
            <span className="text-[11px] text-slate-600">ได้รับทุนสนับสนุนจาก</span>
          </p>
          <p className="font-display font-bold text-detective-700 text-sm mt-1.5 leading-tight">
            กองทุนพัฒนาสื่อปลอดภัยและสร้างสรรค์
          </p>
          <p className="text-[11px] text-slate-500 italic">THAI MEDIA FUND</p>
        </div>
      </main>

      {/* Admin Passcode Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="text-center space-y-1">
              <span className="text-3xl">🔒</span>
              <h3 className="font-display font-bold text-slate-900 text-base">
                เข้าสู่แดชบอร์ดอาจารย์
              </h3>
              <p className="text-xs text-slate-500">
                กรุณาใส่รหัสผ่านเพื่อเข้าใช้งานแดชบอร์ด
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-3 pt-1">
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPassError(false);
                }}
                placeholder="ใส่รหัสผ่าน"
                className="w-full px-3.5 py-2.5 rounded-xl border text-center font-bold tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-detective-400 bg-slate-50"
                autoFocus
              />
              {passError && (
                <p className="text-[11px] font-semibold text-rose-500 text-center">
                  ❌ รหัสผ่านไม่ถูกต้อง
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="btn-secondary flex-1 py-2 text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-2 text-xs font-bold shadow-clay"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
