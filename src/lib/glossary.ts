// ============================================================================
//  Glossary — อภิธานศัพท์เรื่องบุหรี่ไฟฟ้า
//  ใช้ในแท็บ "ศัพท์" ของหน้า Knowledge — ค้นหาได้ + กรองตามหมวด
// ============================================================================

export type GlossaryCategory =
  | 'chemical'   // 🧪 สารเคมี
  | 'health'     // 🫁 สุขภาพ
  | 'product'    // 📱 ผลิตภัณฑ์
  | 'behavior'   // 🧠 พฤติกรรม
  | 'legal'      // ⚖️ กฎหมาย
  | 'cessation'; // 🚭 เลิกบุหรี่

export interface GlossaryTerm {
  term: string;
  emoji: string;
  def: string;
  source: string;
  category: GlossaryCategory;
}

export const CATEGORY_INFO: Record<GlossaryCategory, { label: string; emoji: string; color: string }> = {
  chemical:  { label: 'สารเคมี',     emoji: '🧪', color: 'danger' },
  health:    { label: 'สุขภาพ',      emoji: '🫁', color: 'detective' },
  product:   { label: 'ผลิตภัณฑ์',   emoji: '📱', color: 'warning' },
  behavior:  { label: 'พฤติกรรม',    emoji: '🧠', color: 'mint' },
  legal:     { label: 'กฎหมาย',      emoji: '⚖️', color: 'detective' },
  cessation: { label: 'เลิกบุหรี่',  emoji: '🚭', color: 'mint' },
};

