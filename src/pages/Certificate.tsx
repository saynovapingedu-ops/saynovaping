import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { usePlayerStore } from '../store/playerStore';
import { issueCertificate } from '../lib/cloudSync';
import { sfx } from '../lib/sound';

export default function Certificate() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const setCertificate = usePlayerStore(s => s.setCertificate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certNo, setCertNo] = useState(player.certificateNo || '');
  const [verifyCode, setVerifyCode] = useState('');
  const [issueDate, setIssueDate] = useState(player.certificateIssuedAt || '');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // ออก cert (ถ้ายังไม่มี)
  useEffect(() => {
    const eligible = player.stagesCompleted.length >= 8 || player.totalXP >= 1500;
    if (!eligible) return;
    if (player.certificateNo) {
      // มีอยู่แล้ว ใช้ของเดิม — แต่ต้องเรียก backend เพื่อขอ verifyCode
      (async () => {
        const res = await issueCertificate(player.userIdHash);
        if (res.ok && res.certificateNo && res.verifyCode) {
          setCertNo(res.certificateNo);
          setVerifyCode(res.verifyCode);
          setIssueDate(res.issueDate || player.certificateIssuedAt || '');
        }
      })();
      return;
    }
    setLoading(true);
    issueCertificate(player.userIdHash).then(res => {
      setLoading(false);
      if (res.ok && res.certificateNo && res.verifyCode) {
        setCertNo(res.certificateNo);
        setVerifyCode(res.verifyCode);
        setIssueDate(res.issueDate || new Date().toISOString());
        setCertificate(res.certificateNo, res.issueDate || new Date().toISOString());
      } else {
        setError(res.message || res.error || 'ไม่สามารถออก certificate ได้');
      }
    });
  }, [player.userIdHash, player.certificateNo, player.stagesCompleted.length, player.totalXP, setCertificate, player.certificateIssuedAt]);

  // สร้าง QR code
  useEffect(() => {
    if (!verifyCode) return;
    const verifyUrl = `${location.origin}/saynovaping/verify?code=${verifyCode}`;
    QRCode.toDataURL(verifyUrl, { width: 220, margin: 1, color: { dark: '#534AB7', light: '#FFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => { /* ignore */ });
  }, [verifyCode]);

  const eligible = player.stagesCompleted.length >= 8 || player.totalXP >= 1500;

  const verifyUrl = verifyCode ? `${location.origin}/saynovaping/verify?code=${verifyCode}` : '';

  const [saving, setSaving] = useState(false);

  // ดึงไฟล์ PNG จาก data URL
  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSave = async () => {
    sfx.click();
    const node = document.getElementById('cert-card');
    if (!node) return;
    setSaving(true);
    try {
      // render การ์ด cert เป็นรูป PNG ความละเอียดสูง (pixelRatio 2 = retina)
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      const safeName = (player.nickname || 'health-detective').replace(/[^\w฀-๿-]/g, '_');
      const filename = `Certificate-${safeName}-${certNo || 'cert'}.png`;

      // มือถือ: ใช้ Web Share API ถ้ามี (แชร์ไป Photos / LINE / IG ได้)
      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Certificate — Health Detective',
              text: `${player.nickname} ผ่านภารกิจ Health Detective ครบ ${player.stagesCompleted.length} ด่าน 🏆`,
            });
            setSaving(false);
            return;
          }
        } catch {
          // user cancelled หรือ share ไม่รองรับ → fallback ดาวน์โหลด
        }
      }

      // desktop / fallback: ดาวน์โหลดเป็นไฟล์ PNG
      downloadDataUrl(dataUrl, filename);
      setShareMsg('💾 บันทึกรูปเรียบร้อย — ตรวจในโฟลเดอร์ดาวน์โหลด');
      setTimeout(() => setShareMsg(null), 2400);
    } catch (err) {
      console.error('save certificate failed', err);
      setShareMsg('❌ บันทึกไม่สำเร็จ ลองอีกครั้ง');
      setTimeout(() => setShareMsg(null), 2400);
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    sfx.click();
    const text = `${player.nickname} ผ่านภารกิจ Health Detective ครบ ${player.stagesCompleted.length} ด่าน รวม ${player.totalXP} XP! 🏆`;
    if (navigator.share && verifyUrl) {
      try {
        await navigator.share({
          title: 'Certificate — Health Detective',
          text,
          url: verifyUrl,
        });
        return;
      } catch {
        /* user cancelled — ไม่ต้อง fallback */
        return;
      }
    }
    // fallback: ก๊อปลิงก์
    if (verifyUrl && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${verifyUrl}`);
      setShareMsg('📋 ก๊อปลิงก์แล้ว — แชร์ไปที่ไลน์/เฟซได้เลย');
      setTimeout(() => setShareMsg(null), 2400);
    }
  };

  if (!eligible) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-xl font-display font-bold text-detective-700 mb-2">ยังไม่ถึงเกณฑ์</h2>
        <p className="text-gray-600 mb-6">
          ต้องจบครบ 8 ด่าน หรือเก็บ XP ครบ 1,500
          <br/>(ตอนนี้ {player.stagesCompleted.length}/8 ด่าน, {player.totalXP} XP)
        </p>
        <button onClick={() => nav('/')} className="btn-primary">กลับไปเล่นต่อ</button>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-8">
      <header className="sticky top-0 bg-white/85 backdrop-blur-md shadow-sm border-b border-detective-100/50
                         p-3 flex items-center gap-3 z-10 print:hidden">
        <button
          onClick={() => nav('/')}
          className="text-detective-500 px-3 py-1.5 rounded-lg hover:bg-detective-50 active:scale-95"
        >←</button>
        <h2 className="font-display font-bold text-detective-700">เกียรติบัตรของฉัน</h2>
      </header>

      <main className="max-w-md mx-auto p-4">
        {loading && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-3 animate-pulse">🏆</div>
            <p className="text-gray-600">กำลังออก Certificate...</p>
          </div>
        )}

        {error && (
          <div className="card border-2 border-danger-500 text-center">
            <p className="text-danger-500 font-semibold mb-2">เกิดข้อผิดพลาด</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button onClick={() => location.reload()} className="btn-primary">ลองใหม่</button>
          </div>
        )}

        {certNo && !loading && !error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            {/* === Certificate artwork === */}
            <div
              id="cert-card"
              className="relative rounded-3xl overflow-hidden shadow-2xl bg-white"
            >
              {/* === Background decorations === */}
              {/* gold corner glows */}
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-warning-400/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-detective-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-detective-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-warning-400/25 rounded-full blur-3xl pointer-events-none" />
              {/* subtle dot pattern */}
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                   style={{
                     backgroundImage:
                       'radial-gradient(circle, #6F2D8E 1px, transparent 1px)',
                     backgroundSize: '18px 18px',
                   }} />

              {/* === Triple-layered border (gold > purple > inner) === */}
              <div className="relative m-2.5 rounded-[1.5rem] p-[3px] bg-gradient-to-br from-warning-400 via-warning-500 to-warning-400 shadow-inner">
                <div className="rounded-[1.3rem] p-[2px] bg-gradient-to-br from-detective-400/70 via-detective-300/40 to-detective-400/70">
                  <div className="rounded-[1.15rem] bg-white p-6 relative overflow-hidden">

                    {/* corner ornaments — SVG flourishes ที่มุม */}
                    <CornerFlourish className="absolute top-2 left-2 text-warning-500" />
                    <CornerFlourish className="absolute top-2 right-2 text-warning-500 -scale-x-100" />
                    <CornerFlourish className="absolute bottom-2 left-2 text-warning-500 -scale-y-100" />
                    <CornerFlourish className="absolute bottom-2 right-2 text-warning-500 -scale-x-100 -scale-y-100" />

                    <div className="relative text-center">
                      {/* === Top medallion — SVG laurel + star === */}
                      <div className="flex justify-center mb-2">
                        <Medallion />
                      </div>

                      {/* top tag */}
                      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-warning-400 to-warning-500
                                      text-white text-[10px] font-bold uppercase tracking-[0.25em]
                                      rounded-full px-3 py-1 shadow-glow-gold">
                        Health Detective
                      </div>

                      <h1 className="font-display font-bold text-3xl text-detective-700 mt-3 leading-tight">
                        เกียรติบัตร
                      </h1>
                      <p className="text-detective-500 text-[11px] uppercase tracking-[0.2em] font-semibold">
                        Certificate of Completion
                      </p>

                      {/* divider — แบบ scrollwork */}
                      <FancyDivider className="my-4" />

                      <p className="text-gray-500 text-sm font-medium">มอบให้แก่</p>
                      <h2 className="font-display text-[2rem] font-bold my-2 leading-tight
                                     bg-gradient-to-r from-detective-700 via-detective-500 to-detective-700
                                     bg-clip-text text-transparent">
                        {player.nickname}
                      </h2>
                      {player.school && (
                        <p className="text-gray-500 text-sm">{player.grade} • {player.school}</p>
                      )}

                      <p className="text-gray-700 text-sm mt-4 leading-relaxed">
                        ได้ผ่านการเรียนรู้ทักษะปฏิเสธบุหรี่ไฟฟ้า<br/>
                        และภัยจากนิโคติน ครบทุกด่าน
                      </p>

                      {/* === Stat strip === */}
                      <div className="grid grid-cols-3 gap-2 mt-5">
                        <StatCell label="ด่านที่ผ่าน" value={player.stagesCompleted.length} accent="detective" />
                        <StatCell label="XP" value={player.totalXP} accent="warning" featured />
                        <StatCell label="Badges" value={player.badges.length} accent="detective" />
                      </div>

                      {/* === QR + Cert info === */}
                      <div className="flex items-stretch gap-3 mt-5 text-left">
                        {qrDataUrl && (
                          <div className="flex-shrink-0 bg-white rounded-xl p-2 border-2 border-detective-200 shadow-sm">
                            <img src={qrDataUrl} alt="Verify QR" className="w-20 h-20" />
                            <p className="text-[8px] text-gray-400 mt-1 text-center font-semibold uppercase tracking-wider">
                              Scan to verify
                            </p>
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">เลขที่</p>
                            <p className="font-mono font-bold text-detective-700 text-sm truncate">{certNo}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mt-1">ออกเมื่อ</p>
                            <p className="font-semibold text-detective-700 text-xs">
                              {issueDate && new Date(issueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          {verifyCode && (
                            <div className="bg-detective-50 rounded-md px-2 py-0.5 mt-1 inline-block self-start">
                              <p className="text-[10px] font-mono text-detective-600 truncate">✓ {verifyCode}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* === Signature footer === */}
                      <div className="mt-5 pt-3 border-t-2 border-dotted border-detective-200/70">
                        <div className="flex items-end justify-between gap-2">
                          <div className="text-left">
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold">รับรองโดย</p>
                            <p className="font-display font-bold text-detective-700 text-sm leading-tight">
                              Walailak University
                            </p>
                            <p className="text-[10px] text-gray-500">SayNo:สู้บุหรี่ไฟฟ้า</p>
                          </div>
                          {/* WU monogram seal */}
                          <SealStamp />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* === Action buttons === */}
            <div className="mt-5 grid grid-cols-2 gap-2 print:hidden">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-br from-warning-400 to-warning-500 text-white font-bold
                           rounded-xl py-3 shadow-glow-gold active:scale-95 transition-all
                           disabled:opacity-60 disabled:cursor-wait
                           flex items-center justify-center gap-1.5"
              >
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกเป็นรูป'}
              </button>
              <button
                onClick={handleShare}
                className="bg-gradient-to-br from-detective-500 to-detective-600 text-white font-bold
                           rounded-xl py-3 shadow-glow active:scale-95 transition-all
                           flex items-center justify-center gap-1.5"
              >
                📤 แชร์
              </button>
            </div>

            {shareMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 card text-center text-sm font-semibold bg-detective-50 text-detective-700 print:hidden"
              >
                {shareMsg}
              </motion.div>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2 print:hidden">
              <button
                onClick={() => nav('/')}
                className="btn-secondary w-full text-sm py-2"
              >
                ← หน้าแรก
              </button>
              {verifyCode && (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`รหัสยืนยัน Certificate: ${verifyCode}`);
                    setShareMsg('📋 ก๊อปรหัสยืนยันแล้ว');
                    setTimeout(() => setShareMsg(null), 2000);
                  }}
                  className="btn-secondary w-full text-sm py-2"
                >
                  📋 ก๊อปรหัส
                </button>
              )}
            </div>

            <p className="text-[11px] text-center text-gray-400 mt-4 print:hidden">
              💡 มือถือ: เลือกแอปที่จะแชร์/บันทึก (Photos, LINE, ฯลฯ) — คอม: ไฟล์ PNG จะถูกดาวน์โหลด
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// ===== Decorative sub-components =====

function CornerFlourish({ className = '' }: { className?: string }) {
  return (
    <svg
      width="36" height="36" viewBox="0 0 36 36" fill="none"
      className={className} aria-hidden
    >
      <path
        d="M2 2 H 14 M2 2 V 14 M2 2 Q 10 4, 14 14 M2 2 Q 4 10, 14 14"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"
        opacity="0.85"
      />
      <circle cx="14" cy="14" r="1.6" fill="currentColor" />
      <circle cx="6"  cy="6"  r="1"   fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function Medallion() {
  return (
    <svg width="68" height="68" viewBox="0 0 68 68" aria-hidden>
      {/* outer ring */}
      <circle cx="34" cy="34" r="28" fill="url(#mg-gold)" />
      <circle cx="34" cy="34" r="28" fill="none" stroke="#C49B00" strokeWidth="1.5" />
      {/* inner ring */}
      <circle cx="34" cy="34" r="22" fill="#FFF7E0" stroke="#E8B500" strokeWidth="1" />
      {/* star */}
      <path
        d="M34 18 L37.5 29 L49 29 L39.7 35.7 L43.2 46.7 L34 40 L24.8 46.7 L28.3 35.7 L19 29 L30.5 29 Z"
        fill="#6F2D8E"
      />
      {/* laurel left */}
      <path d="M10 34 Q 14 22, 22 18 M10 34 Q 14 46, 22 50"
            stroke="#5B2475" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85" />
      <ellipse cx="14" cy="26" rx="3" ry="1.6" fill="#5B2475" opacity="0.6" transform="rotate(-30 14 26)" />
      <ellipse cx="14" cy="42" rx="3" ry="1.6" fill="#5B2475" opacity="0.6" transform="rotate(30 14 42)" />
      {/* laurel right */}
      <path d="M58 34 Q 54 22, 46 18 M58 34 Q 54 46, 46 50"
            stroke="#5B2475" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.85" />
      <ellipse cx="54" cy="26" rx="3" ry="1.6" fill="#5B2475" opacity="0.6" transform="rotate(30 54 26)" />
      <ellipse cx="54" cy="42" rx="3" ry="1.6" fill="#5B2475" opacity="0.6" transform="rotate(-30 54 42)" />
      <defs>
        <linearGradient id="mg-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE7A6" />
          <stop offset="55%" stopColor="#FFC72C" />
          <stop offset="100%" stopColor="#C49B00" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FancyDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <span className="h-px bg-gradient-to-r from-transparent to-warning-400 flex-1" />
      <svg width="60" height="10" viewBox="0 0 60 10" aria-hidden>
        <path d="M0 5 H 24" stroke="#E8B500" strokeWidth="1" />
        <path d="M36 5 H 60" stroke="#E8B500" strokeWidth="1" />
        <path d="M30 1 L 32 5 L 30 9 L 28 5 Z" fill="#E8B500" />
        <circle cx="24" cy="5" r="1.5" fill="#E8B500" />
        <circle cx="36" cy="5" r="1.5" fill="#E8B500" />
      </svg>
      <span className="h-px bg-gradient-to-l from-transparent to-warning-400 flex-1" />
    </div>
  );
}

function StatCell({
  label, value, accent, featured = false,
}: {
  label: string;
  value: number;
  accent: 'detective' | 'warning';
  featured?: boolean;
}) {
  const cls = accent === 'warning'
    ? 'border-warning-300 bg-gradient-to-b from-warning-50 to-white'
    : 'border-detective-200 bg-gradient-to-b from-detective-50 to-white';
  const valCls = accent === 'warning' ? 'text-warning-600' : 'text-detective-700';
  return (
    <div className={`rounded-xl border-2 ${cls} ${featured ? 'shadow-glow-sm scale-105' : ''} py-2 px-1`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{label}</p>
      <p className={`font-display font-bold text-lg ${valCls} leading-none mt-0.5`}>{value}</p>
    </div>
  );
}

function SealStamp() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden className="opacity-90">
      {/* ring */}
      <circle cx="28" cy="28" r="24" fill="none" stroke="#6F2D8E" strokeWidth="1.5" />
      <circle cx="28" cy="28" r="20" fill="none" stroke="#6F2D8E" strokeWidth="0.8" strokeDasharray="2 2" />
      {/* WU monogram */}
      <text x="28" y="32" textAnchor="middle" fontSize="14" fontWeight="800" fill="#6F2D8E" fontFamily="serif">
        WU
      </text>
      {/* corner stars */}
      <path d="M28 4 L 29.2 6.2 L 31.5 6.5 L 29.8 8.3 L 30.2 11 L 28 9.7 L 25.8 11 L 26.2 8.3 L 24.5 6.5 L 26.8 6.2 Z" fill="#E8B500" />
    </svg>
  );
}
