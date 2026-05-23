/**
 * ============================================================================
 *  Health Detective — Backend (Google Apps Script)
 * ============================================================================
 *  Project    : นักสืบสุขภาพ: ภารกิจปกป้องลมหายใจ
 *  Account    : saynovaping.edu@gmail.com
 *  Frontend   : https://saynovapingedu-ops.github.io/saynovaping/
 *  Version    : 1.1.0
 *
 *  Endpoints  :
 *    POST  body {action:'sync', ...}              บันทึก/อัปเดต progress
 *    POST  body {action:'issueCert', ...}         ออก certificate
 *    GET   ?action=verify&code=XXXXXX             ตรวจ certificate
 *    GET   ?action=restore&hash=...               กู้ progress (เปลี่ยนเครื่อง)
 *    GET   ?action=ping                           เช็ค backend ทำงานไหม
 *    GET   ?action=leaderboard&hash=...           กระดานอันดับรวม (ใหม่ v1.1.0)
 *
 *  ตั้งค่าครั้งแรก:
 *    1. Project Settings → Script Properties → เพิ่ม:
 *         Key: SHEET_ID
 *         Value: <Spreadsheet ID จาก URL ของ Google Sheet>
 *    2. รัน function setupSheets() ครั้งเดียว → จะสร้าง headers ให้
 *    3. Deploy → New deployment → Web app
 *         Execute as: Me  |  Who has access: Anyone
 *    4. Copy URL → ใส่ใน LIFF .env เป็น VITE_SYNC_URL
 *
 *  ⚠️ แก้โค้ดแล้วต้อง Deploy เวอร์ชันใหม่เสมอ:
 *     Manage deployments → (ดินสอ) Edit → Version: New version → Deploy
 * ============================================================================
 */

const CONFIG = {
  CERT_PREFIX: 'HD',
  CERT_YEAR: new Date().getFullYear(),
  STAGES_REQUIRED: 8,
  MIN_XP_FOR_CERT: 1500,
  SHEET_NAMES: {
    PLAYERS: 'Players',
    EVENTS: 'Events',
    CERTIFICATES: 'Certificates',
  },
};

// ---------- Helpers ----------
function getSheet_(name) {
  const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) throw new Error('SHEET_ID not configured in Script Properties');
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" not found');
  return sheet;
}

function findRowByUserHash_(sheet, userIdHash) {
  const data = sheet.getRange('A:A').getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userIdHash) return i + 1;
  }
  return -1;
}

function isValidHash_(s) {
  return typeof s === 'string' && /^[a-f0-9]{64}$/i.test(s);
}

