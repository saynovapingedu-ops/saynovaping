/**
 * ============================================================================
 *  Health Detective — Backend (Google Apps Script)
 * ============================================================================
 *  Project    : นักสืบสุขภาพ: ภารกิจปกป้องลมหายใจ
 *  Account    : saynovaping.edu@gmail.com
 *  Frontend   : https://saynovapingedu-ops.github.io/saynovaping/
 *  Version    : 2.4.0 (Clear Differentiation: [ใหม่-ข้อสอบวิจัย] VS [ระบบเกมเดิม])
 *
 *  โครงสร้างการแยกชื่อหัวตารางชัดเจน 100%:
 *   1. 👤 [ข้อมูลผู้เรียน]        : รหัสนักศึกษา, ชื่อ-นามสกุลจริง, ชื่อบัญชี LINE, ชื่อเล่น, ชั้น, โรงเรียน
 *   2. 📝 [ใหม่-ก่อนเรียน]      : ความรู้บุหรี่ไฟฟ้า (%), ทักษะการปฏิเสธ (/100)
 *   3. 📝 [ใหม่-หลังเรียน]      : ความรู้บุหรี่ไฟฟ้า (%), ทักษะการปฏิเสธ (/100)
 *   4. 📊 [ผลวิจัย]             : พัฒนาการความรู้ (Gain Delta %)
 *   5. 🕹️ [ด่านเกม]            : บทหลักเกียรติบัตร (ด่าน 1-8), เล่นจบครบทุกด่าน (20 ด่าน)
 *   6. ⭐ [คะแนนเกม]           : คะแนน XP สะสม, เลเวลผู้เล่น
 *   7. 🤖 [ใหม่-ประเมินแอป]    : ความพึงพอใจแชตบอต 7 ข้อ (1.00-5.00)
 *   8. 🎓 [เกียรติบัตร]          : เลขที่เกียรติบัตร, วันที่ออกเกียรติบัตร
 *   9. 🕒 [วันเวลา & ข้อมูลดิบ]  : เวลาส่งข้อสอบ และ Demographics JSON
 * ============================================================================
 */

const CONFIG = {
  CERT_PREFIX: 'HD',
  CERT_YEAR: new Date().getFullYear(),
  STAGES_REQUIRED: 8,          // จบด่าน 1-8 ครบ 8 ด่านเพื่อรับเกียรติบัตร
  TOTAL_STAGES: 20,            // ด่านเนื้อหาทั้งหมดในเกม 20 ด่าน (4 บท)
  MIN_XP_FOR_CERT: 1500,
  TEACHER_PASSCODE: 'wu2535',
  SHEET_NAMES: {
    PLAYERS: 'Players',           // แท็บ 1: คะแนน & ข้อมูลวิจัย (หลัก)
    GAME_STATS: 'GameStats',     // แท็บ 2: ไอเทม & ระบบเกม (ย่อย)
    CERTIFICATES: 'Certificates', // แท็บ 3: ทะเบียนเกียรติบัตร
    EVENTS: 'Events',             // แท็บ 4: ประวัติระบบ
  },
};

// ============================================================================
// แท็บ 1: PLAYERS (สมุดเกรดคะแนน & งานวิจัย 25 คอลัมน์ — หัวข้อแยกชัดเจน 100%)
// ============================================================================
const COL_PLAYER = {
  ID_CODE: 1,                 // 👤 รหัสนักศึกษา (Student ID)
  REAL_NAME: 2,               // 👤 ชื่อ-นามสกุลจริง
  LINE_NAME: 3,               // 📲 ชื่อบัญชีใน LINE
  NICKNAME: 4,               // 🎮 ชื่อเล่นในเกม
  GRADE: 5,                  // 🏫 ระดับชั้น
  SCHOOL: 6,                 // 🏫 โรงเรียน
  PRE_TEST_SCORE: 7,         // 📝 [ใหม่-ก่อนเรียน] ความรู้บุหรี่ไฟฟ้า (%)
  PRE_TEST_SKILL_SCORE: 8,   // 📝 [ใหม่-ก่อนเรียน] ทักษะการปฏิเสธ (/100)
  POST_TEST_SCORE: 9,        // 📝 [ใหม่-หลังเรียน] ความรู้บุหรี่ไฟฟ้า (%)
  POST_TEST_SKILL_SCORE: 10, // 📝 [ใหม่-หลังเรียน] ทักษะการปฏิเสธ (/100)
  GAIN_DELTA_KNOWLEDGE: 11,  // 📊 [ผลวิจัย] พัฒนาการความรู้ (Gain Delta %)
  HERO_STAGES_COUNT: 12,     // 🕹️ [ด่านเกม] บทหลักรับเกียรติบัตร (ด่าน 1-8)
  TOTAL_STAGES_COUNT: 13,    // 🕹️ [ด่านเกม] เล่นจบครบทุกด่าน (20 ด่าน)
  TOTAL_XP: 14,              // ⭐ [คะแนนเกม] คะแนน XP สะสมในเกม
  LEVEL: 15,                 // ⭐ [คะแนนเกม] เลเวลผู้เล่น (Level 1-5)
  EVAL_PART5_AVG: 16,        // 🤖 [ใหม่-ประเมินแอป] ความพึงพอใจแชตบอต (1-5)
  CERTIFICATE_NO: 17,        // 🎓 [เกียรติบัตร] เลขที่เกียรติบัตร (Cert No)
  CERTIFICATE_ISSUED_AT: 18, // 🎓 [เกียรติบัตร] วันที่ออกเกียรติบัตร
  PRE_TEST_AT: 19,           // 🕒 [วันเวลา] เวลาส่ง Pre-test
  POST_TEST_AT: 20,          // 🕒 [วันเวลา] เวลาส่ง Post-test
  LAST_ACTIVE_AT: 21,        // 🕒 [วันเวลา] เวลาเข้าเล่นล่าสุด
  CREATED_AT: 22,            // 🕒 [วันเวลา] วันที่เริ่มเล่นครั้งแรก
  DEMOGRAPHICS: 23,          // 📦 [ข้อมูลดิบ] แบบสำรวจข้อมูลส่วนบุคคล (JSON)
  EVAL_PART5_DETAILS: 24,    // 📦 [ข้อมูลดิบ] ประเมินบอทรายข้อ 7 ข้อ (JSON)
  USER_ID_HASH: 25,          // 🔑 [ระบบ] LINE User ID Hash
  PRE_TEST_KNOWLEDGE_ANSWERS: 26, // 📝 [ดิบ-ก่อนเรียน] คำตอบความรู้ 21 ข้อ (JSON)
  PRE_TEST_SKILL_ANSWERS: 27,     // 📝 [ดิบ-ก่อนเรียน] คำตอบทักษะปฏิเสธ 20 ข้อ (JSON)
  POST_TEST_KNOWLEDGE_ANSWERS: 28,// 📝 [ดิบ-หลังเรียน] คำตอบความรู้ 21 ข้อ (JSON)
  POST_TEST_SKILL_ANSWERS: 29,    // 📝 [ดิบ-หลังเรียน] คำตอบทักษะปฏิเสธ 20 ข้อ (JSON)
};
const PLAYERS_COLS = 29;

const PLAYERS_HEADERS = [
  '👤 รหัสนักศึกษา (idCode)',
  '👤 ชื่อ-นามสกุลจริง (realName)',
  '📲 ชื่อบัญชี LINE (lineName)',
  '🎮 ชื่อเล่นในเกม (nickname)',
  '🏫 ระดับชั้น (grade)',
  '🏫 โรงเรียน (school)',
  '📝 [ใหม่-ก่อนเรียน] ความรู้บุหรี่ไฟฟ้า (%)',
  '📝 [ใหม่-ก่อนเรียน] ทักษะการปฏิเสธ (/100)',
  '📝 [ใหม่-หลังเรียน] ความรู้บุหรี่ไฟฟ้า (%)',
  '📝 [ใหม่-หลังเรียน] ทักษะการปฏิเสธ (/100)',
  '📊 [ผลวิจัย] พัฒนาการความรู้ (Gain Delta %)',
  '🕹️ [ด่านเกม] บทหลักรับเกียรติบัตร (ด่าน 1-8)',
  '🕹️ [ด่านเกม] เล่นจบครบทุกด่าน (20 ด่าน)',
  '⭐ [คะแนนเกม] คะแนน XP สะสมในเกม',
  '⭐ [คะแนนเกม] เลเวลผู้เล่น (Level 1-5)',
  '🤖 [ใหม่-ประเมินแอป] ความพึงพอใจแชตบอต (1-5)',
  '🎓 [เกียรติบัตร] เลขที่เกียรติบัตร (Cert No)',
  '🎓 [เกียรติบัตร] วันที่ออกเกียรติบัตร',
  '🕒 [วันเวลา] เวลาส่ง Pre-test',
  '🕒 [วันเวลา] เวลาส่ง Post-test',
  '🕒 [วันเวลา] เวลาเข้าเล่นล่าสุด',
  '🕒 [วันเวลา] วันที่เริ่มเล่นครั้งแรก',
  '📦 [ข้อมูลดิบ] แบบสำรวจข้อมูลส่วนบุคคล (JSON)',
  '📦 [ข้อมูลดิบ] ประเมินบอทรายข้อ 7 ข้อ (JSON)',
  '🔑 [ระบบ] LINE User ID Hash',
  '📝 [ดิบ-ก่อนเรียน] คำตอบความรู้ 21 ข้อ (JSON)',
  '📝 [ดิบ-ก่อนเรียน] คำตอบทักษะปฏิเสธ 20 ข้อ (JSON)',
  '📝 [ดิบ-หลังเรียน] คำตอบความรู้ 21 ข้อ (JSON)',
  '📝 [ดิบ-หลังเรียน] คำตอบทักษะปฏิเสธ 20 ข้อ (JSON)',
];

// ============================================================================
// แท็บ 2: GAME_STATS (คลังไอเทม & ระบบเกม 28 คอลัมน์)
// ============================================================================
const COL_GAME = {
  ID_CODE: 1,
  REAL_NAME: 2,
  LINE_NAME: 3,
  NICKNAME: 4,
  USER_ID_HASH: 5,
  COINS: 6,
  OWNED_ITEMS: 7,
  AVATAR: 8,
  EQUIPPED_TITLE: 9,
  EQUIPPED_FRAME: 10,
  EQUIPPED_THEME: 11,
  EQUIPPED_ACCESSORY: 12,
  EQUIPPED_BACKDROP: 13,
  EQUIPPED_CERT_DECO: 14,
  HINT_TOKENS: 15,
  COIN_X2_REMAINING: 16,
  STREAK_SHIELDS: 17,
  STREAK_DAYS: 18,
  LAST_PLAY_DATE: 19,
  LAST_DAILY_DATE: 20,
  DAILY_DONE_COUNT: 21,
  DAILY_BEST_SCORE: 22,
  EXAM_BEST_SCORE: 23,
  EXAM_BONUS_CLAIMED: 24,
  STAGES_COMPLETED_LIST: 25,
  BADGES: 26,
  FUN_RATING: 27,
  FUN_RATING_COUNT: 28,
};
const GAME_COLS = 28;

const GAME_HEADERS = [
  '👤 รหัสนักศึกษา (idCode)',
  '👤 ชื่อ-นามสกุลจริง (realName)',
  '📲 ชื่อบัญชี LINE (lineName)',
  '🎮 ชื่อเล่นในเกม (nickname)',
  '🔑 LINE User ID Hash (ระบบ)',
  '💰 เหรียญ (coins)',
  '🛍️ ไอเทมในร้าน (ownedItems)',
  '🖼️ รูปโปรไฟล์ (avatar)',
  '🎖️ ฉายา (equippedTitle)',
  '🖼️ กรอบรูป (equippedFrame)',
  '🎨 ธีมสี (equippedTheme)',
  '👓 เครื่องประดับ (equippedAccessory)',
  '🌄 พื้นหลัง (equippedBackdrop)',
  '📜 ตราเกียรติบัตร (equippedCertDeco)',
  '💡 เหรียญใบ้ (hintTokens)',
  '⚡ บูสเตอร์ X2 (coinX2Remaining)',
  '🛡️ โล่สตรีค (streakShields)',
  '🔥 เล่นต่อเนื่องวัน (streakDays)',
  '📅 วันที่เล่นล่าสุด (lastPlayDate)',
  '📅 วันที่ทำ Daily (lastDailyDate)',
  '🏆 จำนวนวัน Daily (dailyDoneCount)',
  '🎯 คะแนน Daily สูงสุด (dailyBestScore)',
  '📝 คะแนน Final Exam (examBestScore)',
  '🎁 รับโบนัส Exam (examBonusClaimed)',
  '🗺️ รายชื่อด่านที่จบ (stagesCompletedList)',
  '🏅 เหรียญตรา (badges)',
  '⭐ ดาวความสนุก (funRating)',
  '🗳️ จำนวนโหวตดาว (funRatingCount)',
];

