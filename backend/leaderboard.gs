/**
 * ============================================================================
 *  Leaderboard snippet — เพิ่มลงใน Apps Script เดิม (Code.gs) ของคุณ
 * ============================================================================
 *  มี 2 ทางเลือก:
 *   (A) ง่ายสุด: แทนทั้งไฟล์ Code.gs ด้วย backend/Code.gs (เป็นเวอร์ชันเต็มที่รวมแล้ว)
 *   (B) เพิ่มเฉพาะส่วน: วางฟังก์ชัน handleLeaderboard_ ด้านล่างนี้ต่อท้ายไฟล์เดิม
 *       แล้วเพิ่ม 1 บรรทัดใน doGet():
 *
 *         if (action === 'leaderboard') return handleLeaderboard_(e.parameter);
 *
 *  ใช้ helper เดิม (getSheet_, jsonResponse_, CONFIG) จึงไม่ต้องประกาศซ้ำ
 *  ⚠️ แก้แล้วต้อง Deploy เวอร์ชันใหม่ (Manage deployments → Edit → New version)
 * ============================================================================
 */

// คอลัมน์ Players: A userIdHash | B nickname | C grade | D school
//                  G totalXP    | H level    | I stagesCompleted
function handleLeaderboard_(params) {
  let scope = String(params.scope || 'class').toLowerCase();
  const myHash = params.hash || '';
  const limit = Math.min(parseInt(params.limit, 10) || 50, 200);

  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse_({ok:true, scope:scope, entries:[], total:0});

  const players = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const hash = String(r[0] || '');
    const nick = String(r[1] || '');
    if (!hash && !nick) continue;
    const stagesStr = String(r[8] || '');
    players.push({
      userIdHash: hash,
      nickname: nick || 'ผู้เล่น',
      grade:  String(r[2] || '').trim(),
      school: String(r[3] || '').trim(),
      totalXP: Number(r[6]) || 0,
      level:   Number(r[7]) || 1,
      stagesCount: stagesStr ? stagesStr.split(',').filter(Boolean).length : 0,
    });
  }

  let me = null;
  if (myHash) {
    for (let i = 0; i < players.length; i++) {
      if (players[i].userIdHash === myHash) { me = players[i]; break; }
    }
  }

  let groupLabel = '';
  let filtered = players;
  if (scope === 'class') {
    if (me && me.school && me.grade) {
      filtered = players.filter(function (p) { return p.school === me.school && p.grade === me.grade; });
      groupLabel = me.grade + ' • ' + me.school;
    } else {
      return jsonResponse_({ok:true, scope:'class', entries:[], total:0, groupLabel:''});
    }
  } else if (scope === 'school') {
    if (me && me.school) {
      filtered = players.filter(function (p) { return p.school === me.school; });
      groupLabel = me.school;
    }
  } else {
    scope = 'all';
    groupLabel = 'ผู้เล่นทั้งหมด';
  }

  filtered.sort(function (a, b) {
    if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
    if (b.stagesCount !== a.stagesCount) return b.stagesCount - a.stagesCount;
    return a.nickname.localeCompare(b.nickname);
  });

  const ranked = filtered.map(function (p, i) {
    return {
      rank: i + 1,
      nickname: p.nickname,
      level: p.level,
      totalXP: p.totalXP,
      stagesCount: p.stagesCount,
      isMe: !!(myHash && p.userIdHash === myHash),
    };
  });

  let meEntry = null;
  for (let i = 0; i < ranked.length; i++) {
    if (ranked[i].isMe) { meEntry = ranked[i]; break; }
  }

  return jsonResponse_({
    ok: true,
    scope: scope,
    groupLabel: groupLabel,
    total: ranked.length,
    entries: ranked.slice(0, limit),
    me: meEntry,
  });
}
