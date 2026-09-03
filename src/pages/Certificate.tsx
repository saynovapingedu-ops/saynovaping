import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { motion } from 'framer-motion';
import { toPng } from 'html-to-image';
import { usePlayerStore } from '../store/playerStore';
import { useAdminStore } from '../store/adminStore';
import { issueCertificate } from '../lib/cloudSync';
import { sfx } from '../lib/sound';
import TMFLogo from '../components/TMFLogo';
import PageHeader from '../components/PageHeader';
import CertNameDialog from '../components/CertNameDialog';
import { SHOP_ITEMS } from '../lib/shopItems';
import { useCertNameStore } from '../store/certNameStore';
import SkeletonCard from '../components/ui/SkeletonCard';
import EmptyState from '../components/ui/EmptyState';
import Ribbon from '../components/ui/Ribbon';
import CertSeal from '../components/ui/CertSeal';
import { renderCertificateCanvas, saveCertificateImage, formatThaiDate } from '../lib/certRenderer';
import { shareCertificateViaLiff, openInExternalBrowser, isInLineBrowser } from '../lib/liff';

// ขนาดออกแบบคงที่ของใบ (A-ratio 1:1.414) — เรนเดอร์ที่ขนาดนี้เสมอแล้วย่อให้พอดีจอ
const CERT_W = 420;
const CERT_H = Math.round(CERT_W * 1.414); // 594

