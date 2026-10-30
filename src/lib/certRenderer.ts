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

  const FONT_FAMILY = '"Sukhumvit Set", "Noto Sans Thai", "IBM Plex Sans Thai", sans-serif';

  // 1. พื้นหลังสีขาว
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // 2. ขอบทองด้านนอกสุด (TMF Gold #F59E0B)
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  ctx.strokeRect(12, 12, CANVAS_W - 24, CANVAS_H - 24);

  // 3. กรอบเส้นคู่น้ำเงินเข้ม TMF (#003C73)
  ctx.strokeStyle = '#003C73';
  ctx.lineWidth = 6;
  ctx.strokeRect(26, 26, CANVAS_W - 52, CANVAS_H - 52);

  ctx.lineWidth = 2;
  ctx.strokeRect(38, 38, CANVAS_W - 76, CANVAS_H - 76);

  // ประดับมุมกรอบบนซ้าย-ขวา (สีทองอ่อนช้อย สมดุลกับมุมล่าง)
  drawTopCornerAccents(ctx);

  // 4. วาด Watermark โลโก้ TMF ตรงกลางแบบจางๆ (opacity 4%)
  try {
    const tmfLogo = await loadImage(TMF_LOGO_BASE64);
    ctx.save();
    ctx.globalAlpha = 0.04;
    const wmW = 640;
    const wmH = Math.round(wmW / (1778 / 1573)); // ~566px
    ctx.drawImage(
      tmfLogo,
      Math.round((CANVAS_W - wmW) / 2),
      Math.round((CANVAS_H - wmH) / 2),
      wmW,
      wmH
    );
    ctx.restore();
  } catch (e) {
    console.warn('[certRenderer] Failed to render watermark logo:', e);
  }

  // 5. ลวดลายเรขาคณิตสี่เหลี่ยมที่มุมล่าง (ฟ้า + ทอง ตาม CI ของ TMF)
  // หากมี QR Code มุมขวาล่าง จะไม่วาดสี่เหลี่ยมทับซ้อนด้านหลัง QR Code เพื่อความสวยงามไม่ดูเป็นบั๊ก
  drawCornerPatterns(ctx, !opts.verifyUrl);

  // 6. ส่วนหัว: โลโก้ TMF + เส้นคั่น + ข้อความผู้รับทุนโครงการ SayNo (จัดกึ่งกลางสมดุล)
  try {
    const tmfLogo = await loadImage(TMF_LOGO_BASE64);
    // ไฟล์โลโก้มีพื้นที่ว่างด้านบน-ล่าง ~31% จึงใช้ขนาด 220x195 เพื่อให้ตัวนกและตัวหนังสือมีขนาดสมดุล
    const logoW = 220;
    const logoH = Math.round(logoW / (1778 / 1573)); // ~195px (visual center = topY + 97)
    const gap = 22;
    const textW = 196;
    const totalHeaderW = logoW + gap + 2 + gap + textW; // ~462px
    const startX = Math.round((CANVAS_W - totalHeaderW) / 2);
    const topY = 66;
    const centerY = topY + Math.round(logoH / 2); // ~164

    // วาดโลโก้ TMF
    ctx.drawImage(tmfLogo, startX, topY, logoW, logoH);

    // เส้นคั่นแนวตั้ง (กึ่งกลางเดียวกับโลโก้)
    const dividerX = startX + logoW + gap;
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(dividerX, centerY - 50);
    ctx.lineTo(dividerX, centerY + 50);
    ctx.stroke();

    // ข้อความผู้รับทุน (จัดกึ่งกลางแนวตั้งคู่กับโลโก้)
    const textX = dividerX + gap;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.font = `600 20px ${FONT_FAMILY}`;
    ctx.fillText('ผู้รับทุน', textX, centerY - 26);

    ctx.fillStyle = '#003C73';
    ctx.font = `bold 28px ${FONT_FAMILY}`;
    ctx.fillText('โครงการ SayNo', textX, centerY + 10);
    ctx.fillText('สู้บุหรี่ไฟฟ้า', textX, centerY + 44);
  } catch (e) {
    console.warn('[certRenderer] Failed to draw header logo:', e);
  }

  // 7. หัวข้อหลัก: "ประกาศนียบัตร" (จัดกึ่งกลางแท้จริง)
  ctx.fillStyle = '#003C73';
  ctx.font = `bold 62px ${FONT_FAMILY}`;
  drawCenteredText(ctx, 'ประกาศนียบัตร', CANVAS_W / 2, 322);

  // 8. ริบบิ้นโบว์ทองใต้หัวข้อ (พร้อมเพชรสีขาวตรงกลาง เหมือน SVG Ribbon 100%)
  drawRibbon(ctx, CANVAS_W / 2, 378, 250, 48);

  // 9. ข้อความนำ: "ฉบับนี้ไว้เพื่อแสดงว่า"
  ctx.fillStyle = '#475569';
  ctx.font = `26px ${FONT_FAMILY}`;
  drawCenteredText(ctx, 'ฉบับนี้ไว้เพื่อแสดงว่า', CANVAS_W / 2, 470);

  // 10. ชื่อผู้รับเกียรติบัตร (displayName) — ปรับขนาดอัตโนมัติตามความยาวจริงเพื่อไม่ให้ล้นกรอบ
  const name = (opts.displayName || '').trim() || 'ผู้ผ่านการอบรม';
  let nameSize = 48;
  ctx.font = `bold ${nameSize}px ${FONT_FAMILY}`;
  while (nameSize > 24 && ctx.measureText(name).width > CANVAS_W - 140) {
    nameSize -= 2;
    ctx.font = `bold ${nameSize}px ${FONT_FAMILY}`;
  }

  ctx.fillStyle = '#003C73';
  drawCenteredText(ctx, name, CANVAS_W / 2, 550);

  // ถ้ามีชื่อเล่นแสดงเสริมใต้ชื่อจริง (ข้ามถ้าซ้ำกับชื่อจริง หรือเป็นตัวเลขล้วน เช่น "1")
  const cleanReal = (opts.realName || '').trim();
  const cleanNick = (opts.nickname || '').trim();
  const showNicknameSub =
    Boolean(cleanReal && cleanNick && cleanNick !== cleanReal && !/^\d+$/.test(cleanNick));

  let afterNameY = 584;
  if (showNicknameSub) {
    ctx.fillStyle = '#64748B';
    ctx.font = `24px ${FONT_FAMILY}`;
    drawCenteredText(ctx, `(${cleanNick})`, CANVAS_W / 2, 596);
    afterNameY = 624;
  }

  // เส้นคั่นทองประดับใต้ชื่อผู้รับ (ช่วยเน้นชื่อและถ่วงดุลพื้นที่แนวตั้งอย่างสง่างาม)
  drawGoldenNameDivider(ctx, CANVAS_W / 2, afterNameY, 360);

  // 11. รายละเอียดข้อความหลักสูตร
  const descBaseY = afterNameY + 72;
  ctx.fillStyle = '#334155';
  ctx.font = `26px ${FONT_FAMILY}`;
  drawCenteredText(ctx, 'เป็นผู้ผ่านการเข้าร่วมกิจกรรม', CANVAS_W / 2, descBaseY);

  ctx.fillStyle = '#003C73';
  ctx.font = `bold 40px ${FONT_FAMILY}`;
  drawCenteredText(ctx, '"นักสืบสู้บุหรี่ไฟฟ้า"', CANVAS_W / 2, descBaseY + 66);

  ctx.fillStyle = '#475569';
  ctx.font = `24px ${FONT_FAMILY}`;
  drawCenteredText(ctx, 'หลักสูตรการเรียนรู้ทักษะปฏิเสธ', CANVAS_W / 2, descBaseY + 130);
  drawCenteredText(ctx, 'และรู้เท่าทันภัยจากบุหรี่ไฟฟ้า สำหรับเยาวชน', CANVAS_W / 2, descBaseY + 168);

  // 12. ลวดลายคั่นกลางด้านล่าง (แทนที่ตราประทับดาวเดิม ให้สมดุลและเป็นทางการ)
  const flourishY = descBaseY + 234;
  drawBottomFlourish(ctx, CANVAS_W / 2, flourishY);

  // 13. วันที่มอบเกียรติบัตร (วางเหนือระดับมุมล่างและ QR Code ไม่ชนขอบและไม่ซ้อนทับ 100%)
  const dateY = flourishY + 64;
  drawFormattedDateLine(ctx, formatThaiDate(opts.issueDate), CANVAS_W / 2, dateY, FONT_FAMILY);

  // 14. เลขที่เกียรติบัตร
  ctx.fillStyle = '#64748B';
  ctx.font = '20px "Courier New", monospace';
  drawCenteredText(ctx, `เลขที่ ${opts.certNo}`, CANVAS_W / 2, dateY + 46);

  // 15. วาด QR Code ตรวจสอบมุมขวาล่าง
  if (opts.verifyUrl) {
    try {
      const qrDataUrl = await QRCode.toDataURL(opts.verifyUrl, {
        width: 200,
        margin: 1,
        color: { dark: '#003C73', light: '#FFFFFF' },
      });
      const qrImg = await loadImage(qrDataUrl);
      const qrBoxSize = 90;
      const qrX = CANVAS_W - 56 - qrBoxSize;
      const qrY = CANVAS_H - 56 - qrBoxSize - 24;

      // กล่องพื้นขาวพร้อมกรอบสองชั้นเล็กๆ ให้เข้ากับตัวใบประกาศ
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(qrX - 6, qrY - 6, qrBoxSize + 12, qrBoxSize + 32);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(qrX - 6, qrY - 6, qrBoxSize + 12, qrBoxSize + 32);

      ctx.drawImage(qrImg, qrX, qrY, qrBoxSize, qrBoxSize);

      ctx.fillStyle = '#64748B';
      ctx.font = `600 14px ${FONT_FAMILY}`;
      drawCenteredText(ctx, 'ตรวจสอบ', qrX + qrBoxSize / 2, qrY + qrBoxSize + 18);
    } catch (e) {
      console.warn('[certRenderer] Failed to draw QR Code:', e);
    }
  }

  // 16. อีโมจิประดับมุม (ถ้ามีไอเทมประดับที่สวมใส่)
  if (opts.cornerEmoji) {
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opts.cornerEmoji, 76, 88);
    ctx.fillText(opts.cornerEmoji, CANVAS_W - 76, 88);
  }

  return canvas;
}