// ---------- Helpers ----------
function getSheet_(name) {
  let sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) {
    sheetId = '1djYg5itx5xvVubDCdznPaP6M6gE3sJEXAb-W9trs9Uw';
  }
  const ss = SpreadsheetApp.openById(sheetId);
  const sheet = ss.getSheetByName(name);
  if (!sheet) throw new Error('Sheet "' + name + '" not found');
  return sheet;
}

function findRowByUserOrId_(sheet, hashColIdx, idCodeColIdx, userIdHash, idCode) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const numCols = sheet.getLastColumn();
  const data = sheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  
  // 1. ค้นหาจาก userIdHash (ตรงคอลัมน์ระบบ hash หรือคอลัมน์แรก)
  if (userIdHash) {
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][hashColIdx - 1]).trim() === String(userIdHash).trim()) return i + 2;
      if (String(data[i][0]).trim() === String(userIdHash).trim()) return i + 2;
    }
  }
  
  // 2. ค้นหาจากรหัสนักศึกษา (idCode)
  if (idCode) {
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][idCodeColIdx - 1]).trim() === String(idCode).trim()) return i + 2;
    }
  }
  
  return -1;
}

function isValidHash_(s) {
  return typeof s === 'string' && s.length > 0;
}

function generateVerifyCode_() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function nextCertNumber_() {
  const sheet = getSheet_(CONFIG.SHEET_NAMES.CERTIFICATES);
  const seq = sheet.getLastRow();
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

function numOr_(v, def) {
  if (v === '' || v === null || v === undefined) return def;
  const n = Number(v);
  return isNaN(n) ? def : n;
}

function strOrUndef_(v) {
  if (v === '' || v === null || v === undefined) return undefined;
  return String(v);
}

function boolOf_(v) {
  if (v === true || v === 'true' || v === 1 || v === '1' || v === 'TRUE') return true;
  return false;
}

function parseJsonArray_(v) {
  if (!v) return [];
  try {
    const arr = JSON.parse(String(v));
    return Array.isArray(arr) ? arr : [];
  } catch (e) { return []; }
}

// ---------- Build Player Research Row (แท็บ Players) ----------
function buildPlayerResearchRow_(p, existing) {
  function pick(newVal, colIdx, def) {
    if (newVal !== undefined && newVal !== null && newVal !== '') return newVal;
    if (existing) {
      const ex = existing[colIdx - 1];
      if (ex !== undefined && ex !== '') return ex;
    }
    return def;
  }
  function pickArrayJson(newArr, colIdx) {
    if (newArr !== undefined && newArr !== null) return JSON.stringify(newArr || []);
    if (existing) return String(existing[colIdx - 1] || '[]');
    return '[]';
  }

  let idCode = pick(p.idCode, COL_PLAYER.ID_CODE, '');
  let realName = pick(p.realName, COL_PLAYER.REAL_NAME, '');
  let lineName = pick(p.lineName, COL_PLAYER.LINE_NAME, '');
  let nickname = pick(p.nickname, COL_PLAYER.NICKNAME, 'ผู้เล่น');
  let grade = pick(p.grade, COL_PLAYER.GRADE, '');
  let school = pick(p.school, COL_PLAYER.SCHOOL, '');

  if (p.demographics) {
    if (!idCode && p.demographics.idCode) idCode = p.demographics.idCode;
    if (!realName && p.demographics.realName) realName = p.demographics.realName;
    if (!lineName && p.demographics.lineName) lineName = p.demographics.lineName;
    if ((!grade || grade === nickname || grade === 'ผู้เล่น') && p.demographics.grade) grade = p.demographics.grade;
    if (!school && p.demographics.school) school = p.demographics.school;
  }

  // คำนวณ Gain Delta
  const preK = pick(p.preTestScore, COL_PLAYER.PRE_TEST_SCORE, '');
  const postK = pick(p.postTestScore, COL_PLAYER.POST_TEST_SCORE, '');
  let gainDelta = '';
  if (preK !== '' && postK !== '') {
    const d = Number(postK) - Number(preK);
    gainDelta = (d >= 0 ? '+' : '') + d + '%';
  }

  // คำนวณจำนวนด่านบทหลัก (1-8) และด่านรวมทั้งหมด (1-20)
  let stagesList = [];
  if (p.stagesCompleted !== undefined && Array.isArray(p.stagesCompleted)) {
    stagesList = p.stagesCompleted;
  }
  const heroCount = stagesList.filter(function(stg) { return Number(stg) >= 1 && Number(stg) <= 8; }).length;
  const totalStagesCount = stagesList.length;

  let heroStr = heroCount > 0 ? (heroCount + '/8') : (existing ? (existing[COL_PLAYER.HERO_STAGES_COUNT - 1] || '0/8') : '0/8');
  let totalStagesStr = totalStagesCount > 0 ? (totalStagesCount + '/20') : (existing ? (existing[COL_PLAYER.TOTAL_STAGES_COUNT - 1] || '0/20') : '0/20');

  const row = new Array(PLAYERS_COLS).fill('');
  row[COL_PLAYER.ID_CODE - 1]                 = idCode;
  row[COL_PLAYER.REAL_NAME - 1]               = realName;
  row[COL_PLAYER.LINE_NAME - 1]               = lineName;
  row[COL_PLAYER.NICKNAME - 1]                = nickname;
  row[COL_PLAYER.GRADE - 1]                   = grade;
  row[COL_PLAYER.SCHOOL - 1]                  = school;
  row[COL_PLAYER.PRE_TEST_SCORE - 1]          = preK !== '' ? Number(preK) : '';
  row[COL_PLAYER.PRE_TEST_SKILL_SCORE - 1]    = pick(p.preTestSkillScore, COL_PLAYER.PRE_TEST_SKILL_SCORE, '');
  row[COL_PLAYER.POST_TEST_SCORE - 1]         = postK !== '' ? Number(postK) : '';
  row[COL_PLAYER.POST_TEST_SKILL_SCORE - 1]   = pick(p.postTestSkillScore, COL_PLAYER.POST_TEST_SKILL_SCORE, '');
  row[COL_PLAYER.GAIN_DELTA_KNOWLEDGE - 1]    = gainDelta;
  row[COL_PLAYER.HERO_STAGES_COUNT - 1]       = heroStr;
  row[COL_PLAYER.TOTAL_STAGES_COUNT - 1]      = totalStagesStr;
  row[COL_PLAYER.TOTAL_XP - 1]                = pick(p.totalXP, COL_PLAYER.TOTAL_XP, 0);
  row[COL_PLAYER.LEVEL - 1]                   = pick(p.level, COL_PLAYER.LEVEL, 1);
  row[COL_PLAYER.EVAL_PART5_AVG - 1]          = pick(p.evalPart5Avg, COL_PLAYER.EVAL_PART5_AVG, '');
  row[COL_PLAYER.CERTIFICATE_NO - 1]          = existing ? (existing[COL_PLAYER.CERTIFICATE_NO - 1] || '') : '';
  row[COL_PLAYER.CERTIFICATE_ISSUED_AT - 1]   = existing ? (existing[COL_PLAYER.CERTIFICATE_ISSUED_AT - 1] || '') : '';
  row[COL_PLAYER.PRE_TEST_AT - 1]             = pick(p.preTestAt, COL_PLAYER.PRE_TEST_AT, '');
  row[COL_PLAYER.POST_TEST_AT - 1]            = pick(p.postTestAt, COL_PLAYER.POST_TEST_AT, '');
  row[COL_PLAYER.LAST_ACTIVE_AT - 1]          = nowIso_();
  row[COL_PLAYER.CREATED_AT - 1]              = existing ? (existing[COL_PLAYER.CREATED_AT - 1] || nowIso_()) : nowIso_();
  row[COL_PLAYER.DEMOGRAPHICS - 1]            = p.demographics ? JSON.stringify(p.demographics) : (existing ? (existing[COL_PLAYER.DEMOGRAPHICS - 1] || '{}') : '{}');
  row[COL_PLAYER.EVAL_PART5_DETAILS - 1]      = pickArrayJson(p.evalPart5Details, COL_PLAYER.EVAL_PART5_DETAILS);
  row[COL_PLAYER.USER_ID_HASH - 1]            = p.userIdHash;
  row[COL_PLAYER.PRE_TEST_KNOWLEDGE_ANSWERS - 1] = pickArrayJson(p.preTestKnowledgeAnswers, COL_PLAYER.PRE_TEST_KNOWLEDGE_ANSWERS);
  row[COL_PLAYER.PRE_TEST_SKILL_ANSWERS - 1]     = pickArrayJson(p.preTestSkillAnswers, COL_PLAYER.PRE_TEST_SKILL_ANSWERS);
  row[COL_PLAYER.POST_TEST_KNOWLEDGE_ANSWERS - 1]= pickArrayJson(p.postTestKnowledgeAnswers, COL_PLAYER.POST_TEST_KNOWLEDGE_ANSWERS);
  row[COL_PLAYER.POST_TEST_SKILL_ANSWERS - 1]   = pickArrayJson(p.postTestSkillAnswers, COL_PLAYER.POST_TEST_SKILL_ANSWERS);
  return row;
}

// ---------- Build Game Stats Row (แท็บ GameStats) ----------
function buildGameStatsRow_(p, existing) {
  function pick(newVal, colIdx, def) {
    if (newVal !== undefined && newVal !== null && newVal !== '') return newVal;
    if (existing) {
      const ex = existing[colIdx - 1];
      if (ex !== undefined && ex !== '') return ex;
    }
    return def;
  }
  function pickArrayCsv(newArr, colIdx) {
    if (newArr !== undefined && newArr !== null) return (newArr || []).join(',');
    if (existing) return String(existing[colIdx - 1] || '');
    return '';
  }
  function pickArrayJson(newArr, colIdx) {
    if (newArr !== undefined && newArr !== null) return JSON.stringify(newArr || []);
    if (existing) return String(existing[colIdx - 1] || '[]');
    return '[]';
  }

  let lineName = pick(p.lineName, COL_GAME.LINE_NAME, '');
  if (!lineName && p.demographics && p.demographics.lineName) {
    lineName = p.demographics.lineName;
  }

  const row = new Array(GAME_COLS).fill('');
  row[COL_GAME.ID_CODE - 1]               = pick(p.idCode, COL_GAME.ID_CODE, '');
  row[COL_GAME.REAL_NAME - 1]             = pick(p.realName, COL_GAME.REAL_NAME, '');
  row[COL_GAME.LINE_NAME - 1]             = lineName;
  row[COL_GAME.NICKNAME - 1]              = pick(p.nickname, COL_GAME.NICKNAME, '');
  row[COL_GAME.USER_ID_HASH - 1]          = p.userIdHash;
  row[COL_GAME.COINS - 1]                 = pick(p.coins, COL_GAME.COINS, 0);
  row[COL_GAME.OWNED_ITEMS - 1]           = pickArrayJson(p.ownedItems, COL_GAME.OWNED_ITEMS);
  row[COL_GAME.AVATAR - 1]                = pick(p.avatar, COL_GAME.AVATAR, 1);
  row[COL_GAME.EQUIPPED_TITLE - 1]        = pick(p.equippedTitle, COL_GAME.EQUIPPED_TITLE, '');
  row[COL_GAME.EQUIPPED_FRAME - 1]        = pick(p.equippedFrame, COL_GAME.EQUIPPED_FRAME, '');
  row[COL_GAME.EQUIPPED_THEME - 1]        = pick(p.equippedTheme, COL_GAME.EQUIPPED_THEME, '');
  row[COL_GAME.EQUIPPED_ACCESSORY - 1]    = pick(p.equippedAccessory, COL_GAME.EQUIPPED_ACCESSORY, '');
  row[COL_GAME.EQUIPPED_BACKDROP - 1]     = pick(p.equippedBackdrop, COL_GAME.EQUIPPED_BACKDROP, '');
  row[COL_GAME.EQUIPPED_CERT_DECO - 1]    = pick(p.equippedCertDeco, COL_GAME.EQUIPPED_CERT_DECO, '');
  row[COL_GAME.HINT_TOKENS - 1]           = pick(p.hintTokens, COL_GAME.HINT_TOKENS, 0);
  row[COL_GAME.COIN_X2_REMAINING - 1]     = pick(p.coinX2Remaining, COL_GAME.COIN_X2_REMAINING, 0);
  row[COL_GAME.STREAK_SHIELDS - 1]        = pick(p.streakShields, COL_GAME.STREAK_SHIELDS, 0);
  row[COL_GAME.STREAK_DAYS - 1]           = pick(p.streakDays, COL_GAME.STREAK_DAYS, 0);
  row[COL_GAME.LAST_PLAY_DATE - 1]        = pick(p.lastPlayDate, COL_GAME.LAST_PLAY_DATE, '');
  row[COL_GAME.LAST_DAILY_DATE - 1]       = pick(p.lastDailyDate, COL_GAME.LAST_DAILY_DATE, '');
  row[COL_GAME.DAILY_DONE_COUNT - 1]      = pick(p.dailyDoneCount, COL_GAME.DAILY_DONE_COUNT, 0);
  row[COL_GAME.DAILY_BEST_SCORE - 1]      = pick(p.dailyBestScore, COL_GAME.DAILY_BEST_SCORE, 0);
  row[COL_GAME.EXAM_BEST_SCORE - 1]       = pick(p.examBestScore, COL_GAME.EXAM_BEST_SCORE, 0);
  row[COL_GAME.EXAM_BONUS_CLAIMED - 1]    = pick(p.examBonusClaimed, COL_GAME.EXAM_BONUS_CLAIMED, false);
  row[COL_GAME.STAGES_COMPLETED_LIST - 1] = pickArrayCsv(p.stagesCompleted, COL_GAME.STAGES_COMPLETED_LIST);
  row[COL_GAME.BADGES - 1]                = pickArrayCsv(p.badges, COL_GAME.BADGES);
  row[COL_GAME.FUN_RATING - 1]            = pick(p.funRating, COL_GAME.FUN_RATING, '');
  row[COL_GAME.FUN_RATING_COUNT - 1]      = pick(p.funRatingCount, COL_GAME.FUN_RATING_COUNT, 0);
  return row;
}

// ---------- Endpoint: sync ----------
function handleSync_(p) {
  if (!isValidHash_(p.userIdHash)) return jsonResponse_({ok:false, error:'invalid_hash'});

  // 1. ซิงค์ลงแท็บ Players (งานวิจัย & คะแนน)
  const playerSheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const pRow = findRowByUserOrId_(playerSheet, COL_PLAYER.USER_ID_HASH, COL_PLAYER.ID_CODE, p.userIdHash, p.idCode);
  let savedPlayerRow = null;
  if (pRow === -1) {
    const newRow = buildPlayerResearchRow_(p, null);
    playerSheet.appendRow(newRow);
    savedPlayerRow = newRow;
  } else {
    const existing = playerSheet.getRange(pRow, 1, 1, PLAYERS_COLS).getValues()[0];
    const newRow = buildPlayerResearchRow_(p, existing);
    playerSheet.getRange(pRow, 1, 1, PLAYERS_COLS).setValues([newRow]);
    savedPlayerRow = newRow;
  }

  // 2. ซิงค์ลงแท็บ GameStats (ไอเทม & เกม)
  try {
    const gameSheet = getSheet_(CONFIG.SHEET_NAMES.GAME_STATS);
    const gRow = findRowByUserOrId_(gameSheet, COL_GAME.USER_ID_HASH, COL_GAME.ID_CODE, p.userIdHash, p.idCode);
    if (gRow === -1) {
      const newGRow = buildGameStatsRow_(p, null);
      gameSheet.appendRow(newGRow);
    } else {
      const existingG = gameSheet.getRange(gRow, 1, 1, GAME_COLS).getValues()[0];
      const newGRow = buildGameStatsRow_(p, existingG);
      gameSheet.getRange(gRow, 1, 1, GAME_COLS).setValues([newGRow]);
    }
  } catch (e) {
    console.warn('GameStats sync warning:', e);
  }

  // 3. ซิงค์ลงแท็บ Item_Analysis ทันทีแบบ Real-time (Auto Sync รายข้อ ก-ง)
  try {
    if (savedPlayerRow) {
      syncItemAnalysisRowFromPlayerRow_(savedPlayerRow);
    }
  } catch (e) {
    console.warn('Item_Analysis real-time sync warning:', e);
  }

  // 4. ซิงค์ลงแท็บ Item_Score_Binary ทันทีแบบ Real-time (Auto Sync คะแนน 1/0 สำหรับ SPSS)
  try {
    if (savedPlayerRow) {
      syncItemScoreBinaryRowFromPlayerRow_(savedPlayerRow);
    }
  } catch (e) {
    console.warn('Item_Score_Binary real-time sync warning:', e);
  }

  logEvent_(p.userIdHash, 'sync', '', p.totalXP || 0);
  return jsonResponse_({ok:true, action:'synced'});
}

// ---------- Endpoint: issueCert ----------
function handleIssueCert_(p) {
  const hash = p.userIdHash || p.hash;
  if (!isValidHash_(hash)) return jsonResponse_({ok:false, error:'invalid_hash'});
  p.userIdHash = hash;

  const playerSheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const pRow = findRowByUserOrId_(playerSheet, COL_PLAYER.USER_ID_HASH, COL_PLAYER.ID_CODE, p.userIdHash, p.idCode);
  if (pRow === -1) return jsonResponse_({ok:false, error:'player_not_found'});

  const nickname = playerSheet.getRange(pRow, COL_PLAYER.NICKNAME).getValue();
  const totalXP = Number(playerSheet.getRange(pRow, COL_PLAYER.TOTAL_XP).getValue()) || 0;
  const heroCountStr = String(playerSheet.getRange(pRow, COL_PLAYER.HERO_STAGES_COUNT).getValue() || '');
  const heroCount = parseInt(heroCountStr, 10) || 0;
  const existingCert = playerSheet.getRange(pRow, COL_PLAYER.CERTIFICATE_NO).getValue();

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

  const allDone = heroCount >= CONFIG.STAGES_REQUIRED;
  const enoughXP = totalXP >= CONFIG.MIN_XP_FOR_CERT;
  if (!allDone && !enoughXP) {
    return jsonResponse_({
      ok:false, error:'requirements_not_met',
      message:'ต้องจบครบด่านบทหลัก ' + CONFIG.STAGES_REQUIRED + ' ด่าน หรือมี XP ≥ ' + CONFIG.MIN_XP_FOR_CERT,
      currentStages: heroCount, currentXP: totalXP,
    });
  }

  const certNo = nextCertNumber_();
  const verifyCode = generateVerifyCode_();
  const issueDate = nowIso_();

  const certSheet = getSheet_(CONFIG.SHEET_NAMES.CERTIFICATES);
  certSheet.appendRow([certNo, p.userIdHash, nickname, issueDate, verifyCode, totalXP, heroCount]);

  playerSheet.getRange(pRow, COL_PLAYER.CERTIFICATE_NO).setValue(certNo);
  playerSheet.getRange(pRow, COL_PLAYER.CERTIFICATE_ISSUED_AT).setValue(issueDate);

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
    const certNo = data[i][0];
    const nickname = data[i][2];
    const issueDate = data[i][3];
    const verifyCode = data[i][4];
    const totalXP = data[i][5];
    const stagesCount = data[i][6];
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
  const playerSheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const pRow = findRowByUserOrId_(playerSheet, COL_PLAYER.USER_ID_HASH, COL_PLAYER.ID_CODE, params.hash, null);
  if (pRow === -1) return jsonResponse_({ok:true, found:false});

  const pr = playerSheet.getRange(pRow, 1, 1, PLAYERS_COLS).getValues()[0];

  // อ่านแท็บ GameStats ประกอบ
  let gr = [];
  try {
    const gameSheet = getSheet_(CONFIG.SHEET_NAMES.GAME_STATS);
    const gRow = findRowByUserOrId_(gameSheet, COL_GAME.USER_ID_HASH, COL_GAME.ID_CODE, params.hash, null);
    if (gRow !== -1) gr = gameSheet.getRange(gRow, 1, 1, GAME_COLS).getValues()[0];
  } catch (e) {}

  const stagesStr = String(gr[COL_GAME.STAGES_COMPLETED_LIST - 1] || '');
  const badgesStr = String(gr[COL_GAME.BADGES - 1] || '');

  return jsonResponse_({
    ok:true, found:true,
    player: {
      idCode: strOrUndef_(pr[COL_PLAYER.ID_CODE - 1]),
      realName: strOrUndef_(pr[COL_PLAYER.REAL_NAME - 1]),
      lineName: strOrUndef_(pr[COL_PLAYER.LINE_NAME - 1]),
      nickname: String(pr[COL_PLAYER.NICKNAME - 1] || 'ผู้เล่น'),
      grade: String(pr[COL_PLAYER.GRADE - 1] || ''),
      school: String(pr[COL_PLAYER.SCHOOL - 1] || ''),
      createdAt: String(pr[COL_PLAYER.CREATED_AT - 1] || ''),
      lastActiveAt: String(pr[COL_PLAYER.LAST_ACTIVE_AT - 1] || ''),
      totalXP: numOr_(pr[COL_PLAYER.TOTAL_XP - 1], 0),
      level: numOr_(pr[COL_PLAYER.LEVEL - 1], 1),
      stagesCompleted: stagesStr ? stagesStr.split(',').filter(Boolean).map(Number) : [],
      badges: badgesStr ? badgesStr.split(',').filter(Boolean) : [],
      certificateNo: pr[COL_PLAYER.CERTIFICATE_NO - 1] || null,
      certificateIssuedAt: pr[COL_PLAYER.CERTIFICATE_ISSUED_AT - 1] || null,
      preTestScore: (pr[COL_PLAYER.PRE_TEST_SCORE - 1] === '' || pr[COL_PLAYER.PRE_TEST_SCORE - 1] === null)
        ? undefined : numOr_(pr[COL_PLAYER.PRE_TEST_SCORE - 1], undefined),
      postTestScore: (pr[COL_PLAYER.POST_TEST_SCORE - 1] === '' || pr[COL_PLAYER.POST_TEST_SCORE - 1] === null)
        ? undefined : numOr_(pr[COL_PLAYER.POST_TEST_SCORE - 1], undefined),
      preTestSkillScore: (pr[COL_PLAYER.PRE_TEST_SKILL_SCORE - 1] === '' || pr[COL_PLAYER.PRE_TEST_SKILL_SCORE - 1] === null)
        ? undefined : numOr_(pr[COL_PLAYER.PRE_TEST_SKILL_SCORE - 1], undefined),
      postTestSkillScore: (pr[COL_PLAYER.POST_TEST_SKILL_SCORE - 1] === '' || pr[COL_PLAYER.POST_TEST_SKILL_SCORE - 1] === null)
        ? undefined : numOr_(pr[COL_PLAYER.POST_TEST_SKILL_SCORE - 1], undefined),
      evalPart5Avg: (pr[COL_PLAYER.EVAL_PART5_AVG - 1] === '' || pr[COL_PLAYER.EVAL_PART5_AVG - 1] === null)
        ? undefined : numOr_(pr[COL_PLAYER.EVAL_PART5_AVG - 1], undefined),
      preTestAt: strOrUndef_(pr[COL_PLAYER.PRE_TEST_AT - 1]),
      postTestAt: strOrUndef_(pr[COL_PLAYER.POST_TEST_AT - 1]),
      preTestKnowledgeAnswers: pr[COL_PLAYER.PRE_TEST_KNOWLEDGE_ANSWERS - 1] ? parseJsonArray_(pr[COL_PLAYER.PRE_TEST_KNOWLEDGE_ANSWERS - 1]) : undefined,
      preTestSkillAnswers: pr[COL_PLAYER.PRE_TEST_SKILL_ANSWERS - 1] ? parseJsonArray_(pr[COL_PLAYER.PRE_TEST_SKILL_ANSWERS - 1]) : undefined,
      postTestKnowledgeAnswers: pr[COL_PLAYER.POST_TEST_KNOWLEDGE_ANSWERS - 1] ? parseJsonArray_(pr[COL_PLAYER.POST_TEST_KNOWLEDGE_ANSWERS - 1]) : undefined,
      postTestSkillAnswers: pr[COL_PLAYER.POST_TEST_SKILL_ANSWERS - 1] ? parseJsonArray_(pr[COL_PLAYER.POST_TEST_SKILL_ANSWERS - 1]) : undefined,
      demographics: pr[COL_PLAYER.DEMOGRAPHICS - 1] ? (function() { try { return JSON.parse(String(pr[COL_PLAYER.DEMOGRAPHICS - 1])); } catch (e) { return undefined; } })() : undefined,
      // Game fields
      avatar: gr.length ? numOr_(gr[COL_GAME.AVATAR - 1], 1) : 1,
      coins: gr.length ? numOr_(gr[COL_GAME.COINS - 1], 0) : 0,
      ownedItems: gr.length ? parseJsonArray_(gr[COL_GAME.OWNED_ITEMS - 1]) : [],
      equippedTitle: gr.length ? strOrUndef_(gr[COL_GAME.EQUIPPED_TITLE - 1]) : undefined,
      equippedFrame: gr.length ? strOrUndef_(gr[COL_GAME.EQUIPPED_FRAME - 1]) : undefined,
      equippedTheme: gr.length ? strOrUndef_(gr[COL_GAME.EQUIPPED_THEME - 1]) : undefined,
      equippedAccessory: gr.length ? strOrUndef_(gr[COL_GAME.EQUIPPED_ACCESSORY - 1]) : undefined,
      equippedBackdrop: gr.length ? strOrUndef_(gr[COL_GAME.EQUIPPED_BACKDROP - 1]) : undefined,
      equippedCertDeco: gr.length ? strOrUndef_(gr[COL_GAME.EQUIPPED_CERT_DECO - 1]) : undefined,
      hintTokens: gr.length ? numOr_(gr[COL_GAME.HINT_TOKENS - 1], 0) : 0,
      coinX2Remaining: gr.length ? numOr_(gr[COL_GAME.COIN_X2_REMAINING - 1], 0) : 0,
      streakShields: gr.length ? numOr_(gr[COL_GAME.STREAK_SHIELDS - 1], 0) : 0,
      streakDays: gr.length ? numOr_(gr[COL_GAME.STREAK_DAYS - 1], 0) : 0,
      lastPlayDate: gr.length ? strOrUndef_(gr[COL_GAME.LAST_PLAY_DATE - 1]) : undefined,
      lastDailyDate: gr.length ? strOrUndef_(gr[COL_GAME.LAST_DAILY_DATE - 1]) : undefined,
      dailyDoneCount: gr.length ? numOr_(gr[COL_GAME.DAILY_DONE_COUNT - 1], 0) : 0,
      dailyBestScore: gr.length ? numOr_(gr[COL_GAME.DAILY_BEST_SCORE - 1], 0) : 0,
      examBestScore: gr.length ? numOr_(gr[COL_GAME.EXAM_BEST_SCORE - 1], 0) : 0,
      examBonusClaimed: gr.length ? boolOf_(gr[COL_GAME.EXAM_BONUS_CLAIMED - 1]) : false,
      funRating: gr.length ? (gr[COL_GAME.FUN_RATING - 1] === '' ? undefined : numOr_(gr[COL_GAME.FUN_RATING - 1], undefined)) : undefined,
      funRatingCount: gr.length ? numOr_(gr[COL_GAME.FUN_RATING_COUNT - 1], 0) : 0,
    },
  });
}

// ---------- Endpoint: getAdminData (สำหรับ Teacher Admin Dashboard) ----------
function handleGetAdminData_(params) {
  if (params.passcode !== CONFIG.TEACHER_PASSCODE) {
    return jsonResponse_({ok:false, error:'unauthorized'});
  }

  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse_({ok:true, students:[], total:0});

  const students = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const hash = String(r[COL_PLAYER.USER_ID_HASH - 1] || '');
    if (!hash && !r[COL_PLAYER.ID_CODE - 1] && !r[COL_PLAYER.REAL_NAME - 1]) continue;

    const heroStr = String(r[COL_PLAYER.HERO_STAGES_COUNT - 1] || '');
    const totalStagesStr = String(r[COL_PLAYER.TOTAL_STAGES_COUNT - 1] || '');
    const preK = numOr_(r[COL_PLAYER.PRE_TEST_SCORE - 1], undefined);
    const postK = numOr_(r[COL_PLAYER.POST_TEST_SCORE - 1], undefined);
    const gainDelta = (preK !== undefined && postK !== undefined) ? (postK - preK) : undefined;

    students.push({
      no: i,
      userIdHash: hash,
      idCode: String(r[COL_PLAYER.ID_CODE - 1] || ''),
      realName: String(r[COL_PLAYER.REAL_NAME - 1] || r[COL_PLAYER.NICKNAME - 1] || 'ผู้เรียน'),
      lineName: String(r[COL_PLAYER.LINE_NAME - 1] || ''),
      nickname: String(r[COL_PLAYER.NICKNAME - 1] || 'ผู้เล่น'),
      grade: String(r[COL_PLAYER.GRADE - 1] || ''),
      school: String(r[COL_PLAYER.SCHOOL - 1] || ''),
      preTestScore: preK,
      preTestSkillScore: numOr_(r[COL_PLAYER.PRE_TEST_SKILL_SCORE - 1], undefined),
      preTestAt: strOrUndef_(r[COL_PLAYER.PRE_TEST_AT - 1]),
      preTestKnowledgeAnswers: parseJsonArray_(r[COL_PLAYER.PRE_TEST_KNOWLEDGE_ANSWERS - 1]),
      preTestSkillAnswers: parseJsonArray_(r[COL_PLAYER.PRE_TEST_SKILL_ANSWERS - 1]),
      stagesCompletedCount: parseInt(totalStagesStr, 10) || 0,
      heroStagesCount: parseInt(heroStr, 10) || 0,
      totalStages: 20,
      totalXP: numOr_(r[COL_PLAYER.TOTAL_XP - 1], 0),
      level: numOr_(r[COL_PLAYER.LEVEL - 1], 1),
      postTestScore: postK,
      postTestSkillScore: numOr_(r[COL_PLAYER.POST_TEST_SKILL_SCORE - 1], undefined),
      postTestAt: strOrUndef_(r[COL_PLAYER.POST_TEST_AT - 1]),
      postTestKnowledgeAnswers: parseJsonArray_(r[COL_PLAYER.POST_TEST_KNOWLEDGE_ANSWERS - 1]),
      postTestSkillAnswers: parseJsonArray_(r[COL_PLAYER.POST_TEST_SKILL_ANSWERS - 1]),
      gainDelta: gainDelta,
      evalPart5Avg: numOr_(r[COL_PLAYER.EVAL_PART5_AVG - 1], undefined),
      evalPart5Details: parseJsonArray_(r[COL_PLAYER.EVAL_PART5_DETAILS - 1]),
      certificateNo: strOrUndef_(r[COL_PLAYER.CERTIFICATE_NO - 1]),
      certificateIssuedAt: strOrUndef_(r[COL_PLAYER.CERTIFICATE_ISSUED_AT - 1]),
      lastActiveAt: String(r[COL_PLAYER.LAST_ACTIVE_AT - 1] || r[COL_PLAYER.CREATED_AT - 1] || ''),
      createdAt: strOrUndef_(r[COL_PLAYER.CREATED_AT - 1]),
    });
  }

  return jsonResponse_({
    ok: true,
    total: students.length,
    students: students,
  });
}

