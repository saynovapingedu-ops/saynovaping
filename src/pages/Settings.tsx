import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../store/settingsStore';
import { useAdminStore } from '../store/adminStore';
import { sfx } from '../lib/sound';
import { startBgm, stopBgm } from '../lib/bgm';
import PageHeader from '../components/PageHeader';
import { SCENARIO_META } from '../scenarios';
import { APP_VERSION } from '../lib/changelog';

interface ToggleRowProps {
  icon: string;
  iconBg: string;
  label: string;
  description?: string;
  value: boolean;
  onToggle: () => void;
}

function ToggleRow({ icon, iconBg, label, description, value, onToggle }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={() => {
        sfx.click();
        onToggle();
      }}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-slate-50/80 active:bg-slate-100/70 transition-colors"
    >
      <div
        className={`w-9 h-9 min-w-[36px] rounded-xl flex items-center justify-center text-base ${iconBg} shadow-clay-sm flex-shrink-0`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-sm leading-snug">{label}</p>
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      <div
        className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex-shrink-0 ${
          value ? 'bg-sky-500 shadow-inner' : 'bg-slate-200'
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
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
    <div className="min-h-screen pb-14 bg-[#FBF3EA] relative">
      <PageHeader title="⚙️ การตั้งค่า" backTo="/" />

      <main className="max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-4 pt-5 space-y-4">
        {/* Section 1: เสียงและการสั่น */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
            เสียงและการสั่น
          </p>
          <div className="bg-[#FFFCF7] rounded-3xl border border-stone-200/80 shadow-clay overflow-hidden divide-y divide-stone-100">
            <ToggleRow
              icon="🔊"
              iconBg="bg-sky-50 text-sky-600"
              label="เสียงเอฟเฟกต์"
              description="เสียงแตะปุ่ม ตอบถูก-ผิด และเสียงฉลองผ่านด่าน"
              value={s.soundEnabled}
              onToggle={s.toggleSound}
            />
            <ToggleRow
              icon="🎵"
              iconBg="bg-indigo-50 text-indigo-600"
              label="เพลงประกอบ"
              description="ดนตรีบรรเลงสืบสวนเบาๆ สังเคราะห์ในเครื่อง ไม่ใช้อินเทอร์เน็ต"
              value={s.musicEnabled}
              onToggle={() => {
                const next = !s.musicEnabled;
                s.toggleMusic();
                if (next) startBgm();
                else stopBgm();
              }}
            />
            <ToggleRow
              icon="📳"
              iconBg="bg-amber-50 text-amber-600"
              label="ระบบสั่นตอบสนอง"
              description="สั่นเบาๆ เมื่อเลือกคำตอบหรือได้รับรางวัล"
              value={s.vibrationEnabled}
              onToggle={s.toggleVibration}
            />
          </div>
        </div>

        {/* Section 2: การแสดงผลและการเข้าถึง */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
            การแสดงผลและการเข้าถึง
          </p>
          <div className="bg-[#FFFCF7] rounded-3xl border border-stone-200/80 shadow-clay overflow-hidden divide-y divide-stone-100">
            {/* ขนาดตัวอักษร */}
            <div className="p-4">
              <div className="flex items-center gap-3.5 mb-3">
                <div className="w-9 h-9 min-w-[36px] rounded-xl flex items-center justify-center text-sm font-bold bg-teal-50 text-teal-700 shadow-clay-sm flex-shrink-0">
                  Aa
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm leading-snug">ขนาดตัวอักษร</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    ปรับขนาดข้อความในเกมให้อ่านสบายตา
                  </p>
                </div>
              </div>

              {/* Segmented control */}
              <div className="bg-slate-100/90 p-1 rounded-2xl grid grid-cols-3 gap-1">
                {(['sm', 'md', 'lg'] as const).map((size) => {
                  const active = s.fontSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        s.setFontSize(size);
                      }}
                      className={`py-2 rounded-xl text-center transition-all ${
                        active
                          ? 'bg-white text-sky-700 font-extrabold shadow-clay-sm'
                          : 'text-slate-600 font-medium hover:text-slate-900'
                      }`}
                    >
                      <span
                        className={`block font-bold ${
                          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
                        }`}
                      >
                        Aa
                      </span>
                      <span className="text-[10px] opacity-80">
                        {size === 'sm' ? 'เล็ก' : size === 'md' ? 'ปกติ' : 'ใหญ่'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ลดการเคลื่อนไหว */}
            <ToggleRow
              icon="🎬"
              iconBg="bg-purple-50 text-purple-600"
              label="ลดการเคลื่อนไหว"
              description="ปิดเอฟเฟกต์เคลื่อนไหวและกระดาษโปรย สำหรับผู้ที่เวียนหัวง่าย"
              value={s.reducedMotion}
              onToggle={s.toggleReducedMotion}
            />
          </div>
        </div>

        {/* Section 3: สำหรับครู / อาจารย์ */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
            สำหรับครู / อาจารย์
          </p>
          <div className="bg-[#FFFCF7] rounded-3xl border border-stone-200/80 shadow-clay overflow-hidden">
            <button
              type="button"
              onClick={() => {
                sfx.click();
                if (admin.isTeacherAuthenticated) {
                  nav('/teacher-admin');
                } else {
                  setShowAdminModal(true);
                }
              }}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-slate-50/80 active:bg-slate-100/70 transition-colors"
            >
              <div className="w-9 h-9 min-w-[36px] rounded-xl bg-sky-50 text-sky-700 shadow-clay-sm flex items-center justify-center text-base flex-shrink-0">
                👨‍🏫
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800 text-sm leading-snug">
                    แดชบอร์ดอาจารย์
                  </p>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {admin.isTeacherAuthenticated ? 'เข้าสู่ระบบแล้ว' : 'มีรหัสผ่าน'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  ดูคะแนนนักเรียน รายงานสถิติ และส่งออก Excel
                </p>
              </div>
              <span className="text-slate-400 text-sm font-bold flex-shrink-0">→</span>
            </button>
          </div>
        </div>

        {/* Section 4: เกี่ยวกับแอปพลิเคชัน & กองทุนสนับสนุน */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1 mb-2">
            เกี่ยวกับแอปพลิเคชัน
          </p>
          <div className="bg-[#FFFCF7] rounded-3xl border border-stone-200/80 shadow-clay p-4 space-y-3">
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-medium">เวอร์ชันระบบ</span>
                <span className="font-mono font-bold text-sky-700 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-lg">
                  v{APP_VERSION} (Research Edition)
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">เนื้อหาบทเรียน</span>
                <span className="font-bold text-slate-800">
                  {SCENARIO_META.length} ด่าน (บทหลัก 8 + เสริม 4)
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-t border-slate-100">
                <span className="text-slate-500 font-medium">มินิเกมฝึกทักษะ</span>
                <span className="font-bold text-slate-800">16 รูปแบบการเรียนรู้</span>
              </div>
            </div>

            {/* TMF Funding Credit */}
            <div className="pt-3.5 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500">
                โครงการ <strong className="text-slate-800 font-bold">"SayNo: สู้บุหรี่ไฟฟ้า"</strong> ได้รับทุนสนับสนุนจาก
              </p>
              <p className="font-display font-extrabold text-sky-700 text-sm mt-0.5">
                กองทุนพัฒนาสื่อปลอดภัยและสร้างสรรค์
              </p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Thai Media Fund
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Admin Passcode Modal */}
      {showAdminModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowAdminModal(false)}
        >
          <div
            className="bg-[#FFFCF7] rounded-[28px] p-6 max-w-sm w-full shadow-2xl border border-stone-200/80 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl shadow-clay-sm">
                🔒
              </div>
              <h3 className="font-display font-extrabold text-slate-900 text-base">
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
                placeholder="ใส่รหัสผ่านอาจารย์"
                className={`w-full px-4 py-2.5 rounded-2xl border text-center font-bold tracking-widest text-sm focus:outline-none focus:ring-2 bg-white transition-all ${
                  passError
                    ? 'border-rose-400 focus:ring-rose-200 text-rose-600'
                    : 'border-slate-200 focus:ring-sky-300 text-slate-800'
                }`}
                autoFocus
              />
              {passError && (
                <p className="text-[11px] font-bold text-rose-500 text-center animate-shake">
                  ❌ รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
                </p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-clay-blue transition-all active:scale-95"
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
