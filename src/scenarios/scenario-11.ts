import type { Scenario } from '../types';

// ด่าน 11 (Master) — พี่ในครอบครัวสูบ: รับมือเรื่องอ่อนไหว
export const scenario11: Scenario = {
  id: 11,
  title: 'พี่ในครอบครัวสูบ',
  subtitle: 'ขั้นสูง 3 — รับมือกับครอบครัวอ่อนโยนและกล้าหาญ',
  estMinutes: 7,
  startNode: 'd1',
  intro: [
    'คุณกลับบ้านวันหนึ่งและเห็นพี่ลูกพี่ลูกน้อง ที่อยู่บ้านเดียวกัน',
    'กำลังสูบบุหรี่ไฟฟ้าในห้อง — กลิ่นหวานๆ ลอยออกมา',
    'นี่คือเรื่องอ่อนไหวที่สุด — ครอบครัว',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'narrator', next: 'choice1',
      text: 'พี่อายุ 19 — เครียดเรื่องเรียนมหาลัย และเริ่มใช้บุหรี่ไฟฟ้าตั้งแต่ปีที่แล้ว ในบ้านมีน้องอายุ 8 ขวบ',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'ปฏิกิริยาแรก',
      choices: [
        {
          label: 'นั่งคุยกับพี่ส่วนตัว ไม่ฟ้องพ่อแม่ทันที',
          next: 'd2', xp: 30,
        },
        {
          label: 'บอกพ่อแม่ทันที ให้จัดการ',
          next: 'okay1', xp: 10,
          reflection: 'การฟ้องทำให้พี่ตั้งแง่ — ลองคุยส่วนตัวก่อน เป็นทางสร้างสัมพันธ์',
        },
        {
          label: 'แอบถ่ายรูปไว้เป็นหลักฐาน',
          next: 'wrong1', xp: 0,
          reflection: 'ครอบครัวไม่ใช่ศัตรู — การถ่ายรูปทำลายความไว้ใจถาวร',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1',
      title: 'ครอบครัวต้องไว้ใจกัน',
      body: 'การเก็บหลักฐานเหมาะกับศัตรู ไม่ใช่ครอบครัว — เริ่มจากการคุย ความสัมพันธ์เปลี่ยนพฤติกรรมได้ดีกว่าหลักฐาน',
    },
    {
      type: 'feedback', id: 'okay1', next: 'choice1',
      title: 'มีลำดับขั้น',
      body: 'การฟ้องคือทางเลือกสุดท้าย — ลองคุยส่วนตัวก่อน ถ้าไม่สำเร็จค่อยขอความช่วยเหลือผู้ใหญ่',
    },
    {
      type: 'dialogue', id: 'd2', speaker: 'friend1', next: 'd3',
      text: '(พี่ตกใจ) เออ...น้อง ไม่ได้ตั้งใจให้เห็น พี่ใช้แค่ตอนเครียด ไม่บ่อยหรอก',
    },
    {
      type: 'dialogue', id: 'd3', speaker: 'friend1', next: 'choice2',
      text: 'อย่าบอกแม่นะ พี่จะเลิกเอง — ขอเวลาพี่หน่อย',
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'ตอบยังไงให้สมดุลระหว่างเคารพและรักษาน้องเล็กในบ้าน',
      choices: [
        {
          label: 'พี่ ผมเข้าใจ แต่ในบ้านมีน้องเล็ก ไอที่ออกมาก็มีโลหะหนัก',
          next: 'd4', xp: 35,
        },
        {
          label: 'โอเคพี่ ไม่บอก ทุกอย่างจะหายเอง',
          next: 'wrong2', xp: 0,
          reflection: 'การยอมเฉยๆ = ปล่อยให้น้องเล็กรับ secondhand vapor — ต้องสมดุล',
        },
        {
          label: 'พี่จะเลิกเองได้ไง! ติดแล้วแน่นอน',
          next: 'wrong3', xp: 0,
          reflection: 'การกล่าวหาตัดบทสนทนา — ใช้ข้อเท็จจริงดีกว่าด่วนตัดสิน',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong2', next: 'choice2',
      title: 'น้องเล็กในบ้านสำคัญ',
      body: 'Secondhand vapor มีโลหะหนัก (lead, nickel) — เด็กเล็กรับเข้าระบบหายใจได้ คุณมีหน้าที่ปกป้อง',
    },
    {
      type: 'feedback', id: 'wrong3', next: 'choice2',
      title: 'อย่าด่วนตัดสิน',
      body: 'การกล่าวหาทันทีปิดประตู — ใช้ข้อมูล (โลหะหนัก, นิโคตินหนักกว่าบุหรี่มวน) ดีกว่ากล่าวหาเรื่องการติด',
    },
    {
      type: 'dialogue', id: 'd4', speaker: 'friend1', next: 'mg-balance',
      text: 'จริงเหรอ... โลหะหนักด้วยเหรอ ไม่เคยรู้ พี่ไม่อยากให้น้องเสี่ยง',
    },
    // มินิเกม: หาทางแก้แบบสมดุล
    {
      type: 'minigame', id: 'mg-balance', game: 'fill-blank',
      title: 'หาจุดสมดุล — ดูแลน้องเล็ก + รักษาพี่',
      questions: [
        {
          sentence: 'พี่ตกลงใช้นอกบ้าน + ___ ภายใน 30 วัน',
          options: ['ลดปริมาณลง', 'ใช้บ่อยกว่าเดิม'],
          correctIndex: 0,
          reveal: 'การลดปริมาณ + ตัดพื้นที่ใช้ = step ลดอันตรายแบบ harm reduction',
          source: 'Harm Reduction International — Adolescent Approaches Framework',
        },
        {
          sentence: 'ถ้าใน 30 วันยังเลิกไม่ได้ — ขอ ___ ช่วยกัน',
          options: ['คุณพ่อ/ผู้ใหญ่ที่ไว้ใจ', 'แอบไว้ต่อ'],
          correctIndex: 0,
          reveal: 'มีเส้นเวลาชัด + แผน B ที่ขอผู้ใหญ่ช่วย = ความรับผิดชอบของน้อง',
          source: 'NIDA Family-Based Treatment Research 2022 / กรมสุขภาพจิต',
        },
        {
          sentence: 'หาทางออกที่ดีกว่าบุหรี่ไฟฟ้า — เช่น ___ ลดความเครียด',
          options: ['ออกกำลังกาย/เพลง', 'นั่งเฉยๆ ทนเอา'],
          correctIndex: 0,
          reveal: 'การหา substitute (สิ่งทดแทน) ช่วยลดอาการ craving ได้จริง',
          source: 'Cochrane Review — Exercise for Smoking Cessation 2021',
        },
      ],
      next: 'd5',
      xpOnSuccess: 100,
    },
    {
      type: 'dialogue', id: 'd5', speaker: 'friend1', next: 'choice3',
      text: 'น้อง... ขอบคุณนะ พี่จะลองทำตาม ถ้าใน 30 วันไม่ดีขึ้น เราคุยกับแม่กัน',
    },
    {
      type: 'choice', id: 'choice3', speaker: 'player',
      prompt: 'จะปิดท้ายบทสนทนายังไงให้พี่รู้สึกยังเป็นพี่น้อง?',
      choices: [
        {
          label: 'พี่ ผมเชื่อในพี่ ถ้าต้องการคน listen ผมอยู่ตรงนี้',
          next: 'd-end', xp: 35, badge: 'family-care',
        },
        {
          label: 'อย่าผิดคำพูดนะ',
          next: 'okay2', xp: 10,
          reflection: 'แม้คำเตือนจะดี แต่จบด้วยความเชื่อใจสร้างพันธสัญญาที่หนักแน่นกว่า',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay2', next: 'choice3',
      title: 'ปิดด้วยความเชื่อใจ',
      body: 'การจบด้วยความเชื่อใจสร้างพันธสัญญาภายใน — มากกว่าคำขู่ที่ทำให้พี่รู้สึกถูกจับตา',
    },
    {
      type: 'dialogue', id: 'd-end', speaker: 'narrator', next: 'edu1',
      text: 'พี่กอดคุณ — ครอบครัวคือทีมที่ดีที่สุดในการเปลี่ยนแปลง',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'งานวิจัยพบว่าการเลิกใช้สารเสพติดในวัยรุ่น มีอัตราสำเร็จสูงสุดเมื่อมี "พี่น้อง/ครอบครัวสนับสนุน" — สูงกว่าโรงพยาบาล 2 เท่า',
      source: 'NIDA Family-Based Treatment Research 2022',
    },
    {
      type: 'end', id: 'end1',
      title: '🎓 Master 3 ผ่าน!',
      message: 'คุณดูแลครอบครัวได้อย่างสมดุล — ทักษะ "อบอุ่นในบ้าน" ปลดล็อก',
      xp: 80,
      badge: 'family-care',
    },
  ],
  references: [
    'NIDA — Family-Based Treatment Research 2022',
    'กรมสุขภาพจิต — แนวทางสื่อสารกับสมาชิกครอบครัวที่ใช้สารเสพติด',
    'Secondhand Vapor Effects — American Lung Association',
    'Harm Reduction International — Adolescent Approaches',
  ],
};
