/**
 * ============================================================================
 *  Leaderboard snippet — เพิ่มลงใน Apps Script เดิม (Code.gs) ของคุณ
 * ============================================================================
 *  มี 2 ทางเลือก:
 *   (A) ง่ายสุด: แทนทั้งไฟล์ Code.gs ด้วย backend/Code.gs (เวอร์ชันเต็มที่รวมแล้ว)
 *   (B) เพิ่มเฉพาะส่วน: วางฟังก์ชัน handleLeaderboard_ ด้านล่างนี้ต่อท้ายไฟล์เดิม
 *       แล้วเพิ่ม 1 บรรทัดใน doGet():
 *
 *         if (action === 'leaderboard') return handleLeaderboard_(e.parameter);
 *
 *  ใช้ helper เดิม (getSheet_, jsonResponse_, CONFIG) จึงไม่ต้องประกาศซ้ำ
 *  ⚠️ แก้แล้วต้อง Deploy เวอร์ชันใหม่ (Manage deployments → Edit → New version)
 *
 *  PDPA: กระดานรวมทั้งหมด ไม่แยกห้อง/โรงเรียน และ "ไม่ส่งชื่อผู้เล่นคนอื่น"
 *        ส่ง nickname กลับเฉพาะแถวของผู้เล่นเอง (isMe) เท่านั้น
 * ============================================================================
 */

// คอลัมน์ Players ที่ใช้: A userIdHash | B nickname | G totalXP | I stagesCompleted
function handleLeaderboard_(params) {
  const myHash = params.hash || '';
  const limit = Math.min(parseInt(params.limit, 10) || 50, 200);

  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse_({ok:true, scope:'all', entries:[], total:0});

  const players = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const hash = String(r[0] || '');
    if (!hash) continue;
    const stagesStr = String(r[8] || '');
    players.push({
      userIdHash: hash,
      nickname: String(r[1] || 'ผู้เล่น'),
      totalXP: Number(r[6]) || 0,
      stagesCount: stagesStr ? stagesStr.split(',').filter(Boolean).length : 0,
    });
  }

  players.sort(function (a, b) {
    if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
    return b.stagesCount - a.stagesCount;
  });

  // เปิดเผยชื่อเฉพาะแถวของผู้เล่นเอง (PDPA: data minimization)
  let meEntry = null;
  const ranked = players.map(function (p, i) {
    const isMe = !!(myHash && p.userIdHash === myHash);
    const entry = { rank: i + 1, totalXP: p.totalXP, stagesCount: p.stagesCount, isMe: isMe };
    if (isMe) { entry.nickname = p.nickname; meEntry = entry; }
    return entry;
  });

  return jsonResponse_({
    ok: true,
    scope: 'all',
    groupLabel: 'ผู้เล่นทั้งหมด',
    total: ranked.length,
    entries: ranked.slice(0, limit),
    me: meEntry,
  });
}
