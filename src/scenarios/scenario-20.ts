import type { Scenario } from '../types';

// ด่าน 20 (Expert Final) — สูตร 4D + รวมพลังทีมป้องกันโรงเรียน
export const scenario20: Scenario = {
  id: 20,
  title: 'สูตรเลิก 4D ส่งต่อทีม',
  subtitle: 'Expert Final — รวมพลังป้องกันในโรงเรียน',
  estMinutes: 9,
  startNode: 'd1',
  intro: [
    '🌟 ด่านสุดท้ายของเส้นทางนักสืบ',
    'ผอ.โรงเรียนชวนคุณตั้ง "ทีมนักสืบสุขภาพประจำโรงเรียน" — ป้องกันบุหรี่ไฟฟ้าระดับโรงเรียน',
    'แต่ก่อน — คุณต้องรู้ "สูตรเลิก 4D" สำหรับเพื่อนที่ติดแล้ว และวางแผนทีม',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'doctor', next: 'd2',
      text: 'น้องนักสืบ — เพื่อนของน้องที่อยากเลิก vape มา 1 อาทิตย์แล้ว แต่ทุกครั้งที่ "อยากสูบ" ก็ทนไม่ไหว — มีสูตรช่วยมั้ย?',
    },
    {
      type: 'dialogue', id: 'd2', speaker: 'narrator', next: 'mg1',
      text: 'สูตร 4D คือเครื่องมือเชิงปฏิบัติ — เมื่อ "อยากสูบ" ใช้ 4 ขั้นนี้ ความอยากจะหายใน 5 นาที',
    },
    {
      type: 'minigame', id: 'mg1', game: 'fill-blank',
      title: 'สูตร 4D — เติมคำให้ครบ',
      questions: [
        {
          sentence: 'D-1: ___ — หน่วงเวลา 5 นาที ความอยากจะลดลงเอง',
          options: ['Delay (หน่วงเวลา)', 'Decide (ตัดสินใจ)'],
          correctIndex: 0,
          reveal: 'Delay = "หน่วง" — งานวิจัยพบว่าความอยากนิโคตินสูงสุดแค่ 3-5 นาที ถ้าผ่านไปได้ → ความอยากลดเอง',
          source: 'American Cancer Society — 4D Method',
        },
        {
          sentence: 'D-2: Deep breath — หายใจลึก 10 ครั้ง ลดฮอร์โมน ___',
          options: ['cortisol (เครียด)', 'insulin (น้ำตาล)'],
          correctIndex: 0,
          reveal: 'การหายใจลึกกระตุ้นระบบ parasympathetic → ลด cortisol (ฮอร์โมนความเครียด) ในเลือด ทำให้ความอยากสูบลด',
          source: 'Harvard Health — Relaxation Response (Herbert Benson)',
        },
        {
          sentence: 'D-3: ___ Water — ดื่มน้ำเย็น แทนการ inhale',
          options: ['Drink (ดื่ม)', 'Drop (หยด)'],
          correctIndex: 0,
          reveal: 'การดื่มน้ำเย็นกระตุ้น vagus nerve → ผ่อนคลายเสริมการหายใจลึก + ทำให้ปากไม่ว่าง',
          source: 'Cleveland Clinic — Vagus Nerve & Cravings',
        },
        {
          sentence: 'D-4: Do something — ทำกิจกรรมอื่นแทน เช่น ___',
          options: ['เดิน 5 นาที / โทรเพื่อน', 'นอนต่อ'],
          correctIndex: 0,
          reveal: 'การออกกำลังกายเบา 5 นาทีหลั่ง endorphin ทำให้อยากสูบลดลง — การโทรหาเพื่อนสร้าง social support',
          source: 'NIH — Exercise & Nicotine Cravings 2020',
        },
      ],
      next: 'd3',
      xpOnSuccess: 120,
      badge: 'expert-final-clear',
    },
    {
      type: 'dialogue', id: 'd3', speaker: 'doctor', next: 'd4',
      text: 'เก่งมาก! ตอนนี้คุณช่วยเพื่อนเลิกได้ — แต่ป้องกันก่อนเลิกดีกว่า ทีมโรงเรียนต้องทำอะไรบ้าง?',
    },
    {
      type: 'choice', id: 'd4', speaker: 'player',
      prompt: 'เริ่มทีมนักสืบสุขภาพในโรงเรียน — สิ่งสำคัญที่สุดคืออะไร?',
      choices: [
        { label: 'ประกาศชื่อคนสูบ vape ในไลน์กลุ่ม รร.',
          next: 'wrong1', xp: 0,
          reflection: 'นี่คือ "bullying" — ผิดทั้งกฎหมายและจรรยาบรรณ + ทำให้คนซ่อนหนักขึ้น',
          source: 'พ.ร.บ.คุ้มครองเด็ก พ.ศ. 2546' },
        { label: 'อบรมเพื่อน + ทำกิจกรรม + รายงาน case ลับๆ ให้ครู',
          next: 'right1', xp: 35 },
        { label: 'ห้ามทุกคนถามเรื่อง vape ในโรงเรียนเลย',
          next: 'wrong2', xp: 0,
          reflection: 'การ "ห้ามพูด" = เด็กจะเรียนรู้จาก TikTok แทน อันตรายกว่า' },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'd4',
      title: '⚠️ Bullying ผิดกฎหมาย',
      body: 'พ.ร.บ.คุ้มครองเด็ก พ.ศ. 2546 — ห้ามเปิดเผยข้อมูลส่วนตัวของผู้เยาว์ที่อาจทำให้เสียหาย การประกาศชื่อ = ผิดกฎหมาย + กลั่นแกล้ง',
      source: 'พ.ร.บ.คุ้มครองเด็ก พ.ศ. 2546 มาตรา 27',
    },
    {
      type: 'feedback', id: 'wrong2', next: 'd4',
      title: 'ตรงข้ามกับที่ควรทำ',
      body: 'การ "เปิดพื้นที่พูด" ทำให้เด็กถามได้ → ได้ข้อมูลจริง vs การห้ามพูด = เด็กไปเรียนจากแหล่งไม่น่าเชื่อถือ',
      source: 'WHO — School Health Promotion Framework',
    },
    {
      type: 'dialogue', id: 'right1', speaker: 'doctor', next: 'edu1',
      text: '✓ เยี่ยม! ทีมนักสืบจะ (1) อบรมความรู้ (2) ทำกิจกรรมสนุก (3) รายงาน case ลับๆ ให้ครู — แบบนี้ป้องกันได้จริง',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'd-end',
      fact: 'โรงเรียนในไทยที่มีโครงการ "เพื่อนช่วยเพื่อน" ลดอัตราการเริ่มสูบในวัยรุ่นได้ 35-50% ภายใน 2 ปี — peer education ทำงานได้จริง',
      source: 'สสส. รายงานโครงการโรงเรียนปลอดบุหรี่ 2023',
    },
    {
      type: 'dialogue', id: 'd-end', speaker: 'narrator', next: 'end1',
      text: 'คุณส่งต่อความรู้ให้ทีมเพื่อน — เริ่มห่วงโซ่ป้องกันในโรงเรียน นี่คือผลของนักสืบสุขภาพระดับเชี่ยวชาญ',
    },
    {
      type: 'end', id: 'end1',
      title: '🌟 จบเส้นทางนักสืบสุขภาพ!',
      message: 'คุณผ่านครบ 20 ด่าน — ทักษะครบ ป้องกันได้ ส่งต่อได้ คุณคือนักสืบสุขภาพระดับตำนานแล้ว!',
      xp: 150,
      badge: 'expert-final-clear',
    },
  ],
  references: [
    'American Cancer Society — 4D Method for Smoking Cessation',
    'Harvard Health — Herbert Benson Relaxation Response',
    'NIH — Exercise & Nicotine Cravings (2020)',
    'พ.ร.บ.คุ้มครองเด็ก พ.ศ. 2546',
    'WHO — School Health Promotion Framework (2022)',
    'สสส. — โครงการโรงเรียนปลอดบุหรี่ คู่มือนักเรียนแกนนำ (2023)',
    'Quitline 1600 — เครือข่ายผู้ช่วยเลิกแห่งชาติ',
  ],
};