// วาดวันที่โดยแยกสี "ให้ไว้ ณ วันที่ " และวันที่ตัวหนา พร้อมจัดกึ่งกลางด้วย textAlign = left (กันบั๊ก Safari)
function drawFormattedDateLine(
  ctx: CanvasRenderingContext2D,
  thaiDate: string,
  cx: number,
  cy: number,
  fontFamily: string
) {
  const prefix = 'ให้ไว้ ณ วันที่ ';
  ctx.textAlign = 'left';

  ctx.font = `25px ${fontFamily}`;
  const prefixW = ctx.measureText(prefix).width;

  ctx.font = `bold 25px ${fontFamily}`;
  const dateW = ctx.measureText(thaiDate).width;

  const totalW = prefixW + dateW;
  const startX = Math.round(cx - totalW / 2);

  ctx.fillStyle = '#334155';
  ctx.font = `25px ${fontFamily}`;
  ctx.fillText(prefix, startX, cy);

  ctx.fillStyle = '#003C73';
  ctx.font = `bold 25px ${fontFamily}`;
  ctx.fillText(thaiDate, Math.round(startX + prefixW), cy);
}

// วาดมุมทองประดับด้านบนซ้าย-ขวา
function drawTopCornerAccents(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 3;
  const offset = 50;
  const len = 36;

  // มุมบนซ้าย
  ctx.beginPath();
  ctx.moveTo(offset, offset + len);
  ctx.lineTo(offset, offset);
  ctx.lineTo(offset + len, offset);
  ctx.stroke();

  // มุมบนขวา
  ctx.beginPath();
  ctx.moveTo(CANVAS_W - offset - len, offset);
  ctx.lineTo(CANVAS_W - offset, offset);
  ctx.lineTo(CANVAS_W - offset, offset + len);
  ctx.stroke();

  ctx.restore();
}