export const GLOSSARY: GlossaryTerm[] = [
  // ===== สารเคมี (chemical) =====
  {
    term: 'นิโคติน (Nicotine)',
    emoji: '🧪',
    def: 'สารเสพติดหลักในบุหรี่ไฟฟ้า ทำให้สมองหลั่ง dopamine และติดง่าย — vape 1 พอต ≈ บุหรี่ 1 ซอง (20 มวน)',
    source: 'NIDA / FDA Vape Nicotine Analysis 2023',
    category: 'chemical',
  },
  {
    term: 'Nicotine Salt (นิโคตินซอลต์)',
    emoji: '🧂',
    def: 'นิโคตินสูตรเกลือ ดูดซึมเร็วกว่า นิโคตินอิสระ 3 เท่า ทำให้ติดเร็วและรุนแรงขึ้น — เป็นเทคโนโลยีที่ทำให้ JUUL ดังในวัยรุ่น',
    source: 'Stanford School of Medicine — Tobacco Prevention Toolkit',
    category: 'chemical',
  },
  {
    term: 'PG / VG',
    emoji: '💧',
    def: 'Propylene Glycol และ Vegetable Glycerin — ตัวทำละลายในน้ำยา เมื่อโดนความร้อนสูงเกิดสารระคายเคืองทางเดินหายใจ',
    source: 'FDA E-Liquid Ingredients Database',
    category: 'chemical',
  },
  {
    term: 'ฟอร์มาลดีไฮด์ (Formaldehyde)',
    emoji: '☠️',
    def: 'สารก่อมะเร็งที่เกิดเมื่อน้ำยาถูกความร้อนสูง — เป็นสารชนิดเดียวกับที่ใช้ดองศพ',
    source: 'NEJM 2015 — Hidden Formaldehyde in E-Cigarette Vapor',
    category: 'chemical',
  },
  {
    term: 'Acrolein (อะโครลีน)',
    emoji: '🔥',
    def: 'สารระคายเคืองทางเดินหายใจรุนแรง เกิดจาก VG ที่ถูกความร้อนสูง — ทำให้เยื่อบุปอดอักเสบเฉียบพลัน',
    source: 'American Journal of Preventive Medicine 2017',
    category: 'chemical',
  },
  {
    term: 'Diacetyl (ปอดป๊อปคอร์น)',
    emoji: '🍿',
    def: 'สารแต่งกลิ่นเนย/หวาน ทำให้เนื้อปอดเป็นแผลเป็นถาวร เรียกอาการนี้ว่า "ปอดป๊อปคอร์น" (popcorn lung)',
    source: 'American Lung Association — Diacetyl',
    category: 'chemical',
  },
  {
    term: 'Vitamin E Acetate',
    emoji: '🛢️',
    def: 'สารเติมแต่งในน้ำยา THC ตลาดมืด — เป็นสาเหตุหลักของการระบาด EVALI ในสหรัฐฯ ปี 2019',
    source: 'CDC EVALI Investigation 2020',
    category: 'chemical',
  },
  {
    term: 'โลหะหนัก (Heavy Metals)',
    emoji: '⚙️',
    def: 'ตะกั่ว นิกเกิล โครเมียม จากขดลวดทำความร้อน หลุดปนในไอ สะสมในไตและสมอง',
    source: 'Environmental Health Perspectives 2018',
    category: 'chemical',
  },
  {
    term: 'อนุภาคขนาดเล็ก (PM2.5)',
    emoji: '🌫️',
    def: 'ฝุ่นจิ๋วในไอ vape ขนาด < 2.5 ไมครอน — เล็กพอจะผ่านถุงลมเข้าสู่กระแสเลือด ทำให้เสี่ยงโรคหัวใจและสมอง',
    source: 'Journal of Aerosol Science 2020',
    category: 'chemical',
  },

  // ===== สุขภาพ (health) =====
  {
    term: 'EVALI',
    emoji: '🫁',
    def: 'โรคปอดอักเสบเฉียบพลันจากการสูบบุหรี่ไฟฟ้า (E-cigarette/Vaping Use-Associated Lung Injury) ลามเร็วใน 2-3 วัน อาจต้องใช้เครื่องช่วยหายใจ',
    source: 'CDC EVALI Outbreak Report 2019-2023',
    category: 'health',
  },
  {
    term: 'COPD (ปอดอุดกั้นเรื้อรัง)',
    emoji: '🫀',
    def: 'โรคทางเดินหายใจเรื้อรัง หายใจสั้น ไอเรื้อรัง — vape ทำให้เสี่ยงเพิ่ม 75% เทียบคนไม่สูบ',
    source: 'BMJ Tobacco Control 2021',
    category: 'health',
  },
  {
    term: 'หอบหืด (Asthma)',
    emoji: '😮‍💨',
    def: 'ไอ vape กระตุ้นให้หอบหืดกำเริบ — วัยรุ่นที่ vape มีโอกาสเป็นหอบหืดเพิ่ม 50%',
    source: 'JAMA Pediatrics 2019',
    category: 'health',
  },
  {
    term: 'โรคหัวใจ (Cardiovascular Disease)',
    emoji: '💔',
    def: 'นิโคตินทำให้หัวใจเต้นเร็ว ความดันสูง หลอดเลือดตีบ — เสี่ยงหัวใจวายเพิ่ม 34% สำหรับผู้ใช้รายวัน',
    source: 'American Heart Association 2019',
    category: 'health',
  },
  {
    term: 'มะเร็ง (Cancer Risk)',
    emoji: '🦠',
    def: 'สาร formaldehyde, acetaldehyde, โลหะหนักในไอเป็นสารก่อมะเร็ง — เพิ่มเสี่ยงมะเร็งปอด ช่องปาก กระเพาะปัสสาวะ',
    source: 'IARC Monograph — Tobacco Smoke 2023',
    category: 'health',
  },
  {
    term: 'สมองวัยรุ่น (Adolescent Brain)',
    emoji: '🧠',
    def: 'สมองพัฒนาถึงอายุ 25 ปี — นิโคตินทำลายการสร้าง synapse เสียสมาธิ ความจำ การควบคุมอารมณ์',
    source: 'U.S. Surgeon General Report 2016',
    category: 'health',
  },
  {
    term: 'Dopamine (โดพามีน)',
    emoji: '✨',
    def: 'สารสื่อประสาท "ความสุข/รางวัล" ในสมอง — นิโคตินไปกระตุ้นจนสมองเรียนรู้ว่า "ต้องการนิโคติน" = ต้นกำเนิดการเสพติด',
    source: 'NIDA — Tobacco, Nicotine & E-Cigarettes',
    category: 'health',
  },
  {
    term: 'ไอมือสอง (Secondhand Vapor)',
    emoji: '💨',
    def: 'ไอที่คนข้างๆ สูดเข้าไป มีนิโคติน + โลหะหนัก + สารเคมี ไม่ใช่ "ไอน้ำ" อย่างที่โฆษณาอ้าง',
    source: 'American Lung Association — Secondhand Vapor 2023',
    category: 'health',
  },

  // ===== ผลิตภัณฑ์ (product) =====
  {
    term: 'พอต (Pod)',
    emoji: '🔋',
    def: 'ตลับน้ำยาบุหรี่ไฟฟ้าแบบเปลี่ยนได้ มีนิโคตินเข้มข้นสูง 1 พอตให้นิโคตินเท่าบุหรี่ราว 1 ซอง',
    source: 'Truth Initiative — Pod-Based E-Cigarettes',
    category: 'product',
  },
  {
    term: 'Disposable (ใช้แล้วทิ้ง)',
    emoji: '🗑️',
    def: 'บุหรี่ไฟฟ้าแบบใช้แล้วทิ้ง ราคาถูก สีสันสดใส รสหวาน — ออกแบบดึงดูดวัยรุ่นโดยเฉพาะ',
    source: 'CDC Youth Tobacco Survey 2023',
    category: 'product',
  },
  {
    term: 'JUUL',
    emoji: '💾',
    def: 'แบรนด์ Pod ที่ดังที่สุดในสหรัฐฯ รูปร่างเหมือน USB ซ่อนได้ในห้องเรียน — ถูกฟ้องกรณีโฆษณาผิดกับวัยรุ่น จ่ายค่าปรับกว่า 1,000 ล้าน USD',
    source: 'FDA JUUL Marketing Denial Order 2022',
    category: 'product',
  },
  {
    term: 'Mod / Vape Pen',
    emoji: '🖊️',
    def: 'อุปกรณ์ vape แบบใหญ่ ปรับวัตต์/อุณหภูมิได้ มี tank เติมน้ำยาเอง — ความร้อนสูงกว่า pod ทำให้สารพิษเยอะกว่า',
    source: 'NIDA E-Cigarettes Drug Facts',
    category: 'product',
  },
  {
    term: 'น้ำยา (E-liquid / E-juice)',
    emoji: '🧴',
    def: 'ของเหลวที่เติมในบุหรี่ไฟฟ้า ประกอบด้วย PG, VG, นิโคติน, สารแต่งกลิ่น/รส — ความเข้มข้นนิโคติน 3–60 mg/ml',
    source: 'WHO Tobacco Product Regulation Report',
    category: 'product',
  },
  {
    term: 'Coil (ขดลวดความร้อน)',
    emoji: '🔥',
    def: 'ส่วนทำความร้อนในอุปกรณ์ — เมื่อร้อนเกิน 200°C ทำให้น้ำยาเปลี่ยนเป็นสารพิษเช่น formaldehyde และปล่อยโลหะหนัก',
    source: 'Environmental Science & Technology 2017',
    category: 'product',
  },

  // ===== พฤติกรรม (behavior) =====
  {
    term: 'Withdrawal (อาการขาด)',
    emoji: '😣',
    def: 'อาการเมื่อไม่ได้นิโคติน: หงุดหงิด สมาธิหลุด หิว นอนไม่หลับ — สัญญาณว่าติดแล้ว',
    source: 'NIDA — Nicotine Withdrawal',
    category: 'behavior',
  },
  {
    term: 'Tolerance (ดื้อยา)',
    emoji: '📈',
    def: 'ร่างกายชินกับนิโคติน ทำให้ต้องสูบเพิ่มขึ้นเรื่อยๆ ถึงจะรู้สึก — เกิดขึ้นใน 2-4 สัปดาห์แรก',
    source: 'NIDA — Tobacco/Nicotine and E-Cigs',
    category: 'behavior',
  },
  {
    term: 'Gateway Effect (ทางผ่านยาเสพติด)',
    emoji: '🚪',
    def: 'วัยรุ่นที่ vape มีโอกาสไปสูบบุหรี่จริง 4 เท่า และทดลองกัญชา/ยาเสพติด 3.5 เท่า — bridge สู่ยาแรง',
    source: 'Pediatrics Journal 2018 — Meta-analysis',
    category: 'behavior',
  },
  {
    term: 'Dual Use (ใช้ทั้งคู่)',
    emoji: '↔️',
    def: 'ใช้ทั้ง vape และบุหรี่ธรรมดา — ไม่ได้ลดความเสี่ยง แต่เพิ่มเป็น 2 เท่า (สารพิษซ้อนกัน)',
    source: 'Tobacco Control Journal 2020',
    category: 'behavior',
  },
  {
    term: 'การตลาดแฝง (Stealth Marketing)',
    emoji: '🎭',
    def: 'การโฆษณาที่ไม่บอกตรงๆ เช่น ใช้ influencer, emoji ลับ (🍃💨), รสผลไม้ ดึงดูดเยาวชนแบบเลี่ยงกฎหมาย',
    source: 'Truth Initiative — Social Media Tobacco Marketing',
    category: 'behavior',
  },
  {
    term: 'Peer Pressure (แรงกดดันจากเพื่อน)',
    emoji: '👥',
    def: 'การถูกชวน/กดดันจากเพื่อนให้ลอง — สาเหตุอันดับ 1 ของการเริ่มสูบในวัยรุ่นไทย (62%)',
    source: 'สำนักงานสถิติแห่งชาติ — สำรวจพฤติกรรมสูบบุหรี่ 2566',
    category: 'behavior',
  },

  // ===== กฎหมาย (legal) =====
  {
    term: 'ประกาศกระทรวงพาณิชย์ 2557',
    emoji: '📜',
    def: 'ประกาศห้ามนำเข้าบุหรี่ไฟฟ้า/บารากู่และอุปกรณ์ทุกชนิดในไทย — มีผลตั้งแต่ 27 พ.ย. 2557',
    source: 'ราชกิจจานุเบกษา 2557',
    category: 'legal',
  },
  {
    term: 'พ.ร.บ.ศุลกากร 2560',
    emoji: '⚖️',
    def: 'มาตรา 244: ครอบครองสินค้าหนีภาษี (รวมบุหรี่ไฟฟ้า) มีโทษจำคุก ≤ 5 ปี / ปรับ ≤ 4 เท่ามูลค่า / ทั้งจำทั้งปรับ',
    source: 'พระราชบัญญัติศุลกากร พ.ศ. 2560',
    category: 'legal',
  },
  {
    term: 'พ.ร.บ.ควบคุมผลิตภัณฑ์ยาสูบ 2560',
    emoji: '📋',
    def: 'ห้ามขาย/ครอบครองเพื่อขายบุหรี่ไฟฟ้า — โทษปรับ ≤ 40,000 บาท หรือจำคุก ≤ 6 เดือน',
    source: 'พระราชบัญญัติควบคุมผลิตภัณฑ์ยาสูบ พ.ศ. 2560',
    category: 'legal',
  },
  {
    term: 'พ.ร.บ.คุ้มครองผู้บริโภค',
    emoji: '🛡️',
    def: 'บุหรี่ไฟฟ้าเป็นสินค้าที่ห้ามขาย ผู้ขายมีโทษทั้งจำทั้งปรับ — แจ้งเบาะแสได้ที่ สคบ. 1166',
    source: 'พระราชบัญญัติคุ้มครองผู้บริโภค พ.ศ. 2522',
    category: 'legal',
  },

  // ===== เลิกบุหรี่ (cessation) =====
  {
    term: 'สายเลิกบุหรี่ 1600',
    emoji: '📞',
    def: 'สายเลิกบุหรี่แห่งชาติ โทรฟรี 24 ชั่วโมง ปรึกษากับนักจิตวิทยา ติดตามผลฟรี เก็บข้อมูลเป็นความลับ',
    source: 'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ',
    category: 'cessation',
  },
  {
    term: 'NRT (Nicotine Replacement)',
    emoji: '🩹',
    def: 'การใช้นิโคตินขนาดต่ำ (แผ่นแปะ/หมากฝรั่ง/ลูกอม) ช่วยเลิก — ลดอาการขาดได้ 50–70% เทียบ "หักดิบ"',
    source: 'Cochrane Review — NRT for Smoking Cessation 2018',
    category: 'cessation',
  },
  {
    term: 'CBT (บำบัดความคิด-พฤติกรรม)',
    emoji: '🧘',
    def: 'การปรึกษานักจิตวิทยา ปรับความคิด-พฤติกรรมที่กระตุ้นการสูบ — เพิ่มอัตราเลิกสำเร็จเป็น 2 เท่า',
    source: 'WHO Toolkit for Tobacco Cessation',
    category: 'cessation',
  },
  {
    term: 'Cold Turkey (หักดิบ)',
    emoji: '🦃',
    def: 'การหยุดสูบทันทีโดยไม่ใช้ยา/NRT — อัตราเลิกสำเร็จเพียง 3–7% แต่ก็เป็นวิธีที่หลายคนใช้',
    source: 'JAMA Internal Medicine 2016',
    category: 'cessation',
  },
];
