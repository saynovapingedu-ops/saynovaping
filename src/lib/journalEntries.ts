// ============================================================================
//  Journal Entries — ข้อมูล "แฟ้มคดี" ของแต่ละด่าน
//
//  แทนระบบห้องเดิม: ผู้เล่นจบด่าน → ปลดล็อกหน้าสมุดบันทึก
//  แต่ละหน้ามี: stamp (ผ่าน) / หลักฐาน / ข้อเท็จจริงที่เรียนรู้
// ============================================================================

export interface JournalEntry {
  /** ตรงกับ scenario id */
  id: number;
  caseNumber: string;        // เช่น "CASE-01"
  stamp: string;             // emoji ตราประทับเมื่อผ่าน
  evidence: string;          // hint emoji แทน "หลักฐาน" ที่เก็บได้
  insight: string;           // ข้อเท็จจริง 1 ประโยค สรุปสั้น
  insightSource?: string;    // ที่มา
  tag: string;               // ป้ายสี เช่น "Hero Arc"
}

export const JOURNAL_ENTRIES: JournalEntry[] = [
  { id: 1, caseNumber: 'CASE-01', stamp: '🔍', evidence: '🪧',
    insight: 'โฆษณา vape ใช้รสผลไม้-สี-สื่อโซเชียล ดึงดูดวัยรุ่น แต่ซ่อนนิโคติน',
    insightSource: 'WHO Tobacco Marketing Report 2023', tag: 'Hero Arc' },
  { id: 2, caseNumber: 'CASE-02', stamp: '✋', evidence: '🚻',
    insight: 'สูตรปฏิเสธ 3 ขั้น: "ไม่" ชัด → บอกเหตุผลสั้น → เสนอทางเลือก',
    insightSource: 'American Lung Association — Refusal Skills', tag: 'Hero Arc' },
  { id: 3, caseNumber: 'CASE-03', stamp: '🎂', evidence: '🍓',
    insight: 'รสหวานช่วยให้เริ่มสูบง่ายขึ้น 4 เท่า — เป็นเหตุผลที่ห้ามขายในไทย',
    insightSource: 'CDC Tobacco Use Among Youth 2023', tag: 'Hero Arc' },
  { id: 4, caseNumber: 'CASE-04', stamp: '🏬', evidence: '🪪',
    insight: 'Broken Record: พูดประโยคเดิมสงบๆ — คนตื๊อจะเลิกได้เอง',
    insightSource: 'Manuel J. Smith — When I Say No, I Feel Guilty', tag: 'Hero Arc' },
  { id: 5, caseNumber: 'CASE-05', stamp: '💬', evidence: '📱',
    insight: 'DM จากคนแปลกหน้า + ขายของผิดกฎหมาย = หลบออก, แจ้งผู้ใหญ่',
    insightSource: 'พ.ร.บ. คอมพิวเตอร์ + สคบ.', tag: 'Hero Arc' },
  { id: 6, caseNumber: 'CASE-06', stamp: '🤝', evidence: '🌿',
    insight: 'เพื่อนเปราะบาง → ฟังก่อน, ไม่ตัดสิน, ชวนทำกิจกรรมอื่นแทน',
    insightSource: 'WHO Adolescent Mental Health Guideline', tag: 'Hero Arc' },
  { id: 7, caseNumber: 'CASE-07', stamp: '⚖️', evidence: '📜',
    insight: 'ไทยห้ามนำเข้า/ขาย/ครอบครอง vape ตั้งแต่ปี 2557 — มีโทษจริง',
    insightSource: 'ประกาศกระทรวงพาณิชย์ 2557 + พ.ร.บ.ศุลกากร 2560', tag: 'Hero Arc' },
  { id: 8, caseNumber: 'CASE-08', stamp: '🏆', evidence: '🏢',
    insight: 'จบ Hero Arc — รับ Certificate ได้! การตลาด vape มีรูปแบบซ่อน',
    insightSource: 'Vapor Corp Whistleblower Files (fictional)', tag: 'Hero Arc' },
  { id: 9, caseNumber: 'CASE-09', stamp: '🩺', evidence: '🆘',
    insight: 'สูตร 5A ช่วยเพื่อนเลิก: Ask → Advise → Assess → Assist → Arrange',
    insightSource: 'U.S. Public Health Service Tobacco Cessation', tag: 'Master Arc' },
  { id: 10, caseNumber: 'CASE-10', stamp: '🎬', evidence: '🔓',
    insight: 'TikTok ใช้ hashtag/emoji ลับ (e.g. 🍃, 💨) ขายของผิดกฎหมาย',
    insightSource: 'Truth Initiative — Social Media Tobacco Marketing', tag: 'Master Arc' },
  { id: 11, caseNumber: 'CASE-11', stamp: '🏠', evidence: '👨‍👩‍👧',
    insight: 'พี่/พ่อแม่ในบ้านสูบ → คุยตรง อย่าเทศนา + ขอผู้ใหญ่อีกคนช่วย',
    insightSource: 'CDC Family Conversations About Tobacco', tag: 'Master Arc' },
  { id: 12, caseNumber: 'CASE-12', stamp: '🎓', evidence: '📚',
    insight: 'นักสืบที่เก่งสุด = ส่งต่อความรู้ให้รุ่นน้อง — ทักษะคูณ',
    insightSource: 'Peer Education Effectiveness — WHO 2022', tag: 'Master Arc' },
  { id: 13, caseNumber: 'CASE-13', stamp: '⚠️', evidence: '📊',
    insight: '"ความเสี่ยง" มี 4 ระดับ — vape เด็ก = สูงสุด เพราะสมองยังโต',
    insightSource: 'U.S. Surgeon General Report 2023', tag: 'Pro Arc' },
  { id: 14, caseNumber: 'CASE-14', stamp: '🤳', evidence: '👀',
    insight: '"ปัดผ่าน" ก่อนคิด = อันตราย — ฝึกหยุดถามตัวเอง 3 วินาที',
    insightSource: 'Stanford SHEG Civic Online Reasoning', tag: 'Pro Arc' },
  { id: 15, caseNumber: 'CASE-15', stamp: '🧩', evidence: '🗝️',
    insight: 'ภัย-เครื่องมือ-ทักษะ จับคู่กันได้ — การจำเป็นระบบ ไม่ใช่ท่อง',
    insightSource: 'Cognitive Load Theory — Sweller 1988', tag: 'Pro Arc' },
];

export function getJournalEntry(id: number): JournalEntry | undefined {
  return JOURNAL_ENTRIES.find(e => e.id === id);
}
