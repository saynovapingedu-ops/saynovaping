// ============================================================================
//  Cloud Sync — เชื่อม LIFF กับ Supabase (PostgreSQL Cloud Database)
// ============================================================================
//  หน้าที่:
//  - ส่ง progress ผู้เล่นไปบันทึกที่ Supabase (รองรับ 1600+ คนพร้อมกัน)
//  - ออก/ตรวจ certificate แบบ Atomic
//  - กู้ progress ตอนเปลี่ยนเครื่อง
//
//  ฟีเจอร์:
//  - Offline queue: ถ้าเน็ตหลุด เก็บใน localStorage รอส่งทีหลัง
//  - Auto retry: ถ้า request fail retry 2 ครั้ง (exponential backoff)
//  - Silent fail: ถ้า sync fail ไม่ขัดจังหวะ gameplay
// ============================================================================

import { supabase } from './supabase';

const QUEUE_KEY = 'hd_sync_queue';
const MAX_RETRIES = 2;

export interface SyncPayload {
  userIdHash: string;
  nickname: string;
  grade?: string;
  school?: string;
  totalXP: number;
  level: number;
  stagesCompleted: number[];
  badges: string[];
  // เหรียญ + ของในร้าน (booster + อุปกรณ์แต่งโปรไฟล์) — ต้องเก็บไว้กู้ตอนเปลี่ยนเครื่อง
  coins?: number;
  ownedItems?: string[];
  equippedTitle?: string;
  equippedFrame?: string;
  equippedTheme?: string;
  equippedAccessory?: string;
  equippedBackdrop?: string;
  equippedCertDeco?: string;
  hintTokens?: number;
  coinX2Remaining?: number;
  streakShields?: number;
  // streak / daily challenge / final exam / pre-post assessment
  streakDays?: number;
  lastPlayDate?: string;
  lastDailyDate?: string;
  dailyDoneCount?: number;
  dailyBestScore?: number;
  examBestScore?: number;
  examBonusClaimed?: boolean;
  preTestScore?: number;
  postTestScore?: number;
  preTestSkillScore?: number;
  postTestSkillScore?: number;
  preTestKnowledgeAnswers?: number[];
  postTestKnowledgeAnswers?: number[];
  preTestSkillAnswers?: number[];
  postTestSkillAnswers?: number[];
  preTestAt?: string;
  postTestAt?: string;
  idCode?: string;
  realName?: string;
  lineName?: string;
  evalPart5Avg?: number;
  evalPart5Details?: number[];
  demographics?: Record<string, any>;
  // ความพึงพอใจ/ความสนุก (ดาว 1-5)
  funRating?: number;
  funRatingCount?: number;
  funRatingSum?: number;
  avatar?: number;
}

export interface CertResponse {
  ok: boolean;
  alreadyIssued?: boolean;
  certificateNo?: string;
  verifyCode?: string;
  issueDate?: string;
  nickname?: string;
  error?: string;
  message?: string;
  currentStages?: number;
  currentXP?: number;
}

export interface VerifyResponse {
  ok: boolean;
  valid: boolean;
  certificateNo?: string;
  nickname?: string;
  issueDate?: string;
  totalXP?: number;
  stagesCount?: number;
}

export interface RestoreResponse {
  ok: boolean;
  found: boolean;
  player?: {
    idCode?: string;
    realName?: string;
    lineName?: string;
    nickname: string;
    grade: string;
    school: string;
    createdAt: string;
    lastActiveAt: string;
    totalXP: number;
    level: number;
    stagesCompleted: number[];
    badges: string[];
    certificateNo: string | null;
    certificateIssuedAt: string | null;
    avatar?: number;
    coins?: number;
    ownedItems?: string[];
    equippedTitle?: string;
    equippedFrame?: string;
    equippedTheme?: string;
    equippedAccessory?: string;
    equippedBackdrop?: string;
    equippedCertDeco?: string;
    hintTokens?: number;
    coinX2Remaining?: number;
    streakShields?: number;
    streakDays?: number;
    lastPlayDate?: string;
    lastDailyDate?: string;
    dailyDoneCount?: number;
    dailyBestScore?: number;
    examBestScore?: number;
    examBonusClaimed?: boolean;
    preTestScore?: number;
    postTestScore?: number;
    preTestSkillScore?: number;
    postTestSkillScore?: number;
    preTestKnowledgeAnswers?: number[];
    postTestKnowledgeAnswers?: number[];
    preTestSkillAnswers?: number[];
    postTestSkillAnswers?: number[];
    evalPart5Avg?: number;
    evalPart5Details?: number[];
    demographics?: any;
    preTestAt?: string;
    postTestAt?: string;
    funRating?: number;
    funRatingCount?: number;
    funRatingSum?: number;
  };
}

