import type { Scenario } from '../types';

// ด่าน 8 (บอสใหญ่) — บุก Vapor Corp: รวมทุกทักษะ ผสมมินิเกม 4 แบบ
export const scenario08: Scenario = {
  id: 8,
  title: 'บุก Vapor Corp',
  subtitle: 'ด่านบอสใหญ่ — รวมพลังนักสืบสุขภาพทั้งหมด',
  estMinutes: 12,
  startNode: 'intro1',
  intro: [
    'ทักษะทั้ง 7 ด่านที่ผ่านมา หลอมรวมเป็นพลังเดียว',
    'หัวหน้า Vapor Corp ตัวจริงโผล่หน้าออกมา — เขาคุมเครือข่ายขายให้เยาวชนทั่วประเทศ',
    'นี่คือศึกครั้งสุดท้าย — คุณต้องใช้ทุกทักษะที่ฝึกมา',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'intro1', speaker: 'vapor', next: 'intro2',
      text: 'ฮ่าๆ นักสืบน้อย... แกอยากปิดเครือข่ายของฉันเหรอ? ลองดูสิ ฉันจะให้แกเลือกฝั่งฉันก่อน',
    },
    {
      type: 'dialogue', id: 'intro2', speaker: 'vapor', next: 'choice1',
      text: 'ถ้ามาช่วยฉัน — เงิน ชื่อเสียง อะไรก็ได้ ราคา 1 ล้านบาท แค่ลบโพสต์ที่แกลงเตือนเด็กๆ',
    },
    // === Phase 1: ปฏิเสธคำชักชวน (แบบทักษะด่าน 2/4) ===
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: '⚔️ Phase 1 — ปฏิเสธ',
      choices: [
        {
          label: 'ไม่ — ฉันไม่ได้ทำเพื่อเงิน',
          next: 'phase2-intro', xp: 40,
        },
        {
          label: 'ขอคิดดูก่อน',
          next: 'wrong1', xp: 0,
          reflection: 'การลังเล = การเปิดประตู ปฏิเสธชัดเจนตั้งแต่ต้น',
        },
        {
          label: 'ราคาน่าสนใจ ถ้าเพิ่มอีกล่ะ?',
          next: 'wrong2', xp: 0,
          reflection: 'ผิดทางหมด — นักสืบไม่ขายอุดมการณ์',
        },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1',
      title: '⚠️ Boss ใช้กลลวง',
      body: '"ขอคิดดู" คือคำที่ Boss รออยู่ — เขาจะตื๊อต่อไปไม่หยุด ตอบ "ไม่" ตรงๆ',
    },
    {
      type: 'feedback', id: 'wrong2', next: 'choice1',
      title: '🚨 อย่าหลงทาง',
      body: 'เงินที่ Boss เสนอ คือผลกำไรจากความเสียหายของเยาวชนคนอื่น — นักสืบสุขภาพเลือกฝั่งความถูกต้อง',
    },
    {
      type: 'dialogue', id: 'phase2-intro', speaker: 'vapor', next: 'mg1',
      text: 'แน่จริง... งั้นลองพิสูจน์สิ ข้อกล่าวอ้างที่ฉันใช้โฆษณา — แกแยกได้ไหมว่าอะไรจริงอะไรเท็จ?',
    },
    // === Phase 2: Spot the Lie (ทักษะด่าน 1) ===
    {
      type: 'minigame', id: 'mg1', game: 'spot-the-lie',
      title: 'Phase 2 — แยกความจริงจากโฆษณา',
      claims: [
        {
          text: '"บุหรี่ไฟฟ้าช่วยให้คนเลิกบุหรี่มวนได้"',
          isLie: true,
          reveal: 'เท็จ — งานวิจัยพบว่าผู้ใช้บุหรี่ไฟฟ้ามักกลายเป็นใช้ทั้งสองอย่าง (dual use = ใช้ทั้งบุหรี่ไฟฟ้าและบุหรี่ปกติคู่กัน) ไม่ใช่เลิกได้จริง',
          source: 'BMJ 2022 / WHO Report on Tobacco Epidemic',
        },
        {
          text: '"กลิ่นรสผลไม้ดึงดูดเด็กให้เริ่มเสพติด"',
          isLie: false,
          reveal: 'จริง — กลิ่นหวาน/ผลไม้คือเครื่องมือออกแบบให้ติดตลาดเยาวชนโดยเฉพาะ',
          source: 'CDC Youth Vaping Report 2023',
        },
        {
          text: '"ไอน้ำของบุหรี่ไฟฟ้าไม่อันตรายต่อคนรอบข้าง"',
          isLie: true,
          reveal: 'เท็จ — secondhand vapor มีโลหะหนักและสารระเหยที่ผู้อื่นสูดเข้าไปก็เสี่ยง',
          source: 'American Lung Association 2023',
        },
      ],
      next: 'phase3-intro',
      xpOnSuccess: 80,
      badge: 'truth-finder',
    },
    {
      type: 'dialogue', id: 'phase3-intro', speaker: 'vapor', next: 'mg2',
      text: 'น่าประหลาด... งั้นรู้ไหมว่ากฎหมายไทยห้ามอะไรบ้าง?',
    },
    // === Phase 3: Word Match (ทักษะด่าน 7) ===
    {
      type: 'minigame', id: 'mg2', game: 'word-match',
      title: 'Phase 3 — จับคู่ทักษะกับสถานการณ์',
      pairs: [
        { left: 'รุ่นพี่ตื๊อในห้องน้ำ',     right: 'สูตรปฏิเสธ 3 ขั้น',
          source: 'NIDA — Refusal Skills for Adolescents (2022)' },
        { left: 'พี่ Vapor ในข้อความส่วนตัว',  right: 'ถอย — บล็อก/รายงาน',
          source: 'Common Sense Media — Online Safety / รายงาน กสทช. 2566' },
        { left: 'เพื่อนเครียดอยากลอง',        right: 'ฟัง-ยอมรับ-ห่วงใย-นำพา',
          source: 'Mental Health First Aid (MHFA) Youth Module' },
        { left: 'เจอข่าวสารใน Facebook',   right: 'ตรวจสอบแหล่งอ้างอิง',
          source: 'CRAAP Test — California State University Library' },
        { left: 'คุณลุงขายของผิดกฎหมาย', right: 'โทร 1166 (สคบ.) แจ้งร้านขายของผิดกฎหมาย',
          source: 'สำนักงานคณะกรรมการคุ้มครองผู้บริโภค' },
      ],
      next: 'phase4-intro',
      xpOnSuccess: 100,
      badge: 'wise-words',
      source: 'รวบรวมจากทักษะที่สอนตลอด Hero Arc (ด่าน 1-7)',
    },
    {
      type: 'dialogue', id: 'phase4-intro', speaker: 'vapor', next: 'mg3',
      text: 'แกเก่งจริง... แต่สูตรช่วยเพื่อน — แกพูดได้ตามลำดับไหม?',
    },
    // === Phase 4: Order Cards (ทักษะด่าน 6) ===
    {
      type: 'minigame', id: 'mg3', game: 'order-cards',
      title: 'Phase 4 — สูตรช่วยเพื่อนพ้นภัย',
      cards: [
        { id: 'c1', text: 'หยุด — ไม่ตื่นตูม ฟังให้จบ' },
        { id: 'c2', text: 'เข้าใจ — ยอมรับความรู้สึกเขาก่อน' },
        { id: 'c3', text: 'ห่วง — แสดงว่าเรา care' },
        { id: 'c4', text: 'นำพา — เสนอทางออก/อยู่ด้วยกัน' },
        { id: 'c5', text: 'ส่งต่อ — เชื่อมกับผู้ใหญ่/สายด่วน' },
      ],
      correctOrder: ['c1', 'c2', 'c3', 'c4', 'c5'],
      next: 'phase5-intro',
      xpOnSuccess: 100,
      badge: 'buddy-saver',
      source: 'Mental Health First Aid (MHFA) — ALGEE Action Plan / สสส. คู่มือเพื่อนช่วยเพื่อน 2566',
    },
    {
      type: 'dialogue', id: 'phase5-intro', speaker: 'vapor', next: 'mg4',
      text: 'นี่คือด่านสุดท้าย... แกเติมประโยคเหล่านี้ให้ถูกต้อง — ฉันจะยอมรับว่าพ่ายแพ้',
    },
    // === Phase 5: Fill Blank — สรุปทักษะทั้งหมด ===
    {
      type: 'minigame', id: 'mg4', game: 'fill-blank',
      title: 'Phase 5 — เติมคำสรุปนักสืบ',
      questions: [
        {
          sentence: 'การปฏิเสธที่ทรงพลัง = ปฏิเสธ + เหตุผล + ___',
          options: ['ทางเลือก', 'การด่ากลับ'],
          correctIndex: 0,
          reveal: 'สูตรปฏิเสธ 3 ขั้นที่ใช้ในด่าน 2: "ไม่ → เพราะ → ไปทำอย่างอื่นแทน"',
          source: 'NIDA — Refusal Skills for Adolescents (2022)',
        },
        {
          sentence: 'เมื่อโดนตื๊อต่อ — ใช้เทคนิค ___ Record',
          options: ['Broken', 'Music'],
          correctIndex: 0,
          reveal: 'ยืนยันคำเดิม (Broken Record) = พูดคำตอบเดิมซ้ำๆ จนคนตื๊อเลิกตื๊อเอง',
          source: 'Smith — Assertiveness Training: Broken Record Technique',
        },
        {
          sentence: 'เมื่อเจอภัยออนไลน์ — หยุด → บล็อก → ___ → บอกผู้ใหญ่',
          options: ['รายงาน', 'แชร์ต่อ'],
          correctIndex: 0,
          reveal: '"ถอย" 4 ขั้น (Walk Away) — "รายงาน" บัญชีให้แพลตฟอร์มลบ ป้องกันคนต่อไปด้วย',
          source: 'Common Sense Media — Online Safety for Teens',
        },
        {
          sentence: 'การช่วยเพื่อนเริ่มต้นจากการ ___ ก่อนการสั่งสอน',
          options: ['ฟัง', 'เถียง'],
          correctIndex: 0,
          reveal: 'ฟัง-ยอมรับ-ห่วงใย-นำพา — "ฟัง" คือก้าวแรกที่เปิดประตูให้เพื่อนรับฟังเรา',
          source: 'Mental Health First Aid (MHFA) Youth Module',
        },
      ],
      next: 'taunt1',
      xpOnSuccess: 120,
      badge: 'wise-words',
    },
    // === ฉากขิงคนร้าย — หลังตอบครบแล้ว ผู้เล่นได้สวนกลับ ===
    {
      type: 'dialogue', id: 'taunt1', speaker: 'player', next: 'vapor-shock',
      text: 'เป็นไงล่ะ! ฉันรู้นะว่าคุณใช้สูตรอะไรหลอกเด็กๆ — กลิ่นผลไม้ คำโฆษณาฟอกขาว ฉันถอดรหัสคุณหมดแล้ว 😎',
    },
    {
      type: 'dialogue', id: 'vapor-shock', speaker: 'vapor', next: 'taunt2',
      text: 'แก... แกรู้ลึกขนาดนี้ได้ยังไง? ไม่... ไม่มีเด็กคนไหนที่...',
    },
    {
      type: 'dialogue', id: 'taunt2', speaker: 'player', next: 'taunt3',
      text: 'หลอกฉันไม่ได้หรอก! ทุกคำพูดที่คุณใช้ มันคือกับดักเดิมๆ ที่ฉันฝึกมาแล้ว 8 ด่าน',
    },
    {
      type: 'dialogue', id: 'taunt3', speaker: 'player', next: 'final-dialogue',
      text: 'และเด็กคนต่อไปที่คุณจะเข้าหา — เขาจะรู้ทันคุณเหมือนฉัน เพราะฉันจะส่งต่อทุกอย่างที่เรียนมา 🔍',
    },
    {
      type: 'dialogue', id: 'final-dialogue', speaker: 'vapor', next: 'final-choice',
      text: 'ฉันยอมรับ... ทักษะของแกครบทุกด้าน เครือข่ายของฉันจะถูกถอนรากภายในสัปดาห์นี้',
    },
    // === Phase สุดท้าย: ตัดสินใจ ===
    {
      type: 'choice', id: 'final-choice', speaker: 'player',
      prompt: '⚖️ Phase สุดท้าย — คำพูดสุดท้ายของคุณกับ Vapor',
      choices: [
        {
          label: 'ฉันไม่เกลียดคุณ — แต่ฉันจะไม่ยอมให้คุณทำลายเพื่อนรุ่นต่อไป',
          next: 'right-final', xp: 50, badge: 'mentor',
        },
        {
          label: 'แพ้ก็คือแพ้ จบแล้วก็จบไป',
          next: 'okay-final', xp: 25,
          reflection: 'ปิดท้ายแบบเย็นชา — นักสืบสุขภาพเปลี่ยนแปลงสังคมด้วยความเข้าใจ',
        },
      ],
    },
    {
      type: 'feedback', id: 'okay-final', next: 'final-choice',
      title: 'ลองอีกครั้ง',
      body: 'ตัวร้ายก็เคยเป็นคน — การปิดท้ายด้วยความเข้าใจ มีพลังเปลี่ยนใจคนได้มากกว่าการกล่าวโทษ',
    },
    {
      type: 'dialogue', id: 'right-final', speaker: 'vapor', next: 'feedback1',
      text: '...ขอบใจ นักสืบ ฉันเริ่มเห็นทางที่ถูก ฉันจะมอบรายชื่อเครือข่ายทั้งหมดให้คุณ',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'บันทึกนักสืบ (สรุปส่งท้าย) 📓',
      body: 'การรวมหลายทักษะ (refusal + media literacy + helping peers + law) คือแนวคิด Comprehensive Prevention ของ NIDA — ป้องกันได้ผลที่สุดเมื่อใช้หลายชั้นพร้อมกัน. มันได้ผลเพราะปัจจัยเสี่ยงของวัยรุ่นมาจากหลายด้าน (สื่อ-เพื่อน-ครอบครัว-อารมณ์) ทักษะเดียวไม่พอ. ส่งต่อสิ่งที่เรียน — Peer Education (เพื่อนสอนเพื่อน) เพิ่มผลป้องกันได้ 2-3 เท่าตามงานวิจัยไทย',
      source: 'NIDA Principles of Substance Use Prevention for Adolescents 2022 / งานวิจัย ม.มหิดล + สสส. 2566 — Peer Education Effectiveness',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'end1',
      fact: 'ในประเทศไทย เยาวชนที่จบหลักสูตรปฏิเสธบุหรี่ไฟฟ้า มีโอกาสไม่ลองสารเสพติดสูงกว่ากลุ่มทั่วไปถึง 3 เท่า',
      source: 'งานวิจัย ศจย. ร่วมกับ สสส. 2566',
    },
    {
      type: 'end', id: 'end1',
      title: '🏆 จบเกม! Health Legend',
      message: 'คุณเป็นนักสืบสุขภาพระดับตำนาน — ปกป้องลมหายใจของเพื่อนรุ่นต่อไปได้แล้ว!',
      xp: 200,
      badge: 'health-legend',
    },
  ],
  references: [
    'BMJ 2022 — Vaping vs Smoking Cessation Meta-Analysis',
    'WHO Report on the Global Tobacco Epidemic 2023',
    'CDC Youth Vaping Surveillance Report 2023',
    'American Lung Association — Secondhand Vapor 2023',
    'งานวิจัย ศจย. ร่วมกับ สสส. 2566',
  ],
};