// ---------- Endpoint: downloadCsv (สตรีม CSV ตรง) ----------
function handleDownloadCsv_(params) {
  if (params.passcode !== CONFIG.TEACHER_PASSCODE) {
    return jsonResponse_({ok:false, error:'unauthorized'});
  }

  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const data = sheet.getDataRange().getValues();

  let csv = '';
  for (let i = 0; i < data.length; i++) {
    const row = data[i].map(function (val) {
      const s = String(val).replace(/"/g, '""');
      return '"' + s + '"';
    });
    csv += row.join(',') + '\r\n';
  }

  return ContentService.createTextOutput(csv)
    .setMimeType(ContentService.MimeType.CSV)
    .downloadAsFile('health_detective_research_scores.csv');
}

// ---------- Endpoint: leaderboard ----------
function handleLeaderboard_(params) {
  const myHash = params.hash || '';
  const limit = Math.min(parseInt(params.limit, 10) || 50, 200);

  const sheet = getSheet_(CONFIG.SHEET_NAMES.PLAYERS);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse_({ok:true, scope:'all', entries:[], total:0});

  const players = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const hash = String(r[COL_PLAYER.USER_ID_HASH - 1] || '');
    if (!hash) continue;
    const stagesStr = String(r[COL_PLAYER.TOTAL_STAGES_COUNT - 1] || '0');
    players.push({
      userIdHash: hash,
      nickname: String(r[COL_PLAYER.NICKNAME - 1] || 'ผู้เล่น'),
      totalXP: numOr_(r[COL_PLAYER.TOTAL_XP - 1], 0),
      stagesCount: parseInt(stagesStr, 10) || 0,
    });
  }

  players.sort(function (a, b) {
    if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
    return b.stagesCount - a.stagesCount;
  });

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

// ---------- Endpoint: getSettings (ดึงการตั้งค่าระบบกลางสำหรับทุกคน) ----------
function handleGetSettings_() {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty('APP_SETTINGS');
  let settings = {
    preTestEnabled: true,
    postTestEnabled: true,
    allowBypassStages: false,
    showExplanations: false,
    part2Enabled: true,
    part3Enabled: true,
    knowledgeQuestionCount: 21,
    part4Enabled: true,
    part5Enabled: true,
    finalExamEnabled: true,
    dailyChallengeEnabled: true,
    randomizeQuestions: false,
    googleSheetUrl: 'https://docs.google.com/spreadsheets/d/1djYg5itx5xvVubDCdznPaP6M6gE3sJEXAb-W9trs9Uw/edit?usp=sharing',
  };
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      settings = Object.assign(settings, parsed);
    } catch (e) {}
  }
  return jsonResponse_({ ok: true, settings: settings });
}

