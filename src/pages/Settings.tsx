import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { sfx } from '../lib/sound';
import { startBgm, stopBgm } from '../lib/bgm';

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

  return (
    <div className="min-h-full pb-8 relative">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-detective-300/30 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-10 bg-white/85 backdrop-blur-md shadow-sm border-b border-detective-100/50
                         p-3 flex items-center gap-3">
        <button
          onClick={() => { sfx.click(); nav('/'); }}
          className="text-detective-500 px-3 py-1.5 rounded-lg hover:bg-detective-50 active:scale-95"
        >
          ←
        </button>
        <h2 className="font-display font-bold text-detective-700">⚙️ ตั้งค่า</h2>
      </header>

      <main className="max-w-md mx-auto px-4 pt-4 space-y-3">
        <p className="text-xs text-gray-500 px-1">เสียงและการสั่น</p>
        <Toggle
          emoji="🔊"
          label="เสียงประกอบ"
          description="คลิก / ตอบถูก-ผิด / ได้ XP"
          value={s.soundEnabled}
          onToggle={s.toggleSound}
        />
        <Toggle
          emoji="🎵"
          label="เพลงประกอบ (BGM)"
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
          label="สั่นมือถือ (Vibration)"
          description="สั่นเบาๆ ตอนเลือกหรือได้ badge"
          value={s.vibrationEnabled}
          onToggle={s.toggleVibration}
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
          label="ลด animation"
          description="ปิด confetti และเอฟเฟ็กต์เคลื่อนไหว — ดีสำหรับคนเวียนหัว"
          value={s.reducedMotion}
          onToggle={s.toggleReducedMotion}
        />

        <p className="text-xs text-gray-500 px-1 pt-3">เกี่ยวกับ</p>
        <div className="card text-sm text-gray-700 space-y-1">
          <p className="flex justify-between"><span>เวอร์ชัน</span><span className="font-mono">v0.7.1</span></p>
          <p className="flex justify-between"><span>มินิเกม</span><span>7 แบบ</span></p>
          <p className="flex justify-between"><span>ด่านทั้งหมด</span><span>15 ด่าน</span></p>
        </div>

        <div className="card-hero text-center mt-2">
          <p className="font-display font-bold text-detective-700 text-sm">
            Walailak University - SayNo:สู้บุหรี่ไฟฟ้า
          </p>
        </div>

        <div className="text-center text-[11px] text-gray-400 pt-4">
          🔍 นักสืบสุขภาพ — ภารกิจปกป้องลมหายใจ
        </div>
      </main>
    </div>
  );
}
