import QRCode from 'qrcode';
import { TMF_LOGO_BASE64 } from './tmfLogoBase64';

export interface CertRenderOptions {
  displayName: string;
  nickname?: string;
  realName?: string;
  certNo: string;
  issueDate: string;
  verifyUrl: string;
  cornerEmoji?: string;
}

// ขนาดออกแบบคงที่ระดับ HD 2x (840 x 1188 px มาตรฐาน A4 ratio 1:1.414)
export const CANVAS_W = 840;
export const CANVAS_H = 1188;

// ฟังก์ชันช่วยวาดข้อความจัดกึ่งกลางด้วยการคำนวณพิกเซลจริง
// แก้ปัญหาบั๊ก WebKit/Safari บน iOS ที่ไม่ยอมจัดกึ่งกลางภาษาไทยเมื่อใช้ ctx.textAlign = 'center'
export function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number
) {
  ctx.textAlign = 'left';
  const metrics = ctx.measureText(text);
  ctx.fillText(text, Math.round(cx - metrics.width / 2), cy);
}

// โหลดรูปภาพจาก Data URL หรือ Path ให้เสร็จสมบูรณ์ 100% ก่อนวาด
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

// จัดวันที่แบบไทย "วันที่ DD เดือน พ.ศ. YYYY"
export function formatThaiDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} พ.ศ. ${d.getFullYear() + 543}`;
}

/**
 * เรนเดอร์เกียรติบัตรลงบน HTML5 Canvas โดยตรง
 * ป้องกันบั๊ก iOS Safari ทิ้งรูปภาพใน SVG foreignObject ของ html-to-image 100%
 */
export async function renderCertificateCanvas(opts: CertRenderOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // 1. พื้นหลังสีขาว
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 2. ขอบทองด้านนอกสุด (TMF Gold #F59E0B)
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, CANVAS_W - 16, CANVAS_H - 16);

  // 3. กรอบเส้นคู่น้ำเงินเข้ม TMF (#003C73)
  ctx.strokeStyle = '#003C73';
  ctx.lineWidth = 6;
  ctx.strokeRect(22, 22, CANVAS_W - 44, CANVAS_H - 44);

  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, CANVAS_W - 72, CANVAS_H - 72);

  // 4. วาด Watermark โลโก้ TMF ตรงกลางแบบจางๆ (opacity 4%)
  try {
    const tmfLogo = await loadImage(TMF_LOGO_BASE64);
    ctx.save();
    ctx.globalAlpha = 0.04;
    const wmW = 640;
    const wmH = Math.round(wmW / (1778 / 1573)); // ~566px
    ctx.drawImage(tmfLogo, Math.round((CANVAS_W - wmW) / 2), Math.round((CANVAS_H - wmH) / 2) + 15, wmW, wmH);
    ctx.restore();
  } catch (e) {
    console.warn('[certRenderer] Failed to render watermark logo:', e);
  }

  // 5. ลวดลายเรขาคณิตสี่เหลี่ยมที่มุมล่างทั้งสองข้าง (ฟ้า + ทอง ตาม CI ของ TMF)
  drawCornerPatterns(ctx);

  // 6. ส่วนหัว: โลโก้ TMF + เส้นคั่น + ข้อความผู้รับทุนโครงการ SayNo (จัดกึ่งกลางกลุ่มทั้งหมด)
  try {
    const tmfLogo = await loadImage(TMF_LOGO_BASE64);
    const logoW = 160;
    const logoH = Math.round(logoW / (1778 / 1573)); // ~142px
    const gap = 20;
    const textW = 180;
    const totalHeaderW = logoW + gap + 2 + gap + textW; // ~382px
    const startX = Math.round((CANVAS_W - totalHeaderW) / 2);
    const topY = 60;

    // วาดโลโก้ TMF
    ctx.drawImage(tmfLogo, startX, topY, logoW, logoH);

    // เส้นคั่นแนวตั้ง
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startX + logoW + gap, topY + 15);
    ctx.lineTo(startX + logoW + gap, topY + logoH - 15);
    ctx.stroke();

    // ข้อความผู้รับทุน
    const textX = startX + logoW + gap + gap;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.font = 'bold 18px "Sukhumvit Set", "Noto Sans Thai", sans-serif';
    ctx.fillText('ผู้รับทุน', textX, topY + 40);

    ctx.fillStyle = '#003C73';
    ctx.font = 'bold 24px "Sukhumvit Set", "Noto Sans Thai", sans-serif';
    ctx.fillText('โครงการ SayNo', textX, topY + 74);
    ctx.fillText('สู้บุหรี่ไฟฟ้า', textX, topY + 104);
  } catch (e) {
    console.warn('[certRenderer] Failed to draw header logo:', e);
  }

  // 7. หัวข้อหลัก: "ประกาศนียบัตร" (จัดกึ่งกลางแท้จริง)
  ctx.fillStyle = '#003C73';
  ctx.font = 'bold 50px "Sukhumvit Set", "Noto Sans Thai", "IBM Plex Sans Thai", sans-serif';
  drawCenteredText(ctx, 'ประกาศนียบัตร', CANVAS_W / 2, 260);

  // 8. ริบบิ้นโบว์ทองใต้หัวข้อ
  drawRibbon(ctx, CANVAS_W / 2, 296, 230, 44);

  // 9. ข้อความนำ: "ฉบับนี้ไว้เพื่อแสดงว่า"
  ctx.fillStyle = '#334155';
  ctx.font = '24px "Sukhumvit Set", "Noto Sans Thai", sans-serif';
  drawCenteredText(ctx, 'ฉบับนี้ไว้เพื่อแสดงว่า', CANVAS_W / 2, 372);

  // 10. ชื่อผู้รับเกียรติบัตร (displayName)
  const name = opts.displayName.trim();
  let nameSize = 44;
  if (name.length > 30) nameSize = 28;
  else if (name.length > 22) nameSize = 34;
  else if (name.length > 15) nameSize = 38;

  ctx.fillStyle = '#003C73';
  ctx.font = `bold ${nameSize}px "Sukhumvit Set", "Noto Sans Thai", sans-serif`;
  drawCenteredText(ctx, name, CANVAS_W / 2, 436);

  // ถ้ามีชื่อเล่นแสดงเสริมใต้ชื่อจริง
  let nextY = 478;
  if (opts.realName && opts.nickname) {
    ctx.fillStyle = '#64748B';
    ctx.font = '22px "Sukhumvit Set", "Noto Sans Thai", sans-serif';
    drawCenteredText(ctx, `(${opts.nickname})`, CANVAS_W / 2, nextY);
    nextY += 40;
  }

  // 11. รายละเอียดข้อความหลักสูตร
  ctx.fillStyle = '#334155';
  ctx.font = '23px "Sukhumvit Set", "Noto Sans Thai", sans-serif';
  drawCenteredText(ctx, 'เป็นผู้ผ่านการเข้าร่วมกิจกรรม', CANVAS_W / 2, nextY + 15);

  ctx.fillStyle = '#0284C7';
  ctx.font = 'bold 32px "Sukhumvit Set", "Noto Sans Thai", sans-serif';
  drawCenteredText(ctx, '"นักสืบสู้บุหรี่ไฟฟ้า"', CANVAS_W / 2, nextY + 58);

  ctx.fillStyle = '#475569';
  ctx.font = '20px "Sukhumvit Set", "Noto Sans Thai", sans-serif';
  drawCenteredText(ctx, 'หลักสูตรการเรียนรู้ทักษะปฏิเสธ', CANVAS_W / 2, nextY + 100);
  drawCenteredText(ctx, 'และรู้เท่าทันภัยจากบุหรี่ไฟฟ้า สำหรับเยาวชน', CANVAS_W / 2, nextY + 130);

  // 12. ตราประทับเกียรติบัตร (Official Seal) วงกลมน้ำเงิน-ทอง พร้อมดาว 5 แฉก
  drawSeal(ctx, CANVAS_W / 2, nextY + 230, 64);

  // 13. วันที่มอบเกียรติบัตร (บรรทัดเดียวจัดกึ่งกลางสมบูรณ์แบบ ห่างจาก QR Code ไม่ทับซ้อน)
  ctx.fillStyle = '#334155';
  ctx.font = '23px "Sukhumvit Set", "Noto Sans Thai", sans-serif';
  const dateFullText = `ให้ไว้ ณ วันที่ ${formatThaiDate(opts.issueDate)}`;
  drawCenteredText(ctx, dateFullText, CANVAS_W / 2, CANVAS_H - 165);

  // 14. เลขที่เกียรติบัตร
  ctx.fillStyle = '#64748B';
  ctx.font = '19px "Courier New", monospace';
  drawCenteredText(ctx, `เลขที่ ${opts.certNo}`, CANVAS_W / 2, CANVAS_H - 125);

  // 15. วาด QR Code ตรวจสอบมุมขวาล่าง
  if (opts.verifyUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(opts.verifyUrl, {
        width: 180,
        margin: 1,
        color: { dark: '#003C73', light: '#FFFFFF' },
      });
      const qrImg = await loadImage(qrDataUrl);
      const qrBoxSize = 84;
      const qrX = CANVAS_W - 55 - qrBoxSize;
      const qrY = CANVAS_H - 55 - qrBoxSize - 22;

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 4, qrY - 4, qrBoxSize + 8, qrBoxSize + 26);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      ctx.strokeRect(qrX - 4, qrY - 4, qrBoxSize + 8, qrBoxSize + 26);

      ctx.drawImage(qrImg, qrX, qrY, qrBoxSize, qrBoxSize);

      ctx.fillStyle = '#64748B';
      ctx.font = '13px "Sukhumvit Set", "Noto Sans Thai", sans-serif';
      drawCenteredText(ctx, 'ตรวจสอบ', qrX + qrBoxSize / 2, qrY + qrBoxSize + 16);
    } catch (e) {
      console.warn('[certRenderer] Failed to draw QR Code:', e);
    }
  }

  // 16. อีโมจิประดับมุม (ถ้ามีไอเทมประดับที่สวมใส่)
  if (opts.cornerEmoji) {
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opts.cornerEmoji, 70, 80);
    ctx.fillText(opts.cornerEmoji, CANVAS_W - 70, 80);
  }

  return canvas;
}

// วาดโบว์ทอง
function drawRibbon(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  ctx.save();
  const halfW = w / 2;
  const halfH = h / 2;

  // หางซ้าย
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.moveTo(cx - halfW, cy - halfH + 8);
  ctx.lineTo(cx - halfW + 40, cy - halfH + 8);
  ctx.lineTo(cx - halfW + 32, cy);
  ctx.lineTo(cx - halfW + 40, cy + halfH - 8);
  ctx.lineTo(cx - halfW, cy + halfH - 8);
  ctx.lineTo(cx - halfW + 10, cy);
  ctx.closePath();
  ctx.fill();

  // หางขวา
  ctx.beginPath();
  ctx.moveTo(cx + halfW, cy - halfH + 8);
  ctx.lineTo(cx + halfW - 40, cy - halfH + 8);
  ctx.lineTo(cx + halfW - 32, cy);
  ctx.lineTo(cx + halfW - 40, cy + halfH - 8);
  ctx.lineTo(cx + halfW, cy + halfH - 8);
  ctx.lineTo(cx + halfW - 10, cy);
  ctx.closePath();
  ctx.fill();

  // แถบกลางไล่สีทอง
  const grad = ctx.createLinearGradient(cx - halfW + 35, cy - halfH, cx + halfW - 35, cy + halfH);
  grad.addColorStop(0, '#FBBF24');
  grad.addColorStop(0.5, '#F59E0B');
  grad.addColorStop(1, '#D97706');
  ctx.fillStyle = grad;

  const bandW = w - 70;
  const bandH = h - 10;
  ctx.beginPath();
  ctx.roundRect(cx - bandW / 2, cy - bandH / 2, bandW, bandH, 6);
  ctx.fill();
  ctx.restore();
}

// วาดตราประทับ TMF Blue + Gold
function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.save();

  // วงนอกสุดสีทอง
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // จุดไข่ปลาสีทอง 16 จุด
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const dotX = cx + Math.cos(a) * (r - 7);
    const dotY = cy + Math.sin(a) * (r - 7);
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(dotX, dotY, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // วงกลมน้ำเงินไล่สี
  const grad = ctx.createRadialGradient(cx, cy, 5, cx, cy, r - 14);
  grad.addColorStop(0, '#0072CC');
  grad.addColorStop(1, '#003C73');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // วงแหวนทองด้านใน
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 23, 0, Math.PI * 2);
  ctx.stroke();

  // ดาว 5 แฉกสีทองตรงกลาง
  drawStar(ctx, cx, cy, 5, 25, 11, '#FBBF24', '#F59E0B');

  // แสงสะท้อนประกายขาว
  ctx.save();
  ctx.translate(cx - 15, cy - 18);
  ctx.rotate(-Math.PI / 6);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number,
  fillColor: string,
  strokeColor: string
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1;
  ctx.stroke();
}

// วาดลวดลายสี่เหลี่ยมเรขาคณิตตรงมุมล่างซ้ายและขวา
function drawCornerPatterns(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const colors = [
    ['#003C73', '#0072CC', '#F59E0B', '#ABDAFF'],
    ['#0072CC', '#FBBF24', 'rgba(171, 218, 255, 0.7)'],
    ['#008FFF', 'rgba(171, 218, 255, 0.6)'],
    ['rgba(254, 243, 199, 0.7)'],
  ];

  const sq = 34;
  const gap = 3;

  // วาดมุมซ้าย
  const baseX = 46;
  const baseY = CANVAS_H - 46;

  for (let row = 0; row < colors.length; row++) {
    const rColors = colors[row];
    for (let col = 0; col < rColors.length; col++) {
      ctx.fillStyle = rColors[col];
      const x = baseX + col * (sq + gap);
      const y = baseY - (row + 1) * (sq + gap);
      ctx.fillRect(x, y, sq, sq);
    }
  }

  // วาดมุมขวา (กลับด้าน)
  const baseXR = CANVAS_W - 46;
  for (let row = 0; row < colors.length; row++) {
    const rColors = colors[row];
    for (let col = 0; col < rColors.length; col++) {
      ctx.fillStyle = rColors[col];
      const x = baseXR - (col + 1) * (sq + gap);
      const y = baseY - (row + 1) * (sq + gap);
      ctx.fillRect(x, y, sq, sq);
    }
  }

  ctx.restore();
}

/**
 * บันทึกรูปภาพเกียรติบัตรลงเครื่องอย่างสมบูรณ์แบบ
 * แก้ไขปัญหา Android ไม่ยอมดาวน์โหลด Data URL และ iOS ห้ามคลิก <a> ดาวน์โหลดตรง
 */
export async function saveCertificateImage(
  canvas: HTMLCanvasElement,
  filename: string,
  title: string
): Promise<{ success: boolean; dataUrl: string; method: 'download' | 'share' | 'preview' }> {
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) {
    return { success: false, dataUrl, method: 'preview' };
  }

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isLine = /Line/i.test(navigator.userAgent);

  // 1) บน iOS Safari:
  // ห้ามเรียก <a download>.click() บน iOS เด็ดขาด เพราะ Safari จะเด้งไปหน้า blob ว่างทำให้แอพพัง
  if (isIOS) {
    if (!isLine && navigator.share && navigator.canShare) {
      try {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title,
            text: title,
          });
          return { success: true, dataUrl, method: 'share' };
        }
      } catch {
        // User dismissed share sheet
      }
    }
    // บน iOS หากแชร์ไม่ได้หรือไม่รองรับ ให้ส่งกลับเพื่อเปิด Preview Modal (แตะค้างบันทึกเข้า Photos)
    return { success: true, dataUrl, method: 'preview' };
  }

  // 2) บน Android และ Desktop:
  // ใช้ Blob Object URL สำหรับแท็ก <a> เพื่อให้ Chrome ดาวน์โหลดไฟล์ลงเครื่องทันที
  try {
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }, 4000);
    return { success: true, dataUrl, method: 'download' };
  } catch (e) {
    console.warn('[certRenderer] Native download failed, falling back to preview modal:', e);
    return { success: false, dataUrl, method: 'preview' };
  }
}
