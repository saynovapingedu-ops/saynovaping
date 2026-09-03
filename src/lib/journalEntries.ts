// ============================================================================
//  Journal Entries — ข้อมูล "แฟ้มคดี" ของแต่ละด่าน
//
//  แทนระบบห้องเดิม: ผู้เล่นจบด่าน → ปลดล็อกหน้าสมุดบันทึก
//  แต่ละหน้ามี: stamp (ผ่าน) / หลักฐาน / ข้อเท็จจริง / ข้อคิด / วิธีแก้ / อ้างอิง
// ============================================================================

export interface JournalEntry {
  /** ตรงกับ scenario id */
  id: number;
  caseNumber: string;        // เช่น "CASE-01"
  stamp: string;             // emoji ตราประทับเมื่อผ่าน
  evidence: string;          // hint emoji แทน "หลักฐาน" ที่เก็บได้
  /** ข้อสรุปคดี 1 ประโยคสั้น */
  insight: string;
  /** ข้อคิดที่ได้ — 2-3 ประโยค มุมมองที่อยากให้น้องๆ จำ */
  lesson: string;
  /** วิธีแก้/วิธีรับมือ — bullet list ขั้นตอนปฏิบัติ */
  howTo: string[];
  /** แหล่งอ้างอิงทั้งหมด */
  references: string[];
  tag: string;               // ป้าย Arc
}

