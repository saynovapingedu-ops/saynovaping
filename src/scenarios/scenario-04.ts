import type { Scenario } from '../types';

// ด่าน 4 — ห้างใหญ่หลังเลิกเรียน: ยืนยันคำเดิม (เทคนิคพูดคำตอบเดิมซ้ำๆ จนคนตื๊อเลิก)
export const scenario04: Scenario = {
  id: 4,
  title: 'ห้างใหญ่หลังเลิกเรียน',
  subtitle: 'ยืนยันคำเดิม (Broken Record) — ยืนยันคำตอบเดิมไม่หวั่น',
  estMinutes: 6,
  startNode: 'intro1',
  intro: [
    'เลิกเรียนแล้ว เพื่อนชวนแวะห้างใกล้โรงเรียน',
    'พี่รุ่นพี่ที่รู้จักกัน เปิดร้านชาไทยชั้นใต้ดิน',
    'แต่...ในร้านมีอย่างอื่นซ่อนอยู่',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'shopkeeper', next: 'intro2',
      text: 'เฮ้น้อง! เรียนเสร็จแล้วเหรอ? วันนี้พี่มีของใหม่นะ ลองดูสิ — ราคาเด็ก ม.ต้นจ่ายไหวแน่',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'shopkeeper', next: 'choice1',
      text: '(หยิบบุหรี่ไฟฟ้าออกมาวางบนเคาน์เตอร์) ลองอันนี้ก่อน รสมิ้นต์ ฮิตที่สุดใน TikTok',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'รุ่นพี่ตื๊อหนัก — คุณจะตอบยังไง?',
      choices: [
        {
          label: 'ไม่ครับพี่ ผมไม่สูบ',
          next: 'attempt1', xp: 25,
        },
        {
          label: 'เอ่อ... ขอลองดูสภาพก่อน',
          next: 'wrong1', xp: 0,
          reflection: 'การเปิดช่องลังเล มักทำให้ถูกตื๊อต่อเนื่อง',
        },
        {
          label: 'พี่ไม่กลัวโดนจับเหรอ',
          next: 'okay1', xp: 10,
          reflection: 'ใช้ได้ แต่เปลี่ยนเรื่องไป — ปฏิเสธตรงๆ ดีกว่า',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1',
      title: '⚠️ อย่าเปิดช่อง',
      body: 'การพูดคำว่า "ขอลอง", "ไว้ก่อน", "ขอคิดดู" — ในสายตาคนชวน คือการเปิดประตู เขาจะตื๊อหนักขึ้น',
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice1',
      title: 'พอใช้ได้',
      body: 'การถามกลับช่วยเปลี่ยนหัวข้อ แต่ไม่ได้แสดงจุดยืน — ปฏิเสธตรงๆ ก่อน แล้วค่อยเสริม',
    },
    {
      type: 'dialogue', id: 'attempt1', speaker: 'shopkeeper', next: 'choice2',
      text: 'อ้าว ทำไมล่ะ? เอาน่า ลองคำเดียว ไม่บอกใครหรอก พี่ลดให้ครึ่งราคา',
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'พี่เขาตื๊อต่อ — ยืนยันคำเดิม (Broken Record) คือต้องยืนยัน "คำเดิม" ไม่เปลี่ยน',
      choices: [
        {
          label: 'ไม่ครับพี่ ผมไม่สูบ',
          next: 'attempt2', xp: 30,
        },
        {
          label: 'เอ่อ... ก็ลดเยอะนะ ลองนิดเดียวมั้ง',
          next: 'wrong2', xp: 0,
          reflection: 'หลักการ ยืนยันคำเดิม (Broken Record) คือไม่หวั่นไหวกับข้อเสนอที่เพิ่มขึ้น',
        },
        {
          label: 'งั้นขอเปลี่ยนเป็นเครื่องดื่มดีกว่า',
          next: 'okay2', xp: 15,
          reflection: 'เปลี่ยนเรื่องได้ แต่ ยืนยันคำเดิม (Broken Record) ต้องการให้ยืนคำเดิมก่อน',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong2', next: 'choice2',
      title: '⚠️ อย่าใจอ่อน',
      body: 'นิโคตินทำให้ "ลองครั้งเดียว" กลายเป็น "ครั้งต่อไป" — ยืนยันคำเดิม (Broken Record) ต้องคงคำเดิมเด็ดขาด',
    },
    {
      type: 'feedback', id: 'okay2', next: 'choice2',
      title: 'ใจเย็นๆ',
      body: 'เปลี่ยนเรื่องได้ก็จริง แต่ ยืนยันคำเดิม (Broken Record) คือ "พูดประโยคเดิม" ซ้ำจนเขาเลิกตื๊อ — ลองยืนยันอีกครั้ง',
    },
    {
      type: 'dialogue', id: 'attempt2', speaker: 'shopkeeper', next: 'choice3',
      text: 'เออ พี่เห็นน้องดูเครียดๆ มา ใช้ตัวนี้ช่วยผ่อนคลายไง ใครๆ ก็ใช้',
    },
    {
      type: 'choice', id: 'choice3', speaker: 'player',
      prompt: 'อย่าให้เขาดึงเรื่อง — ยืนยันคำเดิม',
      choices: [
        {
          label: 'ไม่ครับพี่ ผมไม่สูบ',
          next: 'right1', xp: 35,
        },
        {
          label: 'ขอบายพี่ ไม่ใช่ไวบ์เราอะ 😆',
          next: 'right1', xp: 33,
        },
        {
          label: 'พี่อย่ามายุ่งกับผม',
          next: 'okay3', xp: 10,
          reflection: 'หงุดหงิดได้ แต่ ยืนยันคำเดิม (Broken Record) คือสงบและคงคำเดิม',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay3', next: 'choice3',
      title: 'ใจเย็น',
      body: 'ยืนยันคำเดิม (Broken Record) ที่ทรงพลังที่สุด คือพูดประโยคเดิม ด้วยน้ำเสียงปกติ ไม่หงุดหงิด — เดี๋ยวเขาเลิกเอง',
    },
    {
      type: 'dialogue', id: 'right1', speaker: 'shopkeeper', next: 'mg1',
      text: '(ถอนหายใจ) ก็ได้... น้องมั่นใจดี งั้นเอาชาไทยแก้วนึงก็ได้',
    },
    {
      type: 'minigame', id: 'mg1', game: 'spot-the-lie',
      title: 'ข่าวสารที่คนขายมักอ้าง',
      claims: [
        {
          text: '"ไม่บอกใครหรอก ลองสิ"',
          isLie: true,
          reveal: 'เท็จ — กฎหมายไทยห้ามครอบครองบุหรี่ไฟฟ้า ไม่ว่าใครจะบอกหรือไม่ ก็ผิดกฎหมายอยู่ดี',
          source: 'พ.ร.บ. ศุลกากร พ.ศ. 2560',
        },
        {
          text: '"ใช้บุหรี่ไฟฟ้าผ่อนคลายความเครียดได้"',
          isLie: true,
          reveal: 'เท็จ — งานวิจัยพบว่านิโคตินกลับเพิ่มความวิตกกังวลและทำให้สมองวัยรุ่นพัฒนาผิดปกติ',
          source: 'American Heart Association 2022',
        },
        {
          text: '"ลองครั้งเดียวก็เสพติดได้"',
          isLie: false,
          reveal: 'จริง — นิโคตินทำให้สมองวัยรุ่นเกิดการเปลี่ยนแปลงตั้งแต่ครั้งแรกที่ใช้',
          source: 'CDC Tobacco Use Among Youth',
        },
      ],
      next: 'feedback1',
      xpOnSuccess: 90,
      badge: 'broken-record',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'บันทึกนักสืบ 📓',
      body: 'เทคนิค "ยืนยันคำเดิม": เลือก 1 ประโยคสั้นๆ เช่น "ไม่ครับ ผมไม่สูบ" แล้วพูดซ้ำสงบๆ 🔁\nถ้าเถียงด้วยเหตุผลใหม่ทุกครั้ง เขาจะหาทางตื๊อต่อได้เรื่อยๆ\nแต่พอเราพูดเดิมไม่หวั่น เขาจะรู้เองว่าไม่มีทางต่อรอง',
      source: 'Broken Record — Manuel J. Smith, When I Say No, I Feel Guilty (1975)',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'การขายบุหรี่ไฟฟ้าให้เยาวชนในไทย มีโทษจำคุกถึง 5 ปี และปรับสูงสุด 500,000 บาท',
      source: 'พ.ร.บ. คุ้มครองสุขภาพของผู้ไม่สูบบุหรี่',
    },
    {
      type: 'end', id: 'end1',
      title: 'จบด่าน 4!',
      message: 'คุณยืนหยัดได้ในสถานการณ์กดดัน — ทักษะ "ยืนยันคำเดิม (Broken Record)" ปลดล็อก\n\n📱 มือถือสั่น... มีข้อความแปลกจากคนไม่รู้จักในเกมออนไลน์เด้งขึ้นมา',
      xp: 60,
      badge: 'stage-4-clear',
    },
  ],
  references: [
    'พ.ร.บ. ศุลกากร พ.ศ. 2560',
    'พ.ร.บ. คุ้มครองสุขภาพของผู้ไม่สูบบุหรี่ พ.ศ. 2560',
    'American Heart Association — Vaping Effects 2022',
    'CDC — Tobacco Use Among Youth (2023)',
    'Smith — Assertiveness Training: Broken Record Technique',
  ],
};
