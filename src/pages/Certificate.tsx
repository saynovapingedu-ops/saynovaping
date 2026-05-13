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

  useEffect(() => {
    const eligible = player.stagesCompleted.length >= 8 || player.totalXP >= 1500;
    if (!eligible) return;
    if (player.certificateNo) {
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

  useEffect(() => {
    if (!verifyCode) return;
    const verifyUrl = `${location.origin}/saynovaping/verify?code=${verifyCode}`;
    QRCode.toDataURL(verifyUrl, { width: 220, margin: 1, color: { dark: '#8B5CF6', light: '#FFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => { /* ignore */ });
  }, [verifyCode]);

  const eligible = player.stagesCompleted.length >= 8 || player.totalXP >= 1500;
  const verifyUrl = verifyCode ? `${location.origin}/saynovaping/verify?code=${verifyCode}` : '';

  const [saving, setSaving] = useState(false);

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
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
      });
      const safeName = (player.nickname || 'health-detective').replace(/[^\w฀-๿-]/g, '_');
      const filename = `Certificate-${safeName}-${certNo || 'cert'}.png`;

      if (navigator.share && navigator.canShare) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], filename, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Certificate — นักสืบสุขภาพ',
              text: `${player.nickname} ผ่านภารกิจสู้บุหรี่ไฟฟ้า ครบ ${player.stagesCompleted.length} ด่าน! 🏆✨`,
            });
            setSaving(false);
            return;
          }
        } catch {
          /* user cancelled */
        }
      }

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
    const text = `${player.nickname} ผ่านภารกิจสู้บุหรี่ไฟฟ้า ครบ ${player.stagesCompleted.length} ด่าน! 🏆✨`;
    if (navigator.share && verifyUrl) {
      try {
        await navigator.share({
          title: 'Certificate — นักสืบสุขภาพ',
          text,
          url: verifyUrl,
        });
        return;
      } catch {
        return;
      }
    }
    if (verifyUrl && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${verifyUrl}`);
      setShareMsg('📋 ก๊อปลิงก์แล้ว — แชร์ไปที่ไลน์/เฟซได้เลย');
      setTimeout(() => setShareMsg(null), 2400);
    }
  };

  if (!eligible) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4 animate-float">🔒</div>
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
          className="text-detective-500 px-3 py-1.5 rounded-xl hover:bg-detective-50 active:scale-95"
        >←</button>
        <h2 className="font-display font-bold text-detective-700">🏆 เกียรติบัตรของฉัน</h2>
      </header>

      <main className="max-w-md mx-auto p-4">
        {loading && (
          <div className="card text-center py-12">
            <div className="text-5xl mb-3 animate-pulse">🏆</div>
            <p className="text-gray-600">กำลังออก Certificate น่ารักๆ ...</p>
          </div>
        )}

        {error && (
          <div className="card border-2 border-danger-400 text-center">
            <p className="text-danger-500 font-semibold mb-2">เกิดข้อผิดพลาด</p>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <button onClick={() => location.reload()} className="btn-primary">ลองใหม่</button>
          </div>
        )}

        {certNo && !loading && !error && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            {/* === Cert artwork — แบบน่ารัก สดใส === */}
            <div
              id="cert-card"
              className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-white"
            >
              {/* === ฉากหลัง — gradient พาสเทล + ดอกไม้/หัวใจกระจาย === */}
              <div className="absolute inset-0 bg-gradient-to-br from-candy-50 via-warning-50 to-mint-50 pointer-events-none" />
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-candy-200/60 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-warning-200/60 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-mint-200/60 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-detective-200/60 rounded-full blur-3xl pointer-events-none" />

              {/* sticker decorations กระจายไปทั่ว */}
              <div className="absolute top-4  left-3   text-2xl opacity-80 select-none">⭐</div>
              <div className="absolute top-6  right-4  text-2xl opacity-80 select-none">🌟</div>
              <div className="absolute top-1/3 left-4   text-xl opacity-70 select-none">💖</div>
              <div className="absolute top-1/3 right-3  text-xl opacity-70 select-none">🎀</div>
              <div className="absolute bottom-1/3 left-3 text-xl opacity-70 select-none">🌈</div>
              <div className="absolute bottom-1/3 right-3 text-xl opacity-70 select-none">✨</div>
              <div className="absolute bottom-6 left-5  text-2xl opacity-80 select-none">🦋</div>
              <div className="absolute bottom-4 right-5 text-2xl opacity-80 select-none">🍭</div>

              {/* === กรอบหลัก — เส้นประน่ารัก === */}
              <div className="relative m-3 rounded-[1.75rem] p-[3px]
                              bg-gradient-to-br from-candy-400 via-warning-400 to-mint-400 shadow-inner">
                <div className="rounded-[1.6rem] p-[3px] bg-white">
                  <div className="rounded-[1.4rem] bg-white/90 backdrop-blur-sm p-6 relative overflow-hidden
                                  border-4 border-dashed border-detective-200/60">

                    {/* corner stickers */}
                    <div className="absolute top-1 left-2  text-3xl">🌸</div>
                    <div className="absolute top-1 right-2 text-3xl">🌟</div>
                    <div className="absolute bottom-1 left-2  text-3xl">🌈</div>
                    <div className="absolute bottom-1 right-2 text-3xl">💫</div>

                    <div className="relative text-center">
                      {/* === Top badge === */}
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="text-7xl mb-2 inline-block"
                      >
                        🏆
                      </motion.div>

                      <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-candy-400 to-warning-400
                                      text-white text-[11px] font-bold uppercase tracking-[0.2em]
                                      rounded-full px-3 py-1 shadow-glow-pink">
                        🎉 Health Detective 🎉
                      </div>

                      <h1 className="font-display font-extrabold text-3xl mt-3 leading-tight
                                     bg-gradient-to-r from-candy-500 via-detective-500 to-warning-500
                                     bg-clip-text text-transparent">
                        เกียรติบัตรน่ารัก
                      </h1>
                      <p className="text-detective-500 text-[11px] uppercase tracking-[0.2em] font-bold">
                        ✨ Certificate of Awesomeness ✨
                      </p>

                      <div className="flex items-center justify-center gap-2 my-4">
                        <span className="text-2xl">🌈</span>
                        <span className="h-1 bg-gradient-to-r from-candy-400 via-warning-400 to-mint-400 flex-1 rounded-full" />
                        <span className="text-2xl">💖</span>
                        <span className="h-1 bg-gradient-to-r from-mint-400 via-detective-400 to-candy-400 flex-1 rounded-full" />
                        <span className="text-2xl">⭐</span>
                      </div>

                      <p className="text-gray-600 text-sm font-medium">มอบให้กับ</p>
                      <h2 className="font-display text-[2.2rem] font-extrabold my-2 leading-tight
                                     bg-gradient-to-r from-detective-600 via-candy-500 to-warning-500
                                     bg-clip-text text-transparent">
                        {player.nickname} 💫
                      </h2>

                      <div className="bg-white/80 rounded-2xl border-2 border-dashed border-candy-300 p-3 mt-3">
                        <p className="text-gray-700 text-sm leading-relaxed">
                          👍 ผ่านภารกิจสุดเจ๋ง<br/>
                          <b className="text-detective-600">"นักสืบสู้บุหรี่ไฟฟ้า"</b><br/>
                          อย่างยอดเยี่ยม! 🎊
                        </p>
                      </div>

                      {/* === stat strip — น่ารักๆ === */}
                      <div className="grid grid-cols-3 gap-2 mt-5">
                        <StatCell label="ด่าน" emoji="🎯" value={player.stagesCompleted.length} color="detective" />
                        <StatCell label="XP" emoji="⚡" value={player.totalXP} color="warning" featured />
                        <StatCell label="Badge" emoji="🏅" value={player.badges.length} color="candy" />
                      </div>

                      {/* === QR + Info === */}
                      <div className="flex items-stretch gap-3 mt-5 text-left">
                        {qrDataUrl && (
                          <div className="flex-shrink-0 bg-white rounded-2xl p-2 border-2 border-mint-300 shadow-glow-mint">
                            <img src={qrDataUrl} alt="Verify QR" className="w-20 h-20" />
                            <p className="text-[8px] text-mint-600 mt-1 text-center font-bold uppercase tracking-wider">
                              📱 สแกนเช็ค
                            </p>
                          </div>
                        )}
                        <div className="flex-1 min-w-0 flex flex-col justify-between bg-white/70 rounded-2xl p-2.5 border border-detective-100">
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">🎫 เลขที่</p>
                            <p className="font-mono font-bold text-detective-700 text-sm truncate">{certNo}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-1">📅 ออกเมื่อ</p>
                            <p className="font-semibold text-detective-700 text-xs">
                              {issueDate && new Date(issueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          {verifyCode && (
                            <div className="bg-gradient-to-r from-candy-100 to-warning-100 rounded-md px-2 py-0.5 mt-1 inline-block self-start">
                              <p className="text-[10px] font-mono text-candy-600 truncate">✓ {verifyCode}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* === Signature === */}
                      <div className="mt-5 pt-3 border-t-2 border-dotted border-candy-300/70">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-left">
                            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">รับรองโดย 💝</p>
                            <p className="font-display font-bold text-detective-700 text-sm leading-tight">
                              🎓 Walailak University
                            </p>
                            <p className="text-[10px] text-gray-500">SayNo:สู้บุหรี่ไฟฟ้า</p>
                          </div>
                          <CuteSeal />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* === Buttons === */}
            <div className="mt-5 grid grid-cols-2 gap-2 print:hidden">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-br from-warning-400 to-candy-500 text-white font-bold
                           rounded-2xl py-3 shadow-glow-gold active:scale-95 transition-all
                           disabled:opacity-60 disabled:cursor-wait
                           flex items-center justify-center gap-1.5"
              >
                {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกรูป'}
              </button>
              <button
                onClick={handleShare}
                className="bg-gradient-to-br from-mint-500 to-detective-500 text-white font-bold
                           rounded-2xl py-3 shadow-glow active:scale-95 transition-all
                           flex items-center justify-center gap-1.5"
              >
                📤 แชร์ให้เพื่อน
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
                    setShareMsg('📋 ก๊อปรหัสแล้ว');
                    setTimeout(() => setShareMsg(null), 2000);
                  }}
                  className="btn-secondary w-full text-sm py-2"
                >
                  📋 ก๊อปรหัส
                </button>
              )}
            </div>

            <p className="text-[11px] text-center text-gray-400 mt-4 print:hidden">
              💡 มือถือ: เลือกแชร์ไป Photos / LINE / IG / TikTok ได้เลย
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// ===== สวยๆ น่ารักๆ =====

function StatCell({
  label, emoji, value, color, featured = false,
}: {
  label: string;
  emoji: string;
  value: number;
  color: 'detective' | 'warning' | 'candy';
  featured?: boolean;
}) {
  const cls =
    color === 'warning'   ? 'border-warning-300 bg-gradient-to-b from-warning-50 to-white' :
    color === 'candy'     ? 'border-candy-300   bg-gradient-to-b from-candy-50   to-white' :
                            'border-detective-300 bg-gradient-to-b from-detective-50 to-white';
  const valCls =
    color === 'warning'   ? 'text-warning-600' :
    color === 'candy'     ? 'text-candy-600' :
                            'text-detective-700';
  return (
    <div className={`rounded-2xl border-2 ${cls} ${featured ? 'shadow-glow-sm scale-105' : ''} py-2 px-1`}>
      <p className="text-[14px] leading-none">{emoji}</p>
      <p className={`font-display font-extrabold text-lg ${valCls} leading-none mt-0.5`}>{value}</p>
      <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">{label}</p>
    </div>
  );
}

function CuteSeal() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden className="opacity-95">
      <defs>
        <linearGradient id="seal-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor="#EC4899" />
          <stop offset="50%"  stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      {/* ring น่ารัก wavy */}
      <circle cx="30" cy="30" r="26" fill="url(#seal-grad)" />
      <circle cx="30" cy="30" r="22" fill="#FFF" />
      <circle cx="30" cy="30" r="20" fill="none" stroke="#8B5CF6" strokeWidth="1.2" strokeDasharray="3 3" />
      {/* heart shape */}
      <path
        d="M30 42 C 18 34, 14 24, 22 20 C 26 18, 28 22, 30 25 C 32 22, 34 18, 38 20 C 46 24, 42 34, 30 42 Z"
        fill="#EC4899"
        opacity="0.85"
      />
      <text x="30" y="32" textAnchor="middle" fontSize="10" fontWeight="900" fill="#FFFFFF">
        WU
      </text>
    </svg>
  );
}
