// ============================================================================
//  Shuffle utilities — สลับลำดับแบบสุ่ม (Fisher–Yates)
//  ใช้กันไม่ให้ "คำตอบที่ถูก" อยู่ตัวเลือกแรก (ข้อ ก.) ตลอดเวลา
// ============================================================================

/** สลับลำดับ array แบบสุ่ม — คืน array ใหม่ (ไม่แก้ของเดิม) */
export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * สลับตำแหน่งตัวเลือกของคำถาม (choices) แล้วคำนวณ index ของคำตอบที่ถูกใหม่
 * ใช้กับคำถามที่มีโครงสร้าง { choices: string[]; correctIndex: number }
 */
export function shuffleChoices<T extends { choices: string[]; correctIndex: number }>(q: T): T {
  const order = shuffle(q.choices.map((_, i) => i));
  return {
    ...q,
    choices: order.map(i => q.choices[i]),
    correctIndex: order.indexOf(q.correctIndex),
  };
}
