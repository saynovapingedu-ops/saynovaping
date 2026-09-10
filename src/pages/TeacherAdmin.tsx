import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore, type StudentRecord } from '../store/adminStore';
import { usePlayerStore } from '../store/playerStore';
import {
  fetchAdminStudents,
  fetchAppSettings,
  saveAppSettingsToCloud,
  updateStudentProfileCloud,
  deleteStudentCloud,
} from '../lib/cloudSync';
import { ALL_PRESET_SCHOOLS, OTHER_SCHOOL_VALUE } from '../lib/schools';
import SchoolSelectorModal from '../components/SchoolSelectorModal';
import { sfx } from '../lib/sound';
import {
  PART3_KNOWLEDGE_QUESTIONS,
  PART4_REFUSAL_SKILLS,
  PART5_CHATBOT_EVALUATION,
} from '../data/questionnaireData';

export default function TeacherAdmin() {
  const nav = useNavigate();
  const admin = useAdminStore();
  const player = usePlayerStore();

  // Authentication State
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState(false);

  // Tab State: 'analytics' | 'item_analysis' | 'controls' | 'sheets'
  const [activeTab, setActiveTab] = useState<'analytics' | 'item_analysis' | 'controls' | 'sheets'>('analytics');

  // Students Data State - ONLY REAL DATA
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    if (player.nickname) {
      return [
        {
          no: 1,
          userIdHash: player.userIdHash || 'local-player',
          idCode: player.idCode || '-',
          realName: player.realName || player.nickname,
          nickname: player.nickname,
          grade: player.grade || 'ม.2',
          school: player.school || 'โรงเรียนสาธิต ม.วลัยลักษณ์',
          preTestScore: player.preTestScore,
          preTestSkillScore: player.preTestSkillScore,
          preTestKnowledgeAnswers: player.preTestKnowledgeAnswers,
          preTestSkillAnswers: player.preTestSkillAnswers,
          preTestAt: player.preTestAt,
          stagesCompletedCount: player.stagesCompleted.length,
          totalStages: 10,
          totalXP: player.totalXP,
          level: player.level,
          postTestScore: player.postTestScore,
          postTestSkillScore: player.postTestSkillScore,
          postTestKnowledgeAnswers: player.postTestKnowledgeAnswers,
          postTestSkillAnswers: player.postTestSkillAnswers,
          postTestAt: player.postTestAt,
          gainDelta:
            player.preTestScore !== undefined && player.postTestScore !== undefined
              ? player.postTestScore - player.preTestScore
              : undefined,
          evalPart5Avg: player.evalPart5Avg,
          evalPart5Details: player.evalPart5Details,
          certificateNo: player.certificateNo,
          certificateIssuedAt: player.certificateIssuedAt,
          lastActiveAt: player.lastActiveAt,
        },
      ];
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyBinarySuccess, setCopyBinarySuccess] = useState(false);
  const [itemAnalysisSubTab, setItemAnalysisSubTab] = useState<'knowledge' | 'skills' | 'app_eval'>('knowledge');
  const [studentModalTab, setStudentModalTab] = useState<'summary' | 'knowledge' | 'skills' | 'app_eval'>('summary');

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Status Filter for Research & Completion: 'all' | 'both' | 'pre_only' | 'post_only' | 'hero_done' | 'certified'
  const [statusFilter, setStatusFilter] = useState<'all' | 'both' | 'pre_only' | 'post_only' | 'hero_done' | 'certified'>('all');

  // Edit Student Modal States
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [editRealName, setEditRealName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editIdCode, setEditIdCode] = useState('');
  const [editGrade, setEditGrade] = useState('ม.1');
  const [editSchool, setEditSchool] = useState('');
  const [editCustomSchool, setEditCustomSchool] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessToast, setEditSuccessToast] = useState<string | null>(null);
  const [copyResearchSuccess, setCopyResearchSuccess] = useState(false);

  // Auto fetch real students and cloud settings on mount or authentication
  useEffect(() => {
    if (admin.isTeacherAuthenticated || sessionStorage.getItem('hd_teacher_auth') === '1') {
      handleRefreshData();
      fetchAppSettings().then((settings) => {
        if (settings) {
          admin.updateSettings(settings);
        }
      });
    }
  }, [admin.isTeacherAuthenticated]);

  // Handle Passcode Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (admin.loginTeacher(passcode)) {
      sfx.correct();
      setPassError(false);
      handleRefreshData();
      fetchAppSettings().then((settings) => {
        if (settings) {
          admin.updateSettings(settings);
        }
      });
    } else {
      sfx.wrong();
      setPassError(true);
    }
  };

  // Fetch / Refresh REAL cloud data from Google Sheets
  const handleRefreshData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const res = await fetchAdminStudents();
      if (res.ok && res.students && res.students.length > 0) {
        setStudents(res.students);
      } else {
        // If cloud returns empty, check if local player exists
        if (player.nickname) {
          setStudents([
            {
              no: 1,
              userIdHash: player.userIdHash || 'local-player',
              idCode: player.idCode || '-',
              realName: player.realName || player.nickname,
              nickname: player.nickname,
              grade: player.grade || 'ม.2',
              school: player.school || 'โรงเรียนสาธิต ม.วลัยลักษณ์',
              preTestScore: player.preTestScore,
              preTestSkillScore: player.preTestSkillScore,
              preTestKnowledgeAnswers: player.preTestKnowledgeAnswers,
              preTestSkillAnswers: player.preTestSkillAnswers,
              preTestAt: player.preTestAt,
              stagesCompletedCount: player.stagesCompleted.length,
              heroStagesCount: player.stagesCompleted.filter(id => id <= 8).length,
              totalStages: 20,
              totalXP: player.totalXP,
              level: player.level,
              postTestScore: player.postTestScore,
              postTestSkillScore: player.postTestSkillScore,
              postTestKnowledgeAnswers: player.postTestKnowledgeAnswers,
              postTestSkillAnswers: player.postTestSkillAnswers,
              postTestAt: player.postTestAt,
              gainDelta:
                player.preTestScore !== undefined && player.postTestScore !== undefined
                  ? player.postTestScore - player.preTestScore
                  : undefined,
              evalPart5Avg: player.evalPart5Avg,
              evalPart5Details: player.evalPart5Details,
              certificateNo: player.certificateNo,
              certificateIssuedAt: player.certificateIssuedAt,
              lastActiveAt: player.lastActiveAt,
            },
          ]);
        } else {
          setStudents([]);
        }
      }
    } catch (err) {
      console.warn('[TeacherAdmin] Refresh error:', err);
      setFetchError('ไม่สามารถเชื่อมต่อฐานข้อมูล Google Sheets ได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  };

  // ดึงรายชื่อโรงเรียนจริงทั้งหมดที่มีในระบบเพื่อใช้ในตัวกรอง
  const availableSchools = useMemo(() => {
    const list = students.map((s) => s.school).filter(Boolean).map((s) => s.trim());
    return Array.from(new Set(list)).sort();
  }, [students]);

  // กรองข้อมูลนักเรียนตาม คำค้นหา, ระดับชั้น, โรงเรียน, และช่วงเวลา
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !searchQuery ||
        s.realName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.idCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.school?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchGrade = selectedGrade === 'all' || s.grade === selectedGrade;
      const matchSchool = selectedSchool === 'all' || s.school?.trim() === selectedSchool;

      let matchPeriod = true;
      if (selectedPeriod !== 'all') {
        const rawDate = s.postTestAt || s.preTestAt || s.createdAt || s.lastActiveAt;
        if (!rawDate) {
          matchPeriod = false;
        } else {
          const d = new Date(rawDate);
          if (isNaN(d.getTime())) {
            matchPeriod = false;
          } else if (selectedPeriod === 'today') {
            const today = new Date();
            matchPeriod =
              d.getFullYear() === today.getFullYear() &&
              d.getMonth() === today.getMonth() &&
              d.getDate() === today.getDate();
          } else if (selectedPeriod === '7days') {
            matchPeriod = Date.now() - d.getTime() <= 7 * 24 * 60 * 60 * 1000;
          } else if (selectedPeriod === '30days') {
            matchPeriod = Date.now() - d.getTime() <= 30 * 24 * 60 * 60 * 1000;
          } else if (selectedPeriod === 'custom') {
            if (customStartDate) {
              const start = new Date(customStartDate + 'T00:00:00');
              if (d < start) matchPeriod = false;
            }
            if (customEndDate) {
              const end = new Date(customEndDate + 'T23:59:59');
              if (d > end) matchPeriod = false;
            }
          }
        }
      }

      let matchStatus = true;
      if (statusFilter === 'both') {
        matchStatus = s.preTestScore !== undefined && s.postTestScore !== undefined;
      } else if (statusFilter === 'pre_only') {
        matchStatus = s.preTestScore !== undefined && s.postTestScore === undefined;
      } else if (statusFilter === 'post_only') {
        matchStatus = s.postTestScore !== undefined && s.preTestScore === undefined;
      } else if (statusFilter === 'hero_done') {
        matchStatus = (s.heroStagesCount !== undefined ? s.heroStagesCount >= 8 : s.stagesCompletedCount >= 8);
      } else if (statusFilter === 'certified') {
        matchStatus = !!s.certificateNo;
      }

      return matchSearch && matchGrade && matchSchool && matchPeriod && matchStatus;
    });
  }, [students, searchQuery, selectedGrade, selectedSchool, selectedPeriod, customStartDate, customEndDate, statusFilter]);

  // Analytics & Educational Research Statistics calculated strictly from REAL filtered data
  const analytics = useMemo(() => {
    const total = filteredStudents.length;
    const preScores = filteredStudents
      .filter((s) => s.preTestScore !== undefined && s.preTestScore !== null && !isNaN(s.preTestScore))
      .map((s) => s.preTestScore!);
    const postScores = filteredStudents
      .filter((s) => s.postTestScore !== undefined && s.postTestScore !== null && !isNaN(s.postTestScore))
      .map((s) => s.postTestScore!);
    const certCount = filteredStudents.filter((s) => !!s.certificateNo).length;

    // Helper function for Mean & Standard Deviation (SD)
    const calcStats = (vals: number[]) => {
      if (vals.length === 0) return { mean: 0, sd: 0, str: '-' };
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      if (vals.length === 1) return { mean: Number(mean.toFixed(2)), sd: 0, str: `${mean.toFixed(1)} ± 0.00` };
      const variance = vals.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (vals.length - 1);
      const sd = Math.sqrt(variance);
      return {
        mean: Number(mean.toFixed(2)),
        sd: Number(sd.toFixed(2)),
        str: `${mean.toFixed(2)} ± ${sd.toFixed(2)}`,
      };
    };

    // Overall Averages
    const avgPre =
      preScores.length > 0
        ? Math.round(preScores.reduce((a, b) => a + b, 0) / preScores.length)
        : null;
    const avgPost =
      postScores.length > 0
        ? Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length)
        : null;

    // Paired Students (Students who took BOTH Pre and Post test) - Core research sample
    const paired = filteredStudents.filter(
      (s) =>
        s.preTestScore !== undefined &&
        s.preTestScore !== null &&
        !isNaN(s.preTestScore) &&
        s.postTestScore !== undefined &&
        s.postTestScore !== null &&
        !isNaN(s.postTestScore)
    );

    const pairedCount = paired.length;
    const pairedPreScores = paired.map((s) => s.preTestScore!);
    const pairedPostScores = paired.map((s) => s.postTestScore!);
    const pairedPreStats = calcStats(pairedPreScores);
    const pairedPostStats = calcStats(pairedPostScores);

    // Paired Gain Deltas (Post - Pre)
    const pairedDeltas = paired.map((s) => s.postTestScore! - s.preTestScore!);
    const pairedDeltaStats = calcStats(pairedDeltas);

    // 1. Hake's Normalized Gain <g> = (Post% - Pre%) / (100 - Pre%)
    let hakeGainAvg: number | null = null;
    let hakeGainCategory = '-';
    if (paired.length > 0) {
      const individualGains = paired
        .map((s) => {
          const pre = s.preTestScore!;
          const post = s.postTestScore!;
          if (pre >= 100) return 1.0;
          return (post - pre) / (100 - pre);
        })
        .filter((g) => !isNaN(g));

      if (individualGains.length > 0) {
        hakeGainAvg = Number((individualGains.reduce((a, b) => a + b, 0) / individualGains.length).toFixed(2));
        if (hakeGainAvg >= 0.70) {
          hakeGainCategory = 'ระดับสูง (High Gain: g ≥ 0.70)';
        } else if (hakeGainAvg >= 0.30) {
          hakeGainCategory = 'ระดับปานกลาง (Medium Gain: 0.30 ≤ g < 0.70)';
        } else {
          hakeGainCategory = 'ระดับต่ำ (Low Gain: g < 0.30)';
        }
      }
    }

    // 2. Cohen's d Effect Size (for paired comparisons)
    let cohensD: number | null = null;
    let cohensCategory = '-';
    if (pairedCount > 1) {
      const meanDiff = pairedDeltaStats.mean;
      const sdDiff = pairedDeltaStats.sd;
      if (sdDiff > 0) {
        cohensD = Number((meanDiff / sdDiff).toFixed(2));
        if (Math.abs(cohensD) >= 0.8) {
          cohensCategory = 'ระดับสูงมาก (Large Effect: d ≥ 0.8)';
        } else if (Math.abs(cohensD) >= 0.5) {
          cohensCategory = 'ระดับปานกลาง (Medium Effect: 0.5 ≤ d < 0.8)';
        } else {
          cohensCategory = 'ระดับเล็กน้อย (Small Effect: d < 0.5)';
        }
      }
    }

    // 3. Refusal Skills Stats (Part 4)
    const pairedSkills = filteredStudents.filter(
      (s) =>
        s.preTestSkillScore !== undefined &&
        !isNaN(s.preTestSkillScore) &&
        s.postTestSkillScore !== undefined &&
        !isNaN(s.postTestSkillScore)
    );
    const preSkillStats = calcStats(pairedSkills.map((s) => s.preTestSkillScore!));
    const postSkillStats = calcStats(pairedSkills.map((s) => s.postTestSkillScore!));
    const skillDeltaStats = calcStats(pairedSkills.map((s) => s.postTestSkillScore! - s.preTestSkillScore!));

    // 4. Chatbot Evaluation (Part 5 - 7 Items Likert 1-5)
    const evalScores = filteredStudents
      .filter((s) => s.evalPart5Avg !== undefined && !isNaN(s.evalPart5Avg))
      .map((s) => s.evalPart5Avg!);
    const evalStats = calcStats(evalScores);

    return {
      total,
      avgPre,
      avgPost,
      avgDelta: pairedDeltaStats.mean,
      certCount,
      preDoneCount: preScores.length,
      postDoneCount: postScores.length,
      pairedCount,
      pairedPreStats,
      pairedPostStats,
      pairedDeltaStats,
      hakeGainAvg,
      hakeGainCategory,
      cohensD,
      cohensCategory,
      pairedSkillsCount: pairedSkills.length,
      preSkillStats,
      postSkillStats,
      skillDeltaStats,
      evalStats,
      evalCount: evalScores.length,
    };
  }, [filteredStudents]);

  // Open Edit Student Modal
  const handleOpenEdit = (student: StudentRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sfx.click();
    setEditingStudent(student);
    setEditRealName(student.realName || '');
    setEditNickname(student.nickname || '');
    setEditIdCode(student.idCode || '');
    setEditGrade(student.grade || 'ม.1');

    const curSchool = student.school ? student.school.trim() : '';
    if (ALL_PRESET_SCHOOLS.includes(curSchool)) {
      setEditSchool(curSchool);
      setEditCustomSchool('');
    } else if (curSchool) {
      setEditSchool(OTHER_SCHOOL_VALUE);
      setEditCustomSchool(curSchool);
    } else {
      setEditSchool('');
      setEditCustomSchool('');
    }
  };

  // Save Student Updates to local state and Google Sheets cloud
  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    sfx.click();
    setIsSavingEdit(true);

    const finalSchool =
      editSchool === OTHER_SCHOOL_VALUE ? editCustomSchool.trim() : (editSchool || editCustomSchool.trim());

    const updates = {
      realName: editRealName.trim() || editingStudent.realName,
      nickname: editNickname.trim() || editingStudent.nickname,
      idCode: editIdCode.trim() || editingStudent.idCode,
      grade: editGrade.trim() || editingStudent.grade,
      school: finalSchool || editingStudent.school,
    };

    // 1. Update local state immediately
    setStudents((prev) =>
      prev.map((s) => {
        if (
          (s.userIdHash && s.userIdHash === editingStudent.userIdHash) ||
          (s.idCode && s.idCode === editingStudent.idCode)
        ) {
          return {
            ...s,
            ...updates,
          };
        }
        return s;
      })
    );

    if (
      selectedStudent &&
      ((selectedStudent.userIdHash && selectedStudent.userIdHash === editingStudent.userIdHash) ||
        (selectedStudent.idCode && selectedStudent.idCode === editingStudent.idCode))
    ) {
      setSelectedStudent((prev) => (prev ? { ...prev, ...updates } : null));
    }

    // 2. Dispatch to cloud
    try {
      await updateStudentProfileCloud(
        editingStudent.userIdHash,
        editingStudent.idCode,
        updates,
        editingStudent.realName,
        'wu2535'
      );
      setEditSuccessToast('✅ บันทึกข้อมูลนักเรียนสำเร็จแล้ว!');
      setTimeout(() => setEditSuccessToast(null), 3000);
    } catch (err) {
      console.warn('[TeacherAdmin] cloud save error:', err);
    } finally {
      setIsSavingEdit(false);
      setEditingStudent(null);
    }
  };

  // Delete Mock / Test Data
  const handleDeleteStudent = async (student: StudentRecord, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    sfx.click();
    const confirmDelete = window.confirm(
      `⚠️ ยืนยันการลบข้อมูลของ "${student.realName}" (ID: ${student.idCode || '-'}) ออกจากระบบงานวิจัยหรือไม่?\n\n(ระบบจะลบข้อมูลออกจาก Google Sheets เพื่อให้ข้อมูลสถิติงวดนี้สะอาดถูกต้อง)`
    );
    if (!confirmDelete) return;

    // Optimistically remove from state
    setStudents((prev) =>
      prev.filter(
        (s) =>
          !(
            (s.userIdHash && s.userIdHash === student.userIdHash) ||
            (s.idCode && s.idCode === student.idCode && s.realName === student.realName)
          )
      )
    );

    if (
      selectedStudent &&
      ((selectedStudent.userIdHash && selectedStudent.userIdHash === student.userIdHash) ||
        (selectedStudent.idCode && selectedStudent.idCode === student.idCode))
    ) {
      setSelectedStudent(null);
    }

    // Dispatch delete to cloud
    try {
      await deleteStudentCloud(student.userIdHash, student.idCode, 'wu2535');
      setEditSuccessToast('🗑️ ลบข้อมูลทดสอบเรียบร้อยแล้ว');
      setTimeout(() => setEditSuccessToast(null), 3000);
    } catch (err) {
      console.warn('[TeacherAdmin] delete error:', err);
    }
  };

  // Copy Complete Academic Research Summary to Clipboard
  const handleCopyResearchSummary = () => {
    sfx.click();
    const text = [
      `📊 ผลการวิเคราะห์สถิติวิจัย: โครงการแชตบอตเกมมิฟิเคชัน ม.วลัยลักษณ์`,
      `กลุ่มตัวอย่าง: ${selectedSchool !== 'all' ? selectedSchool : 'ทุกโรงเรียน'} | ระดับชั้น: ${selectedGrade !== 'all' ? selectedGrade : 'ทุกระดับชั้น'}`,
      `จำนวนผู้เรียนทั้งหมดในระบบ: ${analytics.total} คน`,
      `----------------------------------------------------------------`,
      `1. ผลการทดสอบความรู้บุหรี่ไฟฟ้า (Part 3: ${PART3_KNOWLEDGE_QUESTIONS.length} ข้อ)`,
      `- กลุ่มตัวอย่างคู่สมบูรณ์ (N_paired): ${analytics.pairedCount} คน`,
      `- คะแนนก่อนเรียน (Pre-test Mean ± SD): ${analytics.pairedPreStats.str}%`,
      `- คะแนนหลังเรียน (Post-test Mean ± SD): ${analytics.pairedPostStats.str}%`,
      `- ค่าเฉลี่ยพัฒนาการ (Mean Gain Delta): ${analytics.pairedDeltaStats.mean >= 0 ? '+' : ''}${analytics.pairedDeltaStats.mean}% (SD = ${analytics.pairedDeltaStats.sd})`,
      `- ดัชนีประสิทธิผลของเฮค (Hake's <g>): ${analytics.hakeGainAvg !== null ? analytics.hakeGainAvg : '-'} (${analytics.hakeGainCategory})`,
      `- ขนาดอิทธิพล (Cohen's d): ${analytics.cohensD !== null ? analytics.cohensD : '-'} (${analytics.cohensCategory})`,
      `----------------------------------------------------------------`,
      `2. ทักษะการปฏิเสธบุหรี่ไฟฟ้า (Part 4: ${PART4_REFUSAL_SKILLS.length} ข้อ, เต็ม 100%)`,
      `- กลุ่มตัวอย่างที่ทำครบ (N): ${analytics.pairedSkillsCount} คน`,
      `- ทักษะก่อนเรียน (Mean ± SD): ${analytics.preSkillStats.str}`,
      `- ทักษะหลังเรียน (Mean ± SD): ${analytics.postSkillStats.str}`,
      `- พัฒนาการทักษะ (Mean Gain): ${analytics.skillDeltaStats.mean >= 0 ? '+' : ''}${analytics.skillDeltaStats.mean} คะแนน`,
      `----------------------------------------------------------------`,
      `3. การประเมินความพึงพอใจต่อแชตบอต (Part 5: ${PART5_CHATBOT_EVALUATION.length} ข้อ, เต็ม 5.00)`,
      `- จำนวนผู้ประเมิน (N): ${analytics.evalCount} คน`,
      `- คะแนนความพึงพอใจเฉลี่ย (Mean ± SD): ${analytics.evalStats.str} / 5.00`,
      `- เกียรติบัตรที่ออกแล้ว: ${analytics.certCount} คน`,
    ].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopyResearchSuccess(true);
      setTimeout(() => setCopyResearchSuccess(false), 3000);
    });
  };

  // คำนวณการกระจายตัวของคำตอบ ถูก/ผิด และอัตราความถูกต้อง สำหรับกลุ่มนักเรียนที่กรอง
  const itemAnalysisData = useMemo(() => {
    return PART3_KNOWLEDGE_QUESTIONS.map((q, qIdx) => {
      const choiceCount = q.choices.length || 2;
      const preAnswers = filteredStudents
        .map((s) => (s.preTestKnowledgeAnswers && s.preTestKnowledgeAnswers[qIdx] !== undefined ? s.preTestKnowledgeAnswers[qIdx] : -1))
        .filter((ans) => ans >= 0 && ans < choiceCount);

      const postAnswers = filteredStudents
        .map((s) => (s.postTestKnowledgeAnswers && s.postTestKnowledgeAnswers[qIdx] !== undefined ? s.postTestKnowledgeAnswers[qIdx] : -1))
        .filter((ans) => ans >= 0 && ans < choiceCount);

      const preDist = new Array(choiceCount).fill(0);
      preAnswers.forEach((ans) => { if (ans >= 0 && ans < choiceCount) preDist[ans]++; });

      const postDist = new Array(choiceCount).fill(0);
      postAnswers.forEach((ans) => { if (ans >= 0 && ans < choiceCount) postDist[ans]++; });

      const preTotal = preAnswers.length;
      const postTotal = postAnswers.length;

      const preCorrectCount = preDist[q.correctIndex] || 0;
      const postCorrectCount = postDist[q.correctIndex] || 0;

      const prePct = preTotal > 0 ? Math.round((preCorrectCount / preTotal) * 100) : null;
      const postPct = postTotal > 0 ? Math.round((postCorrectCount / postTotal) * 100) : null;
      const deltaPct = prePct !== null && postPct !== null ? postPct - prePct : null;

      const preDistPct = preDist.map((cnt) => (preTotal > 0 ? Math.round((cnt / preTotal) * 100) : 0));
      const postDistPct = postDist.map((cnt) => (postTotal > 0 ? Math.round((cnt / postTotal) * 100) : 0));

      return {
        question: q,
        qIdx,
        no: q.no,
        correctIndex: q.correctIndex,
        correctChoiceLabel: q.choices[q.correctIndex] || (q.correctIndex === 0 ? 'ถูก' : 'ผิด'),
        preTotal,
        postTotal,
        preCorrectCount,
        postCorrectCount,
        prePct,
        postPct,
        deltaPct,
        preDist,
        postDist,
        preDistPct,
        postDistPct,
      };
    });
  }, [filteredStudents]);

  // คำนวณค่าเฉลี่ยทักษะการปฏิเสธ 20 ข้อ (1-5)
  const refusalSkillsAnalysis = useMemo(() => {
    return PART4_REFUSAL_SKILLS.map((item, idx) => {
      const preVals = filteredStudents
        .map((s) => (s.preTestSkillAnswers && s.preTestSkillAnswers[idx] ? s.preTestSkillAnswers[idx] : null))
        .filter((v): v is number => v !== null && !isNaN(v));

      const postVals = filteredStudents
        .map((s) => (s.postTestSkillAnswers && s.postTestSkillAnswers[idx] ? s.postTestSkillAnswers[idx] : null))
        .filter((v): v is number => v !== null && !isNaN(v));

      const preAvg = preVals.length > 0 ? Number((preVals.reduce((a, b) => a + b, 0) / preVals.length).toFixed(2)) : null;
      const postAvg = postVals.length > 0 ? Number((postVals.reduce((a, b) => a + b, 0) / postVals.length).toFixed(2)) : null;
      const delta = preAvg !== null && postAvg !== null ? Number((postAvg - preAvg).toFixed(2)) : null;

      return {
        item,
        no: item.no,
        preAvg,
        postAvg,
        delta,
        preCount: preVals.length,
        postCount: postVals.length,
      };
    });
  }, [filteredStudents]);

  // คำนวณค่าเฉลี่ยประเมินแอป 7 ข้อ (1-5)
  const appEvalAnalysis = useMemo(() => {
    return PART5_CHATBOT_EVALUATION.map((item, idx) => {
      const vals = filteredStudents
        .map((s) => (s.evalPart5Details && s.evalPart5Details[idx] ? s.evalPart5Details[idx] : null))
        .filter((v): v is number => v !== null && !isNaN(v));

      const avg = vals.length > 0 ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;

      return {
        item,
        no: item.no,
        avg,
        count: vals.length,
      };
    });
  }, [filteredStudents]);

  // 1-Tap TSV Clipboard Copy
  const handleCopyTableToClipboard = () => {
    sfx.click();
    if (students.length === 0) {
      alert('ยังไม่มีข้อมูลนักเรียนในระบบ');
      return;
    }

    const headers = [
      'ลำดับ',
      'รหัสประจำตัว (ID Code)',
      'ชื่อ-นามสกุลจริง',
      'ชื่อเล่น',
      'โปรไฟล์ LINE',
      'ชั้น',
      'โรงเรียน',
      'Pre-test ความรู้ (%)',
      'ทักษะก่อนเรียน (เต็ม 100)',
      'วันเวลา Pre-test',
      'ด่านที่ผ่าน',
      'คะแนนรวม (XP)',
      'Post-test ความรู้ (%)',
      'ทักษะหลังเรียน (เต็ม 100)',
      'วันเวลา Post-test',
      'พัฒนาการ (Gain Delta %)',
      'ประเมินแชตบอต (ตอนที่ 5)',
      'เลขที่เกียรติบัตร',
      'วันเวลาเข้าใช้งานล่าสุด',
    ];

    const rows = filteredStudents.map((s, idx) => [
      idx + 1,
      s.idCode || '-',
      s.realName || '-',
      s.nickname || '-',
      s.lineName || '-',
      s.grade || '-',
      s.school || '-',
      s.preTestScore !== undefined ? `${s.preTestScore}%` : '-',
      s.preTestSkillScore !== undefined ? s.preTestSkillScore : '-',
      s.preTestAt ? new Date(s.preTestAt).toLocaleDateString('th-TH') : '-',
      `${s.stagesCompletedCount}/${s.totalStages}`,
      s.totalXP,
      s.postTestScore !== undefined ? `${s.postTestScore}%` : '-',
      s.postTestSkillScore !== undefined ? s.postTestSkillScore : '-',
      s.postTestAt ? new Date(s.postTestAt).toLocaleDateString('th-TH') : '-',
      s.gainDelta !== undefined ? `${s.gainDelta > 0 ? '+' : ''}${s.gainDelta}%` : '-',
      s.evalPart5Avg !== undefined ? s.evalPart5Avg : '-',
      s.certificateNo || '-',
      s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString('th-TH') : '-',
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  // 1-Tap SPSS Binary (1/0) TSV Clipboard Copy
  const handleCopyBinaryToClipboard = () => {
    sfx.click();
    if (filteredStudents.length === 0) {
      alert('ยังไม่มีข้อมูลนักเรียนที่ตรงกับตัวกรอง');
      return;
    }

    const kCount = PART3_KNOWLEDGE_QUESTIONS.length;
    const sCount = PART4_REFUSAL_SKILLS.length;
    const eCount = PART5_CHATBOT_EVALUATION.length;

    const headers = [
      'idCode', 'realName', 'nickname', 'grade', 'school',
      'Pre_Score%', 'Post_Score%', 'GainDelta%',
    ];
    for (let i = 1; i <= kCount; i++) headers.push(`Pre_K${i}`);
    for (let i = 1; i <= kCount; i++) headers.push(`Post_K${i}`);
    for (let i = 1; i <= sCount; i++) headers.push(`Pre_S${i}`);
    for (let i = 1; i <= sCount; i++) headers.push(`Post_S${i}`);
    for (let i = 1; i <= eCount; i++) headers.push(`App_Eval${i}`);
    headers.push('App_Eval_Avg', 'Pre_Test_Date', 'Post_Test_Date');

    const KNOWLEDGE_KEYS = PART3_KNOWLEDGE_QUESTIONS.map((q) => q.correctIndex);

    const rows = filteredStudents.map((s) => {
      const preK = s.preTestKnowledgeAnswers || [];
      const postK = s.postTestKnowledgeAnswers || [];
      const preS = s.preTestSkillAnswers || [];
      const postS = s.postTestSkillAnswers || [];
      const evalP5 = s.evalPart5Details || [];

      const r: (string | number)[] = [
        s.idCode || '-',
        s.realName || '-',
        s.nickname || '-',
        s.grade || '-',
        s.school || '-',
        s.preTestScore !== undefined ? s.preTestScore : '',
        s.postTestScore !== undefined ? s.postTestScore : '',
        s.gainDelta !== undefined ? s.gainDelta : '',
      ];

      for (let i = 0; i < kCount; i++) {
        r.push(preK.length > i && preK[i] !== undefined && preK[i] >= 0 ? (preK[i] === KNOWLEDGE_KEYS[i] ? 1 : 0) : '');
      }
      for (let i = 0; i < kCount; i++) {
        r.push(postK.length > i && postK[i] !== undefined && postK[i] >= 0 ? (postK[i] === KNOWLEDGE_KEYS[i] ? 1 : 0) : '');
      }
      for (let i = 0; i < sCount; i++) {
        r.push(preS[i] !== undefined ? preS[i] : '');
      }
      for (let i = 0; i < sCount; i++) {
        r.push(postS[i] !== undefined ? postS[i] : '');
      }
      for (let i = 0; i < eCount; i++) {
        r.push(evalP5[i] !== undefined ? evalP5[i] : '');
      }
      r.push(s.evalPart5Avg !== undefined ? s.evalPart5Avg : '');
      r.push(s.preTestAt ? new Date(s.preTestAt).toLocaleDateString('th-TH') : '');
      r.push(s.postTestAt ? new Date(s.postTestAt).toLocaleDateString('th-TH') : '');
      return r;
    });

    const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopyBinarySuccess(true);
      setTimeout(() => setCopyBinarySuccess(false), 3000);
    });
  };

  // ดาวน์โหลดไฟล์ CSV รูปแบบ 1/0 สำหรับ SPSS / Excel
  const handleDownloadBinaryCsv = () => {
    sfx.click();
    if (filteredStudents.length === 0) {
      alert('ยังไม่มีข้อมูลนักเรียนที่ตรงกับตัวกรอง');
      return;
    }

    const kCount = PART3_KNOWLEDGE_QUESTIONS.length;
    const sCount = PART4_REFUSAL_SKILLS.length;
    const eCount = PART5_CHATBOT_EVALUATION.length;

    const headers = [
      'idCode', 'realName', 'nickname', 'grade', 'school',
      'Pre_Score%', 'Post_Score%', 'GainDelta%',
    ];
    for (let i = 1; i <= kCount; i++) headers.push(`Pre_K${i}`);
    for (let i = 1; i <= kCount; i++) headers.push(`Post_K${i}`);
    for (let i = 1; i <= sCount; i++) headers.push(`Pre_S${i}`);
    for (let i = 1; i <= sCount; i++) headers.push(`Post_S${i}`);
    for (let i = 1; i <= eCount; i++) headers.push(`App_Eval${i}`);
    headers.push('App_Eval_Avg', 'Pre_Test_Date', 'Post_Test_Date');

    const KNOWLEDGE_KEYS = PART3_KNOWLEDGE_QUESTIONS.map((q) => q.correctIndex);

    const rows = filteredStudents.map((s) => {
      const preK = s.preTestKnowledgeAnswers || [];
      const postK = s.postTestKnowledgeAnswers || [];
      const preS = s.preTestSkillAnswers || [];
      const postS = s.postTestSkillAnswers || [];
      const evalP5 = s.evalPart5Details || [];

      const r: (string | number)[] = [
        s.idCode || '-',
        s.realName || '-',
        s.nickname || '-',
        s.grade || '-',
        s.school || '-',
        s.preTestScore !== undefined ? s.preTestScore : '',
        s.postTestScore !== undefined ? s.postTestScore : '',
        s.gainDelta !== undefined ? s.gainDelta : '',
      ];

      for (let i = 0; i < kCount; i++) {
        r.push(preK.length > i && preK[i] !== undefined && preK[i] >= 0 ? (preK[i] === KNOWLEDGE_KEYS[i] ? 1 : 0) : '');
      }
      for (let i = 0; i < kCount; i++) {
        r.push(postK.length > i && postK[i] !== undefined && postK[i] >= 0 ? (postK[i] === KNOWLEDGE_KEYS[i] ? 1 : 0) : '');
      }
      for (let i = 0; i < sCount; i++) {
        r.push(preS[i] !== undefined ? preS[i] : '');
      }
      for (let i = 0; i < sCount; i++) {
        r.push(postS[i] !== undefined ? postS[i] : '');
      }
      for (let i = 0; i < eCount; i++) {
        r.push(evalP5[i] !== undefined ? evalP5[i] : '');
      }
      r.push(s.evalPart5Avg !== undefined ? s.evalPart5Avg : '');
      r.push(s.preTestAt ? new Date(s.preTestAt).toLocaleDateString('th-TH') : '');
      r.push(s.postTestAt ? new Date(s.postTestAt).toLocaleDateString('th-TH') : '');

      return r.map((val) => {
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',');
    });

    const csvContent = '\uFEFF' + [headers.map((h) => `"${h}"`).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const schoolLabel = selectedSchool !== 'all' ? selectedSchool.replace(/[^a-zA-Z0-9ก-๙]/g, '_') : 'all';
    link.setAttribute('download', `health_detective_spss_binary_${schoolLabel}_${selectedPeriod}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle single admin setting with instant cloud sync
  const handleToggleSetting = (key: string, value: any) => {
    sfx.click();
    const next = {
      preTestEnabled: key === 'preTestEnabled' ? value : admin.preTestEnabled,
      postTestEnabled: key === 'postTestEnabled' ? value : admin.postTestEnabled,
      requirePreTestBeforePlaying: key === 'requirePreTestBeforePlaying' ? value : admin.requirePreTestBeforePlaying,
      allowBypassStages: key === 'allowBypassStages' ? value : admin.allowBypassStages,
      part2Enabled: key === 'part2Enabled' ? value : admin.part2Enabled,
      part3Enabled: key === 'part3Enabled' ? value : admin.part3Enabled,
      knowledgeQuestionCount: key === 'knowledgeQuestionCount' ? value : admin.knowledgeQuestionCount,
      part4Enabled: key === 'part4Enabled' ? value : admin.part4Enabled,
      part5Enabled: key === 'part5Enabled' ? value : admin.part5Enabled,
      finalExamEnabled: key === 'finalExamEnabled' ? value : admin.finalExamEnabled,
      dailyChallengeEnabled: key === 'dailyChallengeEnabled' ? value : admin.dailyChallengeEnabled,
      showExplanations: key === 'showExplanations' ? value : admin.showExplanations,
      randomizeQuestions: key === 'randomizeQuestions' ? value : admin.randomizeQuestions,
      googleSheetUrl: key === 'googleSheetUrl' ? value : admin.googleSheetUrl,
    };
    admin.updateSettings(next);
    saveAppSettingsToCloud(next, 'wu2535').then((ok) => {
      if (ok) {
        setSaveSuccessMsg(true);
        setTimeout(() => setSaveSuccessMsg(false), 2500);
      }
    });
  };

  // =========================================================================
  // VIEW: Passcode Lock Screen (If not authenticated)
  // =========================================================================
  if (!admin.isTeacherAuthenticated && sessionStorage.getItem('hd_teacher_auth') !== '1') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-sm card p-6 text-center space-y-4 shadow-clay border-2 border-detective-100 bg-white">
          <div className="w-16 h-16 bg-detective-50 text-detective-600 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-inner">
            🔒
          </div>
          <div>
            <h1 className="text-xl font-display font-extrabold text-detective-900">
              ระบบสำหรับอาจารย์
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Teacher Admin Dashboard & Analytics
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 pt-2">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setPassError(false);
                }}
                placeholder="กรุณาใส่รหัสผ่านเพื่อเข้าใช้งาน"
                className={`w-full px-4 py-3 rounded-2xl border text-center font-bold tracking-widest text-sm focus:outline-none transition-all ${
                  passError
                    ? 'border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-300'
                    : 'border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-detective-400'
                }`}
                autoFocus
              />
              {passError && (
                <p className="text-xs font-semibold text-rose-500 mt-1.5">
                  ❌ รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้นคือ wu2535)
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-sm font-bold shadow-clay">
              🔓 เข้าสู่ระบบอาจารย์
            </button>
          </form>

          <button
            onClick={() => nav('/settings')}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 pt-2"
          >
            ← กลับหน้าตั้งค่า
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: Main Teacher Admin Dashboard
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-detective-500 to-indigo-600 text-white flex items-center justify-center text-xl shadow-sm">
              👨‍🏫
            </span>
            <div>
              <h1 className="font-display font-extrabold text-slate-900 text-base leading-none">
                แดชบอร์ดอาจารย์ (Teacher Admin)
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                โครงการวิจัยแชตบอตเกมมิฟิเคชัน ม.วลัยลักษณ์ (ข้อมูลจริงจากระบบ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sfx.click();
                nav('/');
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              🏠 หน้าเกม
            </button>
            <button
              onClick={() => {
                sfx.click();
                admin.logoutTeacher();
              }}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="max-w-6xl mx-auto px-4 flex gap-2 border-t border-slate-100 pt-2 pb-1.5 overflow-x-auto">
          {[
            { id: 'analytics', label: '📊 พัฒนาการผู้เรียน (ข้อมูลจริง)', count: analytics.total },
            { id: 'item_analysis', label: `🎯 วิเคราะห์ข้อสอบรายข้อ (${PART3_KNOWLEDGE_QUESTIONS.length} ข้อ & ช้อยส์)`, count: PART3_KNOWLEDGE_QUESTIONS.length },
            { id: 'controls', label: '⚙️ ตั้งค่าระบบการสอบ' },
            { id: 'sheets', label: '📑 ฐานข้อมูล Google Sheets & คู่มือ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                sfx.click();
                setActiveTab(tab.id as any);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-detective-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-5 space-y-5">
        {/* =================================================================== */}
        {/* SHARED COHORT FILTER BAR (Multi-Cohort / School / Grade / Period)    */}
        {/* =================================================================== */}
        {(activeTab === 'analytics' || activeTab === 'item_analysis') && (
          <div className="bg-white rounded-3xl p-4 shadow-clay border border-slate-100 space-y-3">
            {/* Row 1: Search, School Dropdown, Grade, Period, Refresh */}
            <div className="flex flex-col lg:flex-row gap-2.5 items-stretch lg:items-center justify-between">
              {/* Search & School */}
              <div className="flex flex-1 flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                {/* Search */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 ค้นหาชื่อจริง, ชื่อเล่น, ID Code..."
                    className="w-full pl-3.5 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-detective-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* School Dropdown */}
                <div className="sm:w-60">
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-detective-400 cursor-pointer"
                  >
                    <option value="all">🏫 ทุกโรงเรียน ({availableSchools.length} แห่ง)</option>
                    {availableSchools.map((sch) => (
                      <option key={sch} value={sch}>
                        🏫 {sch}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grade & Period & Actions */}
              <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
                {/* Grade Dropdown */}
                <div className="w-32 sm:w-36">
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-detective-400 cursor-pointer"
                  >
                    <option value="all">🎓 ทุกระดับชั้น</option>
                    <optgroup label="🌱 ประถมศึกษา">
                      <option value="ป.4">ป.4</option>
                      <option value="ป.5">ป.5</option>
                      <option value="ป.6">ป.6</option>
                      <option value="ประถมศึกษาอื่นๆ">ประถมอื่นๆ</option>
                    </optgroup>
                    <optgroup label="🌿 มัธยมศึกษาตอนต้น">
                      <option value="ม.1">ม.1</option>
                      <option value="ม.2">ม.2</option>
                      <option value="ม.3">ม.3</option>
                    </optgroup>
                    <optgroup label="🌳 มัธยมศึกษาตอนปลาย & อาชีวะ">
                      <option value="ม.4">ม.4</option>
                      <option value="ม.5">ม.5</option>
                      <option value="ม.6">ม.6</option>
                      <option value="ปวช.">ปวช.</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </optgroup>
                  </select>
                </div>

                {/* Status Filter Dropdown */}
                <div className="w-36 sm:w-44">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-detective-400 cursor-pointer"
                  >
                    <option value="all">🎯 สถานะ: ทั้งหมด</option>
                    <option value="both">
                      ✨ ทำครบ Pre & Post ({students.filter((s) => s.preTestScore !== undefined && s.postTestScore !== undefined).length} คน)
                    </option>
                    <option value="pre_only">📝 ทำเฉพาะ Pre-test</option>
                    <option value="post_only">📝 ทำเฉพาะ Post-test</option>
                    <option value="hero_done">🕹️ จบด่าน 1-8 แล้ว</option>
                    <option value="certified">🏆 ได้เกียรติบัตรแล้ว</option>
                  </select>
                </div>

                {/* Period Dropdown */}
                <div className="w-36 sm:w-40">
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-detective-400 cursor-pointer"
                  >
                    <option value="all">📅 ตลอดเวลาทั้งหมด</option>
                    <option value="today">📅 วันนี้</option>
                    <option value="7days">📅 7 วันล่าสุด</option>
                    <option value="30days">📅 30 วันล่าสุด</option>
                    <option value="custom">📅 กำหนดช่วงวันที่เอง...</option>
                  </select>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => {
                    sfx.click();
                    handleRefreshData();
                  }}
                  disabled={isLoading}
                  title="รีเฟรชข้อมูลล่าสุดจาก Google Sheets"
                  className="px-2.5 py-1.5 rounded-xl bg-detective-50 text-detective-700 border border-detective-200 text-xs font-bold hover:bg-detective-100 flex items-center gap-1 shadow-sm"
                >
                  <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
                  <span className="hidden sm:inline">{isLoading ? 'กำลังดึง...' : 'ดึงข้อมูลสด'}</span>
                </button>
              </div>
            </div>

            {/* Custom Date Pickers Row (if selectedPeriod === 'custom') */}
            {selectedPeriod === 'custom' && (
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs animate-fade-in">
                <span className="font-bold text-slate-600">ช่วงวันที่:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
                />
                <span className="text-slate-400">ถึง</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium"
                />
                {(customStartDate || customEndDate) && (
                  <button
                    onClick={() => {
                      setCustomStartDate('');
                      setCustomEndDate('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-1"
                  >
                    ล้างวันที่
                  </button>
                )}
              </div>
            )}

            {/* Row 2: Cohort Summary & 1-Tap Export Buttons */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-slate-500 text-[11px] flex items-center gap-2 flex-wrap">
                <span>
                  ผู้เรียนที่แสดง: <b className="text-detective-700 font-extrabold">{filteredStudents.length}</b> จาก {students.length} คน
                </span>
                {selectedSchool !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-detective-50 text-detective-700 font-semibold border border-detective-200 text-[10px]">
                    {selectedSchool}
                  </span>
                )}
                {selectedPeriod !== 'all' && (
                  <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 font-semibold border border-sky-200 text-[10px]">
                    ช่วงเวลา: {selectedPeriod === 'today' ? 'วันนี้' : selectedPeriod === '7days' ? '7 วันล่าสุด' : selectedPeriod === '30days' ? '30 วันล่าสุด' : 'กำหนดเอง'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={handleCopyTableToClipboard}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-[11px] font-bold hover:bg-slate-50 flex items-center gap-1 shadow-sm transition-all"
                  title="คัดลอกตารางสรุปรายบุคคล (TSV) ไปวางใน Excel ได้ทันที"
                >
                  <span>📋</span>
                  <span>{copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอกตาราง (TSV)'}</span>
                </button>

                <button
                  onClick={handleCopyBinaryToClipboard}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold hover:bg-indigo-100 flex items-center gap-1 shadow-sm transition-all"
                  title="คัดลอกข้อมูล 1/0 สำหรับ SPSS / Jamovi (TSV)"
                >
                  <span>🎯</span>
                  <span>{copyBinarySuccess ? 'คัดลอก 1/0 สำเร็จ!' : 'คัดลอก 1/0 (SPSS TSV)'}</span>
                </button>

                <button
                  onClick={handleDownloadBinaryCsv}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold hover:bg-emerald-100 flex items-center gap-1 shadow-sm transition-all"
                  title="ดาวน์โหลดไฟล์ CSV รูปแบบ 1/0 สำหรับ SPSS พร้อม UTF-8 BOM"
                >
                  <span>📥</span>
                  <span>ดาวน์โหลด CSV 1/0</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 1: Student Analytics & Progress                                 */}
        {/* =================================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            {/* 4 Analytics Highlights Cards (Strictly Real Data) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Card 1: Pre-test avg */}
              <div className="bg-white rounded-3xl p-4 shadow-clay border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center text-2xl flex-shrink-0">
                  🟦
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400">Pre-test เฉลี่ย</p>
                  <p className="text-xl font-display font-extrabold text-slate-900 mt-0.5">
                    {analytics.avgPre !== null ? `${analytics.avgPre}%` : 'ยังไม่มีข้อมูล'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {analytics.preDoneCount > 0 ? `ทำแล้ว ${analytics.preDoneCount} คน` : 'รอเริ่มทำก่อนเรียน'}
                  </p>
                </div>
              </div>

              {/* Card 2: Post-test avg */}
              <div className="bg-white rounded-3xl p-4 shadow-clay border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl flex-shrink-0">
                  🟩
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400">Post-test เฉลี่ย</p>
                  <p className="text-xl font-display font-extrabold text-emerald-600 mt-0.5">
                    {analytics.avgPost !== null ? `${analytics.avgPost}%` : 'ยังไม่มีข้อมูล'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {analytics.postDoneCount > 0 ? `ทำแล้ว ${analytics.postDoneCount} คน` : 'รอเรียนจบเนื้อหา'}
                  </p>
                </div>
              </div>

              {/* Card 3: Gain Delta avg */}
              <div className="bg-white rounded-3xl p-4 shadow-clay border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl flex-shrink-0">
                  🚀
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400">พัฒนาการ (Gain Delta)</p>
                  <p className="text-xl font-display font-extrabold text-indigo-600 mt-0.5">
                    {analytics.avgDelta !== null
                      ? `${analytics.avgDelta > 0 ? '+' : ''}${analytics.avgDelta}%`
                      : 'รอเปรียบเทียบ'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {analytics.avgDelta !== null ? 'คะแนนเพิ่มขึ้นเฉลี่ย' : 'ต้องมีทั้ง Pre และ Post'}
                  </p>
                </div>
              </div>

              {/* Card 4: Certificates issued */}
              <div className="bg-white rounded-3xl p-4 shadow-clay border border-slate-100 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl flex-shrink-0">
                  🏆
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400">เกียรติบัตรที่ออกแล้ว</p>
                  <p className="text-xl font-display font-extrabold text-amber-600 mt-0.5">
                    {analytics.certCount} <span className="text-xs font-normal text-slate-500">/{analytics.total}</span>
                  </p>
                  <p className="text-[10px] text-slate-500">ผ่านเกณฑ์สำเร็จการศึกษา</p>
                </div>
              </div>
            </div>

            {/* Academic Research Statistics Card (สรุปสถิติสำหรับรายงานวิจัย/วิทยานิพนธ์ - Light Theme) */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-clay border border-slate-200/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xl">📊</span>
                    <h3 className="font-display font-extrabold text-base text-slate-900">
                      สถิติวิเคราะห์งานวิจัย (Research Statistical Analysis)
                    </h3>
                    <span className="text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2.5 py-0.5 rounded-full font-bold">
                      N = {analytics.pairedCount} คน (กลุ่มตัวอย่างคู่สมบูรณ์)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    วิเคราะห์เปรียบเทียบผลสัมฤทธิ์ก่อน-หลังเรียน, ดัชนีประสิทธิผลการเรียนรู้แบบปรับฐานของเฮค (Hake's Gain), และขนาดอิทธิพล (Cohen's d)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyResearchSummary}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all active:scale-95 flex-shrink-0"
                  title="คัดลอกข้อความสรุปสถิติทั้งหมดพร้อมนำไปวางในเล่มรายงานวิจัยหรือโปรแกรม Word"
                >
                  <span>📋</span>
                  <span>{copyResearchSuccess ? 'คัดลอกสรุปสถิติสำเร็จ!' : 'คัดลอกสรุปสำหรับรายงานวิจัย/Word'}</span>
                </button>
              </div>

              {/* 3 Academic Metrics Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                {/* Column 1: Knowledge Test (Pre vs Post) */}
                <div className="bg-sky-50/60 hover:bg-sky-50/90 border border-sky-100 rounded-2xl p-4 space-y-3 flex flex-col justify-between transition-colors">
                  <div>
                    <p className="text-xs font-extrabold text-sky-800 flex items-center gap-1.5">
                      <span>🎯</span> 1. ผลสัมฤทธิ์ความรู้ ({PART3_KNOWLEDGE_QUESTIONS.length} ข้อ)
                    </p>
                    <div className="space-y-2 mt-2.5">
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-600 font-medium">ก่อนเรียน (Pre Mean ± SD):</span>
                        <b className="text-sky-800 font-mono text-sm font-bold">{analytics.pairedPreStats.str}%</b>
                      </div>
                      <div className="flex justify-between items-center text-slate-600">
                        <span className="text-slate-600 font-medium">หลังเรียน (Post Mean ± SD):</span>
                        <b className="text-emerald-700 font-mono text-sm font-bold">{analytics.pairedPostStats.str}%</b>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-sky-200/70 flex justify-between items-center">
                    <span className="text-slate-700 font-semibold">พัฒนาการ (Mean Gain):</span>
                    <b className="text-indigo-700 font-mono text-sm font-bold">
                      {analytics.pairedDeltaStats.mean >= 0 ? `+${analytics.pairedDeltaStats.mean}%` : `${analytics.pairedDeltaStats.mean}%`}
                      <span className="text-[10px] text-slate-500 font-normal ml-1">(SD {analytics.pairedDeltaStats.sd})</span>
                    </b>
                  </div>
                </div>

                {/* Column 2: Hake's Gain & Cohen's d */}
                <div className="bg-amber-50/60 hover:bg-amber-50/90 border border-amber-100 rounded-2xl p-4 space-y-3 flex flex-col justify-between transition-colors">
                  <div>
                    <p className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
                      <span>📈</span> 2. ประสิทธิผล & ขนาดอิทธิพล
                    </p>
                    <div className="space-y-2.5 mt-2.5">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Hake's Gain ⟨g⟩:</span>
                          <b className="text-amber-800 font-mono text-sm font-bold">
                            {analytics.hakeGainAvg !== null ? analytics.hakeGainAvg : '-'}
                          </b>
                        </div>
                        <p className="text-[11px] font-medium text-amber-700 mt-0.5">
                          {analytics.hakeGainCategory}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-amber-200/70">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Cohen's d:</span>
                          <b className="text-purple-700 font-mono text-sm font-bold">
                            {analytics.cohensD !== null ? analytics.cohensD : '-'}
                          </b>
                        </div>
                        <p className="text-[11px] font-medium text-purple-700 mt-0.5">
                          {analytics.cohensCategory}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 3: Refusal Skills & Chatbot Usability */}
                <div className="bg-emerald-50/60 hover:bg-emerald-50/90 border border-emerald-100 rounded-2xl p-4 space-y-3 flex flex-col justify-between transition-colors">
                  <div>
                    <p className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                      <span>🛡️</span> 3. ทักษะปฏิเสธ & ความพึงพอใจ
                    </p>
                    <div className="space-y-2 mt-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">ทักษะก่อน (Pre Mean ± SD):</span>
                        <b className="text-slate-800 font-mono text-sm font-bold">{analytics.preSkillStats.str}</b>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-medium">ทักษะหลัง (Post Mean ± SD):</span>
                        <b className="text-slate-800 font-mono text-sm font-bold">{analytics.postSkillStats.str}</b>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-emerald-200/70 flex justify-between items-center">
                    <span className="text-slate-700 font-semibold">ความพึงพอใจบอท (ตอน 5):</span>
                    <b className="text-amber-600 font-mono text-sm font-bold flex items-center gap-1">
                      <span>⭐</span> {analytics.evalStats.str} <span className="text-[10px] text-slate-500 font-normal">/ 5.0</span>
                    </b>
                  </div>
                </div>
              </div>
            </div>

            {/* Error banner if any */}
            {fetchError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
                <span>⚠️ {fetchError}</span>
                <button
                  onClick={handleRefreshData}
                  className="font-bold underline text-amber-800"
                >
                  ลองใหม่
                </button>
              </div>
            )}

            {/* Empty State when no real students exist */}
            {filteredStudents.length === 0 && (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-clay space-y-3">
                <span className="text-4xl">📝</span>
                <h3 className="font-display font-bold text-slate-800 text-base">
                  ยังไม่มีข้อมูลผู้เรียนในระบบ
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  เมื่อนักเรียนเริ่มเข้าใช้งาน ทำแบบทดสอบก่อนเรียน (Pre-test) เล่นเกม หรือทำแบบทดสอบหลังเรียน (Post-test)
                  ข้อมูลคะแนนจริงและพัฒนาการจะถูกส่งมาแสดงที่นี่และบันทึกลง Google Sheets ทันที
                </p>
                <div className="pt-2">
                  <a
                    href={admin.googleSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <span>🌐 ตรวจสอบบน Google Sheets</span>
                  </a>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* 1.2 A: MOBILE CARDS VIEW (block md:hidden)                      */}
            {/* =============================================================== */}
            {filteredStudents.length > 0 && (
              <div className="block md:hidden space-y-3">
                {filteredStudents.map((s, idx) => (
                  <div
                    key={s.userIdHash || idx}
                    onClick={() => setSelectedStudent(s)}
                    className="bg-white rounded-3xl p-4 shadow-clay border border-slate-100 space-y-3 cursor-pointer hover:border-detective-300 transition-all active:scale-[0.99]"
                  >
                    {/* Row 1: Student info + Cert badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-detective-700 bg-detective-50 px-2 py-0.5 rounded-lg">
                            #{idx + 1}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm">{s.realName}</h3>
                          {s.nickname && s.nickname !== s.realName && (
                            <span className="text-xs text-slate-500 font-medium">({s.nickname})</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          ID: <b className="text-detective-700">{s.idCode || '-'}</b> · {s.grade} · {s.school}
                        </p>
                      </div>

                      {s.certificateNo ? (
                        <span className="px-2 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold flex items-center gap-1">
                          <span>🏆</span> {s.certificateNo.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg">
                          ยังไม่จบ
                        </span>
                      )}
                    </div>

                    {/* Row 2: 3-colored Score Pills */}
                    <div className="grid grid-cols-3 gap-1.5 text-center">
                      <div className="bg-sky-50 border border-sky-100 rounded-2xl p-2">
                        <p className="text-[10px] font-bold text-sky-700">Pre-test</p>
                        <p className="font-display font-extrabold text-sm text-sky-900 mt-0.5">
                          {s.preTestScore !== undefined ? `${s.preTestScore}%` : '-'}
                        </p>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-2">
                        <p className="text-[10px] font-bold text-emerald-700">Post-test</p>
                        <p className="font-display font-extrabold text-sm text-emerald-900 mt-0.5">
                          {s.postTestScore !== undefined ? `${s.postTestScore}%` : '-'}
                        </p>
                      </div>

                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-2">
                        <p className="text-[10px] font-bold text-indigo-700">พัฒนาการ</p>
                        <p
                          className={`font-display font-extrabold text-sm mt-0.5 ${
                            s.gainDelta !== undefined && s.gainDelta >= 0
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {s.gainDelta !== undefined
                            ? `${s.gainDelta > 0 ? '+' : ''}${s.gainDelta}%`
                            : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Row 3: Progress indicators */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50/80 px-3 py-1.5 rounded-xl">
                      <span>ด่าน: <b>{s.stagesCompletedCount}/{s.totalStages || 20}</b></span>
                      <span>XP: <b className="text-detective-700">{s.totalXP.toLocaleString()}</b></span>
                      <span>ประเมินแชตบอต: <b className="text-amber-700">{s.evalPart5Avg ? `⭐ ${s.evalPart5Avg}` : '-'}</b></span>
                    </div>

                    {/* Row 4: Action Buttons (Edit & Delete) */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEdit(s, e)}
                        className="px-2.5 py-1 rounded-xl bg-detective-50 text-detective-700 hover:bg-detective-100 text-xs font-bold border border-detective-200 flex items-center gap-1 transition-colors"
                        title="แก้ไขข้อมูล (โรงเรียน, ชั้น, ชื่อ, รหัส)"
                      >
                        <span>✏️</span> แก้ไขข้อมูล
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteStudent(s, e)}
                        className="px-2 py-1 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold border border-rose-200 flex items-center gap-1 transition-colors"
                        title="ลบข้อมูลทดสอบ"
                      >
                        <span>🗑️</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* =============================================================== */}
            {/* 1.2 B: DESKTOP TABLE VIEW (hidden md:block)                      */}
            {/* =============================================================== */}
            {filteredStudents.length > 0 && (
              <div className="hidden md:block bg-white rounded-3xl shadow-clay border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-detective-50 to-sky-50 text-detective-900 font-bold border-b border-slate-200">
                        <th className="py-3 px-3 text-center">#</th>
                        <th className="py-3 px-3">ID Code</th>
                        <th className="py-3 px-3">ชื่อ-นามสกุลจริง</th>
                        <th className="py-3 px-3">ชื่อเล่น</th>
                        <th className="py-3 px-2">ชั้น</th>
                        <th className="py-3 px-3 text-center">Pre-test (%)</th>
                        <th className="py-3 px-3 text-center">ทักษะก่อน (100)</th>
                        <th className="py-3 px-3 text-center">Post-test (%)</th>
                        <th className="py-3 px-3 text-center">ทักษะหลัง (100)</th>
                        <th className="py-3 px-3 text-center">พัฒนาการ (Delta)</th>
                        <th className="py-3 px-2 text-center">ด่าน</th>
                        <th className="py-3 px-3 text-right">คะแนน XP</th>
                        <th className="py-3 px-3 text-center">ประเมินบอท</th>
                        <th className="py-3 px-3 text-center">เกียรติบัตร</th>
                        <th className="py-3 px-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((s, idx) => (
                        <tr
                          key={s.userIdHash || idx}
                          onClick={() => setSelectedStudent(s)}
                          className="hover:bg-sky-50/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3 font-extrabold text-detective-700">
                            {s.idCode || '-'}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800">
                            {s.realName || '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-600">{s.nickname || '-'}</td>
                          <td className="py-3 px-2 font-medium text-slate-600">{s.grade || '-'}</td>
                          <td className="py-3 px-3 text-center">
                            {s.preTestScore !== undefined ? (
                              <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-bold border border-sky-200">
                                {s.preTestScore}%
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {s.preTestSkillScore !== undefined ? s.preTestSkillScore : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {s.postTestScore !== undefined ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                {s.postTestScore}%
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-slate-700">
                            {s.postTestSkillScore !== undefined ? s.postTestSkillScore : '-'}
                          </td>
                          <td className="py-3 px-3 text-center font-extrabold">
                            {s.gainDelta !== undefined ? (
                              <span
                                className={`px-2 py-0.5 rounded-md ${
                                  s.gainDelta >= 0
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {s.gainDelta > 0 ? `+${s.gainDelta}%` : `${s.gainDelta}%`}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center text-slate-600 font-semibold">
                            {s.stagesCompletedCount}/{s.totalStages}
                          </td>
                          <td className="py-3 px-3 text-right font-display font-bold text-detective-800">
                            {s.totalXP.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-amber-700">
                            {s.evalPart5Avg !== undefined ? `⭐ ${s.evalPart5Avg}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {s.certificateNo ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                                ✓ {s.certificateNo.slice(-4)}
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEdit(s, e)}
                                className="px-2 py-1 rounded-lg bg-detective-50 text-detective-700 hover:bg-detective-100 border border-detective-200 text-xs font-bold transition-colors shadow-sm"
                                title="แก้ไขข้อมูล (โรงเรียน, ชั้น, ชื่อ, รหัส)"
                              >
                                ✏️ แก้ไข
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteStudent(s, e)}
                                className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors"
                                title="ลบข้อมูลทดสอบ"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: Item Analysis & Distractor Distribution (21 ข้อ & ตัวลวง)       */}
        {/* =================================================================== */}
        {activeTab === 'item_analysis' && (
          <div className="space-y-5">
            {/* Sub-tabs for Item Analysis */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex gap-1.5 overflow-x-auto">
                {[
                  { id: 'knowledge', label: `🎯 ${PART3_KNOWLEDGE_QUESTIONS.length} ข้อความรู้ & อัตราตอบถูก/ผิด` },
                  { id: 'skills', label: `🛡️ ${PART4_REFUSAL_SKILLS.length} ข้อทักษะการปฏิเสธ (1-5)` },
                  { id: 'app_eval', label: `⭐ ${PART5_CHATBOT_EVALUATION.length} ข้อประเมินแชตบอต` },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      sfx.click();
                      setItemAnalysisSubTab(st.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      itemAnalysisSubTab === st.id
                        ? 'bg-detective-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* SPSS Quick Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyBinaryToClipboard}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 flex items-center gap-1.5 transition-all shadow-sm"
                  title="คัดลอกตาราง 1/0 ทั้งหมด (SPSS TSV) เพื่อนำไปวางใน SPSS / Jamovi"
                >
                  <span>📋</span>
                  <span>{copyBinarySuccess ? 'คัดลอก 1/0 สำเร็จ!' : 'คัดลอก 1/0 สำหรับ SPSS'}</span>
                </button>
                <button
                  onClick={handleDownloadBinaryCsv}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition-all shadow-sm"
                  title="ดาวน์โหลดไฟล์ CSV 1/0 พร้อม UTF-8 BOM"
                >
                  <span>📥</span>
                  <span>ดาวน์โหลด CSV 1/0</span>
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Knowledge Questions & Distractor Breakdown */}
            {itemAnalysisSubTab === 'knowledge' && (
              <div className="space-y-4">
                {/* Information Header Card - Light Theme */}
                <div className="bg-white rounded-3xl p-5 shadow-clay space-y-2 border border-slate-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base sm:text-lg font-display font-extrabold text-slate-900 flex items-center gap-2">
                        <span>🎯</span> การวิเคราะห์ข้อสอบรายข้อและความถี่ตัวเลือก (ถูก / ผิด)
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        คำนวณจากผู้เรียนกลุ่มนี้ {filteredStudents.length} คน (ทำ Pre-test {itemAnalysisData[0]?.preTotal || 0} คน / ทำ Post-test {itemAnalysisData[0]?.postTotal || 0} คน)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 text-sky-700 px-2.5 py-1 rounded-xl">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" /> ก่อนเรียน (Pre)
                      </span>
                      <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-xl">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> หลังเรียน (Post)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Knowledge Question Cards */}
                <div className="space-y-4">
                  {itemAnalysisData.map((item) => {
                    // Difficulty index (p) calculation
                    const preP = item.prePct !== null ? (item.prePct / 100).toFixed(2) : null;
                    const postP = item.postPct !== null ? (item.postPct / 100).toFixed(2) : null;

                    return (
                      <div
                        key={item.no}
                        className="bg-white rounded-3xl p-5 shadow-clay border border-slate-100 space-y-4 transition-all hover:border-detective-200"
                      >
                        {/* Top: Question No, Metrics Badges */}
                        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                          <div className="space-y-1 max-w-2xl">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-xl bg-detective-100 text-detective-800 font-extrabold text-xs">
                                ข้อที่ {item.no} จาก {PART3_KNOWLEDGE_QUESTIONS.length}
                              </span>
                              <span className="text-[11px] text-slate-500 font-medium">
                                (คำตอบที่ถูกต้อง: <b className="text-emerald-700">{item.correctChoiceLabel}</b>)
                              </span>
                            </div>
                            <h3 className="font-bold text-slate-900 text-sm leading-snug">
                              {item.question.question}
                            </h3>
                          </div>

                          {/* Scores & Difficulty Stats */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <div className="px-3 py-1.5 rounded-2xl bg-sky-50 border border-sky-100 text-center">
                              <p className="text-[10px] text-sky-700 font-bold">Pre-test (ก่อน)</p>
                              <p className="font-display font-extrabold text-sky-900 text-sm">
                                {item.prePct !== null ? `${item.prePct}%` : '-'}
                              </p>
                              <p className="text-[9px] text-sky-600 font-medium">
                                ถูก {item.preCorrectCount}/{item.preTotal} คน (p={preP || '-'})
                              </p>
                            </div>

                            <div className="px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                              <p className="text-[10px] text-emerald-700 font-bold">Post-test (หลัง)</p>
                              <p className="font-display font-extrabold text-emerald-900 text-sm">
                                {item.postPct !== null ? `${item.postPct}%` : '-'}
                              </p>
                              <p className="text-[9px] text-emerald-600 font-medium">
                                ถูก {item.postCorrectCount}/{item.postTotal} คน (p={postP || '-'})
                              </p>
                            </div>

                            <div className="px-3 py-1.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                              <p className="text-[10px] text-indigo-700 font-bold">พัฒนาการ (Δ)</p>
                              <p
                                className={`font-display font-extrabold text-sm ${
                                  item.deltaPct !== null && item.deltaPct >= 0
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {item.deltaPct !== null
                                  ? `${item.deltaPct > 0 ? '+' : ''}${item.deltaPct}%`
                                  : '-'}
                              </p>
                              <p className="text-[9px] text-indigo-600 font-medium">
                                {item.deltaPct !== null && item.deltaPct > 0 ? 'ความรู้เพิ่มขึ้น' : 'คงที่ / ลดลง'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Correct Answer Highlight Banner */}
                        <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2 text-xs">
                          <span className="text-emerald-600 font-bold text-sm leading-none mt-0.5">✓</span>
                          <div>
                            <span className="font-bold text-emerald-900 mr-1.5">เฉลยข้อที่ถูกต้อง:</span>
                            <span className="font-extrabold text-emerald-800 underline mr-1.5">
                              {item.correctChoiceLabel}
                            </span>
                            {item.question.explain && (
                              <span className="text-emerald-950 font-medium ml-1">
                                — {item.question.explain}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Breakdown per choice */}
                        <div className="space-y-3 pt-1">
                          <p className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                            <span>📊</span> สัดส่วนนักเรียนที่เลือกแต่ละข้อ (เปรียบเทียบก่อนเรียน vs หลังเรียน):
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {item.question.choices.map((choiceText, cIdx) => {
                              const isCorrect = cIdx === item.correctIndex;
                              const preCnt = item.preDist[cIdx];
                              const prePct = item.preDistPct[cIdx];
                              const postCnt = item.postDist[cIdx];
                              const postPct = item.postDistPct[cIdx];

                              return (
                                <div
                                  key={cIdx}
                                  className={`p-3.5 rounded-2xl border transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                                      : 'bg-slate-50/70 border-slate-200/80'
                                  }`}
                                >
                                  {/* Choice Title */}
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-start gap-2">
                                      <span
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                          isCorrect
                                            ? 'bg-emerald-600 text-white shadow-sm'
                                            : 'bg-slate-200 text-slate-700'
                                        }`}
                                      >
                                        {choiceText === 'ถูก' ? '✓' : choiceText === 'ผิด' ? '✗' : cIdx + 1}
                                      </span>
                                      <span
                                        className={`text-xs leading-snug ${
                                          isCorrect ? 'font-bold text-slate-900' : 'text-slate-700'
                                        }`}
                                      >
                                        {choiceText}
                                      </span>
                                    </div>
                                    {isCorrect && (
                                      <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold whitespace-nowrap flex-shrink-0">
                                        ✓ คำตอบถูก (1)
                                      </span>
                                    )}
                                  </div>

                                  {/* Dual Bars: Pre vs Post */}
                                  <div className="space-y-1.5 text-[11px]">
                                    {/* Pre-test bar */}
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-slate-500 font-medium">
                                        <span>ก่อนเรียน (Pre):</span>
                                        <span className="font-bold text-sky-800">
                                          {preCnt} คน ({prePct}%)
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-sky-500 h-full rounded-full transition-all duration-500"
                                          style={{ width: `${prePct}%` }}
                                        />
                                      </div>
                                    </div>

                                    {/* Post-test bar */}
                                    <div className="space-y-0.5">
                                      <div className="flex justify-between text-slate-500 font-medium">
                                        <span>หลังเรียน (Post):</span>
                                        <span className="font-bold text-emerald-800">
                                          {postCnt} คน ({postPct}%)
                                        </span>
                                      </div>
                                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                                        <div
                                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                          style={{ width: `${postPct}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Explanation Note */}
                        {item.question.explain && (
                          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                            <span className="font-bold text-slate-800 mr-1.5">💡 คำอธิบายเชิงวิชาการ:</span>
                            {item.question.explain}
                            {item.question.source && (
                              <span className="block mt-1 text-[10px] text-slate-400">
                                📚 แหล่งอ้างอิง: {item.question.source}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-tab 2: Refusal Skills (20 Items) */}
            {itemAnalysisSubTab === 'skills' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 shadow-clay border border-slate-100 space-y-2">
                  <h2 className="text-base font-display font-extrabold text-slate-900 flex items-center gap-2">
                    <span>🛡️</span> การประเมินทักษะการปฏิเสธบุหรี่ไฟฟ้า (ตอนที่ 4 จำนวน 20 ข้อ)
                  </h2>
                  <p className="text-xs text-slate-500">
                    เกณฑ์การให้คะแนน Likert Scale 1 - 5 ระดับ (1 = น้อยที่สุด, 5 = มากที่สุด) เปรียบเทียบค่าเฉลี่ยก่อนเรียนและหลังเรียน
                  </p>
                </div>

                <div className="bg-white rounded-3xl shadow-clay border border-slate-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                          <th className="py-3 px-3 text-center w-12">ข้อ</th>
                          <th className="py-3 px-3">ข้อคำถามทักษะการปฏิเสธ</th>
                          <th className="py-3 px-3 text-center w-28">ก่อนเรียน (Pre Mean)</th>
                          <th className="py-3 px-3 text-center w-28">หลังเรียน (Post Mean)</th>
                          <th className="py-3 px-3 text-center w-28">ผลต่าง (Δ Mean)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {refusalSkillsAnalysis.map((sk) => (
                          <tr key={sk.no} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-3 text-center font-bold text-slate-400">
                              {sk.no}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {sk.item.text}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {sk.preAvg !== null ? (
                                <span className="px-2.5 py-1 rounded-xl bg-sky-50 text-sky-800 font-bold border border-sky-200">
                                  {sk.preAvg.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {sk.postAvg !== null ? (
                                <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                                  {sk.postAvg.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-center font-extrabold">
                              {sk.delta !== null ? (
                                <span
                                  className={`px-2.5 py-1 rounded-xl border ${
                                    sk.delta >= 0
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : 'bg-rose-100 text-rose-800 border-rose-300'
                                  }`}
                                >
                                  {sk.delta > 0 ? `+${sk.delta.toFixed(2)}` : sk.delta.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Chatbot App Evaluation (7 Items) */}
            {itemAnalysisSubTab === 'app_eval' && (
              <div className="space-y-4">
                <div className="bg-white rounded-3xl p-5 shadow-clay border border-slate-100 space-y-2">
                  <h2 className="text-base font-display font-extrabold text-slate-900 flex items-center gap-2">
                    <span>⭐</span> การประเมินความพึงพอใจต่อแอปพลิเคชันแชตบอต (ตอนที่ 5 จำนวน 7 ข้อ)
                  </h2>
                  <p className="text-xs text-slate-500">
                    เกณฑ์การให้คะแนน Likert Scale 1 - 5 ระดับ (1 = น้อยที่สุด, 5 = มากที่สุด)
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {appEvalAnalysis.map((ev) => (
                    <div
                      key={ev.no}
                      className="bg-white rounded-3xl p-5 shadow-clay border border-slate-100 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                            ข้อที่ {ev.no}
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 text-sm leading-snug">
                          {ev.item.text}
                        </h4>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-slate-400">คะแนนเฉลี่ย</p>
                          <p className="text-xl font-display font-extrabold text-amber-600">
                            {ev.avg !== null ? `${ev.avg.toFixed(2)} / 5.0` : 'ยังไม่มีข้อมูล'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200">
                            ประเมินแล้ว {ev.count} คน
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: Exam & App Controls                                         */}
        {/* =================================================================== */}
        {activeTab === 'controls' && (
          <div className="max-w-2xl mx-auto space-y-5">
            {/* Group 1: Core Exam Access */}
            <div className="bg-white rounded-3xl p-6 shadow-clay border border-slate-100 space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h2 className="text-sm font-display font-extrabold text-slate-900 flex items-center gap-2">
                  <span>📌 1.</span> การเข้าถึงแบบทดสอบวิจัย (Pre-test / Post-test)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ควบคุมการเปิด-ปิดการทำข้อสอบก่อนและหลังเรียนสำหรับนักเรียนทุกคน
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Control 1: Pre-test */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      📝 เปิดให้ทำแบบทดสอบก่อนเรียน (Pre-test)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      เปิดให้นักเรียนทำแบบทดสอบวัดผลก่อนเริ่มเล่นเนื้อหา
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('preTestEnabled', !admin.preTestEnabled)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.preTestEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.preTestEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Control 1.1: Mandatory Pre-test Gatekeeping */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-800">
                        🔒 บังคับทำแบบประเมินก่อนเรียนก่อนเริ่มเล่นเกม (Pre-test Gatekeeping)
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        admin.requirePreTestBeforePlaying ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {admin.requirePreTestBeforePlaying ? 'บังคับก่อนเริ่ม' : 'อิสระ'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {admin.requirePreTestBeforePlaying
                        ? 'เปิดใช้งาน: นักเรียนต้องทำ Pre-test ให้เสร็จก่อน จึงจะปลดล็อกด่านที่ 1 และแผนที่ภารกิจ (ป้องกันเด็กข้ามข้อสอบ)'
                        : 'ปิดใช้งาน: นักเรียนสามารถเข้าเล่นเกมได้ทันทีโดยไม่ต้องทำ Pre-test ให้เสร็จก่อน'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('requirePreTestBeforePlaying', !admin.requirePreTestBeforePlaying)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.requirePreTestBeforePlaying ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.requirePreTestBeforePlaying ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Control 2: Post-test */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      🎯 เปิดให้ทำแบบทดสอบหลังเรียน (Post-test)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      เปิดให้นักเรียนทำแบบทดสอบวัดผลหลังเรียนจบ
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('postTestEnabled', !admin.postTestEnabled)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.postTestEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.postTestEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Control 3: Bypass stage requirement */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      🔓 ปลดล็อกให้ข้ามบทหลักมาทำข้อสอบได้ทันที (Bypass Stages)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      นักเรียนสามารถกดทำ Post-test ได้ทันทีแม้ยังเล่นไม่จบ 8 ด่านหลัก (เหมาะสำหรับการทดสอบระบบ)
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('allowBypassStages', !admin.allowBypassStages)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.allowBypassStages ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.allowBypassStages ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Group 2: Modular Test Sections (ปรับลดเมื่อข้อสอบเยอะไป) */}
            <div className="bg-white rounded-3xl p-6 shadow-clay border border-slate-100 space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h2 className="text-sm font-display font-extrabold text-slate-900 flex items-center gap-2">
                  <span>✂️ 2.</span> ปรับลด/เลือกตอนของแบบทดสอบ (Modular Test Sections)
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  เลือกเปิด-ปิดตอนที่ต้องการ เพื่อย่นระยะเวลาทำแบบทดสอบให้เหมาะสมกับคาบเรียน
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Part 2 Toggle: Behaviors */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      🚬 ตอนที่ 2: แบบสำรวจพฤติกรรมและการลองสูบ (3 ข้อ)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {admin.part2Enabled ? 'เปิดใช้งาน (นักเรียนต้องทำ 3 ข้อ)' : 'ปิดใช้งาน (ข้ามไปทำข้อสอบความรู้ทันที ประหยัดเวลา 2 นาที)'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('part2Enabled', !admin.part2Enabled)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.part2Enabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.part2Enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Part 3 Toggle: Knowledge Questions */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        🧠 ตอนที่ 3: แบบทดสอบความรู้บุหรี่ไฟฟ้า (Knowledge Test)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {admin.part3Enabled ? 'เปิดใช้งาน (แบบทดสอบ 8 ข้อ ถูก/ผิด)' : 'ปิดใช้งาน (ข้ามส่วนความรู้)'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('part3Enabled', !admin.part3Enabled)}
                      className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                        admin.part3Enabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                          admin.part3Enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {admin.part3Enabled && (
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-600 font-semibold">ข้อสอบความรู้:</span>
                      <span className="text-xs font-bold text-detective-700 bg-detective-50 px-2.5 py-1 rounded-xl border border-detective-200">
                        8 ข้อ ถูก/ผิด (ตรงตามแบบวิจัย 100%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Part 4 Toggle: Refusal Skills */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      🛡️ ตอนที่ 4: แบบประเมินทักษะและความมั่นใจในการปฏิเสธ (15 ข้อ)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {admin.part4Enabled ? 'เปิดใช้งาน (ประเมินระดับความมั่นใจ 1-5 ครบ 15 ข้อ)' : 'ปิดใช้งาน (ข้ามส่วนนี้เพื่อลดเวลาทำข้อสอบลง 3-5 นาที)'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('part4Enabled', !admin.part4Enabled)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.part4Enabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.part4Enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Part 5 Toggle: Chatbot Evaluation */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      ⭐ ตอนที่ 5: แบบประเมินประโยชน์ของแชตบอต (7 ข้อ)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      เปิดให้นักเรียนทำแบบประเมินความคิดเห็นหลังใช้แชตบอตในการทำ Post-test
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('part5Enabled', !admin.part5Enabled)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.part5Enabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.part5Enabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Group 3: In-Game Tests & Quizzes */}
            <div className="bg-white rounded-3xl p-6 shadow-clay border border-slate-100 space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h2 className="text-sm font-display font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🎮 3.</span> แบบทดสอบและควิซอื่นๆ ในเกม
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ควบคุมการเปิด-ปิดข้อสอบรวมและควิซรายวันในแอป
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Final Exam */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      🎓 แบบทดสอบรวมประจำหลักสูตร (Comprehensive Exam 15 ข้อ)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      เปิดให้นักเรียนเข้าทำข้อสอบรวมในหน้า /exam เพื่อรับเหรียญตรา
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('finalExamEnabled', !admin.finalExamEnabled)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.finalExamEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.finalExamEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Daily Challenge */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      📅 ภารกิจควิซรายวัน (Daily Challenge 5 ข้อ)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      เปิดควิซรายวันสำหรับสะสมเหรียญและเล่นต่อเนื่อง
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('dailyChallengeEnabled', !admin.dailyChallengeEnabled)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.dailyChallengeEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.dailyChallengeEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Group 4: Anti-Cheat & Display */}
            <div className="bg-white rounded-3xl p-6 shadow-clay border border-slate-100 space-y-4">
              <div className="border-b border-slate-100 pb-2.5">
                <h2 className="text-sm font-display font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🛡️ 4.</span> การแสดงผลและการป้องกันการลอก
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  ตั้งค่าเฉลยและสลับข้อสอบเพื่อความเที่ยงตรงของข้อมูล
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Randomize Questions */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      🔀 สลับลำดับข้อสอบอัตโนมัติ (Randomize Questions)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      สลับลำดับข้อสอบแบบสุ่ม เพื่อป้องกันนักเรียนลอกข้อสอบกันในห้องเรียน
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('randomizeQuestions', !admin.randomizeQuestions)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.randomizeQuestions ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.randomizeQuestions ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Show Explanations */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      📖 แสดงเฉลยและคำอธิบายหลังทำแบบทดสอบ
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ค่าเริ่มต้นคือปิดไว้ตามหลักวิจัย แต่สามารถเปิดให้อ่านเฉลยละเอียดได้
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('showExplanations', !admin.showExplanations)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
                      admin.showExplanations ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                        admin.showExplanations ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold text-center flex items-center justify-center gap-1.5 animate-fade-in">
                  <span>✅</span> บันทึกและซิงค์การตั้งค่าไปยังนักเรียนทุกคนแล้ว
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: Google Sheets Database & Admin Guide                         */}
        {/* =================================================================== */}
        {activeTab === 'sheets' && (
          <div className="space-y-6">
            {/* 1.1 HERO CARD: โทนสว่าง (Light Clay Tone) */}
            <div className="bg-gradient-to-br from-sky-50 via-indigo-50/30 to-white rounded-[26px] p-6 md:p-8 shadow-clay border border-sky-100 space-y-4">
              {/* Live Status Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>☁️ ระบบคลาวด์เชื่อมต่อสมบูรณ์ (Real-Time Auto Sync)</span>
              </div>

              <div className="space-y-1">
                <h2 className="text-xl md:text-2xl font-display font-extrabold text-slate-900 leading-tight">
                  Google Sheets ศูนย์กลางฐานข้อมูลคะแนนสด
                </h2>
                <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-2xl">
                  ระบบเว็บแอปบันทึกคะแนนและพัฒนาการของนักเรียนทุกคนเข้าสู่ Google Sheets โดยอัตโนมัติ
                  อาจารย์สามารถเปิดดูข้อมูลอัปเดตแบบเรียลไทม์ได้ตลอด 24 ชั่วโมง
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={admin.googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="!bg-emerald-600 hover:!bg-emerald-700 text-white font-bold px-5 py-3 rounded-2xl shadow-clay active:scale-[0.98] transition-all flex items-center gap-2 text-xs sm:text-sm"
                >
                  <span>🌐 เปิด Google Sheets ตารางคะแนนสด ↗</span>
                </a>

                <button
                  onClick={() => {
                    sfx.click();
                    handleRefreshData();
                  }}
                  disabled={isLoading}
                  className="bg-white border-2 border-sky-200 text-sky-700 hover:bg-sky-50 font-bold px-4 py-3 rounded-2xl active:scale-[0.98] transition-all flex items-center gap-2 text-xs sm:text-sm shadow-sm"
                >
                  <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
                  <span>{isLoading ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลสถิติล่าสุดลงเครื่อง'}</span>
                </button>

                <button
                  onClick={handleCopyTableToClipboard}
                  className="bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-4 py-3 rounded-2xl active:scale-[0.98] transition-all flex items-center gap-2 text-xs sm:text-sm shadow-sm"
                >
                  <span>📋</span>
                  <span>{copySuccess ? 'คัดลอกตารางแล้ว!' : 'คัดลอกด่วน (1-Tap TSV)'}</span>
                </button>
              </div>

              {/* Footer Bar */}
              <div className="pt-3 border-t border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-1">
                <span>🔒 สถานะการเข้าถึง: ทุกคนที่มีลิงก์มีสิทธิ์ดู (อ่านเท่านั้น / Viewer) ปลอดภัย 100% ข้อมูลไม่สูญหาย</span>
                <span className="font-bold text-detective-700">
                  นักเรียนทั้งหมดในระบบ: {analytics.total} คน
                </span>
              </div>
            </div>

            {/* 2.2 คู่มือแนะนำการส่งออกไฟล์ 4 ขั้นตอน (Step-by-Step Admin Guide) */}
            <div className="bg-white rounded-3xl p-6 shadow-clay border border-slate-100 space-y-4">
              <h3 className="font-display font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>📚</span> คู่มือแนะนำการส่งออกรายงานและใช้งานฐานข้อมูล (4 ขั้นตอน)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-1.5">
                  <p className="font-bold text-sky-900 flex items-center gap-1.5">
                    <span>💻 ขั้นที่ 1:</span> วิธีดาวน์โหลดบนคอมพิวเตอร์ (PC / Mac)
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed text-[11px]">
                    <li>กดปุ่ม <b>"เปิด Google Sheets ตารางคะแนนสด"</b> ด้านบน</li>
                    <li>ไปที่เมนู <b>ไฟล์ (File)</b> ที่มุมซ้ายบนของ Google Sheets</li>
                    <li>เลือกเมนู <b>ดาวน์โหลด (Download)</b></li>
                    <li>เลือกฟอร์แมต: <b>Excel (.xlsx)</b>, <b>PDF (.pdf)</b> หรือ <b>CSV (.csv)</b> สำหรับวิเคราะห์ใน SPSS</li>
                  </ol>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                  <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <span>📱 ขั้นที่ 2:</span> วิธีดาวน์โหลดบนมือถือ (iOS / Android)
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-700 leading-relaxed text-[11px]">
                    <li>เปิดลิงก์ชีตผ่านเว็บเบราว์เซอร์หรือแอป Google Sheets</li>
                    <li>แตะที่ <b>จุดสามจุด ( ⠇ หรือ ... )</b> ที่มุมบนขวา</li>
                    <li>เลือกเมนู <b>แชร์และส่งออก (Share & export)</b></li>
                    <li>เลือก <b>บันทึกเป็น Excel (.xlsx)</b> หรือส่งสำเนาเข้า LINE / Email</li>
                  </ol>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1.5">
                  <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <span>📊 ขั้นที่ 3:</span> คำอธิบาย 18 คอลัมน์ (Data Dictionary)
                  </p>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    ระบบจัดหมวดหมู่ข้อมูลรายงานออกเป็น 6 กลุ่มการเรียนรู้ (ดูรายละเอียดโครงสร้างด้านล่าง)
                    พร้อมรองรับการส่งออกคะแนนไปใช้งานในรายงานวิจัยได้ทันที
                  </p>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1.5">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <span>📋 ขั้นที่ 4:</span> เครื่องมือคัดลอกด่วน (1-Tap Clipboard Copy)
                  </p>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    เพียงกดปุ่ม <b>"คัดลอกด่วน (1-Tap TSV)"</b> ระบบจะก็อปปี้ตารางนักเรียนทุกคน จากนั้นอาจารย์สามารถเปิด Microsoft Excel ในเครื่อง แล้วกด <b>Ctrl+V (วาง)</b> ได้ทันที
                  </p>
                </div>
              </div>
            </div>

            {/* 2.3 โครงสร้าง 18 คอลัมน์ในฐานข้อมูล (Data Dictionary Table) */}
            <div className="bg-white rounded-3xl p-6 shadow-clay border border-slate-100 space-y-4">
              <h3 className="font-display font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>📋</span> โครงสร้าง 18 คอลัมน์ใน Google Sheets (Data Dictionary)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Group 1 */}
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-1">
                  <p className="font-bold text-detective-800">1. ข้อมูลผู้เรียน</p>
                  <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                    <li>ลำดับที่ (No.)</li>
                    <li>รหัสประจำตัว (ID Code เช่น พร15)</li>
                    <li>ชื่อ-นามสกุลจริง</li>
                    <li>นามสมมุติในแอป (Nickname)</li>
                    <li>ชื่อโปรไฟล์ LINE</li>
                  </ul>
                </div>

                {/* Group 2 */}
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-1">
                  <p className="font-bold text-sky-800">2. ข้อมูลก่อนเรียน</p>
                  <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                    <li>Pre-test ความรู้ (%)</li>
                    <li>ทักษะก่อนเรียน (เต็ม 100)</li>
                    <li>วันเวลาที่ทำ Pre-test</li>
                  </ul>
                </div>

                {/* Group 3 */}
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-1">
                  <p className="font-bold text-indigo-800">3. การเล่นเกม</p>
                  <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                    <li>ด่านที่ผ่าน (เช่น 10/10 ด่าน)</li>
                    <li>คะแนนรวม (XP รวม)</li>
                  </ul>
                </div>

                {/* Group 4 */}
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-1">
                  <p className="font-bold text-emerald-800">4. ข้อมูลหลังเรียน</p>
                  <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                    <li>Post-test ความรู้ (%)</li>
                    <li>ทักษะหลังเรียน (เต็ม 100)</li>
                    <li>วันเวลาที่ทำ Post-test</li>
                    <li>พัฒนาการ (Gain Delta %)</li>
                  </ul>
                </div>

                {/* Group 5 */}
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-1">
                  <p className="font-bold text-amber-800">5. การประเมินแชตบอต (AI Evaluation)</p>
                  <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                    <li>คะแนนเฉลี่ยตอนที่ 5 (1.00 - 5.00)</li>
                  </ul>
                </div>

                {/* Group 6 */}
                <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-1">
                  <p className="font-bold text-slate-800">6. ข้อมูลเกียรติบัตร (Certificates)</p>
                  <ul className="list-disc list-inside text-slate-600 text-[11px] space-y-0.5">
                    <li>เลขที่เกียรติบัตร (เช่น WU-MEL-2569-0001)</li>
                    <li>วันที่ออกเกียรติบัตรทางการ</li>
                    <li>วันเวลาเข้าใช้งานล่าสุด</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =================================================================== */}
      {/* Student Detail Modal                                                */}
      {/* =================================================================== */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-3xl w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-detective-600 bg-detective-50 px-2.5 py-0.5 rounded-lg border border-detective-200">
                      ID: {selectedStudent.idCode || '-'}
                    </span>
                    {selectedStudent.certificateNo && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        🏆 {selectedStudent.certificateNo}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-display font-extrabold text-slate-900 mt-1">
                    {selectedStudent.realName} {selectedStudent.nickname && selectedStudent.nickname !== selectedStudent.realName && `(${selectedStudent.nickname})`}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    ระดับชั้น {selectedStudent.grade || '-'} · {selectedStudent.school || '-'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedStudent)}
                    className="px-3 py-1.5 rounded-xl bg-detective-50 text-detective-700 hover:bg-detective-100 border border-detective-200 text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                    title="แก้ไขข้อมูลนักเรียนคนนี้"
                  >
                    <span>✏️</span> แก้ไขข้อมูล
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(selectedStudent)}
                    className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-colors"
                    title="ลบข้อมูลทดสอบ"
                  >
                    <span>🗑️</span>
                  </button>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold transition-colors ml-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Sub-Tabs */}
              <div className="flex gap-1.5 border-b border-slate-100 pb-2 overflow-x-auto flex-shrink-0">
                {[
                  { id: 'summary', label: '📊 สรุปผลสอบ' },
                  { id: 'knowledge', label: `🎯 ความรู้ ${PART3_KNOWLEDGE_QUESTIONS.length} ข้อ (ถูก/ผิด)` },
                  { id: 'skills', label: `🛡️ ทักษะปฏิเสธ ${PART4_REFUSAL_SKILLS.length} ข้อ` },
                  { id: 'app_eval', label: `⭐ ประเมินแอป ${PART5_CHATBOT_EVALUATION.length} ข้อ` },
                ].map((mt) => (
                  <button
                    key={mt.id}
                    onClick={() => {
                      sfx.click();
                      setStudentModalTab(mt.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      studentModalTab === mt.id
                        ? 'bg-detective-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mt.label}
                  </button>
                ))}
              </div>

              {/* Modal Body: Scrollable */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
                {/* 1. Summary Tab */}
                {studentModalTab === 'summary' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-100 space-y-1">
                        <span className="font-bold text-sky-900 block text-xs">Pre-test (ก่อนเรียน)</span>
                        <p className="font-display font-bold text-base text-sky-800">
                          {selectedStudent.preTestScore !== undefined ? `${selectedStudent.preTestScore}%` : 'ยังไม่ทำ'}
                        </p>
                        <p className="text-[11px] text-sky-700">
                          ทักษะก่อนเรียน: <b>{selectedStudent.preTestSkillScore !== undefined ? `${selectedStudent.preTestSkillScore}/100` : '-'}</b>
                        </p>
                        <p className="text-[10px] text-sky-600">
                          {selectedStudent.preTestAt ? `ทำเมื่อ: ${new Date(selectedStudent.preTestAt).toLocaleString('th-TH')}` : ''}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-1">
                        <span className="font-bold text-emerald-900 block text-xs">Post-test (หลังเรียน)</span>
                        <p className="font-display font-bold text-base text-emerald-800">
                          {selectedStudent.postTestScore !== undefined ? `${selectedStudent.postTestScore}%` : 'ยังไม่ทำ'}
                        </p>
                        <p className="text-[11px] text-emerald-700">
                          ทักษะหลังเรียน: <b>{selectedStudent.postTestSkillScore !== undefined ? `${selectedStudent.postTestSkillScore}/100` : '-'}</b>
                        </p>
                        <p className="text-[10px] text-emerald-600">
                          {selectedStudent.postTestAt ? `ทำเมื่อ: ${new Date(selectedStudent.postTestAt).toLocaleString('th-TH')}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-indigo-900 block text-xs">🚀 พัฒนาการ (Gain Delta)</span>
                        <span className="text-[11px] text-indigo-700">คะแนนความรู้หลังเรียนเทียบก่อนเรียน</span>
                      </div>
                      <span className="font-display font-extrabold text-lg text-indigo-700">
                        {selectedStudent.gainDelta !== undefined
                          ? `${selectedStudent.gainDelta > 0 ? '+' : ''}${selectedStudent.gainDelta}%`
                          : 'รอข้อมูลเปรียบเทียบ'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-amber-900 block text-xs">⭐ การประเมินแชตบอต (ตอนที่ 5)</span>
                        <span className="text-[11px] text-amber-700">คะแนนความพึงพอใจต่อระบบเฉลี่ย</span>
                      </div>
                      <span className="font-display font-bold text-base text-amber-800">
                        {selectedStudent.evalPart5Avg ? `${selectedStudent.evalPart5Avg} / 5.0` : 'ยังไม่ประเมิน'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-700 block text-xs">🎮 ด่านที่ผ่าน & คะแนน XP</span>
                        <span className="text-[11px] text-slate-500">
                          ผ่านแล้ว {selectedStudent.stagesCompletedCount}/{selectedStudent.totalStages} ด่าน
                        </span>
                      </div>
                      <span className="font-display font-bold text-base text-detective-800">
                        {selectedStudent.totalXP.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. Knowledge Items (1/0) Tab */}
                {studentModalTab === 'knowledge' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">
                        เฉลยและตรวจข้อสอบรายบุคคล {PART3_KNOWLEDGE_QUESTIONS.length} ข้อ (1 = ถูก, 0 = ผิด)
                      </span>
                      <div className="flex gap-2">
                        <span className="text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
                          Pre: {selectedStudent.preTestScore !== undefined ? `${selectedStudent.preTestScore}%` : '-'}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Post: {selectedStudent.postTestScore !== undefined ? `${selectedStudent.postTestScore}%` : '-'}
                        </span>
                      </div>
                    </div>

                    {(!selectedStudent.preTestKnowledgeAnswers && !selectedStudent.postTestKnowledgeAnswers) ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                        ยังไม่มีข้อมูลคำตอบรายข้อของนักเรียนคนนี้ในระบบ หรือเป็นข้อมูลที่บันทึกก่อนเปิดระบบตรวจคำตอบละเอียด
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {PART3_KNOWLEDGE_QUESTIONS.map((q, idx) => {
                          const preAns = selectedStudent.preTestKnowledgeAnswers ? selectedStudent.preTestKnowledgeAnswers[idx] : undefined;
                          const postAns = selectedStudent.postTestKnowledgeAnswers ? selectedStudent.postTestKnowledgeAnswers[idx] : undefined;
                          const correctIdx = q.correctIndex;

                          const preScore = preAns !== undefined && preAns >= 0 ? (preAns === correctIdx ? 1 : 0) : null;
                          const postScore = postAns !== undefined && postAns >= 0 ? (postAns === correctIdx ? 1 : 0) : null;

                          return (
                            <div
                              key={q.no}
                              className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2 hover:border-detective-300 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-start gap-2">
                                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-extrabold text-slate-700 text-xs flex-shrink-0">
                                    ข้อ {q.no}
                                  </span>
                                  <span className="font-bold text-slate-800 text-xs leading-snug">
                                    {q.question}
                                  </span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                                {/* Pre choice */}
                                <div className="p-2 rounded-xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
                                  <div>
                                    <span className="text-slate-500 font-medium mr-1">ตอบก่อนเรียน:</span>
                                    <span className="font-bold text-slate-800">
                                      {preAns !== undefined && preAns >= 0 ? `${q.choices[preAns]}` : 'ไม่ได้ตอบ'}
                                    </span>
                                  </div>
                                  {preScore !== null && (
                                    <span
                                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex-shrink-0 ml-1.5 ${
                                        preScore === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {preScore === 1 ? '✓ 1 ถูก' : '✗ 0 ผิด'}
                                    </span>
                                  )}
                                </div>

                                {/* Post choice */}
                                <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                                  <div>
                                    <span className="text-slate-500 font-medium mr-1">ตอบหลังเรียน:</span>
                                    <span className="font-bold text-slate-800">
                                      {postAns !== undefined && postAns >= 0 ? `${q.choices[postAns]}` : 'ไม่ได้ตอบ'}
                                    </span>
                                  </div>
                                  {postScore !== null && (
                                    <span
                                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] flex-shrink-0 ml-1.5 ${
                                        postScore === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {postScore === 1 ? '✓ 1 ถูก' : '✗ 0 ผิด'}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-[10px] text-emerald-700 bg-emerald-50/40 px-2 py-1 rounded-lg">
                                <b>เฉลยที่ถูก:</b> {q.choices[correctIdx]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Refusal Skills Items Tab */}
                {studentModalTab === 'skills' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-bold">
                      คะแนนประเมินทักษะการปฏิเสธบุหรี่ไฟฟ้า ({PART4_REFUSAL_SKILLS.length} ข้อ, Likert Scale 1 - 5 ระดับ)
                    </div>

                    {(!selectedStudent.preTestSkillAnswers && !selectedStudent.postTestSkillAnswers) ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                        ยังไม่มีข้อมูลคำตอบรายข้อของนักเรียนคนนี้ในระบบ
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        {PART4_REFUSAL_SKILLS.map((sk, idx) => {
                          const preVal = selectedStudent.preTestSkillAnswers ? selectedStudent.preTestSkillAnswers[idx] : undefined;
                          const postVal = selectedStudent.postTestSkillAnswers ? selectedStudent.postTestSkillAnswers[idx] : undefined;

                          return (
                            <div key={sk.no} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50/50">
                              <div className="flex items-start gap-2 max-w-lg">
                                <span className="text-slate-400 font-bold text-xs">{sk.no}.</span>
                                <span className="text-slate-700 text-xs">{sk.text}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[11px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-lg">
                                  Pre: {preVal !== undefined ? preVal : '-'}
                                </span>
                                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                                  Post: {postVal !== undefined ? postVal : '-'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Chatbot Evaluation 7 Items Tab */}
                {studentModalTab === 'app_eval' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-bold">
                      ผลประเมินความพึงพอใจต่อแอปพลิเคชันแชตบอต (Likert Scale 1 - 5 ระดับ)
                    </div>

                    {!selectedStudent.evalPart5Details || selectedStudent.evalPart5Details.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                        นักเรียนยังไม่ได้ทำแบบประเมินแอปพลิเคชัน (ตอนที่ 5)
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        {PART5_CHATBOT_EVALUATION.map((ev, idx) => {
                          const val = selectedStudent.evalPart5Details ? selectedStudent.evalPart5Details[idx] : undefined;

                          return (
                            <div key={ev.no} className="p-3 flex items-center justify-between gap-2 hover:bg-slate-50/50">
                              <div className="flex items-start gap-2 max-w-lg">
                                <span className="text-slate-400 font-bold text-xs">{ev.no}.</span>
                                <span className="text-slate-700 text-xs">{ev.text}</span>
                              </div>
                              <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg flex-shrink-0">
                                {val !== undefined ? `⭐ ${val} / 5` : '-'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="pt-2 border-t border-slate-100 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="btn-primary py-2 px-5 text-xs font-bold"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================================================================== */}
      {/* Edit Student Profile Modal                                          */}
      {/* =================================================================== */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✏️</span>
                    <h3 className="text-base font-display font-extrabold text-slate-900">
                      แก้ไขข้อมูลผู้เรียน
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    แก้ไขชื่อ, รหัส, ระดับชั้น, หรือโรงเรียน (ซิงค์ขึ้น Google Sheets ทันที)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs">
                {/* Field 1: Real Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ชื่อ-นามสกุลจริง</label>
                  <input
                    type="text"
                    value={editRealName}
                    onChange={(e) => setEditRealName(e.target.value)}
                    placeholder="เช่น ด.ช.รักเรียน ดีเลิศ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-detective-400"
                  />
                </div>

                {/* Field 2: Nickname */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ชื่อเล่นในเกม</label>
                  <input
                    type="text"
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    placeholder="เช่น น้องอาร์ท"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-detective-400"
                  />
                </div>

                {/* Field 3: ID Code */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">รหัสประจำตัว / รหัสนักศึกษา (idCode)</label>
                  <input
                    type="text"
                    value={editIdCode}
                    onChange={(e) => setEditIdCode(e.target.value)}
                    placeholder="เช่น 65123456"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-detective-400"
                  />
                </div>

                {/* Field 4: Grade Level */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">ระดับชั้นเรียน</label>
                  <select
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-detective-400 cursor-pointer"
                  >
                    <optgroup label="🌱 ประถมศึกษา">
                      <option value="ป.4">ป.4</option>
                      <option value="ป.5">ป.5</option>
                      <option value="ป.6">ป.6</option>
                    </optgroup>
                    <optgroup label="🌿 มัธยมศึกษาตอนต้น">
                      <option value="ม.1">ม.1</option>
                      <option value="ม.2">ม.2</option>
                      <option value="ม.3">ม.3</option>
                    </optgroup>
                    <optgroup label="🌳 มัธยมศึกษาตอนปลาย & อาชีวะ">
                      <option value="ม.4">ม.4</option>
                      <option value="ม.5">ม.5</option>
                      <option value="ม.6">ม.6</option>
                      <option value="ปวช.1">ปวช.1</option>
                      <option value="ปวช.2">ปวช.2</option>
                      <option value="ปวช.3">ปวช.3</option>
                      <option value="อื่นๆ">อื่นๆ</option>
                    </optgroup>
                  </select>
                </div>

                {/* Field 5: School */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center justify-between">
                    <span>โรงเรียน / สถาบันการศึกษา</span>
                    <span className="text-[10px] text-detective-600 font-semibold">แตะเพื่อค้นหา</span>
                  </label>
                  <SchoolSelectorModal
                    selectedSchool={editSchool}
                    customSchoolText={editCustomSchool}
                    onSelectSchool={(sch) => setEditSchool(sch)}
                    onChangeCustomText={(txt) => setEditCustomSchool(txt)}
                  />
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-xs"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-detective-600 hover:bg-detective-700 text-white font-bold text-xs shadow-clay flex items-center gap-1.5 transition-all"
                >
                  {isSavingEdit ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      <span>บันทึกการเปลี่ยนแปลง</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {editSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2"
          >
            <span>{editSuccessToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
