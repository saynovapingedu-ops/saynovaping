import type { Scenario } from '../types';

// ด่าน 19 (Expert 4) — EVALI: ปอดอักเสบเฉียบพลันจากบุหรี่ไฟฟ้า
export const scenario19: Scenario = {
  id: 19,
  title: 'EVALI ฉุกเฉิน',
  subtitle: 'บทเจาะลึก 4 — ปอดอักเสบจากบุหรี่ไฟฟ้า',
  estMinutes: 8,
  startNode: 'd1',
  intro: [
    'พี่หมอเก๋ส่งข้อความด่วน — มีเคสเด็ก ม.3 เข้า ICU เพราะ EVALI',
    'EVALI = E-cigarette/Vaping Use-Associated Lung Injury — ปอดอักเสบเฉียบพลันจากการสูบ vape',
    'นักสืบสุขภาพต้องรู้จักอาการเตือน เพื่อช่วยเพื่อนได้ทันก่อนสาย',
  ],
  nodes: [
    {
      type: 'dialogue', id: 'd1', speaker: 'doctor', next: 'd2',
      text: 'น้องนักสืบ — เคสนี้ คนไข้สูบ vape มา 3 เดือน แล้วมาด้วย "ไอแห้ง+เหนื่อย" คิดว่าเป็นหวัด พอ 2 วันต่อมา หายใจไม่ออก ต้องใช้เครื่องช่วยหายใจ',
    },
    {
      type: 'dialogue', id: 'd2', speaker: 'narrator', next: 'choice1',
      text: 'EVALI ลามเร็วใน 2-3 วัน — รู้อาการเร็ว = ช่วยได้',
    },
    {
      type: 'choice', id: 'choice1', speaker: 'player',
      prompt: 'ถ้าเพื่อนของคุณมีอาการแบบไหน ควรพาไปหาหมอด่วน?',
      choices: [
        { label: 'ไอแห้ง + เหนื่อยง่าย + เคยสูบ vape',
          next: 'right1', xp: 30 },
        { label: 'แค่จาม + คัดจมูก',
          next: 'wrong1', xp: 0,
          reflection: 'นั่นคืออาการหวัดทั่วไป EVALI มี "เหนื่อย" และ "ไอแห้ง" เป็นหลัก' },
        { label: 'รอดูอาการ 1 สัปดาห์ก่อน',
          next: 'wrong2', xp: 0,
          reflection: 'อันตราย! EVALI ลามเร็วใน 2-3 วัน รอ 1 สัปดาห์ = สายเกินไป' },
      ],
    },
    {
      type: 'feedback', id: 'wrong1', next: 'choice1',
      title: 'ลองอีกครั้ง',
      body: 'EVALI ต่างจากหวัด — ไอ "แห้งๆ" ไม่มีเสมหะ + รู้สึก "เหนื่อย" แม้นั่งเฉยๆ + อาจมี ไข้ คลื่นไส้ ปวดท้องร่วม ถ้ามีประวัติสูบ vape → ฉุกเฉินทันที',
      source: 'CDC EVALI Outbreak Report 2019-2023',
    },
    {
      type: 'feedback', id: 'wrong2', next: 'choice1',
      title: '⚠️ อย่ารอ',
      body: 'มีเคสจริงในไทย — เด็กรอ 4 วัน เพราะคิดว่าเป็นหวัด พอมา รพ. ปอดเสียหายไป 50% แล้ว ต้องใช้เครื่องช่วยหายใจ 3 สัปดาห์ ค่ารักษากว่า 1 ล้านบาท',
      source: 'รายงานเคส EVALI โรงพยาบาลรามาธิบดี 2022',
    },
    {
      type: 'dialogue', id: 'right1', speaker: 'doctor', next: 'mg1',
      text: '✓ ถูกต้อง! มาดูกัน — สารพิษอะไรใน vape บ้างที่ทำให้เกิด EVALI',
    },
    {
      type: 'minigame', id: 'mg1', game: 'word-match',
      title: 'สารพิษใน vape — จับคู่กับผลต่อร่างกาย',
      pairs: [
        { left: 'Vitamin E acetate',
          right: 'สาเหตุหลักของ EVALI — เคลือบปอดทำให้แลกเปลี่ยน O2 ไม่ได้',
          source: 'CDC EVALI Investigation — NEJM 2020' },
        { left: 'Formaldehyde (ฟอร์มาลดีไฮด์)',
          right: 'สารก่อมะเร็ง — เกิดจากร้อนน้ำยาที่อุณหภูมิสูง',
          source: 'NEJM 2015 — Hidden Formaldehyde in E-Cig Vapor' },
        { left: 'Diacetyl',
          right: '"ปอดป๊อปคอร์น" — เนื้อปอดเป็นแผลเป็นถาวร',
          source: 'American Lung Association — Diacetyl in Flavored E-Cig' },
        { left: 'Heavy metals (Pb, Ni, Cr)',
          right: 'โลหะหนักจากขดลวด — สะสมในไต/สมอง',
          source: 'Environmental Health Perspectives 2018' },
        { left: 'Propylene Glycol (PG)',
          right: 'ตัวทำละลายในน้ำยา — ก่อให้ระคายเคืองทางเดินหายใจ',
          source: 'FDA E-Liquid Ingredients Database' },
      ],
      next: 'feedback1',
      xpOnSuccess: 110,
      badge: 'expert-4-clear',
      source: 'CDC EVALI Investigation / NEJM Vaping Pulmonary Illness 2020',
    },
    {
      type: 'feedback', id: 'feedback1', next: 'edu1',
      title: 'บันทึกนักสืบ 📓',
      body: 'EVALI ค้นพบครั้งแรกในปี 2019 — มีผู้ป่วยกว่า 2,800 คน เสียชีวิต 68 คน (CDC) หลังจากห้ามขายน้ำยา flavored บางส่วน เคสลดลง แต่ในไทยที่ตลาดเป็น "underground" ทำให้น้ำยาไม่มี QC — เคส EVALI ในไทยเริ่มพบเพิ่มทุกปี',
      source: 'CDC EVALI Surveillance 2019-2023 / กรมการแพทย์ กระทรวงสาธารณสุข',
    },
    {
      type: 'educationalPopup', id: 'edu1', next: 'd-end',
      fact: '⚠️ ถ้าเพื่อนของคุณ "เคยสูบ vape + ไอ + เหนื่อย + ไข้" — โทร 1669 (สายด่วนการแพทย์ฉุกเฉิน) ทันที พาไป ER ที่ใกล้ที่สุด อย่ารอดูอาการ',
      source: 'สถาบันการแพทย์ฉุกเฉินแห่งชาติ (NIEM) — เกณฑ์ฉุกเฉิน 2023',
    },
    {
      type: 'dialogue', id: 'd-end', speaker: 'doctor', next: 'end1',
      text: 'เก่งมาก! ความรู้นี้อาจช่วยชีวิตเพื่อนได้จริง — รู้แล้วต้องส่งต่อ',
    },
    {
      type: 'end', id: 'end1',
      title: '🫁 Expert 4 ผ่าน!',
      message: 'คุณรู้จัก EVALI + สารพิษใน vape + เกณฑ์ฉุกเฉินแล้ว — ทักษะระดับเชี่ยวชาญ',
      xp: 100,
      badge: 'expert-4-clear',
    },
  ],
  references: [
    'CDC EVALI Outbreak Report (2019-2023)',
    'NEJM — Pulmonary Illness Related to E-Cigarette Use (2019, 2020)',
    'American Lung Association — Diacetyl & Popcorn Lung',
    'กรมการแพทย์ กระทรวงสาธารณสุข — รายงาน EVALI ในไทย',
    'สถาบันการแพทย์ฉุกเฉินแห่งชาติ — เกณฑ์ฉุกเฉินทางการแพทย์',
  ],
};
