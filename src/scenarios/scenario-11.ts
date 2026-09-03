import type { Scenario } from '../types';
import { asset } from '../lib/asset';

// ด่าน 11 (Master) — พี่ในครอบครัวสูบ: รับมือเรื่องอ่อนไหว
export const scenario11: Scenario = {
  id: 11,
  title: 'พี่ในครอบครัวสูบ',
  subtitle: 'ขั้นสูง 3 — รับมือกับครอบครัวอ่อนโยนและกล้าหาญ',
  estMinutes: 7,
  startNode: 'd1',
  intro: [
    'คุณกลับบ้านมาวันหนึ่งและเห็นพี่ลูกพี่ลูกน้องที่อยู่บ้านเดียวกัน',
    'กำลังแอบสูบบุหรี่ไฟฟ้าอยู่ในห้องนอน — กลิ่นควันผลไม้ลอยออกมา',
    'นี่คือเรื่องที่ละเอียดอ่อนที่สุด — เพราะเขาคือคนในครอบครัว',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'narrator', next: 'choice1',
      text: 'พี่พีท ลูกพี่ลูกน้องของคุณอายุ 19 ปี กำลังเครียดเรื่องเรียนมหาวิทยาลัย และแอบสูบบุหรี่ไฟฟ้าในห้องนอน โดยที่ในบ้านยังมีน้องเล็กอายุเพียง 8 ขวบอยู่ด้วย',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'ปฏิกิริยาแรกที่คุณจะทำ',
      choices: [
        {
          label: 'เข้าไปนั่งคุยกับพี่พีทเป็นการส่วนตัวก่อน โดยยังไม่รีบฟ้องผู้ใหญ่',
          next: 'd2', xp: 30,
        },
        {
          label: 'บอกพ่อแม่ทันที ให้ท่านจัดการ',
          next: 'okay1', xp: 10,
          reflection: 'การรีบฟ้องอาจทำให้พี่พีทตั้งแง่และปิดใจ — ลองเปิดใจคุยกันส่วนตัวก่อนดีกว่า',
        },
        {
          label: 'แอบถ่ายรูปไว้เป็นหลักฐาน',
          next: 'wrong1', xp: 0,
          reflection: 'คนในครอบครัวไม่ใช่ศัตรู — การแอบถ่ายรูปจะทำลายความไว้ใจกัน',
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
      type: 'dialogue', id: 'd2', speaker: 'friend1', speakerName: 'พี่พีท (ลูกพี่ลูกน้อง)', speakerAvatar: asset('characters/pete.jpg'), next: 'd3',
      text: '(พี่พีทสะดุ้งตกใจ) เฮ้ย... น้อง! พี่ไม่ได้ตั้งใจให้เห็นนะ... ช่วงนี้พี่เครียดเรื่องสอบจริงๆ ไม่ได้สูบบ่อยหรอก',
    },
    {
      type: 'dialogue', id: 'd3', speaker: 'friend1', speakerName: 'พี่พีท (ลูกพี่ลูกน้อง)', speakerAvatar: asset('characters/pete.jpg'), next: 'choice2',
      text: 'อย่าเพิ่งไปบอกน้ากับแม่นะน้อง พี่สัญญาว่าจะค่อยๆ เลิกเอง ขอเวลาพี่หน่อยนะ',
    },
    {
      type: 'choice', id: 'choice2', speaker: 'player',
      prompt: 'ตอบยังไงให้สมดุลระหว่างความเห็นใจพี่และการปกป้องน้องเล็กในบ้าน?',
      choices: [
        {
          label: 'พี่พีท ผม/หนูเข้าใจนะว่าพี่เครียด แต่ในบ้านมีน้องเล็ก ไอน้ำที่พ่นออกมามีโลหะหนักอันตรายมากนะพี่',
          next: 'd4', xp: 35,
        },
        {
          label: 'โอเคพี่ ไม่บอกใครก็ได้ เดี๋ยวทุกอย่างก็ดีขึ้นเอง',
          next: 'wrong2', xp: 0,
          reflection: 'การปล่อยเฉยๆ = ปล่อยให้น้องเล็กรับควันมือสองที่มีสารพิษ — ต้องกล้าเตือน',
        },
        {
          label: 'พี่จะเลิกเองได้ยังไง! ติดงอมแงมแล้วชัดๆ',
          next: 'wrong3', xp: 0,
          reflection: 'การต่อว่ารุนแรงจะปิดบทสนทนา — ใช้ข้อเท็จจริงและความห่วงใยดีกว่า',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong2', next: 'choice2',
      title: 'น้องเล็กในบ้านสำคัญ',
      body: 'ไอน้ำมือสองของบุหรี่ไฟฟ้ามีทั้งสารพิษและโลหะหนัก (ตะกั่ว นิกเกิล) — เด็กเล็กสูดดมเข้าไปจะส่งผลต่อสมองและปอด เรามีหน้าที่ต้องปกป้องคนในบ้าน',
    },
    {
      type: 'feedback', id: 'wrong3', next: 'choice2',
      title: 'อย่าด่วนตัดสิน',
      body: 'การต่อว่าตัดพ้อจะทำให้พี่พีทปิดกั้นตัวเอง — ใช้ข้อมูลความห่วงใยเรื่องสุขภาพจะช่วยให้เขาเปิดใจรับฟังมากกว่า',
    },
    {
      type: 'dialogue', id: 'd4', speaker: 'friend1', speakerName: 'พี่พีท (ลูกพี่ลูกน้อง)', speakerAvatar: asset('characters/pete.jpg'), next: 'mg-balance',
      text: 'จริงเหรอเนี่ย... มีโลหะหนักด้วยเหรอ พี่นึกว่ามีแค่นิโคตินกับกลิ่นผลไม้ พี่ไม่อยากให้น้องเล็กต้องมาเสี่ยงเลย',
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
          options: ['ออกกำลังกาย/ฟังเพลง', 'นั่งเฉยๆ ทนเอา'],
          correctIndex: 0,
          reveal: 'การหา substitute (สิ่งทดแทน) ช่วยลดอาการ craving ได้จริง',
          source: 'Cochrane Review — Exercise for Smoking Cessation 2021',
        },
      ],
      next: 'd5',
      xpOnSuccess: 100,
    },
    {
      type: 'dialogue', id: 'd5', speaker: 'friend1', speakerName: 'พี่พีท (ลูกพี่ลูกน้อง)', speakerAvatar: asset('characters/pete.jpg'), next: 'choice3',
      text: 'ขอบใจมากนะน้อง พี่จะลองทำตามแผนนี้ดู ถ้าผ่านไป 30 วันแล้วยังไม่ดีขึ้น เราค่อยไปปรึกษาแม่ด้วยกันนะ',
    },
    {
      type: 'choice', id: 'choice3', speaker: 'player',
      prompt: 'ปิดท้ายบทสนทนายังไงให้พี่พีทรับรู้ถึงความรักและความห่วงใย?',
      choices: [
        {
          label: 'ผม/หนูเชื่อมั่นในตัวพี่นะ ถ้าเมื่อไหร่พี่เครียดหรืออยากคุยระบาย ผม/หนูพร้อมรับฟังเสมอ',
          next: 'd-end', xp: 35, badge: 'family-care',
        },
        {
          label: 'อย่าผิดคำพูดแล้วกันนะ',
          next: 'okay2', xp: 10,
          reflection: 'แม้คำเตือนจะดี แต่การจบด้วยความเชื่อใจจะสร้างพลังใจที่เข้มแข็งกว่า',
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
      text: 'พี่พีทเข้ามากอดคุณด้วยความซึ้งใจ — ความรักและความเข้าใจในครอบครัวคือพลังที่ดีที่สุดในการเปลี่ยนแปลง',
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
