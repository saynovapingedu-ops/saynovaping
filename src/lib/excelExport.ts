// ============================================================================
//  Excel (.xlsx) Full Multi-Sheet Exporter for Research & School Reports
// ============================================================================

import * as XLSX from 'xlsx';
import { StudentRecord } from '../store/adminStore';
import {
  PART3_KNOWLEDGE_QUESTIONS,
  PART4_REFUSAL_SKILLS,
  PART5_CHATBOT_EVALUATION,
  KnowledgeQuestion,
} from '../data/questionnaireData';

export function exportFullExcelWorkbook(
  students: StudentRecord[],
  analytics: any,
  options?: { school?: string; period?: string }
): void {
  if (!students || students.length === 0) {
    alert('ยังไม่มีข้อมูลนักเรียนที่จะส่งออกเป็นไฟล์ Excel');
    return;
  }

  const wb = XLSX.utils.book_new();

  // 1. Sheet: Players (ข้อมูลผู้เรียนหลัก 20+ คอลัมน์)
  const playersData = students.map((s, idx) => ({
    'ลำดับ (No)': idx + 1,
    'รหัสประจำตัว (ID Code)': s.idCode || '-',
    'ชื่อ-นามสกุลจริง': s.realName || '-',
    'ชื่อเล่นในเกม': s.nickname || '-',
    'ชื่อบัญชี LINE': s.lineName || '-',
    'ระดับชั้น': s.grade || '-',
    'โรงเรียน': s.school || '-',
    'Pre-test ความรู้ (%)': s.preTestScore !== undefined ? s.preTestScore : '',
    'ทักษะก่อนเรียน (/100)': s.preTestSkillScore !== undefined ? s.preTestSkillScore : '',
    'วันเวลาที่ทำ Pre-test': s.preTestAt ? new Date(s.preTestAt).toLocaleString('th-TH') : '',
    'Post-test ความรู้ (%)': s.postTestScore !== undefined ? s.postTestScore : '',
    'ทักษะหลังเรียน (/100)': s.postTestSkillScore !== undefined ? s.postTestSkillScore : '',
    'วันเวลาที่ทำ Post-test': s.postTestAt ? new Date(s.postTestAt).toLocaleString('th-TH') : '',
    'พัฒนาการความรู้ (Gain Delta %)': s.gainDelta !== undefined ? s.gainDelta : '',
    'ด่านที่ผ่าน (จาก 8 ด่านหลัก)': s.heroStagesCount ?? Math.min(8, s.stagesCompletedCount),
    'ด่านที่ผ่านทั้งหมด': s.stagesCompletedCount,
    'คะแนนรวม (XP)': s.totalXP,
    'เลเวล (Level)': s.level,
    'ประเมินแชตบอต (ตอนที่ 5 เฉลี่ย)': s.evalPart5Avg !== undefined ? s.evalPart5Avg : '',
    'เลขที่เกียรติบัตร': s.certificateNo || '',
    'วันที่ออกเกียรติบัตร': s.certificateIssuedAt ? new Date(s.certificateIssuedAt).toLocaleDateString('th-TH') : '',
    'เข้าใช้งานล่าสุด': s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString('th-TH') : '',
  }));

  const wsPlayers = XLSX.utils.json_to_sheet(playersData);
  XLSX.utils.book_append_sheet(wb, wsPlayers, 'Players');

  // 2. Sheet: Item_Score_Binary (SPSS Binary 1/0 สำหรับข้อสอบ)
  const kCount = PART3_KNOWLEDGE_QUESTIONS.length;
  const sCount = PART4_REFUSAL_SKILLS.length;
  const eCount = PART5_CHATBOT_EVALUATION.length;
  const KNOWLEDGE_KEYS = PART3_KNOWLEDGE_QUESTIONS.map((q: KnowledgeQuestion) => q.correctIndex);

  const binaryRows = students.map((s) => {
    const row: Record<string, any> = {
      idCode: s.idCode || '-',
      realName: s.realName || '-',
      nickname: s.nickname || '-',
      grade: s.grade || '-',
      school: s.school || '-',
      'Pre_Score%': s.preTestScore !== undefined ? s.preTestScore : '',
      'Post_Score%': s.postTestScore !== undefined ? s.postTestScore : '',
      'GainDelta%': s.gainDelta !== undefined ? s.gainDelta : '',
    };

    const preK = s.preTestKnowledgeAnswers || [];
    const postK = s.postTestKnowledgeAnswers || [];
    const preS = s.preTestSkillAnswers || [];
    const postS = s.postTestSkillAnswers || [];
    const evalP5 = s.evalPart5Details || [];

    for (let i = 0; i < kCount; i++) {
      row[`Pre_K${i + 1}`] =
        preK.length > i && preK[i] !== undefined && preK[i] >= 0
          ? preK[i] === KNOWLEDGE_KEYS[i]
            ? 1
            : 0
          : '';
    }
    for (let i = 0; i < kCount; i++) {
      row[`Post_K${i + 1}`] =
        postK.length > i && postK[i] !== undefined && postK[i] >= 0
          ? postK[i] === KNOWLEDGE_KEYS[i]
            ? 1
            : 0
          : '';
    }
    for (let i = 0; i < sCount; i++) {
      row[`Pre_S${i + 1}`] = preS[i] !== undefined ? preS[i] : '';
    }
    for (let i = 0; i < sCount; i++) {
      row[`Post_S${i + 1}`] = postS[i] !== undefined ? postS[i] : '';
    }
    for (let i = 0; i < eCount; i++) {
      row[`App_Eval${i + 1}`] = evalP5[i] !== undefined ? evalP5[i] : '';
    }
    row['App_Eval_Avg'] = s.evalPart5Avg !== undefined ? s.evalPart5Avg : '';
    row['Pre_Test_Date'] = s.preTestAt ? new Date(s.preTestAt).toLocaleDateString('th-TH') : '';
    row['Post_Test_Date'] = s.postTestAt ? new Date(s.postTestAt).toLocaleDateString('th-TH') : '';

    return row;
  });

  const wsBinary = XLSX.utils.json_to_sheet(binaryRows);
  XLSX.utils.book_append_sheet(wb, wsBinary, 'Item_Score_Binary');

  // 3. Sheet: Research_Summary (สรุปผลการวิเคราะห์สถิติวิจัย)
  const researchSummary = [
    { 'ตัวชี้วัดสถิติวิจัย': 'จำนวนผู้เรียนทั้งหมดในระบบ (N รวม)', 'ค่าสถิติ': `${students.length} คน` },
    { 'ตัวชี้วัดสถิติวิจัย': 'กลุ่มตัวอย่างคู่สมบูรณ์ (N ทำครบ Pre & Post)', 'ค่าสถิติ': `${analytics?.pairedCount || 0} คน` },
    { 'ตัวชี้วัดสถิติวิจัย': 'คะแนนก่อนเรียนเฉลี่ย (Pre-test Mean ± SD)', 'ค่าสถิติ': `${analytics?.pairedPreStats?.str || '-'}%` },
    { 'ตัวชี้วัดสถิติวิจัย': 'คะแนนหลังเรียนเฉลี่ย (Post-test Mean ± SD)', 'ค่าสถิติ': `${analytics?.pairedPostStats?.str || '-'}%` },
    { 'ตัวชี้วัดสถิติวิจัย': 'พัฒนาการคะแนนเฉลี่ย (Mean Gain Delta)', 'ค่าสถิติ': `${analytics?.pairedDeltaStats?.mean ?? 0}% (SD ${analytics?.pairedDeltaStats?.sd ?? 0})` },
    { 'ตัวชี้วัดสถิติวิจัย': 'ดัชนีประสิทธิผลของเฮค (Hake\'s Gain ⟨g⟩)', 'ค่าสถิติ': `${analytics?.hakeGainAvg !== null ? analytics?.hakeGainAvg : '-'} (${analytics?.hakeGainCategory || '-'})` },
    { 'ตัวชี้วัดสถิติวิจัย': 'ขนาดอิทธิพล (Cohen\'s d Effect Size)', 'ค่าสถิติ': `${analytics?.cohensD !== null ? analytics?.cohensD : '-'} (${analytics?.cohensCategory || '-'})` },
    { 'ตัวชี้วัดสถิติวิจัย': 'ทักษะการปฏิเสธก่อนเรียน (Pre Skill Mean ± SD)', 'ค่าสถิติ': `${analytics?.preSkillStats?.str || '-'}/100` },
    { 'ตัวชี้วัดสถิติวิจัย': 'ทักษะการปฏิเสธหลังเรียน (Post Skill Mean ± SD)', 'ค่าสถิติ': `${analytics?.postSkillStats?.str || '-'}/100` },
    { 'ตัวชี้วัดสถิติวิจัย': 'ความพึงพอใจต่อแชตบอต (ตอนที่ 5)', 'ค่าสถิติ': `⭐ ${analytics?.evalStats?.str || '-'}/5.0` },
    { 'ตัวชี้วัดสถิติวิจัย': 'จำนวนเกียรติบัตรที่ออกแล้ว', 'ค่าสถิติ': `${analytics?.certCount || 0} ใบ` },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(researchSummary);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Research_Summary');

  // 4. Sheet: Certificates (รายชื่อผู้ได้รับเกียรติบัตร)
  const certStudents = students.filter((s) => !!s.certificateNo);
  const certData = certStudents.map((s, idx) => ({
    'ลำดับ': idx + 1,
    'เลขที่เกียรติบัตร': s.certificateNo,
    'รหัสประจำตัว (ID Code)': s.idCode || '-',
    'ชื่อ-นามสกุลจริง': s.realName,
    'ชื่อเล่นในเกม': s.nickname,
    'โรงเรียน': s.school,
    'ระดับชั้น': s.grade,
    'วันที่ออกเกียรติบัตร': s.certificateIssuedAt ? new Date(s.certificateIssuedAt).toLocaleString('th-TH') : '',
    'คะแนนหลังเรียน (%)': s.postTestScore,
    'คะแนนรวม (XP)': s.totalXP,
  }));
  const wsCert = XLSX.utils.json_to_sheet(certData);
  XLSX.utils.book_append_sheet(wb, wsCert, 'Certificates');

  // Export file
  const dateStr = new Date().toISOString().slice(0, 10);
  const schoolTag =
    options?.school && options.school !== 'all'
      ? `_${options.school.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}`
      : '';
  const filename = `Health_Detective_DB${schoolTag}_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}