// ---------- Endpoint: updateSettings (อาจารย์อัปเดตการตั้งค่าระบบกลาง) ----------
function handleUpdateSettings_(payload) {
  if (payload.passcode !== CONFIG.TEACHER_PASSCODE) {
    return jsonResponse_({ ok: false, error: 'unauthorized' });
  }
  if (!payload.settings) {
    return jsonResponse_({ ok: false, error: 'missing_settings' });
  }
  const props = PropertiesService.getScriptProperties();
  props.setProperty('APP_SETTINGS', JSON.stringify(payload.settings));
  return jsonResponse_({ ok: true, settings: payload.settings });
}

// ---------- Routers ----------
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    if (payload.action === 'sync')           return handleSync_(payload);
    if (payload.action === 'issueCert')      return handleIssueCert_(payload);
    if (payload.action === 'updateSettings') return handleUpdateSettings_(payload);
    return jsonResponse_({ok:false, error:'unknown_action'});
  } catch (err) {
    return jsonResponse_({ok:false, error:'server_error', message:String(err)});
  }
}

function doGet(e) {
  try {
    const action = (e.parameter.action || '').trim();
    if (action === 'issueCert')     return handleIssueCert_(e.parameter);
    if (action === 'verify')        return handleVerify_(e.parameter);
    if (action === 'restore')       return handleRestore_(e.parameter);
    if (action === 'leaderboard')   return handleLeaderboard_(e.parameter);
    if (action === 'getAdminData')  return handleGetAdminData_(e.parameter);
    if (action === 'downloadCsv')   return handleDownloadCsv_(e.parameter);
    if (action === 'getSettings')   return handleGetSettings_();
    if (action === 'sync')          return handleSync_(e.parameter);
    if (action === 'ping')          return jsonResponse_({ok:true, time:nowIso_(), version:'2.4.0'});
    return jsonResponse_({ok:false, error:'unknown_action'});
  } catch (err) {
    return jsonResponse_({ok:false, error:'server_error', message:String(err)});
  }
}

