import type { Scenario } from '../types';

// ด่าน 15 (Pro 3) — บันทึกนักสืบรุ่นเก่า: จับคู่พฤติกรรมกับผลที่เกิด
export const scenario15: Scenario = {
  id: 15,
  title: 'บันทึกนักสืบรุ่นเก่า',
  subtitle: 'Pro 3 — เชื่อมพฤติกรรมกับผล',
  estMinutes: 7,
  startNode: 'd1',
  intro: [
    '📓 Pro 3 — บันทึกของนักสืบรุ่นพี่',
    'พี่หมอเก๋ส่งสมุดบันทึกเก่ามาให้ — ในนั้นมีคู่พฤติกรรมกับผลที่ตามมา',
    'นักสืบต้องเปิดการ์ดและจับคู่ "พฤติกรรม" กับ "ผลที่เกิด" ให้ถูกทั้งหมด',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'doctor', next: 'd2',
      text: 'นักสืบ — สมุดเล่มนี้เป็นบันทึกของพี่นักสืบรุ่นแรก จดเรื่อง "พฤติกรรม → ผลกระทบ" ที่พี่ได้เห็นมา',
    },
    {
      type: 'dialogue', id: 'd2', speaker: 'doctor', next: 'mg1',
      text: 'ลองเปิดการ์ดดู — จับคู่ให้ครบ แล้วพี่จะเล่าเรื่องราวของแต่ละคู่ให้ฟัง',
    },
    // มินิเกมหลัก — MemoryMatch
    {
      type: 'minigame', id: 'mg1', game: 'memory-match',
      title: 'จับคู่พฤติกรรม-ผลที่เกิด',
      memoryPairs: [
        {
          a: '🚭 ใช้บุหรี่ไฟฟ้าทุกวัน 1 ปี',
          b: '🫁 ความจุปอดลดลง 15-20%',
          reveal: 'การใช้บุหรี่ไฟฟ้าเป็นประจำในวัยเรียน ลดความสามารถในการออกกำลังกาย',
          source: 'American Lung Association 2023 — Long-term Lung Function in Youth Vapers',
        },
        {
          a: '💔 รับบุหรี่ไฟฟ้าจากคนใน DM (ข้อความส่วนตัว)',
          b: '⚠️ เสี่ยงสารปนเปื้อนไม่รู้ที่มา',
          reveal: 'ของไม่ผ่าน QC อาจมีสารหนัก/ยาเสพติดปลอมตัว — เคยมีเคสจริงในไทย',
          source: 'รายงาน อย. + กรมควบคุมโรค 2566 — ตรวจของผิดกฎหมายจากออนไลน์',
        },
        {
          a: '📚 อ่านความรู้ก่อนเข้าด่าน',
          b: '🎯 ผ่านด่านได้ลื่นกว่า',
          reveal: 'การ priming ความรู้ก่อนสถานการณ์จริง = ทักษะของนักสืบมือทอง',
          source: 'Bjork — Desirable Difficulties in Learning (1994)',
        },
        {
          a: '🤝 ใช้สูตร 5A ช่วยเพื่อนเลิก',
          b: '✨ เพื่อนเลิกได้สำเร็จ 70%',
          reveal: 'WHO 2023: คนเลิกได้สำเร็จเมื่อมีโค้ชใกล้ตัว เทียบกับ 5% คนที่ทำคนเดียว',
          source: 'WHO Tobacco Cessation Guidelines 2023',
        },
        {
          a: '☎️ โทร 1600 (Quit Line)',
          b: '👨‍⚕️ คุยกับนักจิตวิทยา ปรึกษาเลิก vape ฟรี 24 ชม.',
          reveal: '1600 คือ Quit Line ของศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ (กรมการแพทย์) — ไม่ต้องบอกชื่อจริง เก็บเป็นความลับ',
          source: 'ศูนย์บริการเลิกบุหรี่ทางโทรศัพท์แห่งชาติ (Quit Line)',
        },
        {
          a: '🎓 สอนรุ่นน้อง',
          b: '🌱 สร้างนักสืบเพิ่ม 1 คน',
          reveal: 'การส่งต่อความรู้ คือ multiplier — 1 ครู สร้างนักสืบหลายคน',
          source: 'งานวิจัย ม.มหิดล + สสส. 2566 — Peer Education Effectiveness',
        },
      ],
      next: 'feedback1',
      xpOnSuccess: 130,
      badge: 'sensei',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: '📓 บันทึกครบแล้ว',
      body: 'การมองเห็น "พฤติกรรม → ผลกระทบ" คือทักษะ Consequential Thinking (คิดถึงผลที่ตามมาก่อนตัดสินใจ) ที่ CASEL บอกว่าเป็นพื้นฐานของ SEL (Social-Emotional Learning). มันได้ผลเพราะสมองวัยรุ่นยังพัฒนา Prefrontal Cortex (ส่วนคิดผลที่ตามมา) ไม่เต็มที่ จึงต้องฝึกซ้ำๆ ผ่านเคสจริง. เวลาจะตัดสินใจอะไร — ถามตัวเอง "แล้วต่อจากนั้นเกิดอะไรขึ้นได้บ้าง?" เป็นนิสัย',
      source: 'CASEL — SEL Framework (Collaborative for Academic, Social, and Emotional Learning) / WHO Life Skills Education for Children and Adolescents (1997, updated 2020)',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'd-end',
      fact: 'งานวิจัย Cohort ปี 2024 ของไทย ติดตามนักเรียนที่ผ่านโครงการการศึกษาเรื่องบุหรี่ไฟฟ้า — พบว่า 80% ตัดสินใจไม่ลอง แม้เพื่อนจะชวน',
      source: 'ศจย. — Tobacco Control Research Center 2024',
    },
    {
      type: 'dialogue', id: 'd-end', speaker: 'doctor', next: 'end1',
      text: 'นักสืบ — บันทึกเล่มนี้เป็นของคุณแล้ว ส่งต่อให้รุ่นน้องคนต่อไปด้วยนะ',
    },
    {
      type: 'end', id: 'end1',
      title: '📓 Pro 3 ผ่าน!',
      message: 'คุณรับมรดกของนักสืบรุ่นแรกแล้ว — เห็นความเชื่อมโยงระหว่างทุกพฤติกรรม',
      xp: 100,
      badge: 'sensei',
    },
  ],
  references: [
    'WHO Tobacco Cessation Guidelines 2023',
    'ศจย. — Tobacco Control Research Center, Cohort Study 2024',
    'สายด่วน 1600 — กระทรวงสาธารณสุข',
    'WHO Behaviour Change Communication Framework',
  ],
};
