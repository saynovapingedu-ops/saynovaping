import type { Scenario } from '../types';
import { asset } from '../lib/asset';

// ด่าน 12 (Master Final) — นักสืบระดับครู: ส่งต่อความรู้ให้รุ่นน้อง
export const scenario12: Scenario = {
  id: 12,
  title: 'นักสืบระดับครู',
  subtitle: 'ขั้นสูง รวบยอด — ส่งต่อทักษะให้นักสืบรุ่นน้อง',
  estMinutes: 10,
  startNode: 'd1',
  intro: [
    '🌟 ด่านสุดท้ายของเส้นทางนักสืบสุขภาพ',
    'ไม่ใช่การปะทะใคร — แต่คือการ "ส่งต่อความรู้"',
    'น้องเอม นักเรียนชั้น ป.6 มาเข้าค่าย Health Detective Junior — คุณคือพี่เลี้ยงคนเก่ง',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'friend2', speakerName: 'น้องเอม (ป.6)', speakerAvatar: asset('characters/aim.jpg'), next: 'd2',
      text: 'สวัสดีค่ะพี่นักสืบ! หนูชื่อเอม อยู่ ป.6 เพิ่งมาเข้าค่าย Health Detective Junior ครั้งแรกเลยค่ะ — วันนี้พี่จะสอนอะไรหนูบ้างคะ?',
    },
    {
      type: 'dialogue', id: 'd2', speaker: 'narrator', next: 'choice1',
      text: 'น้องเอมดูตื่นเต้นและตั้งใจมาก — เธอเล่าให้ฟังว่าที่ห้องเรียนเริ่มมีเพื่อนแอบลองบุหรี่ไฟฟ้ากันแล้ว',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'บทเรียนแรกที่คุณจะสอนน้องเอม',
      choices: [
        {
          label: 'เริ่มจากทักษะ "อย่าเพิ่งเชื่อทุกอย่างในโลกออนไลน์" — การแยกแยะข้อเท็จจริง',
          next: 'd3', xp: 30,
        },
        {
          label: 'สอนทุกอย่างพร้อมกันเลย จะได้รู้เร็วๆ',
          next: 'okay1', xp: 10,
          reflection: 'การยัดข้อมูลทำให้เด็กล้น — สอนทีละทักษะ ค่อยๆ สร้างฐาน',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice1',
      title: 'สอนทีละขั้น',
      body: 'การเรียนรู้ที่ดี = ทีละทักษะ แล้วค่อยต่อยอด — รุ่นน้องจะจำได้ดีกว่าและไม่ท้อ',
    },
    {
      type: 'dialogue', id: 'd3', speaker: 'friend2', speakerName: 'น้องเอม (ป.6)', speakerAvatar: asset('characters/aim.jpg'), next: 'mg-test',
      text: 'เข้าใจแล้วค่ะพี่! ลองทดสอบหนูดูได้เลย หนูจะตั้งใจตอบให้ถูกทุกข้อเลยค่ะ',
    },
    // === Phase 1: ทดสอบนักสืบรุ่นน้อง ===
    {
      type: 'minigame', id: 'mg-test', game: 'spot-the-lie',
      title: 'Phase 1 — ทดสอบเอม: จริงหรือเท็จ',
      claims: [
        {
          text: '"พี่ในโรงเรียนบอกว่าใช้บุหรี่ไฟฟ้าผ่อนคลาย ไม่อันตราย"',
          isLie: true,
          reveal: 'เท็จ — นิโคตินรบกวนสมองวัยรุ่นที่ยังพัฒนา ทำให้สมาธิลดและเครียดง่ายขึ้น',
          source: 'Surgeon General Report 2023',
        },
        {
          text: '"ใน TikTok บอกว่ามีรสองุ่นไม่มีนิโคติน"',
          isLie: true,
          reveal: 'เท็จ — เกือบทุกยี่ห้อมีนิโคติน แม้จะติดฉลากว่า 0% ก็ตรวจพบในห้องแล็บ',
          source: 'งานวิจัย FDA 2022',
        },
      ],
      next: 'd4',
      xpOnSuccess: 60,
    },
    {
      type: 'dialogue', id: 'd4', speaker: 'friend2', speakerName: 'น้องเอม (ป.6)', speakerAvatar: asset('characters/aim.jpg'), next: 'd5',
      text: 'เย้! ตอบถูกหมดเลย — แต่ถ้าวันหนึ่งมีเพื่อนยื่นมาให้หนูตรงๆ ในห้องน้ำ หนูควรจะปฏิเสธยังไงดีคะพี่?',
    },
    // === Phase 2: เลือกวิธีสอน ===
    {
      type: 'dialogue', id: 'd5', speaker: 'narrator', next: 'choice2',
      text: 'น้องเอมถามด้วยความกังวล — คุณต้องช่วยอธิบายวิธีปฏิเสธที่จำง่ายและนำไปใช้ได้จริง',
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'อธิบายสูตรปฏิเสธให้เอมจำง่าย',
      choices: [
        {
          label: 'จำง่ายๆ 3 ขั้น: "ปฏิเสธชัด → บอกเหตุผลสั้น → เสนอไปทำอย่างอื่น"',
          next: 'd6', xp: 30,
        },
        {
          label: 'จำให้เป๊ะคำต่อคำตามที่พี่บอก',
          next: 'okay2', xp: 10,
          reflection: 'ท่องจำเป๊ะๆ ใช้ไม่ได้จริง — สอนเป็นโครง 3 คำ ปรับใช้ได้ทุกสถานการณ์',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay2', next: 'choice2',
      title: 'ทักษะ ≠ ท่องจำ',
      body: 'สอนเด็กเป็น "หลักการ" สั้นๆ ที่ปรับใช้ได้ — ดีกว่าให้ท่องประโยคเป๊ะๆ ที่อาจฟังเป็นหุ่นยนต์',
    },
    {
      type: 'dialogue', id: 'd6', speaker: 'friend2', speakerName: 'น้องเอม (ป.6)', speakerAvatar: asset('characters/aim.jpg'), next: 'mg-roleplay',
      text: 'ได้เลยค่ะ! ลองให้หนูจับคู่ดูนะคะพี่ ว่าสถานการณ์แบบไหนต้องใช้ทักษะอะไร',
    },
    // === Phase 3: word-match สูตรกับสถานการณ์ ===
    {
      type: 'minigame', id: 'mg-roleplay', game: 'word-match',
      title: 'Phase 3 — เอมจับคู่สูตร ↔ สถานการณ์',
      pairs: [
        { left: 'ตื๊อในห้องน้ำ',         right: 'สูตรปฏิเสธ 3 ขั้น',
          source: 'NIDA Refusal Skills 2022' },
        { left: 'รุ่นพี่ลดราคา + ตื๊อต่อ', right: 'ยืนยันคำเดิม (Broken Record)',
          source: 'Smith — Assertiveness Training' },
        { left: 'คนแปลกหน้าทักแชตส่วนตัวมาชวน', right: 'ถอยห่าง — บล็อกและรายงาน',
          source: 'Common Sense Media — Online Safety' },
        { left: 'เพื่อนสนิทเครียดมาปรึกษา',      right: 'ฟัง-ยอมรับ-ห่วงใย-นำพา',
          source: 'Mental Health First Aid (MHFA) Youth Module' },
        { left: 'เห็นโพสต์โฆษณาแฝง',   right: 'แยกแยะ + รายงาน',
          source: 'รายงาน กสทช. 2566 + TikTok Community Guidelines' },
      ],
      next: 'd7',
      xpOnSuccess: 100,
      source: 'รวบรวมจากทักษะที่สอนตลอด Hero Arc + Master Arc',
    },
    {
      type: 'dialogue', id: 'd7', speaker: 'friend2', speakerName: 'น้องเอม (ป.6)', speakerAvatar: asset('characters/aim.jpg'), next: 'mg-final',
      text: 'หนูจำได้ขึ้นใจแล้วค่ะ! ขออีกข้อสุดท้ายนะคะพี่ หนูอยากมั่นใจจริงๆ ก่อนจบค่าย',
    },
    // === Phase 4: fill-blank ปิดท้าย ===
    {
      type: 'minigame', id: 'mg-final', game: 'fill-blank',
      title: 'Phase 4 — บทเรียนสุดท้ายของอาจารย์',
      questions: [
        {
          sentence: 'นักสืบสุขภาพคนเก่ง = แยกข้อมูล + ปฏิเสธ + ___ + ส่งต่อ',
          options: ['ช่วยเพื่อน', 'แค่หลบเอง'],
          correctIndex: 0,
          reveal: 'การช่วยเพื่อนคือหัวใจ — นักสืบที่เก่งคนเดียวไม่พอ ต้องสร้างเครือข่าย',
          source: 'WHO Adolescent Health — Peer Support Framework',
        },
        {
          sentence: 'การส่งต่อความรู้ ทำให้เกิด ___ ของนักสืบรุ่นใหม่',
          options: ['ห่วงโซ่ปกป้อง', 'การแข่งขัน'],
          correctIndex: 0,
          reveal: 'ห่วงโซ่ปกป้อง = แต่ละรุ่นสอนรุ่นต่อไป สังคมแข็งแรงขึ้นทีละรุ่น',
          source: 'งานวิจัย ม.มหิดล + สสส. 2566 — Peer Education Effectiveness',
        },
        {
          sentence: 'เมื่อรุ่นน้องผิดพลาด — สอนด้วย ___ ไม่ใช่ตำหนิ',
          options: ['ความเข้าใจ', 'การลงโทษ'],
          correctIndex: 0,
          reveal: 'ครูที่ดีสอนด้วยความเข้าใจ — เด็กเรียนรู้จากความรู้สึกปลอดภัย',
          source: 'Vygotsky — Zone of Proximal Development / UNICEF Education Frameworks',
        },
      ],
      next: 'd8',
      xpOnSuccess: 120,
      badge: 'sensei',
    },
    {
      type: 'dialogue', id: 'd8', speaker: 'friend2', speakerName: 'น้องเอม (ป.6)', speakerAvatar: asset('characters/aim.jpg'), next: 'choice3',
      text: 'ขอบคุณพี่มากๆ เลยนะคะ! หนูสัญญาว่าจะเป็นนักสืบสุขภาพที่ดี และจะคอยดูแลเพื่อนๆ กับรุ่นน้องเหมือนที่พี่สอนหนูเลยค่ะ',
    },
    {
      type: 'choice', id: 'choice3', speaker: 'player',
      prompt: 'คำพูดให้กำลังใจส่งท้ายให้น้องเอม',
      choices: [
        {
          label: 'จำไว้นะน้องเอม น้องไม่ได้สู้คนเดียวหรอก มีพวกพี่และเพื่อนๆ นักสืบคอยช่วยเหลือและอยู่ข้างๆ เสมอ',
          next: 'd-final', xp: 50, badge: 'mentor',
        },
        {
          label: 'อย่าทำพลาดนะ',
          next: 'okay3', xp: 15,
          reflection: 'คำเตือนสร้างความกลัว — คำให้กำลังใจสร้างพลัง',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay3', next: 'choice3',
      title: 'ปิดท้ายด้วยพลัง',
      body: 'นักสืบรุ่นน้องต้องการ "พลัง" ไม่ใช่ "ความกลัว" — ส่งคำให้กำลังใจให้เธอ',
    },
    {
      type: 'dialogue', id: 'd-final', speaker: 'narrator', next: 'feedback1',
      text: 'น้องเอมยิ้มกว้างออกมาด้วยความมั่นใจ — เธอพร้อมแล้วที่จะเป็นนักสืบสุขภาพรุ่นเยาว์ คอยปกป้องและดูแลเพื่อนๆ ในชั้น ป.6 ของเธอ',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'บันทึกนักสืบ (สรุปส่งท้าย) 📓',
      body: 'เพื่อนสอนเพื่อนได้ผลดีมาก เพราะเด็กเชื่อเพื่อนวัยใกล้กันมากกว่าผู้ใหญ่ 🧑‍🏫\nแถมคนสอนก็ได้ทบทวนความรู้ตัวเอง เก่งขึ้นทั้งคู่\nสอนน้องด้วยเรื่องเล่า ไม่ใช่คำขู่ — เรื่องจริงจำได้นานกว่าตัวเลข',
      source: 'Peer Education — งานวิจัย ม.มหิดล + สสส. 2566 / WHO Adolescent Health Strategy 2018',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'แนวคิด "เพื่อนสอนเพื่อน" (Peer Education) พบว่ามีประสิทธิผลในการลดสารเสพติดในวัยรุ่นไทย — รุ่นพี่สอนรุ่นน้อง ลดการใช้บุหรี่ไฟฟ้าได้ 45% ในกลุ่มทดลอง',
      source: 'งานวิจัย ม.มหิดล + สสส. 2566',
    },
    {
      type: 'end', id: 'end1',
      title: '🎓✨ ตำนานนักสืบสุขภาพ',
      message: 'คุณคืออาจารย์นักสืบแล้ว — ห่วงโซ่ปกป้องเริ่มต้นจากคุณ และจะดำเนินต่อไปอีกหลายรุ่น',
      xp: 250,
      badge: 'sensei',
    },
  ],
  references: [
    'Surgeon General Report on E-cigarette Use Among Youth 2023',
    'งานวิจัย FDA 2022 — Nicotine Content in 0% Labeled Vape Products',
    'งานวิจัย ม.มหิดล + สสส. 2566 — Peer Education Effectiveness',
    'WHO — Adolescent Health Programmes',
  ],
};