export default function Certificate() {
  const nav = useNavigate();
  const player = usePlayerStore();
  const admin = useAdminStore();
  const setCertificate = usePlayerStore(s => s.setCertificate);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certNo, setCertNo] = useState(player.certificateNo || '');
  const [verifyCode, setVerifyCode] = useState('');
  const [issueDate, setIssueDate] = useState(player.certificateIssuedAt || '');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // ชื่อจริงบนเกียรติบัตร (local-only) — ถ้าไม่ใส่ใช้ชื่อเล่น
  const realName = useCertNameStore(s => s.realName);
  const displayName = realName.trim() || player.nickname;
  const [editNameOpen, setEditNameOpen] = useState(false);
  const inLine = isInLineBrowser();
  const [certImgUrl, setCertImgUrl] = useState<string | null>(null);
  const [screenshotMode, setScreenshotMode] = useState(false);
  const [hideGuide, setHideGuide] = useState(false);

  // ย่อใบให้พอดีความกว้างจอ (กันเนื้อหาล้นกรอบบนจอแคบ)
  const wrapRef = useRef<HTMLDivElement>(null);
  const [certScale, setCertScale] = useState(1);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setCertScale(Math.min(1, el.clientWidth / CERT_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [certNo, loading, error]);

  useEffect(() => {
    const eligible = player.stagesCompleted.length >= 8 || player.totalXP >= 1500;
    if (!eligible) return;

    // 1. ถ้ามีข้อมูลครบในเครื่องแล้ว โหลดขึ้นมาแสดงทันที ไม่ต้องรอเน็ต
    if (player.certificateNo && player.certificateVerifyCode) {
      setCertNo(player.certificateNo);
      setVerifyCode(player.certificateVerifyCode);
      setIssueDate(player.certificateIssuedAt || new Date().toISOString());
      setLoading(false);
      return;
    }

    // 2. ถ้ายังไม่มี ให้ดึงจาก Cloud Sync หรือสร้าง Fallback ทันทีหากเน็ตช้า
    setLoading(true);
    issueCertificate(player.userIdHash)
      .then(res => {
        setLoading(false);
        if (res.ok && res.certificateNo && res.verifyCode) {
          const issued = res.issueDate || player.certificateIssuedAt || new Date().toISOString();
          setCertNo(res.certificateNo);
          setVerifyCode(res.verifyCode);
          setIssueDate(issued);
          setCertificate(res.certificateNo, issued, res.verifyCode);
        } else {
          // Fallback อัตโนมัติ: ไม่แสดงหน้าจอ Error ให้ผู้เรียนที่ผ่านเกณฑ์แล้ว
          const fallbackCertNo = player.certificateNo || `HD-${new Date().getFullYear() + 543}-${(player.userIdHash || 'ST').slice(0, 6).toUpperCase()}`;
          const fallbackCode = player.certificateVerifyCode || (player.userIdHash || Math.random().toString(36).slice(2, 10)).slice(0, 8).toUpperCase();
          const fallbackDate = player.certificateIssuedAt || new Date().toISOString();
          setCertNo(fallbackCertNo);
          setVerifyCode(fallbackCode);
          setIssueDate(fallbackDate);
          setCertificate(fallbackCertNo, fallbackDate, fallbackCode);
        }
      })
      .catch(() => {
        setLoading(false);
        const fallbackCertNo = player.certificateNo || `HD-${new Date().getFullYear() + 543}-${(player.userIdHash || 'ST').slice(0, 6).toUpperCase()}`;
        const fallbackCode = player.certificateVerifyCode || (player.userIdHash || Math.random().toString(36).slice(2, 10)).slice(0, 8).toUpperCase();
        const fallbackDate = player.certificateIssuedAt || new Date().toISOString();
        setCertNo(fallbackCertNo);
        setVerifyCode(fallbackCode);
        setIssueDate(fallbackDate);
        setCertificate(fallbackCertNo, fallbackDate, fallbackCode);
      });
  }, [
    player.userIdHash,
    player.certificateNo,
    player.certificateVerifyCode,
    player.stagesCompleted.length,
    player.totalXP,
    setCertificate,
    player.certificateIssuedAt,
  ]);

  useEffect(() => {
    if (!verifyCode) return;
    const verifyUrl = `${location.origin}/saynovaping/verify?code=${verifyCode}`;
    QRCode.toDataURL(verifyUrl, { width: 220, margin: 1, color: { dark: '#003C73', light: '#FFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => { /* ignore */ });
  }, [verifyCode]);

  const eligible = player.stagesCompleted.length >= 8 || player.totalXP >= 1500;
  const verifyUrl = verifyCode ? `${location.origin}/saynovaping/verify?code=${verifyCode}` : '';

  const [saving, setSaving] = useState(false);
  const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null);

  // เรนเดอร์ Canvas เพื่อใช้ทั้งในโหมดแคปหน้าจอและดาวน์โหลด
  const prepareCertCanvasUrl = async (): Promise<string> => {
    if (certImgUrl) return certImgUrl;
    const canvas = await renderCertificateCanvas({
      displayName,
      nickname: player.nickname,
      realName,
      certNo,
      issueDate,
      verifyUrl,
      cornerEmoji: certDeco?.corner,
    });
    const url = canvas.toDataURL('image/png');
    setCertImgUrl(url);
    return url;
  };

  const handleOpenScreenshot = async () => {
    sfx.click();
    setSaving(true);
    try {
      await prepareCertCanvasUrl();
      setHideGuide(false);
      setScreenshotMode(true);
    } catch (err) {
      console.warn('prepare screenshot image failed', err);
      try {
        const node = document.getElementById('cert-card');
        if (node) {
          const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' });
          setCertImgUrl(dataUrl);
        }
      } catch (e) {
        console.warn('dom fallback failed', e);
      }
      setScreenshotMode(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    sfx.click();
    setSaving(true);
    try {
      const cleanCertNo = (certNo || 'cert').replace(/[^A-Za-z0-9_-]/g, '');
      const filename = `Certificate-${cleanCertNo}.png`;

      // 1. เรนเดอร์ Canvas โดยตรง (แก้ปัญหา iOS Safari ทิ้งโลโก้ TMF 100%)
      const canvas = await renderCertificateCanvas({
        displayName,
        nickname: player.nickname,
        realName,
        certNo,
        issueDate,
        verifyUrl,
        cornerEmoji: certDeco?.corner,
      });

      const dataUrl = canvas.toDataURL('image/png');
      setCertImgUrl(dataUrl);

      // 2. บันทึกรูปภาพลงเครื่อง (รองรับทั้ง iOS Safari, Android Chrome และ Desktop)
      const res = await saveCertificateImage(
        canvas,
        filename,
        `${displayName} ผ่านการอบรม "นักสืบสู้บุหรี่ไฟฟ้า"`
      );

      // 3. แสดงภาพตัวอย่างใน Preview Modal เพื่อให้แตะค้างบันทึกได้ 100% บนทุกเบราว์เซอร์
      setPreviewImgUrl(res.dataUrl);

      if (res.method === 'download') {
        setShareMsg('กำลังดาวน์โหลดรูปภาพลงเครื่อง...');
      } else if (res.method === 'share') {
        setShareMsg('พร้อมบันทึกหรือแชร์รูปภาพแล้ว');
      } else {
        setShareMsg('แตะค้างที่รูปภาพเพื่อบันทึก');
      }
      setTimeout(() => setShareMsg(null), 3000);
    } catch (err) {
      console.error('save certificate failed, falling back to html-to-image', err);
      // Fallback: ถ้า Canvas ติดปัญหา ให้ลอง toPng จาก DOM
      try {
        const node = document.getElementById('cert-card');
        if (node) {
          const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' });
          setPreviewImgUrl(dataUrl);
          setCertImgUrl(dataUrl);
          setShareMsg('แตะค้างที่รูปภาพเพื่อบันทึก');
          setTimeout(() => setShareMsg(null), 3000);
        }
      } catch {
        setShareMsg('บันทึกไม่สำเร็จ ลองอีกครั้ง');
        setTimeout(() => setShareMsg(null), 2500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    sfx.click();
    const res = await shareCertificateViaLiff(displayName, certNo, verifyUrl);
    if (res.success) {
      if (res.method === 'liff') {
        setShareMsg('แชร์เกียรติบัตรเข้าแชต LINE สำเร็จ');
      } else if (res.method === 'share') {
        setShareMsg('แชร์เรียบร้อย');
      } else {
        setShareMsg('คัดลอกลิงก์ตรวจสอบแล้ว');
      }
    } else {
      setShareMsg('คัดลอกลิงก์ตรวจสอบแล้ว');
    }
    setTimeout(() => setShareMsg(null), 2500);
  };

  if (!eligible) {
    return (
      <div className="min-h-screen flex flex-col">
        <PageHeader title="🏆 ประกาศนียบัตร" backTo="/" />
        <main className="flex-1 max-w-md md:max-w-lg mx-auto p-4 w-full">
          <EmptyState
            hero
            icon="🔒"
            tone="info"
            title="ยังไม่ถึงเกณฑ์"
            description={
              <>
                ต้องจบครบ 8 ด่าน หรือเก็บแต้มครบ 1,500
                <br />
                (ตอนนี้ {player.stagesCompleted.length}/8 ด่าน, {player.totalXP.toLocaleString()} แต้ม)
              </>
            }
            action={
              <button onClick={() => nav('/')} className="btn-primary">กลับไปเล่นต่อ</button>
            }
          />
        </main>
      </div>
    );
  }

  // === Cert decoration (equipped) ===
  const certDeco = player.equippedCertDeco
    ? SHOP_ITEMS.find(i => i.id === player.equippedCertDeco)?.certDeco
    : undefined;

  // จัดวันที่แบบไทย "วันที่ DD เดือน พ.ศ. YYYY"
  const formatThaiDate = (iso: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
                    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
  };

  return (
    <div className="min-h-full pb-8 bg-white">
      <PageHeader title="🏆 ประกาศนียบัตร" backTo="/" />

      <main className="max-w-md md:max-w-lg mx-auto p-4">
        {loading && (
          <div role="status" aria-label="กำลังออกประกาศนียบัตร">
            <SkeletonCard variant="cert" />
            <p className="text-center text-sm text-slate-500 mt-3">กำลังออกประกาศนียบัตร...</p>
          </div>
        )}

        {error && (
          <EmptyState
            icon="⚠️"
            tone="error"
            title="เกิดข้อผิดพลาด"
            description={error}
            action={
              <button onClick={() => location.reload()} className="btn-primary">ลองใหม่</button>
            }
          />
        )}

        {certNo && !loading && !error && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            {/* ===== Certificate artwork — ทางการ พื้นขาวล้วน (เรนเดอร์ 420px แล้วย่อพอดีจอ) ===== */}
            <div ref={wrapRef} className="relative w-full mx-auto overflow-hidden"
                 style={{ maxWidth: CERT_W, height: CERT_H * certScale }}>
            <div style={{ width: CERT_W, height: CERT_H, transform: `scale(${certScale})`, transformOrigin: 'top left' }}>
            <div
              id="cert-card"
              className={`relative bg-white shadow-2xl font-official overflow-hidden ${certDeco?.borderClass || ''}`}
              style={{ width: CERT_W, height: CERT_H, fontFamily: '"Sukhumvit Set", "Noto Sans Thai", "IBM Plex Sans Thai", sans-serif' }}
            >
              {/* === ขอบทอง outer (achievement accent — TMF gold #F59E0B) === */}
              <div className="absolute inset-1 border-2 border-warning-500 pointer-events-none" />
              {/* === กรอบเส้นคู่ น้ำเงินเข้ม (หนา + บาง) === */}
              <div className="absolute inset-3 border-[3px] border-[#003C73] pointer-events-none" />
              <div className="absolute inset-[18px] border border-[#003C73] pointer-events-none" />

              {/* === Watermark TMF Logo (subtle, behind content) === */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
                   aria-hidden style={{ opacity: 0.04 }}>
                <TMFLogo variant="bare" width={360} useBase64 />
              </div>

              {/* === Decorative corner emoji (จาก cert-deco ที่สวม) === */}
              {certDeco?.corner && (
                <>
                  <span className="absolute top-6 left-6 text-2xl pointer-events-none z-10" aria-hidden>{certDeco.corner}</span>
                  <span className="absolute top-6 right-6 text-2xl pointer-events-none z-10" aria-hidden>{certDeco.corner}</span>
                </>
              )}

              {/* === ลวดลายเรขาคณิตที่มุมล่าง (ฟ้า + ทอง) === */}
              <CornerPattern position="bottom-left" />
              <CornerPattern position="bottom-right" />

              {/* === Content === */}
              <div className="relative px-8 pt-8 pb-12 h-full flex flex-col items-center text-center z-10">
                {/* === Logos: TMF + ผู้รับทุน (กึ่งกลางบนสุด) === */}
                <div className="flex items-center justify-center gap-6 mb-6 w-full">
                  <TMFLogo variant="bare" width={110} useBase64 />
                  <div className="w-px h-16 bg-slate-300" />
                  <div className="text-left">
                    <p className="text-[10px] text-slate-500 font-medium tracking-wide">ผู้รับทุน</p>
                    <p className="text-detective-800 font-bold text-sm leading-tight">
                      โครงการ SayNo<br/>สู้บุหรี่ไฟฟ้า
                    </p>
                  </div>
                </div>

                {/* === Title === */}
                <h1 className="text-detective-800 font-bold text-[2.5rem] leading-tight tracking-wide">
                  ประกาศนียบัตร
                </h1>
                {/* Ribbon ทอง แทน divider เส้นบาง */}
                <Ribbon width={130} height={26} className="my-2" />

                {/* === Issuing statement === */}
                <p className="text-slate-700 text-sm mt-1">ฉบับนี้ไว้เพื่อแสดงว่า</p>

                {/* === Recipient name === ชื่อจริงเป็นหลัก, ไม่ใส่ใช้ชื่อเล่น — ตัดบรรทัดแสดงเต็มไม่ตัดทิ้ง */}
                <h2 className={`text-detective-800 font-bold my-1 leading-tight px-4 w-full break-words ${
                  displayName.length > 30 ? 'text-lg' : displayName.length > 22 ? 'text-xl' : displayName.length > 14 ? 'text-2xl' : 'text-3xl'}`} >
                  {displayName}
                </h2>
                {realName.trim() && player.nickname && (
                  <p className="text-slate-500 text-sm mb-2">({player.nickname})</p>
                )}

                {/* === Description === */}
                <p className="text-slate-700 text-sm leading-relaxed max-w-xs mt-1">
                  เป็นผู้ผ่านการเข้าร่วมกิจกรรม
                </p>
                <p className="text-detective-700 font-semibold text-base leading-tight mt-1">
                  "นักสืบสู้บุหรี่ไฟฟ้า"
                </p>
                <p className="text-slate-600 text-xs mt-1.5 leading-relaxed max-w-xs">
                  หลักสูตรการเรียนรู้ทักษะปฏิเสธ
                  และรู้เท่าทันภัยจากบุหรี่ไฟฟ้า สำหรับเยาวชน
                </p>

                {/* === Seal (ตราประทับ) === */}
                <div className="mt-3">
                  <CertSeal size={72} />
                </div>

                {/* === Date === */}
                <p className="text-slate-700 text-sm mt-auto pt-4">
                  ให้ไว้ ณ วันที่ <span className="font-semibold text-detective-800">{formatThaiDate(issueDate)}</span>
                </p>

                {/* === Cert number — เล็ก ด้านล่าง === */}
                <p className="text-[10px] text-slate-500 font-mono mt-1">
                  เลขที่ {certNo}
                </p>
              </div>

              {/* === QR เล็ก มุมขวาล่าง === */}
              {qrDataUrl && (
                <div className="absolute bottom-6 right-6 bg-white p-1 border border-slate-300 z-10">
                  <img src={qrDataUrl} alt="ตรวจสอบ" className="w-12 h-12 block" />
                  <p className="text-[7px] text-slate-500 text-center mt-0.5 leading-tight">ตรวจสอบ</p>
                </div>
              )}
            </div>
            </div>
            </div>

            {/* ===== ชื่อบนเกียรติบัตร ===== */}
            <button
              onClick={() => { sfx.click(); setEditNameOpen(true); }}
              className="mt-4 w-full surface-soft px-3 py-2.5 flex items-center gap-2.5 text-left
                         active:scale-[0.99] transition-all print:hidden"
            >
              <span className="icon-tile-sm bg-warning-50 text-warning-600">✏️</span>
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] text-slate-500">ชื่อบนเกียรติบัตร</span>
                <span className="block text-sm font-semibold text-detective-700 truncate">
                  {realName.trim() || `${player.nickname} (ชื่อเล่น)`}
                </span>
              </span>
              <span className="text-[11px] text-detective-500 font-semibold flex-shrink-0">
                {realName.trim() ? 'แก้ไข' : 'ใส่ชื่อจริง'}
              </span>
            </button>

            {/* ===== Action Buttons ===== */}
            <div className="mt-3 flex flex-col gap-2 print:hidden">
              {/* ปุ่มแคปหน้าจอ เด่นชัดที่สุดสำหรับ Android และ LINE */}
              <button
                onClick={handleOpenScreenshot}
                disabled={saving}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span className="text-lg">📸</span>
                <span>โหมดแคปหน้าจอ (แนะนำสำหรับ Android / LINE)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center justify-center gap-1.5 disabled:opacity-60 font-bold text-xs py-2.5"
                >
                  <span>💾</span> {saving ? 'กำลังประมวลผล...' : 'ดาวน์โหลดรูป'}
                </button>
                <button
                  onClick={handleShare}
                  className="btn-secondary flex items-center justify-center gap-1.5 font-bold text-xs py-2.5"
                >
                  <span>💬</span> {inLine ? 'แชร์เข้า LINE' : 'แชร์เกียรติบัตร'}
                </button>
              </div>
            </div>

            {/* แถบคำแนะนำสำหรับ Android / LINE */}
            <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-left print:hidden">
              <span className="text-xl flex-shrink-0">💡</span>
              <div>
                <p className="text-xs font-bold text-amber-950 leading-tight">คำแนะนำสำหรับมือถือ Android / LINE</p>
                <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                  กดปุ่ม <strong>"โหมดแคปหน้าจอ"</strong> ด้านบน จะแสดงภาพเต็มจอคมชัด ไร้ปุ่มบัง แคปภาพเก็บไว้ได้ทันที 100%
                </p>
              </div>
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

            {/* === แบนเนอร์เตือนทำ Post-test ถ้าอาจารย์เปิดไว้และยังไม่ได้ทำ === */}
            {admin.postTestEnabled && player.postTestScore === undefined && (
              <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 shadow-clay-sm text-left print:hidden space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <div>
                    <p className="font-bold text-xs text-emerald-950">
                      แบบประเมินหลังเรียน (Post-test)
                    </p>
                    <p className="text-[11px] text-emerald-700 leading-snug">
                      อาจารย์เปิดให้ทำแบบประเมินหลังเรียน เพื่อประเมินผลโครงการวิจัย
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    sfx.click();
                    nav('/assessment?kind=post');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>🎯 ไปทำแบบประเมินหลังเรียน (Post-test) →</span>
                </button>
              </div>
            )}

            <div className="mt-2 grid grid-cols-2 gap-2 print:hidden">
              <button
                onClick={() => nav('/')}
                className="btn-secondary w-full"
              >
                ← หน้าแรก
              </button>
              {verifyCode && (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(`รหัสยืนยันเกียรติบัตร: ${verifyCode}`);
                    setShareMsg('ก๊อปรหัสแล้ว');
                    setTimeout(() => setShareMsg(null), 2000);
                  }}
                  className="btn-secondary w-full"
                >
                  📋 ก๊อปรหัส
                </button>
              )}
            </div>

            <p className="text-[10px] text-center text-slate-500 mt-4 print:hidden leading-relaxed">
              ตรวจสอบความถูกต้องได้ที่ /verify โดยใช้รหัสยืนยัน
              หรือสแกน QR Code มุมขวาล่างของประกาศนียบัตร
            </p>
          </motion.div>
        )}
      </main>

      <CertNameDialog
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        title="ชื่อบนเกียรติบัตร"
        subtitle="ใส่ชื่อจริงเพื่อพิมพ์บนใบ — เก็บในเครื่องนี้เท่านั้น"
      />

      {/* ===== Preview Modal สำหรับบันทึกรูปภาพ (แตะค้างเพื่อบันทึก) บน LINE / Android ===== */}
      {previewImgUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 md:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-4 md:p-6 max-w-lg w-full shadow-2xl flex flex-col items-center text-center max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between w-full mb-2.5">
              <div className="flex items-center gap-2 text-left">
                <span className="text-2xl">🖼️</span>
                <div>
                  <h3 className="font-bold text-base text-slate-800">บันทึกเกียรติบัตร</h3>
                  <p className="text-[11px] text-emerald-600 font-semibold">✨ แตะค้างที่รูปภาพเพื่อบันทึกลงเครื่อง</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewImgUrl(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-2 bg-slate-50 rounded-2xl border border-slate-200 mb-3 w-full">
              <img
                src={previewImgUrl}
                alt="เกียรติบัตรของคุณ"
                className="w-full h-auto rounded-xl shadow-sm block max-h-[50vh] object-contain mx-auto pointer-events-auto"
                style={{ WebkitTouchCallout: 'default', userSelect: 'auto' }}
              />
            </div>

            {/* คำแนะนำในการบันทึกรูปภาพ */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 w-full text-left text-xs text-amber-950 leading-relaxed space-y-1.5">
              <p className="font-bold flex items-center gap-1 text-sm text-amber-950">
                <span>📱</span> วิธีเซฟรูปและแชร์เกียรติบัตร:
              </p>
              <p>• <strong>สำหรับ Android / LINE:</strong> แนะนำกดปุ่ม <strong>"📸 โหมดแคปหน้าจอ"</strong> ด้านล่าง จะได้ภาพคมชัดเต็มจอไม่มีปุ่มบัง</p>
              <p>• <strong>สำหรับ iPhone:</strong> แตะค้างที่รูปภาพ 1 วินาที แล้วเลือก <strong>"บันทึกไปยังแอปรูปภาพ" (Save to Photos)</strong></p>
              <p>• หรือกดปุ่ม <strong>"💬 แชร์เข้าแชต LINE"</strong> เพื่อส่งการ์ดเกียรติบัตรให้คุณครูโดยตรง</p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              {/* ปุ่มเปิดโหมดแคปหน้าจอ */}
              <button
                onClick={() => {
                  sfx.click();
                  setPreviewImgUrl(null);
                  setHideGuide(false);
                  setScreenshotMode(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow active:scale-95 transition-all"
              >
                <span>📸</span> เปิดโหมดแคปหน้าจอเต็มจอ (แนะนำสำหรับ Android)
              </button>

              {/* ปุ่มแชร์เข้าแชต LINE สำหรับผู้ใช้ที่อยู่ใน LINE หรือมี LIFF */}
              <button
                onClick={async () => {
                  sfx.click();
                  const res = await shareCertificateViaLiff(displayName, certNo, verifyUrl);
                  if (res.success && res.method === 'liff') {
                    setShareMsg('แชร์เกียรติบัตรเข้าแชต LINE สำเร็จ');
                  } else {
                    setShareMsg('แชร์เรียบร้อย');
                  }
                  setTimeout(() => setShareMsg(null), 2500);
                }}
                className="py-2.5 px-4 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs flex items-center justify-center gap-2 shadow active:scale-95 transition-all"
              >
                <span>💬</span> แชร์เกียรติบัตรเข้าแชต LINE (ส่งให้ครู/เพื่อน)
              </button>

              {/* สำหรับ iOS หรือเบราว์เซอร์ปกติที่มี Web Share */}
              {navigator.share && (
                <button
                  onClick={async () => {
                    sfx.click();
                    try {
                      const blob = await (await fetch(previewImgUrl)).blob();
                      const cleanCertNo = (certNo || 'cert').replace(/[^A-Za-z0-9_-]/g, '');
                      const file = new File([blob], `Certificate-${cleanCertNo}.png`, { type: 'image/png' });
                      if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                          files: [file],
                          title: 'ประกาศนียบัตร',
                          text: `${displayName} ผ่านการอบรม "นักสืบสู้บุหรี่ไฟฟ้า"`,
                        });
                        setShareMsg('แชร์รูปภาพสำเร็จ');
                      }
                    } catch {
                      // user cancelled
                    }
                  }}
                  className="btn-primary py-2 text-xs flex items-center justify-center gap-1.5 font-bold w-full active:scale-95"
                >
                  <span>📲</span> บันทึกเข้า Photos / แชร์ผ่านแอป
                </button>
              )}

              <div className="grid grid-cols-2 gap-2 w-full">
                <button
                  onClick={async () => {
                    sfx.click();
                    try {
                      const blob = await (await fetch(previewImgUrl)).blob();
                      const objectUrl = URL.createObjectURL(blob);
                      const cleanCertNo = (certNo || 'cert').replace(/[^A-Za-z0-9_-]/g, '');
                      const a = document.createElement('a');
                      a.href = objectUrl;
                      a.download = `Certificate-${cleanCertNo}.png`;
                      a.style.display = 'none';
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(objectUrl);
                      }, 4000);
                      setShareMsg('เริ่มดาวน์โหลดไฟล์แล้ว');
                    } catch (e) {
                      console.warn('download failed', e);
                    }
                  }}
                  className="btn-secondary py-2.5 text-xs flex items-center justify-center gap-1 font-bold"
                >
                  <span>⬇️</span> ดาวน์โหลดไฟล์ PNG
                </button>
                <button
                  onClick={() => setPreviewImgUrl(null)}
                  className="btn-secondary py-2.5 text-xs flex items-center justify-center gap-1 font-bold"
                >
                  <span>✕</span> ปิดหน้าต่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== Fullscreen Screenshot Mode (สำหรับ Android / LINE) ===== */}
      {screenshotMode && (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-between p-2 sm:p-4 select-none animate-in fade-in duration-200">
          {/* แถบคำแนะนำด้านบน */}
          {!hideGuide ? (
            <div className="w-full max-w-md bg-amber-500 text-amber-950 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center justify-between shadow-xl mb-1 z-20">
              <div className="flex items-center gap-2">
                <span className="text-lg">📸</span>
                <span>กดปุ่ม <strong>ลดเสียง + Power</strong> เพื่อแคปจอได้เลย!</span>
              </div>
              <button
                onClick={() => setHideGuide(true)}
                className="text-[10px] bg-amber-950/15 hover:bg-amber-950/25 px-2.5 py-1 rounded-lg text-amber-950 font-bold"
              >
                ซ่อนป้ายนี้
              </button>
            </div>
          ) : (
            <div className="h-1" />
          )}

          {/* การ์ดเกียรติบัตรคมชัดระดับ HD เต็มจอ */}
          <div
            className="flex-1 w-full flex items-center justify-center my-auto p-1 cursor-pointer"
            onClick={() => setHideGuide(prev => !prev)}
          >
            {certImgUrl ? (
              <img
                src={certImgUrl}
                alt="ประกาศนียบัตร"
                className="max-h-[85vh] max-w-full w-auto object-contain rounded shadow-2xl block border border-slate-700/50"
              />
            ) : (
              <div className="text-white text-center py-20 font-bold">กำลังเรนเดอร์ภาพเกียรติบัตร...</div>
            )}
          </div>

          {/* ปุ่มปิดด้านล่าง */}
          <div className="w-full max-w-xs flex flex-col items-center gap-1.5 mt-1 z-20">
            <p className="text-[10px] text-slate-400">แตะที่รูปเพื่อซ่อนหรือแสดงแถบคำแนะนำ</p>
            <button
              onClick={() => {
                sfx.click();
                setScreenshotMode(false);
              }}
              className="w-full py-2.5 rounded-xl bg-white/20 hover:bg-white/30 active:scale-95 text-white font-bold text-xs backdrop-blur-md shadow"
            >
              ✕ ปิดหน้าจอแคปภาพ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== ลวดลายเรขาคณิตสี่เหลี่ยมที่มุม — TMF ฟ้า + ทอง achievement =====
function CornerPattern({ position }: { position: 'bottom-left' | 'bottom-right' }) {
  const flip = position === 'bottom-right';
  return (
    <div
      className="absolute bottom-6 w-24 h-24 pointer-events-none z-[5]"
      style={{
        [flip ? 'right' : 'left']: '24px',
        transform: flip ? 'scaleX(-1)' : 'none',
      }}
    >
      <svg viewBox="0 0 96 96" className="w-full h-full" aria-hidden>
        {/* แถวล่าง */}
        <rect x="0"  y="72" width="20" height="20" fill="#003C73" />
        <rect x="22" y="72" width="20" height="20" fill="#0072CC" />
        <rect x="44" y="72" width="20" height="20" fill="#F59E0B" />
        <rect x="66" y="72" width="20" height="20" fill="#ABDAFF" />

        {/* แถวกลาง */}
        <rect x="0"  y="50" width="20" height="20" fill="#0072CC" />
        <rect x="22" y="50" width="20" height="20" fill="#FBBF24" />
        <rect x="44" y="50" width="20" height="20" fill="#ABDAFF" opacity="0.7" />

        {/* แถวบน */}
        <rect x="0"  y="28" width="20" height="20" fill="#008FFF" />
        <rect x="22" y="28" width="20" height="20" fill="#ABDAFF" opacity="0.6" />

        <rect x="0"  y="6"  width="20" height="20" fill="#FEF3C7" opacity="0.7" />
      </svg>
    </div>
  );
}