function generateVerifyCode_() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function nextCertNumber_() {
  const sheet = getSheet_(CONFIG.SHEET_NAMES.CERTIFICATES);
  const seq = sheet.getLastRow(); // header=1 → lastRow คือ seq ถัดไปพอดี
  return CONFIG.CERT_PREFIX + '-' + CONFIG.CERT_YEAR + '-' + String(seq).padStart(4, '0');
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function nowIso_() { return new Date().toISOString(); }

function logEvent_(userIdHash, event, detail, xpDelta) {
  try {
    const sheet = getSheet_(CONFIG.SHEET_NAMES.EVENTS);
    sheet.appendRow([nowIso_(), userIdHash, event, detail || '', xpDelta || 0]);
  } catch (e) { console.error('logEvent failed:', e); }
}

// ---------- Endpoint: sync ----------
function handleSync_(p) {
  if (!isValidHash_(p.userIdHash)) return jsonResponse_({ok:false, error:'invalid_hash'});
  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const row = findRowByUserHash_(sheet, p.userIdHash);
  const stagesStr = (p.stagesCompleted || []).join(',');
  const badgesStr = (p.badges || []).join(',');

  if (row === -1) {
    sheet.appendRow([
      p.userIdHash, p.nickname || '', p.grade || '', p.school || '',
      nowIso_(), nowIso_(),
      p.totalXP || 0, p.level || 1,
      stagesStr, badgesStr,
      '', ''
    ]);
    logEvent_(p.userIdHash, 'player_created', '', 0);
    return jsonResponse_({ok:true, action:'created'});
  } else {
    sheet.getRange(row, 2).setValue(p.nickname || '');
    sheet.getRange(row, 3).setValue(p.grade || '');
    sheet.getRange(row, 4).setValue(p.school || '');
    sheet.getRange(row, 6).setValue(nowIso_());
    sheet.getRange(row, 7).setValue(p.totalXP || 0);
    sheet.getRange(row, 8).setValue(p.level || 1);
    sheet.getRange(row, 9).setValue(stagesStr);
    sheet.getRange(row, 10).setValue(badgesStr);
    logEvent_(p.userIdHash, 'sync', '', p.totalXP || 0);
    return jsonResponse_({ok:true, action:'updated'});
  }
}

// ---------- Endpoint: issueCert ----------
function handleIssueCert_(p) {
  if (!isValidHash_(p.userIdHash)) return jsonResponse_({ok:false, error:'invalid_hash'});

  const playerSheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const row = findRowByUserHash_(playerSheet, p.userIdHash);
  if (row === -1) return jsonResponse_({ok:false, error:'player_not_found'});

  const nickname = playerSheet.getRange(row, 2).getValue();
  const totalXP = Number(playerSheet.getRange(row, 7).getValue()) || 0;
  const stagesStr = String(playerSheet.getRange(row, 9).getValue() || '');
  const stages = stagesStr ? stagesStr.split(',').filter(Boolean) : [];
  const existingCert = playerSheet.getRange(row, 11).getValue();

  // ถ้าออกแล้ว → คืนของเดิม ไม่ออกซ้ำ
  if (existingCert) {
    const certSheet = getSheet_(CONFIG.SHEET_NAMES.CERTIFICATES);
    const certData = certSheet.getDataRange().getValues();
    for (let i = 1; i < certData.length; i++) {
      if (certData[i][0] === existingCert) {
        return jsonResponse_({
          ok:true, alreadyIssued:true,
          certificateNo: existingCert,
          verifyCode: certData[i][4],
          issueDate: certData[i][3],
          nickname: certData[i][2],
        });
      }
    }
  }

  const allDone = stages.length >= CONFIG.STAGES_REQUIRED;
  const enoughXP = totalXP >= CONFIG.MIN_XP_FOR_CERT;
  if (!allDone && !enoughXP) {
    return jsonResponse_({
      ok:false, error:'requirements_not_met',
      message:'ต้องจบครบ ' + CONFIG.STAGES_REQUIRED + ' ด่าน หรือมี XP ≥ ' + CONFIG.MIN_XP_FOR_CERT,
      currentStages: stages.length, currentXP: totalXP,
    });
  }

  const certNo = nextCertNumber_();
  const verifyCode = generateVerifyCode_();
  const issueDate = nowIso_();

  const certSheet = getSheet_(CONFIG.SHEET_NAMES.CERTIFICATES);
  certSheet.appendRow([certNo, p.userIdHash, nickname, issueDate, verifyCode, totalXP, stages.length]);

  playerSheet.getRange(row, 11).setValue(certNo);
  playerSheet.getRange(row, 12).setValue(issueDate);

  logEvent_(p.userIdHash, 'cert_issued', certNo, totalXP);

  return jsonResponse_({
    ok:true, alreadyIssued:false,
    certificateNo: certNo,
    verifyCode: verifyCode,
    issueDate: issueDate,
    nickname: nickname,
  });
}

// ---------- Endpoint: verify ----------
function handleVerify_(params) {
  const sheet = getSheet_(CONFIG.SHEET_NAMES.CERTIFICATES);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const [certNo, _hash, nickname, issueDate, verifyCode, totalXP, stagesCount] = data[i];
    const matchByCode = params.code && String(verifyCode).toUpperCase() === String(params.code).toUpperCase();
    const matchByCertNo = params.certNo && String(certNo) === String(params.certNo);
    if (matchByCode || matchByCertNo) {
      return jsonResponse_({
        ok:true, valid:true,
        certificateNo: certNo,
        nickname: nickname,
        issueDate: issueDate,
        totalXP: totalXP,
        stagesCount: stagesCount,
      });
    }
  }
  return jsonResponse_({ok:true, valid:false});
}