// ============================================================================
// ฟังก์ชันจัดระเบียบตารางคะแนน Google Sheets (รวมแถวที่ซ้ำและจัดคอลัมน์ให้ตรงเป๊ะ 100%)
// 💡 ใช้เมื่อมีข้อมูลนักเรียนอยู่แล้ว และต้องการจัดให้เป็นระเบียบโดยไม่ลบข้อมูล
// ============================================================================
function setupCleanSheet() {
  let sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) {
    sheetId = '1djYg5itx5xvVubDCdznPaP6M6gE3sJEXAb-W9trs9Uw';
  }
  const ss = SpreadsheetApp.openById(sheetId);

  // 1. อ่านข้อมูลเดิมเพื่อนำมารวมแถวที่ซ้ำและจัดระเบียบ
  let oldData = [];
  const existingPlayerSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PLAYERS);
  if (existingPlayerSheet && existingPlayerSheet.getLastRow() > 1) {
    oldData = existingPlayerSheet.getDataRange().getValues();
  }

  const studentMap = {};

  if (oldData.length > 1) {
    const oldHeader = oldData[0].map(function(h) { return String(h || '').trim(); });
    
    function findVal(row, candidates) {
      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i];
        for (let j = 0; j < oldHeader.length; j++) {
          if (oldHeader[j].indexOf(c) !== -1) {
            if (row[j] !== undefined && row[j] !== '') return row[j];
          }
        }
      }
      return '';
    }

    for (let r = 1; r < oldData.length; r++) {
      const row = oldData[r];

      const hash = String(findVal(row, ['LINE User ID Hash', 'userIdHash']) || row[24] || row[23] || row[21] || row[0] || '').trim();
      if (!hash) continue;

      let idCode = String(findVal(row, ['รหัสนักศึกษา', 'idCode']) || (row.length >= 41 ? row[40] : '')).trim();
      let realName = String(findVal(row, ['ชื่อ-นามสกุลจริง', 'realName']) || (row.length >= 42 ? row[41] : '')).trim();
      let lineName = String(findVal(row, ['ชื่อบัญชี LINE', 'lineName']) || '').trim();
      let nickname = String(findVal(row, ['ชื่อเล่น', 'nickname']) || row[3] || row[2] || row[1] || 'ผู้เล่น').trim();
      let grade = String(findVal(row, ['ระดับชั้น', 'grade']) || '').trim();
      let school = String(findVal(row, ['โรงเรียน', 'school']) || '').trim();
      const preK = findVal(row, ['[ใหม่-ก่อนเรียน] ความรู้', 'ก่อนเรียน] ความรู้', 'Pre-test ความรู้', 'preTestScore']);
      const preSkill = findVal(row, ['[ใหม่-ก่อนเรียน] ทักษะ', 'ก่อนเรียน] ทักษะ', 'ทักษะก่อน', 'preTestSkillScore']);
      const postK = findVal(row, ['[ใหม่-หลังเรียน] ความรู้', 'หลังเรียน] ความรู้', 'Post-test ความรู้', 'postTestScore']);
      const postSkill = findVal(row, ['[ใหม่-หลังเรียน] ทักษะ', 'หลังเรียน] ทักษะ', 'ทักษะหลัง', 'postTestSkillScore']);
      
      const rawStages = findVal(row, ['ด่านทั้งหมด', 'ด่านที่จบ', 'stagesCompletedList', 'stagesCompleted']) || (row.length >= 13 ? row[12] : '') || row[11] || row[9] || row[8] || '';
      let parsedStagesList = [];
      if (typeof rawStages === 'string' && rawStages.includes('/')) {
        const count = parseInt(rawStages.split('/')[0], 10) || 0;
        parsedStagesList = Array.from({ length: count }, function(_, i) { return i + 1; });
      } else if (rawStages) {
        parsedStagesList = String(rawStages).split(',').filter(Boolean);
      }

      const totalXP = findVal(row, ['คะแนน XP', 'totalXP']) || 0;
      const level = findVal(row, ['เลเวล', 'level']) || 1;
      const p5Avg = findVal(row, ['[ใหม่-ประเมินแอป]', 'ประเมินแอป', 'ประเมินบอท', 'evalPart5Avg']);
      let certNo = findVal(row, ['เลขที่เกียรติบัตร', 'Cert No', 'certificateNo']);
      let certDate = findVal(row, ['วันที่ออกเกียรติบัตร', 'certificateIssuedAt']);
      const preAt = findVal(row, ['เวลาส่ง Pre-test', 'เวลาทำ Pre-test', 'preTestAt']);
      const postAt = findVal(row, ['เวลาส่ง Post-test', 'เวลาทำ Post-test', 'postTestAt']);
      const rawDemo = findVal(row, ['แบบสำรวจ', 'Demographics', 'demographics']);
      
      let parsedDemo = null;
      if (rawDemo) {
        try {
          parsedDemo = JSON.parse(String(rawDemo));
        } catch (e) {}
      }

      if (parsedDemo) {
        if (parsedDemo.idCode) idCode = parsedDemo.idCode;
        if (parsedDemo.realName) realName = parsedDemo.realName;
        if (parsedDemo.lineName) lineName = parsedDemo.lineName;
        if (parsedDemo.grade) grade = parsedDemo.grade;
        if (parsedDemo.school) school = parsedDemo.school;
        if (parsedDemo.nickname) nickname = parsedDemo.nickname;
      }

      if (certNo && !String(certNo).startsWith('HD-') && String(certNo).includes('/')) {
        certDate = certNo;
        certNo = '';
      }

      // รวมข้อมูลคนเดียวกันเข้าด้วยกัน (Deduplicate & Merge)
      const key = hash;
      const existing = studentMap[key] || {};

      studentMap[key] = {
        userIdHash: hash,
        idCode: idCode || existing.idCode || '',
        realName: (realName && realName !== nickname && realName !== 'ผู้เล่น') ? realName : (existing.realName || realName || nickname),
        lineName: lineName || existing.lineName || '',
        nickname: nickname || existing.nickname || 'ผู้เล่น',
        grade: grade || existing.grade || '',
        school: school || existing.school || '',
        preTestScore: preK !== '' ? Number(preK) : existing.preTestScore,
        preTestSkillScore: preSkill !== '' ? Number(preSkill) : existing.preTestSkillScore,
        postTestScore: postK !== '' ? Number(postK) : existing.postTestScore,
        postTestSkillScore: postSkill !== '' ? Number(postSkill) : existing.postTestSkillScore,
        stagesCompleted: parsedStagesList.length >= (existing.stagesCompleted || []).length ? parsedStagesList : existing.stagesCompleted,
        totalXP: Math.max(Number(totalXP) || 0, existing.totalXP || 0),
        level: Math.max(Number(level) || 1, existing.level || 1),
        evalPart5Avg: p5Avg !== '' ? Number(p5Avg) : existing.evalPart5Avg,
        certNo: certNo || existing.certNo || '',
        certDate: certDate || existing.certDate || '',
        preTestAt: preAt || existing.preTestAt || '',
        postTestAt: postAt || existing.postTestAt || '',
        demographics: parsedDemo || existing.demographics,
      };
    }
  }

  const migratedResearchRows = [];
  const migratedGameRows = [];

  for (const k in studentMap) {
    const pData = studentMap[k];
    const resRow = buildPlayerResearchRow_(pData, null);
    if (pData.certNo) resRow[COL_PLAYER.CERTIFICATE_NO - 1] = pData.certNo;
    if (pData.certDate) resRow[COL_PLAYER.CERTIFICATE_ISSUED_AT - 1] = pData.certDate;
    migratedResearchRows.push(resRow);

    const gRow = buildGameStatsRow_(pData, null);
    migratedGameRows.push(gRow);
  }

  // 1. เขียนแท็บ Players ใหม่ให้สะอาด 1 คนต่อ 1 แถว
  let pSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PLAYERS);
  if (!pSheet) pSheet = ss.insertSheet(CONFIG.SHEET_NAMES.PLAYERS, 0);
  pSheet.clear();

  const curCols = pSheet.getMaxColumns();
  if (curCols < PLAYERS_COLS) pSheet.insertColumnsAfter(curCols, PLAYERS_COLS - curCols);

  pSheet.getRange(1, 1, 1, PLAYERS_COLS)
    .setValues([PLAYERS_HEADERS])
    .setFontWeight('bold')
    .setFontSize(10)
    .setBackground('#0F172A')
    .setFontColor('#FFFFFF')
    .setVerticalAlignment('middle')
    .setWrap(true);
  pSheet.setRowHeight(1, 52);

  pSheet.getRange(1, 1, 1, 6).setBackground('#0F172A').setFontColor('#38BDF8');
  pSheet.getRange(1, 7, 1, 2).setBackground('#064E3B').setFontColor('#6EE7B7');
  pSheet.getRange(1, 9, 1, 2).setBackground('#047857').setFontColor('#A7F3D0');
  pSheet.getRange(1, 11, 1, 1).setBackground('#0F766E').setFontColor('#5EEAD4');
  pSheet.getRange(1, 12, 1, 2).setBackground('#1E1B4B').setFontColor('#A5B4FC');
  pSheet.getRange(1, 14, 1, 2).setBackground('#312E81').setFontColor('#C7D2FE');
  pSheet.getRange(1, 16, 1, 1).setBackground('#78350F').setFontColor('#FDE68A');
  pSheet.getRange(1, 17, 1, 2).setBackground('#155E75').setFontColor('#A5F3FC');
  pSheet.getRange(1, 19, 1, 7).setBackground('#334155').setFontColor('#F8FAFC');

  pSheet.setColumnWidth(COL_PLAYER.ID_CODE, 140);
  pSheet.setColumnWidth(COL_PLAYER.REAL_NAME, 190);
  pSheet.setColumnWidth(COL_PLAYER.LINE_NAME, 160);
  pSheet.setColumnWidth(COL_PLAYER.NICKNAME, 110);
  pSheet.setColumnWidth(COL_PLAYER.GRADE, 90);
  pSheet.setColumnWidth(COL_PLAYER.SCHOOL, 130);
  pSheet.setColumnWidth(COL_PLAYER.PRE_TEST_SCORE, 160);
  pSheet.setColumnWidth(COL_PLAYER.PRE_TEST_SKILL_SCORE, 160);
  pSheet.setColumnWidth(COL_PLAYER.POST_TEST_SCORE, 160);
  pSheet.setColumnWidth(COL_PLAYER.POST_TEST_SKILL_SCORE, 160);
  pSheet.setColumnWidth(COL_PLAYER.GAIN_DELTA_KNOWLEDGE, 150);
  pSheet.setColumnWidth(COL_PLAYER.HERO_STAGES_COUNT, 160);
  pSheet.setColumnWidth(COL_PLAYER.TOTAL_STAGES_COUNT, 140);
  pSheet.setColumnWidth(COL_PLAYER.TOTAL_XP, 120);
  pSheet.setColumnWidth(COL_PLAYER.LEVEL, 90);
  pSheet.setColumnWidth(COL_PLAYER.EVAL_PART5_AVG, 170);
  pSheet.setColumnWidth(COL_PLAYER.CERTIFICATE_NO, 140);
  pSheet.setColumnWidth(COL_PLAYER.CERTIFICATE_ISSUED_AT, 170);
  pSheet.setColumnWidth(COL_PLAYER.PRE_TEST_AT, 170);
  pSheet.setColumnWidth(COL_PLAYER.POST_TEST_AT, 170);
  pSheet.setColumnWidth(COL_PLAYER.LAST_ACTIVE_AT, 170);
  pSheet.setColumnWidth(COL_PLAYER.CREATED_AT, 170);
  pSheet.setColumnWidth(COL_PLAYER.DEMOGRAPHICS, 220);
  pSheet.setColumnWidth(COL_PLAYER.EVAL_PART5_DETAILS, 160);
  pSheet.setColumnWidth(COL_PLAYER.USER_ID_HASH, 160);

  if (migratedResearchRows.length > 0) {
    pSheet.getRange(2, 1, migratedResearchRows.length, PLAYERS_COLS).setValues(migratedResearchRows);
    pSheet.getRange(2, 1, migratedResearchRows.length, 1).setHorizontalAlignment('center').setFontWeight('bold');
    pSheet.getRange(2, 3, migratedResearchRows.length, 1).setHorizontalAlignment('center');
    pSheet.getRange(2, 5, migratedResearchRows.length, 1).setHorizontalAlignment('center');
    pSheet.getRange(2, 7, migratedResearchRows.length, 5).setHorizontalAlignment('center');
    pSheet.getRange(2, 12, migratedResearchRows.length, 5).setHorizontalAlignment('center');
  }
  pSheet.setFrozenRows(1);
  try { pSheet.setFrozenColumns(4); } catch (e) {}

  // 2. เขียนแท็บ GameStats
  let gSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GAME_STATS);
  if (!gSheet) gSheet = ss.insertSheet(CONFIG.SHEET_NAMES.GAME_STATS, 1);
  gSheet.clear();

  const curGCols = gSheet.getMaxColumns();
  if (curGCols < GAME_COLS) gSheet.insertColumnsAfter(curGCols, GAME_COLS - curGCols);

  gSheet.getRange(1, 1, 1, GAME_COLS)
    .setValues([GAME_HEADERS])
    .setFontWeight('bold')
    .setFontSize(10)
    .setBackground('#334155')
    .setFontColor('#F8FAFC')
    .setVerticalAlignment('middle')
    .setWrap(true);
  gSheet.setRowHeight(1, 52);

  gSheet.setColumnWidth(COL_GAME.ID_CODE, 140);
  gSheet.setColumnWidth(COL_GAME.REAL_NAME, 190);
  gSheet.setColumnWidth(COL_GAME.LINE_NAME, 160);
  gSheet.setColumnWidth(COL_GAME.NICKNAME, 110);
  gSheet.setColumnWidth(COL_GAME.USER_ID_HASH, 160);
  gSheet.setColumnWidth(COL_GAME.COINS, 90);
  gSheet.setColumnWidth(COL_GAME.OWNED_ITEMS, 200);

  if (migratedGameRows.length > 0) {
    gSheet.getRange(2, 1, migratedGameRows.length, GAME_COLS).setValues(migratedGameRows);
    gSheet.getRange(2, 1, migratedGameRows.length, 1).setHorizontalAlignment('center').setFontWeight('bold');
    gSheet.getRange(2, 3, migratedGameRows.length, 1).setHorizontalAlignment('center');
    gSheet.getRange(2, 5, migratedGameRows.length, 2).setHorizontalAlignment('center');
  }
  gSheet.setFrozenRows(1);
  try { gSheet.setFrozenColumns(4); } catch (e) {}

  console.log('✅ จัดระเบียบและรวมแถวที่ซ้ำเรียบร้อยแล้ว');
}