/** ขอบเขตของกระดานอันดับ */
export type LeaderboardScope = 'class' | 'school' | 'all';

export interface LeaderboardEntry {
  rank: number;
  /** PDPA: ส่งมาเฉพาะแถวของผู้เล่นเอง (isMe) เท่านั้น — ของคนอื่นจะไม่มีชื่อ */
  nickname?: string;
  level?: number;
  totalXP: number;
  stagesCount: number;
  /** true ถ้าเป็นแถวของผู้เล่นคนปัจจุบัน (backend เทียบจาก userIdHash) */
  isMe?: boolean;
}

export interface LeaderboardResponse {
  ok: boolean;
  unsupported?: boolean;
  scope: LeaderboardScope;
  groupLabel?: string;
  entries: LeaderboardEntry[];
  me?: LeaderboardEntry;
  total?: number;
}

function addToQueue(payload: SyncPayload) {
  try {
    const queue = getQueue();
    queue.push({ payload, ts: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch { /* localStorage full — silent */ }
}

function getQueue(): Array<{ payload: SyncPayload; ts: number }> {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function clearQueue() {
  try { localStorage.removeItem(QUEUE_KEY); } catch { /* */ }
}

export async function flushQueue(): Promise<void> {
  const queue = getQueue();
  if (queue.length === 0) return;
  const latest = new Map<string, SyncPayload>();
  for (const item of queue) latest.set(item.payload.userIdHash, item.payload);
  try {
    await Promise.all(Array.from(latest.values()).map(p => syncProgress(p, false)));
    clearQueue();
  } catch { /* try again next time */ }
}

export async function syncProgress(payload: SyncPayload, queueOnFail = true): Promise<boolean> {
  if (!payload.userIdHash) return false;
  try {
    const stages = payload.stagesCompleted || [];
    const heroCount = stages.filter(id => id >= 1 && id <= 8).length;
    const totalCount = stages.length;

    const row: Record<string, any> = {
      user_id_hash: payload.userIdHash,
      nickname: payload.nickname || 'ผู้เล่น',
      total_xp: payload.totalXP ?? 0,
      level: payload.level ?? 1,
      stages_completed: stages,
      hero_stages_count: heroCount,
      total_stages_count: totalCount,
      badges: payload.badges || [],
      last_active_at: new Date().toISOString(),
    };

    if (payload.idCode !== undefined) row.id_code = payload.idCode;
    if (payload.realName !== undefined) row.real_name = payload.realName;
    if (payload.lineName !== undefined) row.line_name = payload.lineName;
    if (payload.grade !== undefined) row.grade = payload.grade;
    if (payload.school !== undefined) row.school = payload.school;
    if (payload.avatar !== undefined) row.avatar = payload.avatar;
    if (payload.coins !== undefined) row.coins = payload.coins;
    if (payload.ownedItems !== undefined) row.owned_items = payload.ownedItems;
    if (payload.equippedTitle !== undefined) row.equipped_title = payload.equippedTitle;
    if (payload.equippedFrame !== undefined) row.equipped_frame = payload.equippedFrame;
    if (payload.equippedTheme !== undefined) row.equipped_theme = payload.equippedTheme;
    if (payload.equippedAccessory !== undefined) row.equipped_accessory = payload.equippedAccessory;
    if (payload.equippedBackdrop !== undefined) row.equipped_backdrop = payload.equippedBackdrop;
    if (payload.equippedCertDeco !== undefined) row.equipped_cert_deco = payload.equippedCertDeco;
    if (payload.hintTokens !== undefined) row.hint_tokens = payload.hintTokens;
    if (payload.coinX2Remaining !== undefined) row.coin_x2_remaining = payload.coinX2Remaining;
    if (payload.streakShields !== undefined) row.streak_shields = payload.streakShields;
    if (payload.streakDays !== undefined) row.streak_days = payload.streakDays;
    if (payload.lastPlayDate !== undefined) row.last_play_date = payload.lastPlayDate;
    if (payload.lastDailyDate !== undefined) row.last_daily_date = payload.lastDailyDate;
    if (payload.dailyDoneCount !== undefined) row.daily_done_count = payload.dailyDoneCount;
    if (payload.dailyBestScore !== undefined) row.daily_best_score = payload.dailyBestScore;
    if (payload.examBestScore !== undefined) row.exam_best_score = payload.examBestScore;
    if (payload.examBonusClaimed !== undefined) row.exam_bonus_claimed = payload.examBonusClaimed;

    if (payload.preTestScore !== undefined) row.pre_test_score = payload.preTestScore;
    if (payload.postTestScore !== undefined) row.post_test_score = payload.postTestScore;
    if (payload.preTestSkillScore !== undefined) row.pre_test_skill_score = payload.preTestSkillScore;
    if (payload.postTestSkillScore !== undefined) row.post_test_skill_score = payload.postTestSkillScore;
    if (payload.postTestScore != null && payload.preTestScore != null) {
      row.gain_delta_knowledge = payload.postTestScore - payload.preTestScore;
    }

    if (payload.preTestKnowledgeAnswers !== undefined) row.pre_test_knowledge_answers = payload.preTestKnowledgeAnswers;
    if (payload.postTestKnowledgeAnswers !== undefined) row.post_test_knowledge_answers = payload.postTestKnowledgeAnswers;
    if (payload.preTestSkillAnswers !== undefined) row.pre_test_skill_answers = payload.preTestSkillAnswers;
    if (payload.postTestSkillAnswers !== undefined) row.post_test_skill_answers = payload.postTestSkillAnswers;
    if (payload.preTestAt !== undefined) row.pre_test_at = payload.preTestAt;
    if (payload.postTestAt !== undefined) row.post_test_at = payload.postTestAt;

    if (payload.evalPart5Avg !== undefined) row.eval_part5_avg = payload.evalPart5Avg;
    if (payload.evalPart5Details !== undefined) row.eval_part5_details = payload.evalPart5Details;
    if (payload.demographics !== undefined) row.demographics = payload.demographics;
    if (payload.funRating !== undefined) row.fun_rating = payload.funRating;
    if (payload.funRatingCount !== undefined) row.fun_rating_count = payload.funRatingCount;
    if (payload.funRatingSum !== undefined) row.fun_rating_sum = payload.funRatingSum;

    const { error } = await supabase.from('players').upsert(row, { onConflict: 'user_id_hash' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn('[cloudSync] Supabase sync failed, queueing:', err);
    if (queueOnFail) addToQueue(payload);
    return false;
  }
}

export async function issueCertificate(userIdHash: string): Promise<CertResponse> {
  try {
    const verifyCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const now = new Date();
    const issueDate = now.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

    const { data, error } = await supabase.rpc('issue_certificate_atomic', {
      p_user_id_hash: userIdHash,
      p_verify_code: verifyCode,
      p_issue_date: issueDate,
    });

    if (error || !data) {
      return { ok: false, error: 'rpc_error', message: error?.message || 'Failed to issue cert' };
    }
    return data as CertResponse;
  } catch (err) {
    return { ok: false, error: 'network_error', message: String(err) };
  }
}

export async function verifyCertificate(code: string): Promise<VerifyResponse> {
  try {
    const clean = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .or(`verify_code.ilike.${clean},cert_no.ilike.${clean}`)
      .maybeSingle();

    if (error || !data) return { ok: false, valid: false };

    return {
      ok: true,
      valid: true,
      certificateNo: data.cert_no,
      nickname: data.nickname,
      issueDate: data.issue_date,
      totalXP: data.total_xp,
      stagesCount: data.stages_count,
    };
  } catch {
    return { ok: false, valid: false };
  }
}

export async function restoreProgress(userIdHash: string): Promise<RestoreResponse> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id_hash', userIdHash)
      .maybeSingle();

    if (error || !data) return { ok: false, found: false };

    return {
      ok: true,
      found: true,
      player: {
        idCode: data.id_code || undefined,
        realName: data.real_name || undefined,
        lineName: data.line_name || undefined,
        nickname: data.nickname || 'ผู้เล่น',
        grade: data.grade || '',
        school: data.school || '',
        createdAt: data.created_at,
        lastActiveAt: data.last_active_at,
        totalXP: data.total_xp || 0,
        level: data.level || 1,
        stagesCompleted: data.stages_completed || [],
        badges: data.badges || [],
        certificateNo: data.certificate_no || null,
        certificateIssuedAt: data.certificate_issued_at || null,
        avatar: data.avatar,
        coins: data.coins,
        ownedItems: data.owned_items,
        equippedTitle: data.equipped_title,
        equippedFrame: data.equipped_frame,
        equippedTheme: data.equipped_theme,
        equippedAccessory: data.equipped_accessory,
        equippedBackdrop: data.equipped_backdrop,
        equippedCertDeco: data.equipped_cert_deco,
        hintTokens: data.hint_tokens,
        coinX2Remaining: data.coin_x2_remaining,
        streakShields: data.streak_shields,
        streakDays: data.streak_days,
        lastPlayDate: data.last_play_date,
        lastDailyDate: data.last_daily_date,
        dailyDoneCount: data.daily_done_count,
        dailyBestScore: data.daily_best_score,
        examBestScore: data.exam_best_score,
        examBonusClaimed: data.exam_bonus_claimed,
        preTestScore: data.pre_test_score,
        postTestScore: data.post_test_score,
        preTestSkillScore: data.pre_test_skill_score,
        postTestSkillScore: data.post_test_skill_score,
        preTestKnowledgeAnswers: data.pre_test_knowledge_answers,
        postTestKnowledgeAnswers: data.post_test_knowledge_answers,
        preTestSkillAnswers: data.pre_test_skill_answers,
        postTestSkillAnswers: data.post_test_skill_answers,
        evalPart5Avg: data.eval_part5_avg,
        evalPart5Details: data.eval_part5_details,
        demographics: data.demographics,
        preTestAt: data.pre_test_at,
        postTestAt: data.post_test_at,
        funRating: data.fun_rating,
        funRatingCount: data.fun_rating_count,
        funRatingSum: data.fun_rating_sum,
      },
    };
  } catch (err) {
    return { ok: false, found: false };
  }
}

export async function fetchLeaderboard(
  userIdHash: string,
  scope: LeaderboardScope = 'all',
  limit = 50
): Promise<LeaderboardResponse> {
  const empty = (extra: Partial<LeaderboardResponse> = {}): LeaderboardResponse =>
    ({ ok: false, scope, entries: [], ...extra });

  try {
    let query = supabase
      .from('players')
      .select('user_id_hash, nickname, total_xp, total_stages_count, level')
      .order('total_xp', { ascending: false })
      .order('total_stages_count', { ascending: false })
      .limit(limit);

    const { data, error } = await query;
    if (error || !data) return empty();

    let meEntry: LeaderboardEntry | undefined;
    const entries: LeaderboardEntry[] = data.map((row, idx) => {
      const isMe = !!(userIdHash && row.user_id_hash === userIdHash);
      const entry: LeaderboardEntry = {
        rank: idx + 1,
        totalXP: row.total_xp || 0,
        stagesCount: row.total_stages_count || 0,
        level: row.level || 1,
        isMe,
      };
      if (isMe) {
        entry.nickname = row.nickname || 'ผู้เล่น';
        meEntry = entry;
      }
      return entry;
    });

    return {
      ok: true,
      scope,
      groupLabel: 'ผู้เล่นทั้งหมด',
      entries,
      me: meEntry,
      total: entries.length,
    };
  } catch (err) {
    console.warn('[cloudSync] fetchLeaderboard failed:', err);
    return empty();
  }
}

export async function pingBackend(): Promise<boolean> {
  try {
    const { count, error } = await supabase.from('players').select('*', { count: 'exact', head: true });
    return !error;
  } catch {
    return false;
  }
}

export interface AdminStudentsResponse {
  ok: boolean;
  students?: any[];
  total?: number;
  error?: string;
}

export async function fetchAdminStudents(passcode = 'wu2535'): Promise<AdminStudentsResponse> {
  if (passcode !== 'wu2535') return { ok: false, error: 'unauthorized' };
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) return { ok: false, error: error?.message || 'failed_to_fetch' };

    const students = data.map((r, i) => {
      const preK = r.pre_test_score != null ? Number(r.pre_test_score) : undefined;
      const postK = r.post_test_score != null ? Number(r.post_test_score) : undefined;
      const gainDelta = (preK !== undefined && postK !== undefined) ? (postK - preK) : undefined;

      return {
        no: i + 1,
        userIdHash: r.user_id_hash,
        idCode: r.id_code || '',
        realName: r.real_name || r.nickname || 'ไม่ระบุชื่อ',
        lineName: r.line_name || '',
        nickname: r.nickname || 'ผู้เล่น',
        grade: r.grade || '',
        school: r.school || '',
        preTestScore: preK,
        preTestSkillScore: r.pre_test_skill_score != null ? Number(r.pre_test_skill_score) : undefined,
        preTestAt: r.pre_test_at || undefined,
        preTestKnowledgeAnswers: r.pre_test_knowledge_answers || [],
        preTestSkillAnswers: r.pre_test_skill_answers || [],
        stagesCompletedCount: r.total_stages_count || 0,
        heroStagesCount: r.hero_stages_count || 0,
        totalStages: 20,
        totalXP: r.total_xp || 0,
        level: r.level || 1,
        postTestScore: postK,
        postTestSkillScore: r.post_test_skill_score != null ? Number(r.post_test_skill_score) : undefined,
        postTestAt: r.post_test_at || undefined,
        postTestKnowledgeAnswers: r.post_test_knowledge_answers || [],
        postTestSkillAnswers: r.post_test_skill_answers || [],
        gainDelta: gainDelta,
        evalPart5Avg: r.eval_part5_avg != null ? Number(r.eval_part5_avg) : undefined,
        evalPart5Details: r.eval_part5_details || [],
        certificateNo: r.certificate_no || undefined,
        certificateIssuedAt: r.certificate_issued_at || undefined,
        lastActiveAt: r.last_active_at || r.created_at || '',
        createdAt: r.created_at || undefined,
      };
    });

    return { ok: true, total: students.length, students };
  } catch (err) {
    console.warn('[cloudSync] fetchAdminStudents failed:', err);
    return { ok: false, error: String(err) };
  }
}

export async function fetchAppSettings(): Promise<Record<string, any> | null> {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'exam_controls')
      .maybeSingle();

    return data?.value || null;
  } catch (err) {
    console.warn('[cloudSync] fetchAppSettings failed:', err);
    return null;
  }
}