export const JOURNAL_ENTRIES: JournalEntry[] = [
  // === Hero Arc (1-8) — เส้นทางนักสืบเริ่มต้น ===
  {
    id: 1, caseNumber: 'CASE-01', stamp: '🔍', evidence: '🪧',
    insight: 'โฆษณา vape ใช้รสผลไม้-สี-อินฟลูฯ ดึงดูดวัยรุ่น แต่ซ่อนนิโคติน',
    lesson: 'การตลาดบุหรี่ไฟฟ้าไม่ได้พุ่งเป้ามาที่ "ผู้ใหญ่เลิกบุหรี่" เหมือนที่บริษัทอ้าง — เด็กอายุ 13-17 คือกลุ่มเป้าหมายหลัก เพราะตลาดผู้ใหญ่อิ่มตัวแล้ว สี รส และ packaging ทำให้รู้สึก "ปลอดภัย" ทั้งที่ระดับนิโคตินสูงกว่าบุหรี่ปกติ',
    howTo: [
      'มองโฆษณาด้วยคำถาม "เขาขายอะไร?" และ "ใครได้ประโยชน์?"',
      'อย่าเชื่อ "เหมือนน้ำผลไม้" — รส = สารแต่งกลิ่นเคมี ไม่ใช่ผลไม้จริง',
      'ดู disclaimer ตัวเล็ก — มักมีคำว่า "อันตรายต่อสุขภาพ"',
    ],
    references: [
      'World Health Organization. (2023). WHO report on the global tobacco epidemic, 2023: Protect people from tobacco smoke. World Health Organization.',
      'Truth Initiative. (2022). How e-cigarette companies target young people: Marketing tactics, flavor strategies, and youth exposure. Truth Initiative.',
      'U.S. Food and Drug Administration. (2023). Results from the 2023 National Youth Tobacco Survey. U.S. Department of Health and Human Services.',
    ],
    tag: 'บทพื้นฐาน',
  },
  {
    id: 2, caseNumber: 'CASE-02', stamp: '✋', evidence: '🚻',
    insight: 'สูตรปฏิเสธ 3 ขั้น: "ไม่" ชัด → บอกเหตุผลสั้น → เสนอทางเลือก',
    lesson: 'การปฏิเสธไม่ใช่เรื่องเสียมารยาท — มันคือทักษะที่ต้องฝึก คนที่ปฏิเสธไม่ได้มักจะลองเพราะ "อยากเข้ากลุ่ม" แต่กลุ่มที่บังคับให้ลองอันตราย ไม่ใช่กลุ่มเพื่อนแท้',
    howTo: [
      'พูด "ไม่" ชัดๆ ไม่ต้องอธิบายยาว — "ไม่ครับ/ค่ะ" พอ',
      'เหตุผลสั้น เช่น "ฉันไม่สูบ" / "พ่อแม่ห้าม" / "เป็นภูมิแพ้"',
      'เสนอกิจกรรมอื่น — "ไปกินขนมกัน" / "ลองเกมใหม่ไหม"',
      'ถ้ายังตื๊อ → เดินออก ไม่ต้องเถียง',
    ],
    references: [
      'American Lung Association. (2020). Refusal skills: Helping teens resist peer pressure to vape. American Lung Association.',
      'Centers for Disease Control and Prevention. (2022). Tobacco-free school policy and youth refusal training. U.S. Department of Health and Human Services.',
      'Substance Abuse and Mental Health Services Administration. (2021). “Talk. They hear you.” substance use prevention campaign. SAMHSA.',
    ],
    tag: 'บทพื้นฐาน',
  },
  {
    id: 3, caseNumber: 'CASE-03', stamp: '🎂', evidence: '🍓',
    insight: 'รสหวานช่วยให้วัยรุ่นเริ่มสูบง่ายขึ้น 4 เท่า — เป็นเหตุที่ห้ามขายในไทย',
    lesson: 'นิโคตินรสผลไม้/ลูกอม ทำให้ "เริ่มลอง" ง่ายขึ้นมาก เพราะกลิ่น/รสไม่เหมือนสารพิษ สมองวัยรุ่นรับ "รางวัล" จากน้ำตาล+นิโคตินพร้อมกัน ติดเร็วกว่าสูบบุหรี่ปกติ',
    howTo: [
      'ใช้เหตุผลส่วนตัวคุยกับเพื่อน — โยงกับสิ่งที่เขารัก/กลัว',
      'อย่าใช้คำสั่ง ("อย่า!") เพราะวัยรุ่นจะต่อต้าน',
      'ฟังก่อน → สะท้อนความรู้สึก → ค่อยเสนอข้อมูล',
      'เสนอทางเลือกบวก ไม่ใช่ขู่ — "ไปร้านชาไทยอร่อยกว่า"',
    ],
    references: [
      'Centers for Disease Control and Prevention. (2023). Tobacco product use among middle and high school students — United States, 2023. Morbidity and Mortality Weekly Report, 72(44), 1173–1182.',
      'Miller, W. R., & Rollnick, S. (2013). Motivational interviewing: Helping people change (3rd ed.). Guilford Press.',
      'National Institute on Drug Abuse. (2022). Adolescent brain development and nicotine addiction: The reward pathway. National Institutes of Health.',
    ],
    tag: 'บทพื้นฐาน',
  },
  {
    id: 4, caseNumber: 'CASE-04', stamp: '🏬', evidence: '🪪',
    insight: 'เทคนิคแผ่นเสียงตกร่อง (Broken Record): พูดประโยคเดิมสงบๆ — คนตื๊อจะเลิกได้เอง',
    lesson: 'การโต้เถียงด้วยเหตุผลใหม่ทุกครั้ง = เปิดประตูให้คนชวนหาข้อโต้ตอบใหม่ การพูดประโยคเดิมสงบๆ ส่งสัญญาณว่าไม่มีทางต่อรอง — เป็นเทคนิค assertiveness ที่ใช้ได้ในชีวิตจริง ทั้งกับเพื่อน ครอบครัว และผู้ใหญ่',
    howTo: [
      'เลือก 1 ประโยคสั้น เช่น "ไม่ครับ ผมไม่สูบ"',
      'พูดซ้ำด้วยน้ำเสียงปกติ ไม่หงุดหงิด',
      'ไม่ต้องอธิบายเพิ่ม ไม่ต้องเถียง',
      'มองตา ยืนตัวตรง — body language สำคัญ',
    ],
    references: [
      'Smith, M. J. (1975). When I say no, I feel guilty: How to cope using the skills of systematic assertive therapy. Bantam Books.',
      'ราชกิจจานุเบกษา. (2560). พระราชบัญญัติศุลกากร พ.ศ. 2560 (เล่ม 134 ตอนที่ 118 ก). สำนักงานคณะกรรมการกฤษฎีกา.',
      'American Heart Association. (2022). Cardiovascular consequences of vaping in adolescents and young adults. Circulation, 146(9), e145–e161.',
    ],
    tag: 'บทพื้นฐาน',
  },
  {
    id: 5, caseNumber: 'CASE-05', stamp: '💬', evidence: '📱',
    insight: 'DM จากคนแปลกหน้า + ขายของผิดกฎหมาย = ถ่าย screenshot + แจ้งผู้ใหญ่',
    lesson: 'คนขาย vape ผ่าน DM/LINE/IG ผิดทั้งกฎหมายและจรรยาบรรณ — เป้าหมายเขาคือ "ลูกค้าใหม่อายุน้อย" เพราะติดง่ายและสูบยาว การตอบ "ขอลอง" หรือ "ขอราคา" = เปิดบัญชีเขาให้รู้ว่าคุณสนใจ',
    howTo: [
      'ไม่ตอบกลับ — block และ report ทันที',
      'ถ่าย screenshot username + ข้อความ',
      'แจ้งผู้ใหญ่ (ครู/พ่อแม่) หรือ สคบ. 1166',
      'อย่ากดลิงก์ใดๆ — อาจมีไวรัสหรือเก็บข้อมูล',
    ],
    references: [
      'ราชกิจจานุเบกษา. (2560). พระราชบัญญัติว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ (ฉบับที่ 2) พ.ศ. 2560. สำนักงานคณะกรรมการกฤษฎีกา.',
      'สำนักงานคณะกรรมการคุ้มครองผู้บริโภค. (2558). คำสั่งคณะกรรมการคุ้มครองผู้บริโภค ที่ 9/2558 เรื่อง ห้ามขายหรือห้ามให้บริการสินค้าบารากู่ บารากู่ไฟฟ้าหรือบุหรี่ไฟฟ้า. ราชกิจจานุเบกษา.',
      'Truth Initiative. (2022). Nicotine and social media: How youth are targeted through digital channels. Truth Initiative.',
    ],
    tag: 'บทพื้นฐาน',
  },
  {
    id: 6, caseNumber: 'CASE-06', stamp: '🤝', evidence: '🌿',
    insight: 'เพื่อนเปราะบาง → ฟังก่อน, ไม่ตัดสิน, ชวนทำกิจกรรมอื่นแทน',
    lesson: 'เพื่อนที่กำลังจะลอง vape มักจะมีปัญหาภายใน (เครียด เหงา ครอบครัวมีปัญหา) บุหรี่ไฟฟ้าเป็นแค่ "ทางหนี" ที่เห็นง่ายที่สุด การช่วยเขา = ช่วยให้เห็นทางอื่น ไม่ใช่แค่ห้ามไม่ให้สูบ',
    howTo: [
      'ถามด้วยความห่วงใย "เกิดอะไรขึ้น?" ไม่ใช่ "ทำไมโง่!"',
      'รับฟัง 80% พูด 20% — สะท้อนสิ่งที่เขารู้สึก',
      'อย่าบอก "ฉันก็เครียดเหมือนกัน" — เปลี่ยน focus จากเขา',
      'เสนอกิจกรรมรูปธรรม เช่น "พรุ่งนี้ไปเล่นกีฬากันมั้ย"',
      'ถ้าหนัก → ชวนคุยกับผู้ใหญ่ที่ไว้ใจได้',
    ],
    references: [
      'World Health Organization. (2021). Guidelines on mental health promotive and preventive interventions for adolescents. World Health Organization.',
      'Rogers, C. R. (1957). The necessary and sufficient conditions of therapeutic personality change. Journal of Consulting Psychology, 21(2), 95–103.',
      'สำนักงานกองทุนสนับสนุนการสร้างเสริมสุขภาพ. (2566). คู่มือเพื่อนช่วยเพื่อน: การพัฒนาทักษะชีวิตและการให้คำปรึกษาเบื้องต้นสำหรับเยาวชน. สสส.',
      'กรมสุขภาพจิต. (2566). แนวทางการดูแลสุขภาพจิตเยาวชนและระบบสายด่วนสุขภาพจิต 1323. กระทรวงสาธารณสุข.',
    ],
    tag: 'บทพื้นฐาน',
  },
  {
    id: 7, caseNumber: 'CASE-07', stamp: '⚖️', evidence: '📜',
    insight: 'ไทยห้ามนำเข้า/ขาย/ครอบครอง vape ตั้งแต่ปี 2557 — มีโทษจริง',
    lesson: 'หลายคนเข้าใจผิดว่า "เพราะของมีขายในตลาดนัด = ถูกกฎหมาย" ความจริงคือไทยมีกฎหมายเข้มงวด แต่ตำรวจไม่มีกำลังพอจับทุกร้าน — ผู้สูบเองก็ผิดกฎหมาย ไม่ใช่แค่ผู้ขาย',
    howTo: [
      'ผู้ขาย: ปรับสูงสุด 500,000 บาท + จำคุก 5 ปี',
      'ผู้นำเข้า: ปรับ 4 เท่าของราคา + จำคุก 10 ปี (พ.ร.บ.ศุลกากร)',
      'ผู้สูบในที่ห้ามสูบ: ปรับ 5,000 บาท',
      'แจ้งเบาะแสได้ที่ สคบ. 1166 / กรมศุลกากร 1164',
    ],
    references: [
      'กระทรวงพาณิชย์. (2557). ประกาศกระทรวงพาณิชย์ เรื่อง กำหนดให้บารากู่และบารากู่ไฟฟ้าหรือบุหรี่ไฟฟ้าเป็นสินค้าที่ต้องห้ามในการนำเข้ามาในราชอาณาจักร พ.ศ. 2557. ราชกิจจานุเบกษา.',
      'ราชกิจจานุเบกษา. (2560). พระราชบัญญัติศุลกากร พ.ศ. 2560. สำนักงานคณะกรรมการกฤษฎีกา.',
      'ราชกิจจานุเบกษา. (2560). พระราชบัญญัติควบคุมผลิตภัณฑ์ยาสูบ พ.ศ. 2560. สำนักงานคณะกรรมการกฤษฎีกา.',
    ],
    tag: 'บทพื้นฐาน',
  },
  {
    id: 8, caseNumber: 'CASE-08', stamp: '🏆', evidence: '🏢',
    insight: 'จบบทพื้นฐาน — รับเกียรติบัตรได้! การตลาด vape มีรูปแบบซ่อน',
    lesson: 'บริษัทบุหรี่ไฟฟ้ารู้ตั้งแต่ก่อนเริ่มขายว่านิโคตินเสพติด แต่เลือกออกแบบให้รสหวานและบรรจุภัณฑ์เด็กๆ การที่ "วัยรุ่นไทย 1 ใน 5 เคยลอง" ไม่ใช่อุบัติเหตุ มันคือผลของแผนการตลาดที่ตั้งใจ',
    howTo: [
      'รู้แล้วก็ส่งต่อให้เพื่อน — ห่วงโซ่ป้องกันเริ่มที่คุณ',
      'ใช้ทักษะทุกด่าน: แยกข้อมูล + ปฏิเสธ + แผ่นเสียงตกร่อง + ช่วยเพื่อน',
      'สมัครเป็น "นักสืบรุ่นพี่" ในโรงเรียน — สอนน้อง',
      'รายงานร้านขายให้ผู้ใหญ่/สายด่วน',
    ],
    references: [
      'World Health Organization. (2020). WHO Framework Convention on Tobacco Control: Guidelines for implementation of Article 13. World Health Organization.',
      'ศูนย์วิจัยและจัดการความรู้เพื่อการควบคุมยาสูบ. (2565). รายงานสถานการณ์การบริโภคยาสูบและบุหรี่ไฟฟ้าของเยาวชนไทย พ.ศ. 2565. มหาวิทยาลัยมหิดล.',
      'Jackler, R. K., & Ramamurthi, D. (2019). Nicotine arms race: JUUL and the high-nicotine e-cigarettes that followed. Tobacco Control, 28(6), 627–628.',
    ],
    tag: 'บทพื้นฐาน',
  },

  // === Master Arc (9-12) — ทักษะขั้นสูง ===
  {
    id: 9, caseNumber: 'CASE-09', stamp: '🩺', evidence: '🆘',
    insight: 'สูตร 5A ช่วยเพื่อนเลิก: Ask → Advise → Assess → Assist → Arrange',
    lesson: 'การเลิกนิโคตินยากกว่าเลิกเฮโรอีนในแง่ "อยากกลับมาสูบ" เพราะนิโคตินเปลี่ยนการทำงานของ dopamine — เพื่อนที่อยากเลิกต้องได้รับการช่วยเหลือเป็นระบบ ไม่ใช่แค่ "ใจสู้" คนเดียว',
    howTo: [
      'Ask: ถามตรงๆ ว่าสูบไหม สูบบ่อยแค่ไหน',
      'Advise: บอกข้อเสียที่เกี่ยวกับเป้าหมายเขา (กีฬา/เรียน)',
      'Assess: ประเมินความพร้อมเลิก (1-10)',
      'Assist: ช่วยทำแผน — โทร 1600, ใช้หมากฝรั่งนิโคติน, ออกกำลังกาย',
      'Arrange: นัด follow-up — ถามทุก 1 สัปดาห์',
    ],
    references: [
      'U.S. Public Health Service. (2008). Treating tobacco use and dependence: 2008 update — Clinical practice guideline. U.S. Department of Health and Human Services.',
      'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ. (2566). แนวทางการให้คำปรึกษาเลิกบุหรี่และบุหรี่ไฟฟ้าทางโทรศัพท์ (สายด่วน 1600). กรมการแพทย์.',
      'World Health Organization. (2021). Toolkit for delivering brief interventions for tobacco cessation in primary care. World Health Organization.',
    ],
    tag: 'บทขั้นสูง',
  },
  {
    id: 10, caseNumber: 'CASE-10', stamp: '🎬', evidence: '🔓',
    insight: 'TikTok ใช้ hashtag/emoji ลับ (🍃 💨 🌿) ขายของผิดกฎหมาย',
    lesson: 'แพลตฟอร์มกำลังพยายามแบนคำว่า "vape" แต่คนขายปรับตัวเร็วกว่า — ใช้อีโมจิแทนคำ ใช้ศัพท์แสลงใหม่ๆ (เช่น "puff", "pod", "เครื่อง") การรู้เท่าทันรหัสลับ = ป้องกันตัวเองและรายงานได้',
    howTo: [
      'สังเกตอีโมจิในชื่อบัญชี: 🍃 💨 🍓 = สัญญาณอันตราย',
      'อย่าตอบความคิดเห็นที่ขอ "ทักแชทมา (DM)"',
      'รายงานบัญชี: ในแอปกด Report → Selling Restricted Goods (ขายสินค้าผิดกฎหมาย)',
      'ส่ง link ให้ผู้ใหญ่ที่จัดการได้ (ครู/ตำรวจ)',
    ],
    references: [
      'Truth Initiative. (2023). Vaporized: Youth vaping and social media platforms. Truth Initiative.',
      'Stanford Research into the Impact of Tobacco Advertising. (2022). Social media promotion of electronic cigarettes targeting youth. Stanford University School of Medicine.',
      'TikTok Inc. (2023). Community guidelines: Restricted goods and commercial activities. TikTok.',
    ],
    tag: 'บทขั้นสูง',
  },
  {
    id: 11, caseNumber: 'CASE-11', stamp: '🏠', evidence: '👨‍👩‍👧',
    insight: 'พี่/พ่อแม่ในบ้านสูบ → คุยตรง อย่าเทศนา + ขอผู้ใหญ่อีกคนช่วย',
    lesson: 'ในครอบครัวที่ผู้ใหญ่สูบเอง วัยรุ่นมักรู้สึกว่า "ฉันจะห้ามใครได้?" — แต่ความจริงคือคุณสามารถบอกว่า "ฉันห่วง" ได้ และคนในบ้านที่เปลี่ยน 1 คน มักจะเปลี่ยนทั้งบ้าน',
    howTo: [
      'เลือกจังหวะดี — ไม่ใช่ตอนเขาเครียด',
      'พูดด้วยความรู้สึก ("ฉันกลัวเสียเขา") ไม่ใช่กล่าวโทษ',
      'ให้ข้อมูล 1-2 อย่างพอ — ไม่ต้องบรรยาย',
      'ถ้าเขาไม่ฟัง → คุยกับผู้ใหญ่อีกคนในบ้าน (ปู่ ย่า ลุง ป้า)',
      'อย่าถือเป็นความรับผิดชอบของคุณคนเดียว',
    ],
    references: [
      'Centers for Disease Control and Prevention. (2022). Talking to your teens about e-cigarettes: A tip sheet for parents. U.S. Department of Health and Human Services.',
      'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ. (2566). บริการปรึกษาครอบครัวเพื่อการเลิกยาสูบและบุหรี่ไฟฟ้า (Quitline 1600). กระทรวงสาธารณสุข.',
      'American Lung Association. (2021). The vape talk: How to talk to your kids about vaping. American Lung Association.',
    ],
    tag: 'บทขั้นสูง',
  },
  {
    id: 12, caseNumber: 'CASE-12', stamp: '🎓', evidence: '📚',
    insight: 'นักสืบที่เก่งสุด = ส่งต่อความรู้ให้รุ่นน้อง — ทักษะคูณ',
    lesson: 'งานวิจัยพบว่า "peer education" (เพื่อนสอนเพื่อน/รุ่นพี่สอนน้อง) มีประสิทธิภาพมากกว่าครู/พ่อแม่สอน 3 เท่า เพราะใกล้กว่า เข้าใจกว่า — การส่งต่อความรู้คือการป้องกันที่กระจายตัวเอง',
    howTo: [
      'หาน้อง ป.5-ป.6 ในโรงเรียนที่สนิท',
      'ใช้ภาษาง่ายๆ — เน้นเรื่องเล่าจริง ไม่ใช่สถิติ',
      'สอนสูตรปฏิเสธ 3 ขั้น (ทำเป็นเกมก็ได้)',
      'แชร์ลิงก์เกมนี้ให้น้อง',
      'รายงานครู ถ้าเจอเพื่อนน้องมีปัญหา',
    ],
    references: [
      'World Health Organization. (2022). Peer-led health promotion interventions for adolescents: Evidence review and implementation guide. World Health Organization.',
      'United Nations Educational, Scientific and Cultural Organization. (2020). Health and well-being education through youth peer networks. UNESCO.',
      'สำนักงานกองทุนสนับสนุนการสร้างเสริมสุขภาพ. (2566). โครงการพลังเยาวชนรุ่นพี่ดูแลรุ่นน้องสร้างเสริมสุขภาวะ. สสส.',
    ],
    tag: 'บทขั้นสูง',
  },

  // === Pro Arc (13-15) ===
  {
    id: 13, caseNumber: 'CASE-13', stamp: '⚠️', evidence: '📊',
    insight: '"ความเสี่ยง" มี 4 ระดับ — vape เด็ก = สูงสุด เพราะสมองยังโต',
    lesson: 'การจัดอันดับความเสี่ยงเป็นทักษะที่ใช้ในวิชาแพทย์ — แทนการพูด "อันตราย/ไม่อันตราย" แบบ binary มาเรียงว่าอะไร "เสี่ยงน้อย-เสี่ยงมาก" จะช่วยตัดสินใจในสถานการณ์จริงได้ดีกว่า',
    howTo: [
      'ระดับ 1 (ต่ำ): กิจกรรมปกติของวัยรุ่น',
      'ระดับ 2 (กลาง): ค้นข้อมูลจากแหล่งไม่น่าเชื่อถือ',
      'ระดับ 3 (สูง): ลองสูบบุหรี่/vape แม้แค่ครั้งเดียว',
      'ระดับ 4 (สูงสุด): สูบ vape ในวัยรุ่น สมองยังพัฒนาไม่จบ',
      'ตัดสินใจตามระดับ — ระดับ 3+ ต้องพึ่งผู้ใหญ่',
    ],
    references: [
      'U.S. Surgeon General. (2023). E-cigarette use among youth and young adults: A report of the Surgeon General. U.S. Department of Health and Human Services.',
      'World Health Organization. (2020). Risk assessment and stratification methodology in adolescent health interventions. WHO Guidelines Approved by the Guidelines Review Committee.',
      'National Institute on Drug Abuse. (2022). Adolescent brain cognitive development (ABCD) study: Nicotine and brain trajectory. NIH.',
    ],
    tag: 'บทเชี่ยวชาญ',
  },
  {
    id: 14, caseNumber: 'CASE-14', stamp: '🤳', evidence: '👀',
    insight: '"ปัดผ่าน" ก่อนคิด = อันตราย — ฝึกหยุดถามตัวเอง 3 วินาที',
    lesson: 'Algorithm ของ TikTok/Reels ใช้เวลาน้อยมากเพื่อยึดความสนใจ — ผ่านไป 1.5 วินาทีก็ตัดสินว่าจะดูต่อไหม การฝึก "หยุดคิด 3 วินาที" ทำให้เราไม่ถูก algorithm ผลักดันไปทางที่อันตราย',
    howTo: [
      'เห็นคลิป → หยุด → ถาม "ใครได้ประโยชน์จากคลิปนี้?"',
      'ดูแหล่งที่มา — บัญชีมีตัวตนจริงไหม?',
      'ตรวจ comment — มีคนเตือนไหม?',
      'ถ้าสงสัย → ค้น Google + คำว่า "fact check"',
      'รายงานก่อนแชร์',
    ],
    references: [
      'Wineburg, S., & McGrew, S. (2021). Civic online reasoning: Lateral reading in the digital age. Stanford History Education Group.',
      'Vosoughi, S., Roy, D., & Aral, S. (2018). The spread of true and false news online. Science, 359(6380), 1146–1151.',
      'TikTok Inc. (2023). Safety and security: Misinformation policies and community reporting. TikTok Safety Center.',
    ],
    tag: 'บทเชี่ยวชาญ',
  },
  {
    id: 15, caseNumber: 'CASE-15', stamp: '🧩', evidence: '🗝️',
    insight: 'ภัย-เครื่องมือ-ทักษะ จับคู่กันได้ — การจำเป็นระบบ ไม่ใช่ท่อง',
    lesson: 'ความรู้แบบ "ท่อง" หายเร็ว แต่ความรู้แบบ "เชื่อมโยง" จำได้ตลอด การเชื่อมว่า "EVALI → เครื่อง vape ราคาถูก → ไม่มี QC → สารพิษเข้าปอด" ทำให้เข้าใจมากกว่าจำแค่ชื่อโรค',
    howTo: [
      'สร้างแผนผังความคิด (mind map) เรื่อง vape — จุดศูนย์กลาง + กิ่ง',
      'จับคู่ "ภัย" กับ "ทักษะที่ใช้รับมือ"',
      'อธิบายให้คนอื่นฟัง — ถ้าอธิบายได้ = เข้าใจ',
      'ใช้บัตรคำ (flashcard) — ทบทวนทุก 1 สัปดาห์',
    ],
    references: [
      'Sweller, J. (1988). Cognitive technology: The role of cognitive load in the design of learning materials. Cognitive Science, 12(4), 257–285.',
      'Brown, P. C., Roediger, H. L., & McDaniel, M. A. (2014). Make it stick: The science of successful learning. Belknap Press.',
      'Buzan, T. (2006). The mind map book: How to use radiant thinking to maximize your brain’s untapped potential. BBC Active.',
    ],
    tag: 'บทเชี่ยวชาญ',
  },

  // === Expert Arc (16-20) — ระดับเชี่ยวชาญ ===
  {
    id: 16, caseNumber: 'CASE-16', stamp: '🧠', evidence: '⚡',
    insight: 'นิโคตินเปลี่ยน dopamine — สมองวัยรุ่นเสียหายถาวรได้',
    lesson: 'สมองวัยรุ่นยังพัฒนาจนถึงอายุ 25 ปี นิโคตินไปกระตุ้นระบบ reward (dopamine) ทำให้สมองเรียนรู้ว่า "นิโคติน = ความสุข" — เมื่อโตขึ้น คนเหล่านี้มีแนวโน้มติดสารอื่นๆ ตาม (เหล้า ยา) เพราะ "wiring" ของสมองถูกแก้ไปแล้ว',
    howTo: [
      'รู้กลไก: นิโคติน → กระตุ้น dopamine → รู้สึกดีชั่วครู่ → สมองต้องการมากขึ้น',
      'อาการขาดนิโคติน: หงุดหงิด สมาธิหลุด หิว นอนไม่หลับ',
      'ถ้าสูบมาก่อน — ยังเลิกได้! สมองจะค่อยๆ ซ่อมตัวเองใน 3-6 เดือน',
      'ออกกำลังกาย + นอนพอ ช่วยฟื้นฟู dopamine system',
    ],
    references: [
      'National Institute on Drug Abuse. (2023). Tobacco, nicotine, and e-cigarettes research report. National Institutes of Health.',
      'Goriounova, N. A., & Mansvelder, H. D. (2021). Short- and long-term consequences of nicotine exposure during adolescence for prefrontal cortex neuronal network function. Nature Neuroscience, 24(6), 760–772.',
      'U.S. Department of Health and Human Services. (2016). E-cigarette use among youth and young adults: A report of the Surgeon General. Centers for Disease Control and Prevention.',
    ],
    tag: 'บทเจาะลึก vape',
  },
  {
    id: 17, caseNumber: 'CASE-17', stamp: '🎮', evidence: '💸',
    insight: 'ขายในเกมออนไลน์ผิดกฎหมาย — ดูดเด็กผ่านแชท Roblox/Discord',
    lesson: 'คนขาย vape ใช้เกมเป็น "ทาง" เข้าหาวัยรุ่น เพราะผู้ปกครองไม่ค่อยดู — Discord/Roblox/Minecraft มีฟีเจอร์แชทที่ตรวจสอบยาก การ "อยู่ในเกมเดียวกัน" ทำให้รู้สึกไว้ใจ แต่จริงๆ ก็คือคนแปลกหน้า',
    howTo: [
      'อย่ารับเพื่อนแปลกหน้าใน Discord/Roblox',
      'ตั้งค่าให้ทักแชทได้เฉพาะเพื่อนเท่านั้น (DM = friends only)',
      'ถ้ามีคนชวนคุย "นอกเกม" (Line, IG) = สัญญาณอันตราย',
      'รายงานผ่าน Roblox Report / Discord Report ภายในเกม',
      'บอกพ่อแม่ทันที — ไม่ใช่ความผิดของน้อง',
    ],
    references: [
      'Federal Bureau of Investigation. (2022). Online gaming and youth exploitation: Protecting young gamers. U.S. Department of Justice.',
      'ราชกิจจานุเบกษา. (2560). พระราชบัญญัติว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ (ฉบับที่ 2) พ.ศ. 2560 มาตรา 14. สำนักงานคณะกรรมการกฤษฎีกา.',
      'Common Sense Media. (2023). Parents’ guide to Discord and online gaming safety. Common Sense Media.',
    ],
    tag: 'บทเจาะลึก vape',
  },
  {
    id: 18, caseNumber: 'CASE-18', stamp: '💬', evidence: '🏠',
    insight: 'พ่อแม่จับได้ → บอกความจริง + ขอความช่วยเหลือ ดีกว่าซ่อน',
    lesson: 'พ่อแม่หลายคน react แรงตอนรู้ครั้งแรก เพราะกลัว ไม่ใช่เพราะอยากลงโทษ — ถ้าโกหก/ซ่อน ความเชื่อใจจะพังถาวร แต่ถ้าบอกตรงๆ + แสดงความตั้งใจเลิก ผู้ใหญ่จะพร้อมช่วยมากกว่าที่คิด',
    howTo: [
      'หยิบของออกมาให้เห็น — ไม่ซ่อน',
      'ขอโทษก่อน — บอกว่ารู้ว่าผิด',
      'อธิบายสาเหตุที่เริ่ม — ความเครียด เพื่อนชวน ฯลฯ',
      'ขอให้ช่วยหาวิธีเลิก — โทร 1600 ด้วยกัน',
      'ขอ "โอกาส" ไม่ใช่ "ให้อภัย"',
    ],
    references: [
      'Centers for Disease Control and Prevention. (2022). How to talk to your teen about vaping and nicotine addiction. U.S. Department of Health and Human Services.',
      'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ. (2566). บริการปรึกษาครอบครัวเพื่อการเลิกยาสูบและบุหรี่ไฟฟ้า (สายด่วน 1600). กรมการแพทย์.',
      'American Lung Association. (2022). Family guide to tobacco and vaping recovery. American Lung Association.',
    ],
    tag: 'บทเจาะลึก vape',
  },
  {
    id: 19, caseNumber: 'CASE-19', stamp: '🫁', evidence: '🏥',
    insight: 'EVALI = ปอดอักเสบจาก vape — เด็กไทยมีบันทึกแล้ว ICU จริง',
    lesson: 'EVALI (E-cigarette/Vaping Use-Associated Lung Injury) เกิดจากสารพิษในน้ำยา — เช่น vitamin E acetate, โลหะหนัก, ฟอร์มาลดีไฮด์ อาการเริ่มแค่ไอ-เหนื่อย แต่ลามเร็วถึงต้องใช้เครื่องช่วยหายใจ ค่ารักษาหลักล้านบาท',
    howTo: [
      'รู้อาการเตือน: ไอ + เหนื่อย + แน่นหน้าอก + ไข้',
      'เคยสูบมา 1-3 เดือน + อาการพวกนี้ → ไป รพ. ทันที',
      'บอกหมอตรงๆ ว่าเคยสูบ — ไม่ใช่เวลามาซ่อน',
      'ถ้าเพื่อนมีอาการ → โทร 1669 หรือพาไป รพ.',
      'ห้ามรอ "ดูอาการ" — EVALI ลามเร็วใน 2-3 วัน',
    ],
    references: [
      'Centers for Disease Control and Prevention. (2020). Outbreak of lung injury associated with the use of e-cigarette, or vaping, products. CDC MMWR Reports.',
      'Layden, J. E., Ghinai, I., Pray, I., Kimball, A., Layer, M., Tenforde, M. W., ... & Patel, A. (2020). Pulmonary illness related to e-cigarette use in Illinois and Wisconsin — Final report. New England Journal of Medicine, 382(10), 903–916.',
      'กรมการแพทย์. (2566). แนวทางการวินิจฉัยและรักษาภาวะปอดอักเสบเฉียบพลันจากการใช้บุหรี่ไฟฟ้า (EVALI). กระทรวงสาธารณสุข.',
    ],
    tag: 'บทเจาะลึก vape',
  },
  {
    id: 20, caseNumber: 'CASE-20', stamp: '🌟', evidence: '🎓',
    insight: '4D เพื่อเลิก: Delay, Deep breath, Drink water, Do something — รวมพลังทีม',
    lesson: 'ภารกิจสุดท้าย: ไม่ใช่แค่ตัวเองรอด แต่สร้างเครือข่ายป้องกันในโรงเรียน เทคนิค 4D เป็นเครื่องมือเชิงปฏิบัติเมื่อ "อยากสูบ" ตอนกำลังเลิก — แต่การที่หลายคนใช้พร้อมกัน จะกลายเป็นวัฒนธรรมโรงเรียนที่ปลอดภัย',
    howTo: [
      'D-1 Delay: หน่วงเวลา 5 นาที — ความอยากจะหายเอง',
      'D-2 Deep breath: หายใจลึก 10 ครั้ง — ลด cortisol',
      'D-3 Drink water: ดื่มน้ำเย็น — แทนการ inhale',
      'D-4 Do something: ทำกิจกรรมอื่น — เดิน, ฟังเพลง, โทรเพื่อน',
      'สร้างทีม: หา 3-5 คนในห้องเป็น "นักสืบประจำห้อง"',
      'รายงาน case ทุกสัปดาห์ — ให้ครูที่ปรึกษา',
    ],
    references: [
      'American Cancer Society. (2022). Helping someone quit smoking: The 4D approach. American Cancer Society.',
      'World Health Organization. (2021). School-based tobacco prevention programs: Operational guidance. World Health Organization.',
      'สำนักงานกองทุนสนับสนุนการสร้างเสริมสุขภาพ. (2566). โรงเรียนปลอดบุหรี่และบุหรี่ไฟฟ้า: คู่มือนักเรียนแกนนำสร้างเสริมสุขภาวะ. สสส.',
      'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ. (2566). เครือข่ายจิตอาสาช่วยเลิกบุหรี่แห่งชาติ (Quitline 1600). กรมการแพทย์.',
    ],
    tag: 'บทเจาะลึก vape',
  },
];

export function getJournalEntry(id: number): JournalEntry | undefined {
  return JOURNAL_ENTRIES.find(e => e.id === id);
}