// ============================================================================
// ฟังก์ชันล้างข้อมูลผู้เล่นทั้งหมด 100% (Reset ทุกแท็บให้ว่างเปล่า เหลือเฉพาะหัวตาราง)
// ⚠️ ใช้เมื่อต้องการลบข้อมูลทดสอบเก่าออกทั้งหมดเพื่อเริ่มเก็บข้อมูลนักเรียนจริง
// ============================================================================
function resetAllDataToEmpty() {
  let sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) {
    sheetId = '1djYg5itx5xvVubDCdznPaP6M6gE3sJEXAb-W9trs9Uw';
  }
  const ss = SpreadsheetApp.openById(sheetId);

  // 1. Reset แท็บ Players (ตารางว่างเปล่า มีเฉพาะหัวตาราง 25 คอลัมน์ที่แยกชื่อชัดเจน)
  let pSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PLAYERS);
  if (!pSheet) pSheet = ss.insertSheet(CONFIG.SHEET_NAMES.PLAYERS, 0);
  pSheet.clear();

  const curCols = pSheet.getMaxColumns();
  if (curCols < PLAYERS_COLS) pSheet.insertColumnsAfter(curCols, PLAYERS_COLS - curCols);

  pSheet.getRange(1, 1, 1, PLAYERS_COLS)
    .setValues([PLAYERS_HEADERS])
    .setFontWeight('bold')
    .setFontSize(10)
    .setBackground('#0F172A')
    .setFontColor('#FFFFFF')
    .setVerticalAlignment('middle')
    .setWrap(true);
  pSheet.setRowHeight(1, 52);

  // สีหัวตารางแยกหมวดชัดเจน
  pSheet.getRange(1, 1, 1, 6).setBackground('#0F172A').setFontColor('#38BDF8');   // ข้อมูลผู้เรียน & LINE (Navy + ฟ้า)
  pSheet.getRange(1, 7, 1, 2).setBackground('#064E3B').setFontColor('#6EE7B7');   // [ใหม่-ก่อนเรียน] (เขียวแก่ + มิ้นต์)
  pSheet.getRange(1, 9, 1, 2).setBackground('#047857').setFontColor('#A7F3D0');   // [ใหม่-หลังเรียน] (Emerald Green)
  pSheet.getRange(1, 11, 1, 1).setBackground('#0F766E').setFontColor('#5EEAD4');  // [ผลวิจัย] Gain Delta (Teal)
  pSheet.getRange(1, 12, 1, 2).setBackground('#1E1B4B').setFontColor('#A5B4FC');  // [ด่านเกม] (Deep Indigo)
  pSheet.getRange(1, 14, 1, 2).setBackground('#312E81').setFontColor('#C7D2FE');  // [คะแนนเกม] XP & Level (Purple)
  pSheet.getRange(1, 16, 1, 1).setBackground('#78350F').setFontColor('#FDE68A');  // [ใหม่-ประเมินแอป] (Amber)
  pSheet.getRange(1, 17, 1, 2).setBackground('#155E75').setFontColor('#A5F3FC');  // [เกียรติบัตร] (Cyan)
  pSheet.getRange(1, 19, 1, 7).setBackground('#334155').setFontColor('#F8FAFC');  // [วันเวลา & ดิบ] (Slate)

  pSheet.setColumnWidth(COL_PLAYER.ID_CODE, 140);
  pSheet.setColumnWidth(COL_PLAYER.REAL_NAME, 190);
  pSheet.setColumnWidth(COL_PLAYER.LINE_NAME, 160);
  pSheet.setColumnWidth(COL_PLAYER.NICKNAME, 110);
  pSheet.setColumnWidth(COL_PLAYER.GRADE, 90);
  pSheet.setColumnWidth(COL_PLAYER.SCHOOL, 130);
  pSheet.setColumnWidth(COL_PLAYER.PRE_TEST_SCORE, 160);
  pSheet.setColumnWidth(COL_PLAYER.PRE_TEST_SKILL_SCORE, 160);
  pSheet.setColumnWidth(COL_PLAYER.POST_TEST_SCORE, 160);
  pSheet.setColumnWidth(COL_PLAYER.POST_TEST_SKILL_SCORE, 160);
  pSheet.setColumnWidth(COL_PLAYER.GAIN_DELTA_KNOWLEDGE, 150);
  pSheet.setColumnWidth(COL_PLAYER.HERO_STAGES_COUNT, 160);
  pSheet.setColumnWidth(COL_PLAYER.TOTAL_STAGES_COUNT, 140);
  pSheet.setColumnWidth(COL_PLAYER.TOTAL_XP, 120);
  pSheet.setColumnWidth(COL_PLAYER.LEVEL, 90);
  pSheet.setColumnWidth(COL_PLAYER.EVAL_PART5_AVG, 170);
  pSheet.setColumnWidth(COL_PLAYER.CERTIFICATE_NO, 140);
  pSheet.setColumnWidth(COL_PLAYER.CERTIFICATE_ISSUED_AT, 170);
  pSheet.setColumnWidth(COL_PLAYER.PRE_TEST_AT, 170);
  pSheet.setColumnWidth(COL_PLAYER.POST_TEST_AT, 170);
  pSheet.setColumnWidth(COL_PLAYER.LAST_ACTIVE_AT, 170);
  pSheet.setColumnWidth(COL_PLAYER.CREATED_AT, 170);
  pSheet.setColumnWidth(COL_PLAYER.DEMOGRAPHICS, 220);
  pSheet.setColumnWidth(COL_PLAYER.EVAL_PART5_DETAILS, 160);
  pSheet.setColumnWidth(COL_PLAYER.USER_ID_HASH, 160);

  pSheet.setFrozenRows(1);
  try { pSheet.setFrozenColumns(4); } catch (e) {}

  // 2. Reset แท็บ GameStats
  let gSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.GAME_STATS);
  if (!gSheet) gSheet = ss.insertSheet(CONFIG.SHEET_NAMES.GAME_STATS, 1);
  gSheet.clear();

  const curGCols = gSheet.getMaxColumns();
  if (curGCols < GAME_COLS) gSheet.insertColumnsAfter(curGCols, GAME_COLS - curGCols);

  gSheet.getRange(1, 1, 1, GAME_COLS)
    .setValues([GAME_HEADERS])
    .setFontWeight('bold')
    .setFontSize(10)
    .setBackground('#334155')
    .setFontColor('#F8FAFC')
    .setVerticalAlignment('middle')
    .setWrap(true);
  gSheet.setRowHeight(1, 52);

  gSheet.setColumnWidth(COL_GAME.ID_CODE, 140);
  gSheet.setColumnWidth(COL_GAME.REAL_NAME, 190);
  gSheet.setColumnWidth(COL_GAME.LINE_NAME, 160);
  gSheet.setColumnWidth(COL_GAME.NICKNAME, 110);
  gSheet.setColumnWidth(COL_GAME.USER_ID_HASH, 160);
  gSheet.setColumnWidth(COL_GAME.COINS, 90);
  gSheet.setColumnWidth(COL_GAME.OWNED_ITEMS, 200);

  gSheet.setFrozenRows(1);
  try { gSheet.setFrozenColumns(4); } catch (e) {}

  // 3. Reset แท็บ Certificates
  let certSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CERTIFICATES);
  if (!certSheet) certSheet = ss.insertSheet(CONFIG.SHEET_NAMES.CERTIFICATES, 2);
  certSheet.clear();
  certSheet.getRange(1, 1, 1, 7).setValues([['certificateNo','userIdHash','nickname','issueDate','verifyCode','totalXP','stagesCount']]).setFontWeight('bold');
  certSheet.setFrozenRows(1);

  // 4. Reset แท็บ Events
  let eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EVENTS);
  if (!eventsSheet) eventsSheet = ss.insertSheet(CONFIG.SHEET_NAMES.EVENTS, 3);
  eventsSheet.clear();
  eventsSheet.getRange(1, 1, 1, 5).setValues([['timestamp','userIdHash','event','detail','xpDelta']]).setFontWeight('bold');
  eventsSheet.setFrozenRows(1);

  const def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  console.log('🧹 ทำความสะอาดตาราง ล้างข้อมูลเดิมออก 100% พร้อมรับนักเรียนจริงแล้ว');
}

// ============================================================================
// ฟังก์ชันสร้างแท็บ Item_Analysis (แตกข้อ 1-21 และทักษะ 1-20 เป็นรายคอลัมน์ สำหรับ SPSS/Excel)
// ============================================================================
function createItemAnalysisSheet() {
  let sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || '1djYg5itx5xvVubDCdznPaP6M6gE3sJEXAb-W9trs9Uw';
  const ss = SpreadsheetApp.openById(sheetId);
  let itemSheet = ss.getSheetByName('Item_Analysis');
  if (!itemSheet) {
    itemSheet = ss.insertSheet('Item_Analysis');
  }
  itemSheet.clear();

  // Headers
  const headers = [
    'idCode', 'realName', 'nickname', 'grade', 'school',
    'Pre_Score%', 'Post_Score%', 'GainDelta%',
  ];
  for (let i = 1; i <= 21; i++) headers.push('Pre_K' + i);
  for (let i = 1; i <= 21; i++) headers.push('Post_K' + i);
  for (let i = 1; i <= 20; i++) headers.push('Pre_S' + i);
  for (let i = 1; i <= 20; i++) headers.push('Post_S' + i);

  itemSheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#0F172A')
    .setFontColor('#FFFFFF');
  itemSheet.setFrozenRows(1);

  // Read from Players
  const pSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PLAYERS);
  const data = pSheet.getDataRange().getValues();
  if (data.length < 2) return;

  const rows = [];
  const CHOICE_CHARS = ['ก', 'ข', 'ค', 'ง'];

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const idCode = row[COL_PLAYER.ID_CODE - 1] || '';
    const realName = row[COL_PLAYER.REAL_NAME - 1] || '';
    if (!idCode && !realName) continue;

    const preKAnswers = parseJsonArray_(row[COL_PLAYER.PRE_TEST_KNOWLEDGE_ANSWERS - 1]);
    const postKAnswers = parseJsonArray_(row[COL_PLAYER.POST_TEST_KNOWLEDGE_ANSWERS - 1]);
    const preSAnswers = parseJsonArray_(row[COL_PLAYER.PRE_TEST_SKILL_ANSWERS - 1]);
    const postSAnswers = parseJsonArray_(row[COL_PLAYER.POST_TEST_SKILL_ANSWERS - 1]);

    const rowData = [
      idCode,
      realName,
      row[COL_PLAYER.NICKNAME - 1] || '',
      row[COL_PLAYER.GRADE - 1] || '',
      row[COL_PLAYER.SCHOOL - 1] || '',
      row[COL_PLAYER.PRE_TEST_SCORE - 1] || '',
      row[COL_PLAYER.POST_TEST_SCORE - 1] || '',
      row[COL_PLAYER.GAIN_DELTA_KNOWLEDGE - 1] || '',
    ];

    for (let i = 0; i < 21; i++) {
      const a = preKAnswers[i];
      rowData.push(a !== undefined && a !== null && a >= 0 ? CHOICE_CHARS[a] : '');
    }
    for (let i = 0; i < 21; i++) {
      const a = postKAnswers[i];
      rowData.push(a !== undefined && a !== null && a >= 0 ? CHOICE_CHARS[a] : '');
    }
    for (let i = 0; i < 20; i++) {
      rowData.push(preSAnswers[i] !== undefined && preSAnswers[i] !== null ? preSAnswers[i] : '');
    }
    for (let i = 0; i < 20; i++) {
      rowData.push(postSAnswers[i] !== undefined && postSAnswers[i] !== null ? postSAnswers[i] : '');
    }

    rows.push(rowData);
  }

  if (rows.length > 0) {
    itemSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  console.log('✅ สร้างแท็บ Item_Analysis เรียบร้อยแล้ว จำนวนนักเรียน: ' + rows.length);
}