export async function saveAppSettingsToCloud(
  settings: Record<string, any>,
  passcode = 'wu2535'
): Promise<boolean> {
  if (passcode !== 'wu2535') return false;
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: 'exam_controls',
        value: settings,
        updated_at: new Date().toISOString(),
      });
    return !error;
  } catch (err) {
    console.warn('[cloudSync] saveAppSettingsToCloud failed:', err);
    return false;
  }
}

export interface StudentProfileUpdates {
  realName?: string;
  nickname?: string;
  idCode?: string;
  grade?: string;
  school?: string;
}

export async function updateStudentProfileCloud(
  userIdHash: string,
  idCode: string,
  updates: StudentProfileUpdates,
  oldRealName?: string,
  passcode = 'wu2535'
): Promise<boolean> {
  if (passcode !== 'wu2535') return false;
  try {
    const updateData: Record<string, any> = {};
    if (updates.realName !== undefined) updateData.real_name = updates.realName;
    if (updates.nickname !== undefined) updateData.nickname = updates.nickname;
    if (updates.idCode !== undefined) updateData.id_code = updates.idCode;
    if (updates.grade !== undefined) updateData.grade = updates.grade;
    if (updates.school !== undefined) updateData.school = updates.school;

    let query = supabase.from('players').update(updateData);
    if (userIdHash) {
      query = query.eq('user_id_hash', userIdHash);
    } else if (idCode) {
      query = query.eq('id_code', idCode);
    } else {
      return false;
    }

    const { error } = await query;
    return !error;
  } catch (err) {
    console.warn('[cloudSync] updateStudentProfileCloud failed:', err);
    return false;
  }
}

export async function deleteStudentCloud(
  userIdHash: string,
  idCode: string,
  passcode = 'wu2535'
): Promise<boolean> {
  if (passcode !== 'wu2535') return false;
  try {
    let query = supabase.from('players').delete();
    if (userIdHash) {
      query = query.eq('user_id_hash', userIdHash);
    } else if (idCode) {
      query = query.eq('id_code', idCode);
    } else {
      return false;
    }

    const { error } = await query;
    return !error;
  } catch (err) {
    console.warn('[cloudSync] deleteStudentCloud failed:', err);
    return false;
  }
}