// ---------- Endpoint: restore ----------
function handleRestore_(params) {
  if (!isValidHash_(params.hash)) return jsonResponse_({ok:false, error:'invalid_hash'});
  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const row = findRowByUserHash_(sheet, params.hash);
  if (row === -1) return jsonResponse_({ok:true, found:false});
  const r = sheet.getRange(row, 1, 1, 12).getValues()[0];
  return jsonResponse_({
    ok:true, found:true,
    player: {
      nickname: r[1], grade: r[2], school: r[3],
      createdAt: r[4], lastActiveAt: r[5],
      totalXP: Number(r[6]) || 0,
      level: Number(r[7]) || 1,
      stagesCompleted: r[8] ? String(r[8]).split(',').filter(Boolean).map(Number) : [],
      badges: r[9] ? String(r[9]).split(',').filter(Boolean) : [],
      certificateNo: r[10] || null,
      certificateIssuedAt: r[11] || null,
    },
  });
}

// ---------- Endpoint: leaderboard (v1.1.0) ----------
// PDPA: กระดานรวมทั้งหมด ไม่แยกห้อง/โรงเรียน และ "ไม่ส่งชื่อผู้เล่นคนอื่น"
//       ส่ง nickname กลับเฉพาะแถวของผู้เล่นเอง (isMe) เท่านั้น
// คอลัมน์ Players ที่ใช้: A userIdHash | B nickname | G totalXP | I stagesCompleted
function handleLeaderboard_(params) {
  const myHash = params.hash || '';
  const limit = Math.min(parseInt(params.limit, 10) || 50, 200);

  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse_({ok:true, scope:'all', entries:[], total:0});

  // อ่านผู้เล่นทุกแถว (ข้าม header) — เก็บเท่าที่จำเป็น
  const players = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const hash = String(r[0] || '');
    if (!hash) continue; // แถวว่าง
    const stagesStr = String(r[8] || '');
    players.push({
      userIdHash: hash,
      nickname: String(r[1] || 'ผู้เล่น'),
      totalXP: Number(r[6]) || 0,
      stagesCount: stagesStr ? stagesStr.split(',').filter(Boolean).length : 0,
    });
  }

  // เรียงอันดับ: XP มาก → ด่านเยอะ
  players.sort(function (a, b) {
    if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
    return b.stagesCount - a.stagesCount;
  });

  // ใส่อันดับ — เปิดเผยชื่อเฉพาะแถวของผู้เล่นเอง (PDPA: data minimization)
  let meEntry = null;
  const ranked = players.map(function (p, i) {
    const isMe = !!(myHash && p.userIdHash === myHash);
    const entry = {
      rank: i + 1,
      totalXP: p.totalXP,
      stagesCount: p.stagesCount,
      isMe: isMe,
    };
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

// ---------- Routers ----------
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action === 'sync')      return handleSync_(payload);
    if (payload.action === 'issueCert') return handleIssueCert_(payload);
    return jsonResponse_({ok:false, error:'unknown_action'});
  } catch (err) {
    return jsonResponse_({ok:false, error:'server_error', message:String(err)});
  }
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    if (action === 'verify')      return handleVerify_(e.parameter);
    if (action === 'restore')     return handleRestore_(e.parameter);
    if (action === 'leaderboard') return handleLeaderboard_(e.parameter);
    if (action === 'ping')        return jsonResponse_({ok:true, time:nowIso_(), version:'1.1.0'});
    return jsonResponse_({ok:false, error:'unknown_action'});
  } catch (err) {
    return jsonResponse_({ok:false, error:'server_error', message:String(err)});
  }
}

// ---------- Setup helper (รันครั้งเดียว) ----------
function setupSheets() {
  const sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) throw new Error('กรุณาตั้ง SHEET_ID ใน Script Properties ก่อน');
  const ss = SpreadsheetApp.openById(sheetId);

  const setup = [
    {name: CONFIG.SHEET_NAMES.PLAYERS,
     headers: ['userIdHash','nickname','grade','school','createdAt','lastActiveAt',
               'totalXP','level','stagesCompleted','badges','certificateNo','certificateIssuedAt']},
    {name: CONFIG.SHEET_NAMES.EVENTS,
     headers: ['timestamp','userIdHash','event','detail','xpDelta']},
    {name: CONFIG.SHEET_NAMES.CERTIFICATES,
     headers: ['certificateNo','userIdHash','nickname','issueDate','verifyCode','totalXP','stagesCount']},
  ];

  setup.forEach(({name, headers}) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  });

  const def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  console.log('✅ Setup complete: ' + setup.map(s => s.name).join(', '));
}