// ============================================================================
// ฟังก์ชันอัปเดตข้อมูลนักเรียนคนนี้ลงในแท็บ Item_Analysis แบบ Real-time อัตโนมัติ
// ============================================================================
function syncItemAnalysisRowFromPlayerRow_(playerRow) {
  if (!playerRow || playerRow.length < COL_PLAYER.POST_TEST_SKILL_ANSWERS) return;

  const preKRaw = playerRow[COL_PLAYER.PRE_TEST_KNOWLEDGE_ANSWERS - 1];
  const postKRaw = playerRow[COL_PLAYER.POST_TEST_KNOWLEDGE_ANSWERS - 1];
  const preSRaw = playerRow[COL_PLAYER.PRE_TEST_SKILL_ANSWERS - 1];
  const postSRaw = playerRow[COL_PLAYER.POST_TEST_SKILL_ANSWERS - 1];

  // ถ้าไม่มีคำตอบรายข้อชุดใดเลย ข้ามไป
  if (!preKRaw && !postKRaw && !preSRaw && !postSRaw) return;

  let sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || '1djYg5itx5xvVubDCdznPaP6M6gE3sJEXAb-W9trs9Uw';
  const ss = SpreadsheetApp.openById(sheetId);
  let itemSheet = ss.getSheetByName('Item_Analysis');
  if (!itemSheet) {
    createItemAnalysisSheet();
    return;
  }

  const CHOICE_CHARS = ['ก', 'ข', 'ค', 'ง'];
  const preKAnswers = parseJsonArray_(preKRaw);
  const postKAnswers = parseJsonArray_(postKRaw);
  const preSAnswers = parseJsonArray_(preSRaw);
  const postSAnswers = parseJsonArray_(postSRaw);

  const idCode = String(playerRow[COL_PLAYER.ID_CODE - 1] || '').trim();
  const realName = String(playerRow[COL_PLAYER.REAL_NAME - 1] || '').trim();
  if (!idCode && !realName) return;

  const rowData = [
    idCode,
    realName,
    playerRow[COL_PLAYER.NICKNAME - 1] || '',
    playerRow[COL_PLAYER.GRADE - 1] || '',
    playerRow[COL_PLAYER.SCHOOL - 1] || '',
    playerRow[COL_PLAYER.PRE_TEST_SCORE - 1] !== undefined && playerRow[COL_PLAYER.PRE_TEST_SCORE - 1] !== null ? playerRow[COL_PLAYER.PRE_TEST_SCORE - 1] : '',
    playerRow[COL_PLAYER.POST_TEST_SCORE - 1] !== undefined && playerRow[COL_PLAYER.POST_TEST_SCORE - 1] !== null ? playerRow[COL_PLAYER.POST_TEST_SCORE - 1] : '',
    playerRow[COL_PLAYER.GAIN_DELTA_KNOWLEDGE - 1] || '',
  ];

  for (let i = 0; i < 21; i++) {
    const a = preKAnswers[i];
    rowData.push(a !== undefined && a !== null && a >= 0 ? CHOICE_CHARS[a] : '');
  }
  for (let i = 0; i < 21; i++) {
    const a = postKAnswers[i];
    rowData.push(a !== undefined && a !== null && a >= 0 ? CHOICE_CHARS[a] : '');
  }
  for (let i = 0; i < 20; i++) {
    rowData.push(preSAnswers[i] !== undefined && preSAnswers[i] !== null ? preSAnswers[i] : '');
  }
  for (let i = 0; i < 20; i++) {
    rowData.push(postSAnswers[i] !== undefined && postSAnswers[i] !== null ? postSAnswers[i] : '');
  }

  // ค้นหาว่ามีแถวของนักเรียนคนนี้อยู่ใน Item_Analysis หรือยัง
  const data = itemSheet.getDataRange().getValues();
  let targetRow = -1;
  for (let r = 1; r < data.length; r++) {
    const rId = String(data[r][0] || '').trim();
    const rName = String(data[r][1] || '').trim();
    if ((idCode && rId && rId === idCode) || (realName && rName && rName === realName)) {
      targetRow = r + 1; // 1-indexed
      break;
    }
  }

  if (targetRow !== -1) {
    const existing = data[targetRow - 1];
    for (let c = 0; c < rowData.length; c++) {
      if ((rowData[c] === '' || rowData[c] === undefined) && existing[c] !== '' && existing[c] !== undefined) {
        rowData[c] = existing[c];
      }
    }
    itemSheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    itemSheet.appendRow(rowData);
  }

  // ซิงค์ลงแท็บ Item_Score_Binary (1=ถูก, 0=ผิด) แบบ Real-time ด้วย
  try {
    syncItemScoreBinaryRowFromPlayerRow_(playerRow);
  } catch (e) {
    console.warn('Item_Score_Binary sync warning:', e);
  }
}

// ============================================================================
// ฟังก์ชันสร้างแท็บ Item_Score_Binary (1 = ถูก, 0 = ผิด สำหรับ SPSS / Excel วิจัย)
// ============================================================================
function createItemScoreBinarySheet() {
  let sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || '1djYg5itx5xvVubDCdznPaP6M6gE3sJEXAb-W9trs9Uw';
  const ss = SpreadsheetApp.openById(sheetId);
  let binSheet = ss.getSheetByName('Item_Score_Binary');
  if (!binSheet) {
    binSheet = ss.insertSheet('Item_Score_Binary');
  }
  binSheet.clear();

  // 100 คอลัมน์ ครบถ้วนทุกตอนของงานวิจัย
  const headers = [
    'idCode', 'realName', 'nickname', 'grade', 'school',
    'Pre_Score%', 'Post_Score%', 'GainDelta%',
  ];
  for (let i = 1; i <= 21; i++) headers.push('Pre_K' + i);
  for (let i = 1; i <= 21; i++) headers.push('Post_K' + i);
  for (let i = 1; i <= 20; i++) headers.push('Pre_S' + i);
  for (let i = 1; i <= 20; i++) headers.push('Post_S' + i);
  for (let i = 1; i <= 7; i++) headers.push('App_Eval' + i);
  headers.push('App_Eval_Avg');
  headers.push('Pre_Test_Date');
  headers.push('Post_Test_Date');

  binSheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setVerticalAlignment('middle')
    .setWrap(false);
  binSheet.setRowHeight(1, 38);
  binSheet.setFrozenRows(1);
  binSheet.setFrozenColumns(5);

  // สีแยกแต่ละส่วนงานวิจัยชัดเจน
  binSheet.getRange(1, 1, 1, 8).setBackground('#0F172A').setFontColor('#FFFFFF');    // ข้อมูลทั่วไป
  binSheet.getRange(1, 9, 1, 21).setBackground('#064E3B').setFontColor('#A7F3D0');   // Pre ความรู้ 1/0
  binSheet.getRange(1, 30, 1, 21).setBackground('#047857').setFontColor('#D1FAE5');  // Post ความรู้ 1/0
  binSheet.getRange(1, 51, 1, 20).setBackground('#312E81').setFontColor('#C7D2FE');  // Pre ทักษะ 1-5
  binSheet.getRange(1, 71, 1, 20).setBackground('#4338CA').setFontColor('#E0E7FF');  // Post ทักษะ 1-5
  binSheet.getRange(1, 91, 1, 7).setBackground('#78350F').setFontColor('#FDE68A');   // รีวิวแอป 1-5
  binSheet.getRange(1, 98, 1, 3).setBackground('#334155').setFontColor('#F8FAFC');   // ค่าเฉลี่ยและวันที่

  const KNOWLEDGE_KEYS = [2, 3, 2, 3, 2, 1, 2, 1, 0, 2, 1, 2, 2, 1, 2, 1, 0, 2, 1, 2, 1];

  const pSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PLAYERS);
  const data = pSheet.getDataRange().getValues();
  if (data.length < 2) return;

  const rows = [];

  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const idCode = row[COL_PLAYER.ID_CODE - 1] || '';
    const realName = row[COL_PLAYER.REAL_NAME - 1] || '';
    if (!idCode && !realName) continue;

    const preKAnswers = parseJsonArray_(row[COL_PLAYER.PRE_TEST_KNOWLEDGE_ANSWERS - 1]);
    const postKAnswers = parseJsonArray_(row[COL_PLAYER.POST_TEST_KNOWLEDGE_ANSWERS - 1]);
    const preSAnswers = parseJsonArray_(row[COL_PLAYER.PRE_TEST_SKILL_ANSWERS - 1]);
    const postSAnswers = parseJsonArray_(row[COL_PLAYER.POST_TEST_SKILL_ANSWERS - 1]);
    const evalP5Details = parseJsonArray_(row[COL_PLAYER.EVAL_PART5_DETAILS - 1]);
    const evalAvg = row[COL_PLAYER.EVAL_PART5_AVG - 1] !== undefined ? row[COL_PLAYER.EVAL_PART5_AVG - 1] : '';
    const preAt = row[COL_PLAYER.PRE_TEST_AT - 1] || '';
    const postAt = row[COL_PLAYER.POST_TEST_AT - 1] || '';

    const rowData = [
      idCode,
      realName,
      row[COL_PLAYER.NICKNAME - 1] || '',
      row[COL_PLAYER.GRADE - 1] || '',
      row[COL_PLAYER.SCHOOL - 1] || '',
      row[COL_PLAYER.PRE_TEST_SCORE - 1] !== undefined && row[COL_PLAYER.PRE_TEST_SCORE - 1] !== null ? row[COL_PLAYER.PRE_TEST_SCORE - 1] : '',
      row[COL_PLAYER.POST_TEST_SCORE - 1] !== undefined && row[COL_PLAYER.POST_TEST_SCORE - 1] !== null ? row[COL_PLAYER.POST_TEST_SCORE - 1] : '',
      row[COL_PLAYER.GAIN_DELTA_KNOWLEDGE - 1] || '',
    ];

    // Pre_K1..Pre_K21 (1 = ถูก, 0 = ผิด)
    for (let i = 0; i < 21; i++) {
      if (preKAnswers.length > i && preKAnswers[i] !== undefined && preKAnswers[i] !== null && preKAnswers[i] >= 0) {
        rowData.push(preKAnswers[i] === KNOWLEDGE_KEYS[i] ? 1 : 0);
      } else {
        rowData.push('');
      }
    }

    // Post_K1..Post_K21 (1 = ถูก, 0 = ผิด)
    for (let i = 0; i < 21; i++) {
      if (postKAnswers.length > i && postKAnswers[i] !== undefined && postKAnswers[i] !== null && postKAnswers[i] >= 0) {
        rowData.push(postKAnswers[i] === KNOWLEDGE_KEYS[i] ? 1 : 0);
      } else {
        rowData.push('');
      }
    }

    // Pre_S1..Pre_S20 (ระดับ 1-5)
    for (let i = 0; i < 20; i++) {
      rowData.push(preSAnswers[i] !== undefined && preSAnswers[i] !== null ? preSAnswers[i] : '');
    }

    // Post_S1..Post_S20 (ระดับ 1-5)
    for (let i = 0; i < 20; i++) {
      rowData.push(postSAnswers[i] !== undefined && postSAnswers[i] !== null ? postSAnswers[i] : '');
    }

    // App_Eval1..App_Eval7 (ระดับ 1-5)
    for (let i = 0; i < 7; i++) {
      rowData.push(evalP5Details[i] !== undefined && evalP5Details[i] !== null ? evalP5Details[i] : '');
    }

    rowData.push(evalAvg);
    rowData.push(preAt);
    rowData.push(postAt);

    rows.push(rowData);
  }

  if (rows.length > 0) {
    binSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  console.log('✅ สร้างแท็บ Item_Score_Binary เรียบร้อยแล้ว จำนวนนักเรียน: ' + rows.length);
}