// วาดเส้นคั่นทองใต้ชื่อผู้รับเกียรติบัตร
function drawGoldenNameDivider(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number) {
  ctx.save();
  const halfW = width / 2;
  const grad = ctx.createLinearGradient(cx - halfW, cy, cx + halfW, cy);
  grad.addColorStop(0, 'rgba(245, 158, 11, 0)');
  grad.addColorStop(0.2, 'rgba(245, 158, 11, 0.65)');
  grad.addColorStop(0.5, '#D97706');
  grad.addColorStop(0.8, 'rgba(245, 158, 11, 0.65)');
  grad.addColorStop(1, 'rgba(245, 158, 11, 0)');

  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, cy);
  ctx.lineTo(cx + halfW, cy);
  ctx.stroke();

  // เพชรสีทองตรงกลางเส้น
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 5);
  ctx.lineTo(cx + 5, cy);
  ctx.lineTo(cx, cy + 5);
  ctx.lineTo(cx - 5, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// วาดลวดลายคั่นกลางส่วนล่าง (สมดุล สง่างาม แทนที่เหรียญดาวเดิม)
function drawBottomFlourish(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  const halfW = 110;
  const grad = ctx.createLinearGradient(cx - halfW, cy, cx + halfW, cy);
  grad.addColorStop(0, 'rgba(0, 60, 115, 0)');
  grad.addColorStop(0.25, 'rgba(0, 60, 115, 0.35)');
  grad.addColorStop(0.5, 'rgba(0, 60, 115, 0.6)');
  grad.addColorStop(0.75, 'rgba(0, 60, 115, 0.35)');
  grad.addColorStop(1, 'rgba(0, 60, 115, 0)');

  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - halfW, cy);
  ctx.lineTo(cx - 18, cy);
  ctx.moveTo(cx + 18, cy);
  ctx.lineTo(cx + halfW, cy);
  ctx.stroke();

  // เพชรคู่ตรงกลาง (น้ำเงิน + ทอง)
  ctx.fillStyle = '#003C73';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx + 8, cy);
  ctx.lineTo(cx, cy + 8);
  ctx.lineTo(cx - 8, cy);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx + 4, cy);
  ctx.lineTo(cx, cy + 4);
  ctx.lineTo(cx - 4, cy);
  ctx.closePath();
  ctx.fill();

  // จุดทองซ้าย-ขวา
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.arc(cx - 18, cy, 2.5, 0, Math.PI * 2);
  ctx.arc(cx + 18, cy, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// วาดโบว์ทอง (ตรงกับคอมโพเนนต์ <Ribbon /> ทุกประการ)
function drawRibbon(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number) {
  ctx.save();
  const halfW = w / 2;
  const halfH = h / 2;

  // หางซ้าย
  ctx.fillStyle = '#D97706';
  ctx.beginPath();
  ctx.moveTo(cx - halfW, cy - halfH + 8);
  ctx.lineTo(cx - halfW + 44, cy - halfH + 8);
  ctx.lineTo(cx - halfW + 36, cy + 2);
  ctx.lineTo(cx - halfW + 44, cy + halfH - 4);
  ctx.lineTo(cx - halfW, cy + halfH - 4);
  ctx.lineTo(cx - halfW + 10, cy + 2);
  ctx.closePath();
  ctx.fill();

  // หางขวา
  ctx.beginPath();
  ctx.moveTo(cx + halfW, cy - halfH + 8);
  ctx.lineTo(cx + halfW - 44, cy - halfH + 8);
  ctx.lineTo(cx + halfW - 36, cy + 2);
  ctx.lineTo(cx + halfW - 44, cy + halfH - 4);
  ctx.lineTo(cx + halfW, cy + halfH - 4);
  ctx.lineTo(cx + halfW - 10, cy + 2);
  ctx.closePath();
  ctx.fill();

  // แถบกลางไล่สีทอง
  const bandW = w - 72;
  const bandH = h - 12;
  const bandX = cx - bandW / 2;
  const bandY = cy - bandH / 2 - 2;

  const grad = ctx.createLinearGradient(bandX, bandY, bandX, bandY + bandH);
  grad.addColorStop(0, '#FBBF24');
  grad.addColorStop(0.5, '#F59E0B');
  grad.addColorStop(1, '#D97706');
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.roundRect(bandX, bandY, bandW, bandH, 6);
  ctx.fill();

  // เส้นไฮไลต์สีขาวด้านบนของโบว์
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.roundRect(bandX + 4, bandY + 4, bandW - 8, 3.5, 1.5);
  ctx.fill();

  // เพชรสีขาวตรงกลางโบว์
  const dCy = bandY + bandH / 2;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  ctx.beginPath();
  ctx.moveTo(cx, dCy - 9);
  ctx.lineTo(cx + 8, dCy);
  ctx.lineTo(cx, dCy + 9);
  ctx.lineTo(cx - 8, dCy);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// วาดลวดลายสี่เหลี่ยมเรขาคณิตตรงมุมล่าง
function drawCornerPatterns(ctx: CanvasRenderingContext2D, includeRight = false) {
  ctx.save();
  const colors = [
    ['#003C73', '#0072CC', '#F59E0B', '#ABDAFF'],
    ['#0072CC', '#FBBF24', 'rgba(171, 218, 255, 0.7)'],
    ['#008FFF', 'rgba(171, 218, 255, 0.6)'],
    ['rgba(254, 243, 199, 0.7)'],
  ];

  const sq = 25;
  const gap = 4;

  // วาดมุมซ้ายล่าง
  const baseX = 52;
  const baseY = CANVAS_H - 52;

  for (let row = 0; row < colors.length; row++) {
    const rColors = colors[row];
    for (let col = 0; col < rColors.length; col++) {
      ctx.fillStyle = rColors[col];
      const x = baseX + col * (sq + gap);
      const y = baseY - (row + 1) * (sq + gap);
      ctx.fillRect(x, y, sq, sq);
    }
  }

  // วาดมุมขวาล่างเฉพาะเมื่อไม่มี QR Code ทับอยู่
  if (includeRight) {
    const baseXR = CANVAS_W - 52;
    for (let row = 0; row < colors.length; row++) {
      const rColors = colors[row];
      for (let col = 0; col < rColors.length; col++) {
        ctx.fillStyle = rColors[col];
        const x = baseXR - (col + 1) * (sq + gap);
        const y = baseY - (row + 1) * (sq + gap);
        ctx.fillRect(x, y, sq, sq);
      }
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
