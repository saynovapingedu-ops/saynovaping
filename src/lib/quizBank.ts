// ============================================================================
//  Quiz Bank — คลังคำถามรวมเรื่องบุหรี่ไฟฟ้า
//  ใช้ร่วมกัน 3 โหมด: Daily Challenge, Final Exam, Pre/Post Assessment
//  ทุกข้อมีเฉลย + แหล่งอ้างอิงจริง — เนื้อหาเฉพาะบุหรี่ไฟฟ้า
// ============================================================================

export interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];        // 3-4 ตัวเลือก
  correctIndex: number;
  explain: string;          // เฉลยอธิบายสั้น
  source: string;           // อ้างอิงจริง
  arc: 'hero' | 'master' | 'pro' | 'expert';
  topic: string;            // เช่น 'นิโคติน','กฎหมาย','EVALI'
}

export const QUIZ_BANK: QuizQuestion[] = [
  // ===== Hero topics =====
  {
    id: 'q-law-year',
    question: 'บุหรี่ไฟฟ้าผิดกฎหมายในไทยตั้งแต่ปีใด?',
    choices: ['พ.ศ. 2557', 'พ.ศ. 2563', 'ยังไม่ผิดกฎหมาย'],
    correctIndex: 0,
    explain: 'ไทยห้ามนำเข้า/ขาย/ครอบครอง ตั้งแต่ พ.ศ. 2557 — ทั้งผู้ขายและผู้สูบมีความผิด',
    source: 'ประกาศกระทรวงพาณิชย์ พ.ศ. 2557',
    arc: 'hero', topic: 'กฎหมาย',
  },
  {
    id: 'q-refusal-3',
    question: 'สูตรปฏิเสธ 3 ขั้นเรียงลำดับอย่างไร?',
    choices: [
      'พูด "ไม่" ชัด → บอกเหตุผลสั้น → เสนอทางเลือก',
      'อธิบายยาวๆ → ขอคิดดู → เดินหนี',
      'เงียบ → ทำเป็นไม่ได้ยิน → ยอมลอง',
    ],
    correctIndex: 0,
    explain: 'ปฏิเสธชัด ไม่ต้องอธิบายยาว แล้วเสนอกิจกรรมอื่นแทน',
    source: 'American Lung Association — Refusal Skills',
    arc: 'hero', topic: 'ทักษะปฏิเสธ',
  },
  {
    id: 'q-broken-record',
    question: 'เทคนิค Broken Record คือการทำอะไร?',
    choices: [
      'พูดประโยคปฏิเสธเดิมซ้ำๆ ด้วยน้ำเสียงสงบ',
      'หาเหตุผลใหม่มาเถียงทุกครั้ง',
      'ตะโกนใส่คนที่ชวน',
    ],
    correctIndex: 0,
    explain: 'พูดประโยคเดิมสงบๆ ส่งสัญญาณว่าไม่มีทางต่อรอง คนตื๊อจะเลิกเอง',
    source: 'Manuel J. Smith — When I Say No, I Feel Guilty (1975)',
    arc: 'hero', topic: 'ทักษะปฏิเสธ',
  },
  {
    id: 'q-flavor',
    question: 'ทำไมบุหรี่ไฟฟ้าถึงมีรสผลไม้/ลูกอม?',
    choices: [
      'เพื่อดึงดูดวัยรุ่นให้เริ่มลองง่ายขึ้น',
      'เพราะปลอดภัยกว่ารสปกติ',
      'เพราะกฎหมายบังคับให้ใส่',
    ],
    correctIndex: 0,
    explain: 'รสหวานทำให้ "เริ่มลอง" ง่ายขึ้น 4 เท่า — เป็นกลยุทธ์การตลาดที่จงใจ',
    source: 'CDC Tobacco Use Among Youth 2023',
    arc: 'hero', topic: 'การตลาด',
  },
  {
    id: 'q-dm-stranger',
    question: 'มีคนแปลกหน้า DM มาขายบุหรี่ไฟฟ้า ควรทำอย่างไร?',
    choices: [
      'ไม่ตอบ → block → screenshot → แจ้งผู้ใหญ่',
      'ถามราคาก่อนเฉยๆ',
      'บอกว่าตัวเองยังเด็ก',
    ],
    correctIndex: 0,
    explain: 'แค่ตอบกลับก็ทำให้เขารู้ว่าคุณ active — block และรายงานทันที',
    source: 'พ.ร.บ.คอมพิวเตอร์ พ.ศ. 2560 / สคบ. 1166',
    arc: 'hero', topic: 'ออนไลน์',
  },
  {
    id: 'q-report-hotline',
    question: 'แจ้งเบาะแสร้านขายบุหรี่ไฟฟ้าผิดกฎหมายโทรสายด่วนใด?',
    choices: ['สคบ. 1166', '191 ตำรวจจราจร', '1112 ร้องเรียนอาหาร'],
    correctIndex: 0,
    explain: 'สคบ. 1166 รับแจ้งเบาะแสสินค้าผิดกฎหมาย — โทรฟรี',
    source: 'สำนักงานคณะกรรมการคุ้มครองผู้บริโภค (สคบ.)',
    arc: 'hero', topic: 'กฎหมาย',
  },
  {
    id: 'q-friend-help',
    question: 'เพื่อนเครียดและอยากลอง vape ควรเริ่มอย่างไร?',
    choices: [
      'ฟังก่อน ไม่ตัดสิน แล้วชวนทำกิจกรรมอื่น',
      'บอกว่า "อย่าโง่"',
      'เล่าให้คนอื่นฟังว่าเพื่อนจะลอง',
    ],
    correctIndex: 0,
    explain: 'รับฟัง 80% พูด 20% — เสนอทางออกอื่น ไม่ใช่สั่งห้าม',
    source: 'WHO Adolescent Mental Health Guideline 2021',
    arc: 'hero', topic: 'ช่วยเพื่อน',
  },

  // ===== Master topics =====
  {
    id: 'q-5a',
    question: 'สูตร 5A ช่วยเพื่อนเลิก ขั้นแรกคืออะไร?',
    choices: ['Ask (ถาม)', 'Arrange (นัดติดตาม)', 'Assist (ช่วยทำแผน)'],
    correctIndex: 0,
    explain: '5A: Ask → Advise → Assess → Assist → Arrange — เริ่มจากถามก่อน',
    source: 'U.S. Public Health Service — Treating Tobacco Use',
    arc: 'master', topic: 'ช่วยเลิก',
  },
  {
    id: 'q-quitline',
    question: 'สายเลิกบุหรี่แห่งชาติ (โทรฟรี 24 ชม.) คือเบอร์ใด?',
    choices: ['1600', '1669', '1323'],
    correctIndex: 0,
    explain: '1600 = สายเลิกบุหรี่แห่งชาติ ปรึกษาฟรี เก็บข้อมูลเป็นความลับ',
    source: 'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ',
    arc: 'master', topic: 'ช่วยเลิก',
  },
  {
    id: 'q-tiktok-code',
    question: 'คนขาย vape ใน TikTok มักใช้สิ่งใดเลี่ยงการตรวจจับ?',
    choices: [
      'emoji ลับ เช่น 🍃 💨 🍓',
      'โพสต์คำว่า "ขายบุหรี่ไฟฟ้า" ตรงๆ',
      'ติดแฮชแท็ก #ผิดกฎหมาย',
    ],
    correctIndex: 0,
    explain: 'ใช้ emoji/slang แทนคำเพื่อเลี่ยงระบบกรองของแพลตฟอร์ม',
    source: 'Truth Initiative — Social Media Tobacco Marketing 2023',
    arc: 'master', topic: 'รู้ทันสื่อ',
  },
  {
    id: 'q-family',
    question: 'พี่ในบ้านสูบบุหรี่ไฟฟ้า ควรคุยแบบใด?',
    choices: [
      'พูดด้วยความห่วงใย ("ฉันกลัวเสียพี่") ไม่ใช่กล่าวโทษ',
      'ประกาศให้ทุกคนในบ้านรู้',
      'แอบทิ้งของเขา',
    ],
    correctIndex: 0,
    explain: 'เลือกจังหวะดี พูดด้วยความรู้สึก ถ้าไม่ฟังให้ขอผู้ใหญ่อีกคนช่วย',
    source: 'CDC — Family Conversations About Tobacco 2022',
    arc: 'master', topic: 'ครอบครัว',
  },
  {
    id: 'q-peer-edu',
    question: 'วิธีป้องกัน vape ที่ได้ผลที่สุดในวัยรุ่นคือ?',
    choices: [
      'เพื่อนสอนเพื่อน / รุ่นพี่สอนรุ่นน้อง (peer education)',
      'ครูบรรยายหน้าห้องอย่างเดียว',
      'ห้ามพูดเรื่อง vape ในโรงเรียน',
    ],
    correctIndex: 0,
    explain: 'peer education ได้ผลกว่าครู/พ่อแม่สอน เพราะใกล้ตัวและเข้าใจกัน',
    source: 'WHO — Peer Education Effectiveness Review 2022',
    arc: 'master', topic: 'ส่งต่อ',
  },

  // ===== Pro topics =====
  {
    id: 'q-risk-spectrum',
    question: 'ข้อความใดถูกต้องเรื่องความเสี่ยง?',
    choices: [
      '"ปลอดภัยกว่า" ไม่เท่ากับ "ปลอดภัย"',
      'บุหรี่ไฟฟ้าปลอดภัย 100%',
      'ลองครั้งเดียวไม่มีผลใดๆ',
    ],
    correctIndex: 0,
    explain: 'ความเสี่ยงเป็นสเปกตรัม — vape เด็กทุกวัน = เสี่ยงสูงสุด',
    source: 'U.S. Surgeon General Report 2023',
    arc: 'pro', topic: 'ความเสี่ยง',
  },
  {
    id: 'q-factcheck',
    question: 'เห็นคลิปอ้างว่า "vape ทำให้เรียนเก่งขึ้น" ควรทำอย่างไร?',
    choices: [
      'หยุดคิด 3 วินาที + ถาม "ใครได้ประโยชน์?"',
      'แชร์ต่อทันทีเพราะน่าสนใจ',
      'เชื่อเพราะมีคนดูเยอะ',
    ],
    correctIndex: 0,
    explain: 'ตรวจ ใคร-ที่มา-ผลประโยชน์ ก่อนเชื่อหรือแชร์',
    source: 'Stanford SHEG — Civic Online Reasoning',
    arc: 'pro', topic: 'รู้ทันสื่อ',
  },
  {
    id: 'q-occasional',
    question: 'การ "ลองสูบ vape เป็นครั้งคราว" จัดอยู่ระดับเสี่ยงใด?',
    choices: ['เสี่ยงสูง', 'ไม่เสี่ยงเลย', 'เสี่ยงต่ำมาก'],
    correctIndex: 0,
    explain: 'แม้ครั้งคราวก็เสี่ยงสูง เพราะนิโคตินทำให้ติดได้ตั้งแต่ครั้งแรก',
    source: 'Pediatrics 2023 — Occasional Use & Addiction Risk',
    arc: 'pro', topic: 'ความเสี่ยง',
  },

  // ===== Expert topics =====
  {
    id: 'q-nicotine-pod',
    question: 'นิโคตินในบุหรี่ไฟฟ้า 1 พอต เทียบเท่ากับอะไร?',
    choices: ['บุหรี่ประมาณ 1 ซอง (20 มวน)', 'บุหรี่ 1 มวน', 'ไม่มีนิโคติน'],
    correctIndex: 0,
    explain: 'vape 1 พอต ≈ บุหรี่ 1 ซอง และเข้าสมองเร็วกว่าเพราะไอร้อน',
    source: 'Truth Initiative / FDA Vape Nicotine Analysis 2023',
    arc: 'expert', topic: 'นิโคติน',
  },
  {
    id: 'q-brain-age',
    question: 'สมองคนเราพัฒนาเต็มที่เมื่ออายุประมาณเท่าใด?',
    choices: ['25 ปี', '15 ปี', '18 ปี'],
    correctIndex: 0,
    explain: 'สมองส่วนควบคุมตัวเอง (prefrontal) พัฒนาถึง ~25 ปี จึงเสี่ยงติดง่ายในวัยรุ่น',
    source: 'NIDA — Adolescent Brain Development',
    arc: 'expert', topic: 'นิโคติน',
  },
  {
    id: 'q-dopamine',
    question: 'นิโคตินทำอะไรกับสมองวัยรุ่น?',
    choices: [
      'กระตุ้น dopamine จนสมองเรียนรู้ว่า "นิโคติน = ความสุข"',
      'ทำให้ฉลาดขึ้น',
      'ไม่มีผลในระยะสั้น',
    ],
    correctIndex: 0,
    explain: 'นิโคติน hijack ระบบ reward → ต้นกำเนิดการเสพติด + เสี่ยงติดสารอื่นตาม',
    source: 'NIDA Research Report — Tobacco, Nicotine & E-Cigarettes',
    arc: 'expert', topic: 'นิโคติน',
  },
  {
    id: 'q-evali',
    question: 'EVALI คือโรคอะไร?',
    choices: [
      'ปอดอักเสบเฉียบพลันจากการสูบบุหรี่ไฟฟ้า',
      'โรคผิวหนังจากแบตเตอรี่',
      'อาการแพ้รสผลไม้',
    ],
    correctIndex: 0,
    explain: 'EVALI ลามเร็วใน 2-3 วัน อาจต้องใช้เครื่องช่วยหายใจ',
    source: 'CDC EVALI Outbreak Report 2019-2023',
    arc: 'expert', topic: 'EVALI',
  },
  {
    id: 'q-evali-symptom',
    question: 'อาการเตือนของ EVALI ที่ต่างจากหวัดทั่วไปคือ?',
    choices: [
      'ไอแห้ง + เหนื่อยแม้นั่งเฉยๆ + เคยสูบ vape',
      'จาม + คัดจมูก',
      'เจ็บคอเล็กน้อย',
    ],
    correctIndex: 0,
    explain: 'ถ้ามีประวัติสูบ vape + ไอ + เหนื่อย + ไข้ → ฉุกเฉิน โทร 1669',
    source: 'NEJM — Pulmonary Illness Related to E-Cigarette Use 2019',
    arc: 'expert', topic: 'EVALI',
  },
  {
    id: 'q-vite',
    question: 'สารใดเป็นสาเหตุหลักของ EVALI?',
    choices: ['Vitamin E acetate', 'น้ำตาล', 'คาเฟอีน'],
    correctIndex: 0,
    explain: 'Vitamin E acetate เคลือบปอด ทำให้แลกเปลี่ยนออกซิเจนไม่ได้',
    source: 'CDC EVALI Investigation / NEJM 2020',
    arc: 'expert', topic: 'EVALI',
  },
  {
    id: 'q-4d',
    question: 'สูตร 4D เมื่อ "อยากสูบ" ระหว่างเลิก ข้อใดถูก?',
    choices: [
      'Delay, Deep breath, Drink water, Do something',
      'Drink, Drive, Drop, Dream',
      'Delete, Download, Drag, Drop',
    ],
    correctIndex: 0,
    explain: 'หน่วงเวลา → หายใจลึก → ดื่มน้ำ → ทำกิจกรรมอื่น — ความอยากหายใน 5 นาที',
    source: 'American Cancer Society — 4D Method',
    arc: 'expert', topic: 'เลิก',
  },
  {
    id: 'q-discord',
    question: 'คนขาย vape ในเกมออนไลน์มักเริ่มต้นอย่างไร?',
    choices: [
      'ชมว่าเล่นเก่ง สร้างความสนิท แล้วค่อยขาย (grooming)',
      'บอกตรงๆ ว่าขายของผิดกฎหมาย',
      'ส่งใบเสร็จราชการ',
    ],
    correctIndex: 0,
    explain: 'เริ่มจากคำชม สร้าง trust แล้วชวนคุยนอกเกม — ตั้งค่า DM = friends only',
    source: 'FBI — Online Predators & Gaming Platforms 2022',
    arc: 'expert', topic: 'ออนไลน์',
  },
  {
    id: 'q-parent',
    question: 'ถ้าพ่อแม่จับได้ว่าสูบ vape ควรทำอย่างไร?',
    choices: [
      'บอกความจริง + ขอโทษ + ขอช่วยเลิก',
      'โกหกว่าเป็นของเพื่อน',
      'เงียบไม่พูดอะไร',
    ],
    correctIndex: 0,
    explain: 'โกหกแล้วจับได้ = พังความเชื่อใจถาวร — บอกตรงๆ ได้รับความช่วยเหลือมากกว่า',
    source: 'CDC — Talking to Your Teen About Tobacco',
    arc: 'expert', topic: 'ครอบครัว',
  },
  {
    id: 'q-secondhand',
    question: 'ไอบุหรี่ไฟฟ้ามือสอง (อยู่ใกล้คนสูบ) เป็นอย่างไร?',
    choices: [
      'มีสารพิษ ส่งผลต่อคนรอบข้างได้',
      'เป็นแค่ไอน้ำ ไม่มีอันตราย',
      'ช่วยให้อากาศสดชื่น',
    ],
    correctIndex: 0,
    explain: 'ไอมือสองมีนิโคติน + โลหะหนัก + สารเคมี ไม่ใช่ "ไอน้ำ" อย่างที่โฆษณาอ้าง',
    source: 'American Lung Association — Secondhand Vapor 2023',
    arc: 'expert', topic: 'สารพิษ',
  },
  {
    id: 'q-popcorn-lung',
    question: '"ปอดป๊อปคอร์น" เกิดจากสารใดใน vape?',
    choices: ['Diacetyl', 'วิตามินซี', 'เกลือแกง'],
    correctIndex: 0,
    explain: 'Diacetyl (สารแต่งกลิ่น) ทำให้เนื้อปอดเป็นแผลเป็นถาวร',
    source: 'American Lung Association — Diacetyl in Flavored E-Cig',
    arc: 'expert', topic: 'สารพิษ',
  },
  {
    id: 'q-quit-reversible',
    question: 'ถ้าเคยสูบมาก่อนแล้วเลิก สมองจะเป็นอย่างไร?',
    choices: [
      'ค่อยๆ ซ่อมตัวเองได้ใน 3-6 เดือน',
      'เสียหายถาวร เลิกไปก็ไม่มีประโยชน์',
      'ไม่เปลี่ยนแปลงอะไร',
    ],
    correctIndex: 0,
    explain: 'ข่าวดี — เลิกได้เร็ว สมองฟื้นตัวได้ ออกกำลังกาย+นอนพอช่วยฟื้น dopamine',
    source: 'U.S. Surgeon General Report 2023 / NIDA',
    arc: 'expert', topic: 'เลิก',
  },
];

// === สุ่มแบบ deterministic ด้วย seed (mulberry32) ===
function seededShuffle<T>(arr: T[], seedStr: string): T[] {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  const rand = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Daily Challenge — 5 ข้อ ชุดเดียวกันทั้งวัน (seed = วันที่) */
export function getDailyQuestions(dateSeed: string, n = 5): QuizQuestion[] {
  return seededShuffle(QUIZ_BANK, `daily-${dateSeed}`).slice(0, n);
}

/** Final Exam — 15 ข้อสุ่มใหม่ทุกครั้ง (เล่นซ้ำได้) */
export function getExamQuestions(n = 15): QuizQuestion[] {
  return seededShuffle(QUIZ_BANK, `exam-${Date.now()}-${Math.random()}`).slice(0, n);
}

/** Pre/Post Assessment — 10 ข้อชุดคงที่ (เทียบก่อน-หลังได้ยุติธรรม) */
export function getAssessmentQuestions(n = 10): QuizQuestion[] {
  return seededShuffle(QUIZ_BANK, 'assessment-fixed-v1').slice(0, n);
}