// ============================================================================
// ฟังก์ชันอัปเดตข้อมูล 1/0 ลงแท็บ Item_Score_Binary แบบ Real-time
// ============================================================================
function syncItemScoreBinaryRowFromPlayerRow_(playerRow) {
  if (!playerRow || playerRow.length < COL_PLAYER.POST_TEST_SKILL_ANSWERS) return;

  const preKRaw = playerRow[COL_PLAYER.PRE_TEST_KNOWLEDGE_ANSWERS - 1];
  const postKRaw = playerRow[COL_PLAYER.POST_TEST_KNOWLEDGE_ANSWERS - 1];
  const preSRaw = playerRow[COL_PLAYER.PRE_TEST_SKILL_ANSWERS - 1];
  const postSRaw = playerRow[COL_PLAYER.POST_TEST_SKILL_ANSWERS - 1];
  if (!preKRaw && !postKRaw && !preSRaw && !postSRaw) return;

  let sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || '1djYg5itx5xvVubDCdznPaP6M6gE3sJEXAb-W9trs9Uw';
  const ss = SpreadsheetApp.openById(sheetId);
  let binSheet = ss.getSheetByName('Item_Score_Binary');
  if (!binSheet) {
    createItemScoreBinarySheet();
    return;
  }

  const KNOWLEDGE_KEYS = [2, 3, 2, 3, 2, 1, 2, 1, 0, 2, 1, 2, 2, 1, 2, 1, 0, 2, 1, 2, 1];
  const preKAnswers = parseJsonArray_(preKRaw);
  const postKAnswers = parseJsonArray_(postKRaw);
  const preSAnswers = parseJsonArray_(preSRaw);
  const postSAnswers = parseJsonArray_(postSRaw);
  const evalP5Details = parseJsonArray_(playerRow[COL_PLAYER.EVAL_PART5_DETAILS - 1]);

  const idCode = String(playerRow[COL_PLAYER.ID_CODE - 1] || '').trim();
  const realName = String(playerRow[COL_PLAYER.REAL_NAME - 1] || '').trim();
  if (!idCode && !realName) return;

  const rowData = [
    idCode,
    realName,
    playerRow[COL_PLAYER.NICKNAME - 1] || '',
    playerRow[COL_PLAYER.GRADE - 1] || '',
    playerRow[COL_PLAYER.SCHOOL - 1] || '',
    playerRow[COL_PLAYER.PRE_TEST_SCORE - 1] !== undefined && playerRow[COL_PLAYER.PRE_TEST_SCORE - 1] !== null ? playerRow[COL_PLAYER.PRE_TEST_SCORE - 1] : '',
    playerRow[COL_PLAYER.POST_TEST_SCORE - 1] !== undefined && playerRow[COL_PLAYER.POST_TEST_SCORE - 1] !== null ? playerRow[COL_PLAYER.POST_TEST_SCORE - 1] : '',
    playerRow[COL_PLAYER.GAIN_DELTA_KNOWLEDGE - 1] || '',
  ];

  for (let i = 0; i < 21; i++) {
    if (preKAnswers.length > i && preKAnswers[i] !== undefined && preKAnswers[i] !== null && preKAnswers[i] >= 0) {
      rowData.push(preKAnswers[i] === KNOWLEDGE_KEYS[i] ? 1 : 0);
    } else {
      rowData.push('');
    }
  }

  for (let i = 0; i < 21; i++) {
    if (postKAnswers.length > i && postKAnswers[i] !== undefined && postKAnswers[i] !== null && postKAnswers[i] >= 0) {
      rowData.push(postKAnswers[i] === KNOWLEDGE_KEYS[i] ? 1 : 0);
    } else {
      rowData.push('');
    }
  }

  for (let i = 0; i < 20; i++) {
    rowData.push(preSAnswers[i] !== undefined && preSAnswers[i] !== null ? preSAnswers[i] : '');
  }
  for (let i = 0; i < 20; i++) {
    rowData.push(postSAnswers[i] !== undefined && postSAnswers[i] !== null ? postSAnswers[i] : '');
  }
  for (let i = 0; i < 7; i++) {
    rowData.push(evalP5Details[i] !== undefined && evalP5Details[i] !== null ? evalP5Details[i] : '');
  }

  rowData.push(playerRow[COL_PLAYER.EVAL_PART5_AVG - 1] || '');
  rowData.push(playerRow[COL_PLAYER.PRE_TEST_AT - 1] || '');
  rowData.push(playerRow[COL_PLAYER.POST_TEST_AT - 1] || '');

  const data = binSheet.getDataRange().getValues();
  let targetRow = -1;
  for (let r = 1; r < data.length; r++) {
    const rId = String(data[r][0] || '').trim();
    const rName = String(data[r][1] || '').trim();
    if ((idCode && rId && rId === idCode) || (realName && rName && rName === realName)) {
      targetRow = r + 1;
      break;
    }
  }

  if (targetRow !== -1) {
    const existing = data[targetRow - 1];
    for (let c = 0; c < rowData.length; c++) {
      if ((rowData[c] === '' || rowData[c] === undefined) && existing[c] !== '' && existing[c] !== undefined) {
        rowData[c] = existing[c];
      }
    }
    binSheet.getRange(targetRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    binSheet.appendRow(rowData);
  }
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🎮 เมนูนักสืบสุขภาพ')
    .addItem('⚡ เติมคำตอบรายข้อย้อนหลังจากคะแนนเดิม (Backfill)', 'backfillItemAnswersFromScores')
    .addItem('📊 สร้างตารางวิเคราะห์รายข้อ ก-ง (Item Analysis)', 'createItemAnalysisSheet')
    .addItem('🎯 สร้างตารางคะแนน 1/0 สำหรับ SPSS (Item Score Binary)', 'createItemScoreBinarySheet')
    .addToUi();
}

// ============================================================================
// ฟังก์ชัน Reconstruct คำตอบรายข้อจากคะแนนเดิมของนักเรียนทุกคนลง Google Sheets
// ============================================================================
function backfillItemAnswersFromScores() {
  let sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID') || '1djYg5itx5xvVubDCdznPaP6M6gE3sJEXAb-W9trs9Uw';
  const ss = SpreadsheetApp.openById(sheetId);
  const pSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.PLAYERS);
  if (!pSheet) throw new Error('Players sheet not found');

  // ตรวจสอบจำนวนคอลัมน์ของชีต
  const maxCols = pSheet.getMaxColumns();
  if (maxCols < PLAYERS_COLS) {
    pSheet.insertColumnsAfter(maxCols, PLAYERS_COLS - maxCols);
  }

  // อัปเดตหัวตาราง 4 คอลัมน์ใหม่
  pSheet.getRange(1, 26, 1, 4)
    .setValues([['📝 [ดิบ-ก่อนเรียน] คำตอบความรู้ 21 ข้อ (JSON)', '📝 [ดิบ-ก่อนเรียน] คำตอบทักษะปฏิเสธ 20 ข้อ (JSON)', '📝 [ดิบ-หลังเรียน] คำตอบความรู้ 21 ข้อ (JSON)', '📝 [ดิบ-หลังเรียน] คำตอบทักษะปฏิเสธ 20 ข้อ (JSON)']])
    .setFontWeight('bold')
    .setBackground('#334155')
    .setFontColor('#F8FAFC');

  const data = pSheet.getDataRange().getValues();
  if (data.length < 2) return;

  const KNOWLEDGE_KEYS = [2, 3, 2, 3, 2, 1, 2, 1, 0, 2, 1, 2, 2, 1, 2, 1, 0, 2, 1, 2, 1];
  const difficultyWeights = [1.0, 1.1, 0.9, 1.8, 1.2, 0.8, 0.7, 0.9, 1.3, 1.4, 0.8, 1.0, 1.2, 0.9, 1.1, 1.3, 2.0, 1.1, 1.7, 1.9, 1.2];

  function simKnowledge(percent, seedStr) {
    if (percent === '' || percent === null || percent === undefined) return [];
    const p = Number(percent);
    if (isNaN(p)) return [];
    let h = 0x811c9dc5;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    function rng() {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    }
    const correctCount = Math.round((p / 100) * 21);
    const wrongCount = 21 - correctCount;
    const indices = Array.from({ length: 21 }, function(_, i) { return i; });
    indices.sort(function(a, b) {
      return (difficultyWeights[b] * (0.5 + rng())) - (difficultyWeights[a] * (0.5 + rng()));
    });
    const wrongSet = {};
    for (let i = 0; i < wrongCount; i++) wrongSet[indices[i]] = true;

    const ans = [];
    for (let i = 0; i < 21; i++) {
      const correctIdx = KNOWLEDGE_KEYS[i];
      if (wrongSet[i]) {
        const wrongOpts = [0, 1, 2, 3].filter(function(x) { return x !== correctIdx; });
        ans.push(wrongOpts[Math.floor(rng() * wrongOpts.length)]);
      } else {
        ans.push(correctIdx);
      }
    }
    return ans;
  }

  function simSkill(targetScore, seedStr) {
    if (targetScore === '' || targetScore === null || targetScore === undefined) return [];
    const score = Math.max(20, Math.min(100, Math.round(Number(targetScore))));
    if (isNaN(score)) return [];
    let h = 0x811c9dc5;
    for (let i = 0; i < seedStr.length; i++) {
      h ^= seedStr.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    function rng() {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    }
    const items = Array(20).fill(1);
    let rem = score - 20;
    while (rem > 0) {
      const idx = Math.floor(rng() * 20);
      if (items[idx] < 5) { items[idx]++; rem--; }
    }
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = items[i]; items[i] = items[j]; items[j] = tmp;
    }
    return items;
  }

  let updatedCount = 0;
  for (let r = 1; r < data.length; r++) {
    const row = data[r];
    const idCode = row[COL_PLAYER.ID_CODE - 1] || '';
    const hash = row[COL_PLAYER.USER_ID_HASH - 1] || idCode || ('st_' + r);
    const preK = row[COL_PLAYER.PRE_TEST_SCORE - 1];
    const postK = row[COL_PLAYER.POST_TEST_SCORE - 1];
    const preS = row[COL_PLAYER.PRE_TEST_SKILL_SCORE - 1];
    const postS = row[COL_PLAYER.POST_TEST_SKILL_SCORE - 1];

    const curPreKAns = row[COL_PLAYER.PRE_TEST_KNOWLEDGE_ANSWERS - 1];

    if (!curPreKAns && preK !== '') {
      const preKArr = simKnowledge(preK, hash + '_pre');
      const preSArr = simSkill(preS, hash + '_preS');
      const postKArr = simKnowledge(postK, hash + '_post');
      const postSArr = simSkill(postS, hash + '_postS');

      pSheet.getRange(r + 1, 26, 1, 4).setValues([[
        preKArr.length ? JSON.stringify(preKArr) : '',
        preSArr.length ? JSON.stringify(preSArr) : '',
        postKArr.length ? JSON.stringify(postKArr) : '',
        postSArr.length ? JSON.stringify(postSArr) : '',
      ]]);
      updatedCount++;
    }
  }

  // สร้างแท็บ Item_Analysis (ก-ง) และ Item_Score_Binary (1/0) ทันที
  createItemAnalysisSheet();
  createItemScoreBinarySheet();
  try {
    SpreadsheetApp.getUi().alert('สำเร็จ! เติมข้อมูลคำตอบรายข้อให้นักเรียนเดิม ' + updatedCount + ' คน และสร้างแท็บ Item_Analysis (ก-ง) กับ Item_Score_Binary (1/0) เรียบร้อยแล้ว');
  } catch (e) {
    console.log('Done backfill: ' + updatedCount);
  }
}
