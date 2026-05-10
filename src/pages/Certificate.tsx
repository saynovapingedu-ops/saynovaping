import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
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
    const verifyUrl = `${location.origin}/health-detective/verify?code=${verifyCode}`;
    QRCode.toDataURL(verifyUrl, { width: 220, margin: 1, color: { dark: '#534AB7', light: '#FFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => { /* ignore */ });
  }, [verifyCode]);

  const eligible = player.stagesCompleted.length >= 8 || player.totalXP >= 1500;

  const verifyUrl = verifyCode ? `${location.origin}/health-detective/verify?code=${verifyCode}` : '';

  const handleSave = () => {
    sfx.click();
    // ใช้ window.print() — เบราว์เซอร์มือถือจะมี "บันทึกเป็น PDF" ในเมนูพิมพ์
    window.print();
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
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
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
              className="relative rounded-3xl overflow-hidden shadow-2xl
                         bg-gradient-to-br from-white via-detective-50 to-warning-50"
            >
              {/* corner ribbons */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-warning-400/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-12 -right-12 w-44 h-44 bg-detective-400/30 rounded-full blur-2xl" />
              {/* decorative diagonal stripes */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                   style={{
                     backgroundImage:
                       'repeating-linear-gradient(45deg, #6F2D8E 0 2px, transparent 2px 16px)',
                   }} />

              {/* outer gold border + inner purple border */}
              <div className="relative m-2 rounded-[1.4rem] border-[3px] border-warning-400 p-1">
                <div className="rounded-[1.1rem] border-2 border-detective-400/40 bg-white/85 backdrop-blur-sm
                                p-6 relative overflow-hidden">
                  {/* large watermark trophy */}
                  <div className="absolute -right-6 -top-6 text-[9rem] leading-none text-detective-100 select-none">
                    🏆
                  </div>

                  <div className="relative text-center">
                    {/* top crest */}
                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-warning-400 to-warning-500
                                    text-white text-[10px] font-bold uppercase tracking-[0.2em]
                                    rounded-full px-3 py-1 shadow-glow-gold">
                      ✦ Health Detective ✦
                    </div>
                    <h1 className="font-display font-bold text-3xl text-detective-700 mt-3 leading-tight">
                      เกียรติบัตร
                    </h1>
                    <p className="text-detective-500 text-xs uppercase tracking-widest font-semibold">
                      Certificate of Completion
                    </p>

                    {/* divider with sparkle */}
                    <div className="flex items-center justify-center gap-2 my-3">
                      <span className="h-px bg-gradient-to-r from-transparent via-warning-400 to-warning-400 flex-1" />
                      <span className="text-warning-500 text-sm">✦</span>
                      <span className="h-px bg-gradient-to-l from-transparent via-warning-400 to-warning-400 flex-1" />
                    </div>

                    <p className="text-gray-500 text-sm">มอบให้แก่</p>
                    <h2 className="font-display text-3xl font-bold my-2
                                   bg-gradient-to-r from-detective-600 to-detective-500
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

                    {/* stat strip */}
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="bg-white/80 border border-detective-100 rounded-xl py-2">
                        <p className="text-[10px] text-gray-500">ด่านที่ผ่าน</p>
                        <p className="font-bold text-detective-700">{player.stagesCompleted.length}</p>
                      </div>
                      <div className="bg-white/80 border border-warning-200 rounded-xl py-2">
                        <p className="text-[10px] text-gray-500">XP</p>
                        <p className="font-bold text-warning-600">{player.totalXP}</p>
                      </div>
                      <div className="bg-white/80 border border-detective-100 rounded-xl py-2">
                        <p className="text-[10px] text-gray-500">Badges</p>
                        <p className="font-bold text-detective-700">{player.badges.length}</p>
                      </div>
                    </div>

                    {/* QR + cert number row */}
                    <div className="flex items-center gap-3 mt-5 text-left">
                      {qrDataUrl && (
                        <div className="flex-shrink-0 bg-white rounded-xl p-1.5 border border-detective-100 shadow-sm">
                          <img src={qrDataUrl} alt="Verify QR" className="w-20 h-20" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 uppercase">เลขที่</p>
                        <p className="font-mono font-bold text-detective-700 text-sm truncate">{certNo}</p>
                        <p className="text-[10px] text-gray-400 uppercase mt-1">ออกเมื่อ</p>
                        <p className="font-semibold text-detective-700 text-xs">
                          {issueDate && new Date(issueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        {verifyCode && (
                          <p className="text-[10px] font-mono text-detective-500 mt-1 truncate">
                            ✓ {verifyCode}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* signature bottom strip */}
                    <div className="mt-5 pt-3 border-t border-dashed border-detective-200/60">
                      <p className="text-[10px] text-gray-500">รับรองโดย</p>
                      <p className="font-display font-bold text-detective-700 text-sm">
                        Walailak University
                      </p>
                      <p className="text-[10px] text-gray-500">โครงการ Health Detective</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* === Action buttons === */}
            <div className="mt-5 grid grid-cols-2 gap-2 print:hidden">
              <button
                onClick={handleSave}
                className="bg-gradient-to-br from-warning-400 to-warning-500 text-white font-bold
                           rounded-xl py-3 shadow-glow-gold active:scale-95 transition-all
                           flex items-center justify-center gap-1.5"
              >
                💾 บันทึก
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
              💡 กด "บันทึก" จะเปิดเมนูพิมพ์ของเบราว์เซอร์ → เลือก "บันทึกเป็น PDF" ได้
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
