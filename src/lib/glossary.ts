// ============================================================================
//  Glossary — อภิธานศัพท์เรื่องบุหรี่ไฟฟ้า
//  ใช้ในแท็บ "ศัพท์" ของหน้า Knowledge — ค้นหาได้
// ============================================================================

export interface GlossaryTerm {
  term: string;          // คำศัพท์
  emoji: string;
  def: string;           // คำอธิบายสั้น เข้าใจง่าย
  source: string;        // แหล่งอ้างอิง
}

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: 'นิโคติน (Nicotine)',
    emoji: '🧪',
    def: 'สารเสพติดหลักในบุหรี่ไฟฟ้า ทำให้สมองหลั่ง dopamine และติดง่าย — vape 1 พอต ≈ บุหรี่ 1 ซอง (20 มวน)',
    source: 'NIDA / FDA Vape Nicotine Analysis 2023',
  },
  {
    term: 'EVALI',
    emoji: '🫁',
    def: 'โรคปอดอักเสบเฉียบพลันจากการสูบบุหรี่ไฟฟ้า (E-cigarette/Vaping Use-Associated Lung Injury) ลามเร็วใน 2-3 วัน อาจต้องใช้เครื่องช่วยหายใจ',
    source: 'CDC EVALI Outbreak Report 2019-2023',
  },
  {
    term: 'Dopamine (โดพามีน)',
    emoji: '🧠',
    def: 'สารสื่อประสาท "ความสุข/รางวัล" ในสมอง — นิโคตินไปกระตุ้นจนสมองเรียนรู้ว่า "ต้องการนิโคติน" = ต้นกำเนิดการเสพติด',
    source: 'NIDA — Tobacco, Nicotine & E-Cigarettes',
  },
  {
    term: 'พอต (Pod)',
    emoji: '🔋',
    def: 'ตลับน้ำยาบุหรี่ไฟฟ้าแบบเปลี่ยนได้ มีนิโคตินเข้มข้นสูง 1 พอตให้นิโคตินเท่าบุหรี่ราว 1 ซอง',
    source: 'Truth Initiative — Pod-Based E-Cigarettes',
  },
  {
    term: 'Disposable (ใช้แล้วทิ้ง)',
    emoji: '🗑️',
    def: 'บุหรี่ไฟฟ้าแบบใช้แล้วทิ้ง ราคาถูก สีสันสดใส รสหวาน — ออกแบบดึงดูดวัยรุ่นโดยเฉพาะ',
    source: 'CDC Youth Tobacco Survey 2023',
  },
  {
    term: 'PG / VG',
    emoji: '💧',
    def: 'Propylene Glycol และ Vegetable Glycerin — ตัวทำละลายในน้ำยา เมื่อโดนความร้อนสูงเกิดสารระคายเคืองทางเดินหายใจ',
    source: 'FDA E-Liquid Ingredients Database',
  },
  {
    term: 'ฟอร์มาลดีไฮด์ (Formaldehyde)',
    emoji: '☠️',
    def: 'สารก่อมะเร็งที่เกิดเมื่อน้ำยาถูกความร้อนสูง — เป็นสารชนิดเดียวกับที่ใช้ดองศพ',
    source: 'NEJM 2015 — Hidden Formaldehyde in E-Cigarette Vapor',
  },
  {
    term: 'Diacetyl (ปอดป๊อปคอร์น)',
    emoji: '🍿',
    def: 'สารแต่งกลิ่นเนย/หวาน ทำให้เนื้อปอดเป็นแผลเป็นถาวร เรียกอาการนี้ว่า "ปอดป๊อปคอร์น" (popcorn lung)',
    source: 'American Lung Association — Diacetyl',
  },
  {
    term: 'โลหะหนัก (Heavy Metals)',
    emoji: '⚙️',
    def: 'ตะกั่ว นิกเกิล โครเมียม จากขดลวดทำความร้อน หลุดปนในไอ สะสมในไตและสมอง',
    source: 'Environmental Health Perspectives 2018',
  },
  {
    term: 'Withdrawal (อาการขาด)',
    emoji: '😣',
    def: 'อาการเมื่อไม่ได้นิโคติน: หงุดหงิด สมาธิหลุด หิว นอนไม่หลับ — สัญญาณว่าติดแล้ว',
    source: 'NIDA — Nicotine Withdrawal',
  },
  {
    term: 'ไอมือสอง (Secondhand Vapor)',
    emoji: '💨',
    def: 'ไอที่คนข้างๆ สูดเข้าไป มีนิโคติน + โลหะหนัก + สารเคมี ไม่ใช่ "ไอน้ำ" อย่างที่โฆษณาอ้าง',
    source: 'American Lung Association — Secondhand Vapor 2023',
  },
  {
    term: 'การตลาดแฝง (Stealth Marketing)',
    emoji: '🎭',
    def: 'การโฆษณาที่ไม่บอกตรงๆ เช่น ใช้ influencer, emoji ลับ (🍃💨), รสผลไม้ ดึงดูดเยาวชนแบบเลี่ยงกฎหมาย',
    source: 'Truth Initiative — Social Media Tobacco Marketing',
  },
  {
    term: 'สายเลิกบุหรี่ 1600',
    emoji: '📞',
    def: 'สายเลิกบุหรี่แห่งชาติ โทรฟรี 24 ชั่วโมง ปรึกษากับนักจิตวิทยา ติดตามผลฟรี เก็บข้อมูลเป็นความลับ',
    source: 'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ',
  },
];
