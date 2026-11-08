import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore, type StudentRecord, type AdminSettings } from '../store/adminStore';
import { usePlayerStore } from '../store/playerStore';
import {
  fetchAdminStudents,
  fetchAppSettings,
  saveAppSettingsToCloud,
  updateStudentProfileCloud,
  deleteStudentCloud,
  cleanupLoadTestStudents,
} from '../lib/cloudSync';
import { ALL_PRESET_SCHOOLS, OTHER_SCHOOL_VALUE } from '../lib/schools';
import SchoolSelectorModal from '../components/SchoolSelectorModal';
import { sfx } from '../lib/sound';
import { exportFullExcelWorkbook } from '../lib/excelExport';
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

  // Live Clock State for Windows Phone Glance Screen
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Tab State: 'analytics' | 'item_analysis' | 'controls' | 'sheets'
  const [activeTab, setActiveTab] = useState<'hub' | 'analytics' | 'controls' | 'item_analysis' | 'sheets'>('hub');

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

  // Pagination State for high student volume (up to 1,600+ students)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [copyItemAnalysisSuccess, setCopyItemAnalysisSuccess] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isCleaningLoadTest, setIsCleaningLoadTest] = useState(false);

  // Check if simulated load test data exists in memory
  const hasLoadTestData = useMemo(
    () => students.some((s) => s.userIdHash?.startsWith('loadtest_1600_')),
    [students]
  );

  // Collapsible UI Sections for Clean & Uncluttered Teacher UX
  const [showResearchStats, setShowResearchStats] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [showDataDictionary, setShowDataDictionary] = useState(false);
  const [showExportGuide, setShowExportGuide] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [studentViewMode, setStudentViewMode] = useState<'auto' | 'cards' | 'table'>('auto');

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
        setEditSuccessToast(`🔄 ดึงข้อมูลสดสำเร็จแล้ว! พบบัญชีนักเรียนทั้งหมด ${res.students.length} คน`);
        setTimeout(() => setEditSuccessToast(null), 3000);
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
      setFetchError('ไม่สามารถเชื่อมต่อฐานข้อมูลคลาวด์ได้ในขณะนี้');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Cleanup all simulated load test students (1,600 users) safely
  const handleCleanupLoadTest = async () => {
    const ok = window.confirm(
      '⚠️ ยืนยันการล้างข้อมูลจำลอง 1,600 คนออกทั้งหมดหรือไม่?\n\n(ระบบจะลบเฉพาะข้อมูลที่สร้างขึ้นเพื่อทดสอบโหลดเท่านั้น ข้อมูลนักเรียนจริง 55 คนจะปลอดภัยและคงอยู่ครบถ้วน 100%)'
    );
    if (!ok) return;

    sfx.click();
    setIsCleaningLoadTest(true);
    try {
      const res = await cleanupLoadTestStudents('wu2535');
      if (res.ok) {
        sfx.correct();
        setEditSuccessToast(`🧹 ล้างข้อมูลจำลองสำเร็จแล้ว (${res.count || 0} คน) คืนค่าสู่ข้อมูลจริงเรียบร้อย`);
        setTimeout(() => setEditSuccessToast(null), 4000);
        await handleRefreshData();
      } else {
        alert('เกิดข้อผิดพลาดในการล้างข้อมูล: ' + res.error);
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + String(err));
    } finally {
      setIsCleaningLoadTest(false);
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

      const matchGrade =
        selectedGrade === 'all' ||
        s.grade === selectedGrade ||
        (selectedGrade === 'ปวช.' && s.grade?.startsWith('ปวช.'));
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

  // Reset pagination to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGrade, selectedSchool, selectedPeriod, customStartDate, customEndDate, statusFilter]);

  // Total pages and sliced students for ultra-smooth DOM rendering (no lag even with 1,600+ students)
  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  }, [filteredStudents.length, pageSize]);

  const displayedStudents = useMemo(() => {
    if (pageSize === 'all') return filteredStudents;
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Active Preset Mode calculation for Tab 2
  const currentPreset = useMemo<'public' | 'pre_only' | 'gameplay' | 'post_only' | 'bypass_all' | 'custom'>(() => {
    // 1. โหมดเปิดสาธารณะ (Public / Self-Paced) - ทำ Pre -> เล่นเกม -> ทำ Post -> รับเกียรติบัตรอัตโนมัติ
    if (
      admin.preTestEnabled &&
      admin.requirePreTestBeforePlaying &&
      admin.postTestEnabled &&
      !admin.allowBypassStages
    ) {
      return 'public';
    }
    // 2. โหมดคุมสอบก่อนเรียนในห้องเรียน
    if (
      admin.preTestEnabled &&
      admin.requirePreTestBeforePlaying &&
      !admin.postTestEnabled &&
      !admin.allowBypassStages
    ) {
      return 'pre_only';
    }
    // 3. โหมดคุมสอบหลังเรียนในห้องเรียน
    if (
      !admin.preTestEnabled &&
      admin.postTestEnabled &&
      !admin.allowBypassStages
    ) {
      return 'post_only';
    }
    // 4. โหมดทดสอบระบบอิสระ
    if (
      admin.preTestEnabled &&
      admin.postTestEnabled &&
      !admin.requirePreTestBeforePlaying &&
      admin.allowBypassStages
    ) {
      return 'bypass_all';
    }
    return 'custom';
  }, [admin.preTestEnabled, admin.requirePreTestBeforePlaying, admin.postTestEnabled, admin.allowBypassStages]);

  // Apply 1-Click Preset Modes (รองรับทั้งโหมดเปิดสาธารณะ และโหมดคุมสอบในห้องเรียน)
  const handleApplyPreset = async (presetKey: 'public' | 'pre_only' | 'gameplay' | 'post_only' | 'bypass_all') => {
    sfx.click();
    let updates: Partial<AdminSettings> = {};
    let title = '';
    if (presetKey === 'public') {
      updates = {
        preTestEnabled: true,
        requirePreTestBeforePlaying: true,
        postTestEnabled: true,
        allowBypassStages: false,
      };
      title = 'โหมดเปิดสาธารณะ (Public / Self-Paced)';
    } else if (presetKey === 'pre_only') {
      updates = {
        preTestEnabled: true,
        requirePreTestBeforePlaying: true,
        postTestEnabled: false,
        allowBypassStages: false,
      };
      title = 'โหมดสอบก่อนเรียนในชั้นเรียน (Pre-test Only)';
    } else if (presetKey === 'gameplay') {
      updates = {
        preTestEnabled: true,
        requirePreTestBeforePlaying: true,
        postTestEnabled: false,
        allowBypassStages: false,
      };
      title = 'โหมดเข้าเรียนเนื้อหา/เล่นเกม (Gameplay)';
    } else if (presetKey === 'post_only') {
      updates = {
        preTestEnabled: false,
        requirePreTestBeforePlaying: false,
        postTestEnabled: true,
        allowBypassStages: false,
      };
      title = 'โหมดสอบหลังเรียนในชั้นเรียน (Post-test Mode)';
    } else if (presetKey === 'bypass_all') {
      updates = {
        preTestEnabled: true,
        requirePreTestBeforePlaying: false,
        postTestEnabled: true,
        allowBypassStages: true,
      };
      title = 'โหมดทดสอบระบบอิสระ (Bypass All)';
    }

    const nextSettings = { ...admin, ...updates };
    admin.updateSettings(updates);
    const ok = await saveAppSettingsToCloud(nextSettings, 'wu2535');
    if (ok) {
      sfx.correct();
      setEditSuccessToast(`✅ เปิดใช้งาน "${title}" เรียบร้อยแล้ว (ซิงค์ไปยังผู้เรียนทุกคนทันที)`);
      setTimeout(() => setEditSuccessToast(null), 3500);
    }
  };

  // 1-Tap Copy Item Analysis Table to Clipboard
  const handleCopyItemAnalysis = () => {
    sfx.click();
    const headers = [
      'ข้อที่',
      'ข้อคำถาม',
      'เฉลย',
      'ก่อนเรียน ถูก (คน)',
      'ก่อนเรียน ถูก (%)',
      'หลังเรียน ถูก (คน)',
      'หลังเรียน ถูก (%)',
      'พัฒนาการ (Δ %)',
    ];
    const rows = itemAnalysisData.map((item) => [
      item.no,
      `"${item.question.question.replace(/"/g, '""')}"`,
      `"${item.correctChoiceLabel.replace(/"/g, '""')}"`,
      item.preCorrectCount,
      item.prePct !== null ? `${item.prePct}%` : '-',
      item.postCorrectCount,
      item.postPct !== null ? `${item.postPct}%` : '-',
      item.deltaPct !== null ? `${item.deltaPct > 0 ? '+' : ''}${item.deltaPct}%` : '-',
    ]);
    const tsvContent = [headers.join('\t'), ...rows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopyItemAnalysisSuccess(true);
      setTimeout(() => setCopyItemAnalysisSuccess(false), 3000);
    });
  };

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
      `⚠️ ยืนยันการลบข้อมูลของ "${student.realName}" (ID: ${student.idCode || '-'}) ออกจากระบบงานวิจัยหรือไม่?\n\n(ระบบจะลบข้อมูลออกจากฐานข้อมูลคลาวด์ เพื่อให้ข้อมูลสถิติงวดนี้สะอาดถูกต้อง)`
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

  // 1-Click Direct Excel (.xlsx) Exporter with All Sheets
  const handleExportExcel = () => {
    sfx.click();
    setIsExportingExcel(true);
    setTimeout(() => {
      try {
        exportFullExcelWorkbook(filteredStudents, analytics, {
          school: selectedSchool,
          period: selectedPeriod,
        });
      } finally {
        setIsExportingExcel(false);
      }
    }, 60);
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
  // VIEW: Modern Mobile App Login Screen (Dribbble/iOS Style)
  // =========================================================================
  if (!admin.isTeacherAuthenticated && sessionStorage.getItem('hd_teacher_auth') !== '1') {
    return (
      <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-xl shadow-slate-200/60 border border-slate-100 text-center space-y-5">
          {/* Top Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-3xl shadow-sm mx-auto">
            👨‍🏫
          </div>

          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Teacher Admin Portal
            </span>
            <h1 className="text-xl font-display font-extrabold text-slate-900 mt-2">
              แดชบอร์ดอาจารย์ผู้สอน
            </h1>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              โครงการวิจัยแชตบอตเกมมิฟิเคชัน ม.วลัยลักษณ์
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5 pt-1">
            <div>
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setPassError(false);
                  }}
                  placeholder="กรุณากรอกรหัสผ่าน (wu2535)"
                  className={`w-full px-4 py-3.5 rounded-2xl border text-center font-bold tracking-widest text-sm focus:outline-none transition-all ${
                    passError
                      ? 'border-rose-400 bg-rose-50 text-rose-800 ring-2 ring-rose-200'
                      : 'border-slate-200 bg-slate-50/80 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-500'
                  }`}
                  autoFocus
                />
              </div>
              {passError && (
                <p className="text-xs font-bold text-rose-500 mt-1.5 animate-fade-in">
                  ❌ รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้น: wu2535)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-display font-extrabold text-sm shadow-sm active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>🔓</span>
              <span>เข้าสู่แดชบอร์ด</span>
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => nav('/')}
              className="text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center gap-1"
            >
              <span>←</span>
              <span>กลับสู่หน้าแรกของเกม</span>
            </button>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-400 mt-6">
          Health Detective • ระบบฐานข้อมูลคลาวด์ความเร็วสูง Supabase
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW: Main Teacher Admin Dashboard
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F4F6FB] pb-12 sm:pb-16">
      {/* Modern Responsive Top Header (Phone / iPad / PC) - มีข้อความภาษาไทยชัดเจนทุกปุ่ม ไม่ใช้แต่อิโมจิ */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Left: Title & Cloud Status */}
          <div className="flex items-center justify-between sm:justify-start gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-lg sm:text-xl shadow-sm flex-shrink-0">
                👨‍🏫
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Teacher Dashboard
                  </p>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    ออนไลน์
                  </span>
                </div>
                <h1 className="font-display font-black text-slate-900 text-sm sm:text-base leading-tight truncate">
                  อาจารย์ผู้สอน ({analytics.total} คน)
                </h1>
              </div>
            </div>
          </div>

          {/* Right: Action Buttons with Clear Thai Text on ALL Devices */}
          <div className="grid grid-cols-4 sm:flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              title="ดาวน์โหลดรายงาน Excel (.xlsx) ทันที"
              className="px-2 sm:px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] sm:text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95"
            >
              <span className={isExportingExcel ? 'animate-spin' : ''}>📊</span>
              <span className="truncate">{isExportingExcel ? 'กำลังสร้าง...' : 'โหลด Excel'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.click();
                handleRefreshData();
              }}
              disabled={isLoading}
              title="ดึงข้อมูลล่าสุดจากฐานข้อมูลคลาวด์"
              className="px-2 sm:px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200/90 text-[11px] sm:text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95"
            >
              <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
              <span className="truncate">{isLoading ? 'กำลังโหลด' : 'รีเฟรชข้อมูล'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.click();
                nav('/');
              }}
              className="px-2 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] sm:text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95"
              title="กลับไปหน้าแรกของเกม"
            >
              <span>🏠</span>
              <span className="truncate">กลับหน้าเกม</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.click();
                admin.logoutTeacher();
              }}
              className="px-2 sm:px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 active:scale-95"
              title="ออกจากระบบอาจารย์"
            >
              <span>🚪</span>
              <span className="truncate">ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* 5-Tab Navigation Bar: Fits 100% on Phone, iPad & PC without horizontal scrolling */}
        <div className="max-w-5xl mx-auto px-2.5 sm:px-6 pb-2">
          <div className="bg-slate-100/90 p-1 rounded-2xl grid grid-cols-5 gap-1">
            {[
              { id: 'hub', label: 'หน้าหลัก', shortLabel: 'หน้าหลัก', icon: '📊' },
              { id: 'analytics', label: 'รายชื่อนักเรียน', shortLabel: 'นักเรียน', icon: '👥', count: analytics.total },
              { id: 'controls', label: 'โหมดจัดสอบ', shortLabel: 'โหมดสอบ', icon: '⚡' },
              { id: 'item_analysis', label: 'วิเคราะห์ข้อสอบ', shortLabel: 'ข้อสอบ', icon: '🎯' },
              { id: 'sheets', label: 'คลาวด์ & ส่งออก', shortLabel: 'ส่งออก', icon: '☁️' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sfx.click();
                    setActiveTab(tab.id as any);
                  }}
                  className={`py-2 px-1 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className="text-sm sm:text-base leading-none">{tab.icon}</span>
                  <span className="sm:hidden text-[10px] leading-tight truncate max-w-full">{tab.shortLabel}</span>
                  <span className="hidden sm:inline whitespace-nowrap">{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`hidden md:inline-block px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-200/80 text-slate-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 pt-4 space-y-4 sm:space-y-5">
        {/* Load Test Active Banner & 1-Click Safe Cleanup */}
        {hasLoadTestData && (
          <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-sm animate-fade-in">
            <div className="flex items-start gap-3 min-w-0">
              <span className="w-10 h-10 rounded-2xl bg-amber-200/70 text-amber-900 flex items-center justify-center text-xl flex-shrink-0">
                🧪
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-display font-extrabold text-xs sm:text-sm text-amber-950">
                    ตรวจพบข้อมูลจำลองทดสอบ 1,600 คน ในระบบ
                  </p>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px]">
                    โหมดทดสอบโหลด
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  คุณครูสามารถทดสอบคลิกดูรายชื่อ, ค้นหา, สลับหน้า, และดาวน์โหลดไฟล์ Excel (.xlsx) ได้ทันที เมื่อทดสอบเสร็จสิ้นสามารถกดปุ่มล้างข้อมูลด้านขวาได้ทันที
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCleanupLoadTest}
              disabled={isCleaningLoadTest}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0"
            >
              <span>{isCleaningLoadTest ? '⏳' : '🧹'}</span>
              <span>{isCleaningLoadTest ? 'กำลังล้างข้อมูล...' : 'ล้างข้อมูลทดสอบ 1,600 คน'}</span>
            </button>
          </div>
        )}
        {/* =================================================================== */}
        {/* TAB 0: Modern Mobile / Tablet / PC Dashboard                        */}
        {/* =================================================================== */}
        {activeTab === 'hub' && (
          <div className="space-y-4 sm:space-y-5 animate-fade-in">
            {/* 1. HERO STATUS BANNER */}
            <div className="bg-gradient-to-br from-[#0284C7] to-[#0369A1] rounded-3xl p-5 sm:p-6 text-white shadow-sm border border-sky-400/30 space-y-3.5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-semibold text-blue-100 uppercase tracking-wider">
                    สถานะระบบปัจจุบัน
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold text-white backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                    Supabase Live
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-display font-black text-white mt-1 leading-snug">
                  {currentPreset === 'public' && '🌐 โหมดเปิดบริการสู่สาธารณะ (Public 24 ชม.)'}
                  {currentPreset === 'pre_only' && '📝 โหมดสอบก่อนเรียน (Pre-test Only)'}
                  {currentPreset === 'gameplay' && '🎮 โหมดเรียนรู้เนื้อหา (Gameplay 1-8)'}
                  {currentPreset === 'post_only' && '🎯 โหมดสอบหลังเรียน (Post-test Mode)'}
                  {currentPreset === 'bypass_all' && '🔓 โหมดทดสอบอิสระ (Bypass All)'}
                  {currentPreset === 'custom' && '⚙️ โหมดกำหนดค่าเอง (Custom)'}
                </h2>
                <p className="text-xs text-white/90 mt-1 max-w-2xl leading-relaxed">
                  {currentPreset === 'public' && 'ผู้เรียนเข้าใช้งานได้ตลอด 24 ชม. ทำ Pre-test ➔ ด่าน 1-8 ➔ ปลดล็อก Post-test ➔ รับเกียรติบัตรอัตโนมัติ'}
                  {currentPreset === 'pre_only' && 'บังคับทำ Pre-test ก่อนเริ่มด่าน 1 และล็อก Post-test ไว้ก่อนสำหรับคุมสอบในห้อง'}
                  {currentPreset === 'gameplay' && 'ผู้เรียนตะลุยเนื้อหาด่าน 1-8 ตามลำดับ พร้อมพูดคุยกับ AI Chatbot'}
                  {currentPreset === 'post_only' && 'เปิดให้ทำ Post-test เมื่อผ่านด่านครบตามเกณฑ์ พร้อมออกเกียรติบัตรทันที'}
                  {currentPreset === 'bypass_all' && 'ปลดล็อกทุกด่านและข้อสอบ เพื่อให้อาจารย์และกรรมการตรวจทานระบบได้อิสระ'}
                  {currentPreset === 'custom' && 'เปิด-ปิดส่วนประกอบข้อสอบตามการตั้งค่าแบบละเอียด'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 text-white/95">
                  <span>ผู้เรียน: <b className="text-white font-mono text-sm">{analytics.total}</b> คน</span>
                  <span>·</span>
                  <span>เกียรติบัตร: <b className="text-amber-300 font-mono text-sm">{analytics.certCount}</b> ใบ</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('controls')}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-display font-extrabold text-xs shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>⚡ ตั้งค่าโหมดสอบ</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* 2. SERVICES ACTION GRID (โหมดการใช้งานจริง: สาธารณะ + 4 โหมดห้องเรียน) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-extrabold text-slate-700">
                  ⚡ สลับโหมดด่วน (แตะครั้งเดียวมีผลทันที)
                </h3>
                <span className="text-[11px] text-slate-400">ซิงค์ทุกเครื่องอัตโนมัติ</span>
              </div>

              {/* 2.1 FEATURED: โหมดเปิดสาธารณะ */}
              <div
                onClick={() => handleApplyPreset('public')}
                className={`p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl cursor-pointer transition-all active:scale-[0.99] flex items-center justify-between gap-3 border ${
                  currentPreset === 'public'
                    ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-100 shadow-sm'
                    : 'bg-white border-slate-200/90 hover:border-blue-300 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-sm flex-shrink-0 ${
                    currentPreset === 'public' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                  }`}>
                    🌐
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-display font-extrabold text-xs sm:text-sm text-slate-900">
                        โหมดเปิดสาธารณะ (24 ชม.)
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold text-[10px]">
                        ⭐ แนะนำ
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 leading-snug">
                      เล่นตามขั้นตอนอัตโนมัติ: Pre-test ➔ ด่าน 1-8 ➔ Post-test ➔ เกียรติบัตร
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {currentPreset === 'public' ? (
                    <span className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 text-white text-[11px] sm:text-xs font-bold shadow-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white" />
                      <span>เปิดใช้อยู่</span>
                    </span>
                  ) : (
                    <span className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-bold">
                      เลือกโหมดนี้
                    </span>
                  )}
                </div>
              </div>

              {/* 2.2 4 โหมดควบคุมในห้องเรียน (2x2 on Phone, 4 cols on iPad/PC) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    key: 'pre_only',
                    icon: '📝',
                    title: 'คุมสอบก่อนเรียน',
                    sub: 'ทำเฉพาะ Pre-test',
                  },
                  {
                    key: 'gameplay',
                    icon: '🎮',
                    title: 'คุมเรียนในคาบ',
                    sub: 'เล่นด่าน 1-8 + AI',
                  },
                  {
                    key: 'post_only',
                    icon: '🎯',
                    title: 'คุมสอบหลังเรียน',
                    sub: 'เปิดสอบ Post-test',
                  },
                  {
                    key: 'bypass_all',
                    icon: '🔓',
                    title: 'ทดสอบอิสระ',
                    sub: 'ปลดล็อกทุกด่าน',
                  },
                ].map((m) => {
                  const isCurrent = currentPreset === m.key;
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => handleApplyPreset(m.key as any)}
                      className={`p-3.5 rounded-2xl transition-all active:scale-95 text-left sm:text-center flex sm:flex-col items-center gap-2.5 sm:gap-1.5 relative border ${
                        isCurrent
                          ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-100 shadow-sm'
                          : 'bg-white border-slate-200/80 shadow-sm hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl shadow-sm flex-shrink-0 ${
                        isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {m.icon}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-display font-extrabold text-xs truncate ${isCurrent ? 'text-blue-900' : 'text-slate-800'}`}>
                          {m.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {m.sub}
                        </p>
                      </div>
                      {isCurrent && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. ANALYTICS & 3 PILLARS SUMMARY */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-display font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>📊</span> ผลสัมฤทธิ์ภาพรวม (Overview)
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    ทำครบทั้งก่อนและหลังเรียน N = <b>{analytics.pairedCount}</b> คน (จาก {analytics.total} คน)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyResearchSummary}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] sm:text-xs font-bold transition-colors"
                >
                  {copyResearchSuccess ? '✓ คัดลอกแล้ว' : '📋 คัดลอกสรุปบทที่ 4'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-1">
                <div className="p-2.5 rounded-2xl bg-blue-50/50">
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-500">ก่อนเรียน (Pre)</p>
                  <p className="text-xl sm:text-3xl font-display font-black text-blue-600 mt-0.5">
                    {analytics.avgPre !== null ? `${analytics.avgPre}%` : '-'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {analytics.preDoneCount} คน
                  </p>
                </div>

                <div className="p-2.5 rounded-2xl bg-emerald-50/50">
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-500">หลังเรียน (Post)</p>
                  <p className="text-xl sm:text-3xl font-display font-black text-emerald-600 mt-0.5">
                    {analytics.avgPost !== null ? `${analytics.avgPost}%` : '-'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {analytics.postDoneCount} คน
                  </p>
                </div>

                <div className="p-2.5 rounded-2xl bg-indigo-50/50">
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-500">พัฒนาการ (Gain)</p>
                  <p className="text-xl sm:text-3xl font-display font-black text-indigo-600 mt-0.5">
                    {analytics.avgDelta !== null ? `${analytics.avgDelta > 0 ? '+' : ''}${analytics.avgDelta}%` : '-'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    เพิ่มขึ้นเฉลี่ย
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600">
                <div>Hake's ⟨g⟩: <b className="text-amber-700 font-mono">{analytics.hakeGainAvg !== null ? analytics.hakeGainAvg : '-'}</b></div>
                <div>Cohen's d: <b className="text-purple-700 font-mono">{analytics.cohensD !== null ? analytics.cohensD : '-'}</b></div>
                <div>ทักษะปฏิเสธ: <b className="text-slate-800 font-mono">{analytics.postSkillStats.mean || '-'}/100</b></div>
                <div>ประเมินบอท: <b className="text-amber-600 font-mono">⭐ {analytics.evalStats.mean || '-'}/5.0</b></div>
              </div>
            </div>

            {/* 4. FAST EXPORT TOOLS (Balanced 2x2 on Phone, 4 cols on iPad/PC) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-extrabold text-slate-700">
                  ☁️ ส่งออกข้อมูล & ซิงค์คลาวด์ด่วน
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('sheets')}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  ดูเครื่องมือทั้งหมด →
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isExportingExcel}
                  className="p-3.5 sm:p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white shadow-sm transition-all text-left flex items-center gap-3 active:scale-95 border border-emerald-500/80"
                  title="ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ Excel (.xlsx) ครบ 4 ชีต"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center text-xl flex-shrink-0">
                    <span className={isExportingExcel ? 'animate-spin' : ''}>📊</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold leading-tight truncate">
                      {isExportingExcel ? 'กำลังสร้างไฟล์...' : 'ไฟล์ Excel (.xlsx)'}
                    </p>
                    <p className="text-[10px] text-white/85 mt-0.5 truncate">
                      {isExportingExcel ? 'โปรดรอสักครู่' : 'ครบ 4 ชีตในปุ่มเดียว'}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBinaryCsv}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-indigo-300 transition-all text-left flex items-center gap-3 active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl flex-shrink-0">
                    📥
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 leading-tight truncate">ไฟล์ CSV (1/0)</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">สำหรับโปรแกรม SPSS</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTableToClipboard}
                  className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-300 transition-all text-left flex items-center gap-3 active:scale-95"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl flex-shrink-0">
                    📋
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-800 leading-tight truncate">
                      {copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอกตาราง'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">กดวางใน Excel ทันที</p>
                  </div>
                </button>
              </div>
            </div>

            {/* 5. RECENT STUDENTS LIST */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div>
                  <h3 className="font-display font-extrabold text-slate-900 text-xs sm:text-sm">
                    👥 ผู้เรียนล่าสุด (Recent Students)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    แตะที่รายชื่อเพื่อดูผลสอบรายข้อและแก้ไขข้อมูล
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-extrabold flex items-center gap-1 transition-colors"
                >
                  <span>ดูทั้งหมด ({analytics.total})</span>
                  <span>→</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {students.slice(0, 6).map((s, idx) => (
                  <div
                    key={s.userIdHash || idx}
                    onClick={() => setSelectedStudent(s)}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50/40 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-2.5 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100/80 text-blue-700 font-display font-black flex items-center justify-center text-xs flex-shrink-0">
                        {s.nickname ? s.nickname.slice(0, 1) : idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {s.realName} {s.nickname && s.nickname !== s.realName && `(${s.nickname})`}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          ID: <b className="text-slate-700">{s.idCode || '-'}</b> · {s.grade}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 text-right">
                      <span className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-800 text-[10px] font-bold">
                        Pre {s.preTestScore !== undefined ? `${s.preTestScore}%` : '-'}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Post {s.postTestScore !== undefined ? `${s.postTestScore}%` : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 1: Student Analytics & Progress (รายชื่อผู้เรียน & สถิติ)        */}
        {/* =================================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-4 animate-fade-in">
            {/* 1. COMPACT STUDENT TOOLBAR (ค้นหา & กรองด่วน สะอาดตา ไม่รกหน้าจอ) */}
            <div className="bg-white rounded-3xl p-3.5 sm:p-4 shadow-sm border border-slate-100 space-y-3">
              {/* Row 1: Search + School + Quick Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                {/* Search Input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="🔍 ค้นหาชื่อจริง, ชื่อเล่น, รหัส ID..."
                    className="w-full pl-3.5 pr-8 py-2.5 text-xs rounded-2xl border border-slate-200 bg-slate-50/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* School Selector (if multiple) */}
                {availableSchools.length > 1 && (
                  <div className="sm:w-56">
                    <select
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      className="w-full px-3 py-2.5 text-xs font-semibold rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                    >
                      <option value="all">🏫 ทุกโรงเรียน ({availableSchools.length} แห่ง)</option>
                      {availableSchools.map((sch) => (
                        <option key={sch} value={sch}>
                          🏫 {sch}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                    className={`px-3 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                      showAdvancedFilter || selectedGrade !== 'all' || selectedPeriod !== 'all'
                        ? 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="ตัวกรองเพิ่มเติม (ระดับชั้น, ช่วงเวลา)"
                  >
                    <span>⚙️</span>
                    <span>{showAdvancedFilter ? 'ซ่อนตัวกรอง' : 'ตัวกรอง'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      handleRefreshData();
                    }}
                    disabled={isLoading}
                    className="px-3 py-2 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-all shadow-sm"
                    title="ดึงข้อมูลสดจากฐานข้อมูลคลาวด์ Supabase"
                  >
                    <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
                    <span>{isLoading ? 'กำลังดึง...' : 'ดึงสด'}</span>
                  </button>
                </div>
              </div>

              {/* Advanced Filter Drawer (Only when showAdvancedFilter is true) */}
              {showAdvancedFilter && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-2 text-xs animate-fade-in">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">ตัวกรองละเอียด:</span>
                  {/* Grade Dropdown */}
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800"
                  >
                    <option value="all">🎓 ทุกระดับชั้น</option>
                    <option value="ป.4">ป.4</option>
                    <option value="ป.5">ป.5</option>
                    <option value="ป.6">ป.6</option>
                    <option value="ม.1">ม.1</option>
                    <option value="ม.2">ม.2</option>
                    <option value="ม.3">ม.3</option>
                    <option value="ม.4">ม.4</option>
                    <option value="ม.5">ม.5</option>
                    <option value="ม.6">ม.6</option>
                    <option value="ปวช.">ปวช.</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </select>

                  {/* Period Dropdown */}
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-800"
                  >
                    <option value="all">📅 ตลอดเวลาทั้งหมด</option>
                    <option value="today">📅 วันนี้</option>
                    <option value="7days">📅 7 วันล่าสุด</option>
                    <option value="30days">📅 30 วันล่าสุด</option>
                    <option value="custom">📅 กำหนดช่วงวันที่เอง</option>
                  </select>

                  {selectedPeriod === 'custom' && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-2 py-1 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-2 py-1 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs"
                      />
                    </div>
                  )}

                  {(selectedGrade !== 'all' || selectedPeriod !== 'all' || customStartDate || customEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGrade('all');
                        setSelectedPeriod('all');
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      className="text-[11px] text-blue-600 hover:underline font-bold ml-auto"
                    >
                      ล้างตัวกรอง
                    </button>
                  )}
                </div>
              )}

              {/* Row 2: Status Filter Chips (Pill Scroll) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 text-xs scrollbar-none">
                {[
                  { id: 'all', label: 'ทั้งหมด', count: students.length, icon: '👥' },
                  { id: 'both', label: 'ทำครบ Pre & Post', count: students.filter((s) => s.preTestScore !== undefined && s.postTestScore !== undefined).length, icon: '✨' },
                  { id: 'pre_only', label: 'ค้าง Post-test', count: students.filter((s) => s.preTestScore !== undefined && s.postTestScore === undefined).length, icon: '⏳' },
                  { id: 'certified', label: 'ได้เกียรติบัตร', count: students.filter((s) => !!s.certificateNo).length, icon: '🏆' },
                  { id: 'hero_done', label: 'จบด่าน 1-8', count: students.filter((s) => (s.heroStagesCount !== undefined ? s.heroStagesCount >= 8 : s.stagesCompletedCount >= 8)).length, icon: '🕹️' },
                ].map((chip) => {
                  const isActive = statusFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setStatusFilter(chip.id as any);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-slate-100'
                      }`}
                    >
                      <span>{chip.icon}</span>
                      <span>{chip.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                        }`}
                      >
                        {chip.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Row 3: Count, View Mode Switcher (iPad/PC) and 1-Click Export Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    แสดง <b className="text-blue-700 font-extrabold">{filteredStudents.length}</b> จาก {students.length} คน
                  </span>
                  <div className="hidden sm:inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/70">
                    <button
                      type="button"
                      onClick={() => setStudentViewMode('cards')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        studentViewMode === 'cards' || studentViewMode === 'auto'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🗂️ การ์ด
                    </button>
                    <button
                      type="button"
                      onClick={() => setStudentViewMode('table')}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        studentViewMode === 'table'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📋 ตาราง
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 flex items-center gap-1 transition-all shadow-sm"
                    title="ดาวน์โหลดไฟล์ Excel (.xlsx) ทันที"
                  >
                    <span>📊</span>
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyTableToClipboard}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-[11px] font-bold hover:bg-slate-100 flex items-center gap-1 transition-all"
                    title="คัดลอกตารางไปวางใน Excel"
                  >
                    <span>📋</span>
                    <span>{copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadBinaryCsv}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold hover:bg-indigo-100 flex items-center gap-1 transition-all"
                    title="ดาวน์โหลดไฟล์ CSV 1/0 สำหรับ SPSS"
                  >
                    <span>📥</span>
                    <span>CSV (1/0)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. COMPACT STATS PILLS + COLLAPSIBLE RESEARCH STATS */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
              {/* 4 Quick Metric Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Pre-test เฉลี่ย</p>
                  <p className="text-lg font-display font-black text-blue-900 mt-0.5">
                    {analytics.avgPre !== null ? `${analytics.avgPre}%` : '-'}
                  </p>
                  <p className="text-[10px] text-blue-500">{analytics.preDoneCount} คน</p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Post-test เฉลี่ย</p>
                  <p className="text-lg font-display font-black text-emerald-900 mt-0.5">
                    {analytics.avgPost !== null ? `${analytics.avgPost}%` : '-'}
                  </p>
                  <p className="text-[10px] text-emerald-500">{analytics.postDoneCount} คน</p>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-center">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase">พัฒนาการ (Gain)</p>
                  <p className="text-lg font-display font-black text-indigo-900 mt-0.5">
                    {analytics.avgDelta !== null ? `${analytics.avgDelta > 0 ? '+' : ''}${analytics.avgDelta}%` : '-'}
                  </p>
                  <p className="text-[10px] text-indigo-500">เฉลี่ยเพิ่มขึ้น</p>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
                  <p className="text-[10px] font-bold text-amber-600 uppercase">เกียรติบัตร</p>
                  <p className="text-lg font-display font-black text-amber-900 mt-0.5">
                    {analytics.certCount} <span className="text-xs font-normal text-slate-500">/{analytics.total}</span>
                  </p>
                  <p className="text-[10px] text-amber-600">สำเร็จการศึกษา</p>
                </div>
              </div>

              {/* Collapsible Research Stats Toggle Button */}
              <button
                type="button"
                onClick={() => setShowResearchStats(!showResearchStats)}
                className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/70 flex items-center justify-between gap-2 transition-all"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span>📊</span>
                  <span className="truncate">สถิติงานวิจัย (Hake's Gain / Cohen's d)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold flex-shrink-0">
                    N={analytics.pairedCount}
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[11px] flex-shrink-0">{showResearchStats ? '▲ ซ่อน' : '▼ ดูสถิติ'}</span>
              </button>

              {/* Research Statistics Expanded Box */}
              {showResearchStats && (
                <div className="pt-2 space-y-3 animate-fade-in border-t border-slate-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      สรุปข้อมูลเปรียบเทียบก่อน-หลังเรียนสำหรับนำไปเขียนเล่มวิจัย/วิทยานิพนธ์
                    </p>
                    <button
                      type="button"
                      onClick={handleCopyResearchSummary}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <span>📋</span>
                      <span>{copyResearchSuccess ? 'คัดลอกสำเร็จ!' : 'คัดลอกสรุปสถิติใส่ Word'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                    {/* Column 1 */}
                    <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-3 space-y-2">
                      <p className="font-extrabold text-sky-900">🎯 1. ผลสัมฤทธิ์ความรู้ ({PART3_KNOWLEDGE_QUESTIONS.length} ข้อ)</p>
                      <div className="space-y-1 text-slate-700 text-[11px]">
                        <div className="flex justify-between">
                          <span>ก่อนเรียน (Pre):</span>
                          <b>{analytics.pairedPreStats.str}%</b>
                        </div>
                        <div className="flex justify-between">
                          <span>หลังเรียน (Post):</span>
                          <b className="text-emerald-700">{analytics.pairedPostStats.str}%</b>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-sky-200">
                          <span>Mean Gain:</span>
                          <b className="text-indigo-700">
                            {analytics.pairedDeltaStats.mean >= 0 ? `+${analytics.pairedDeltaStats.mean}%` : `${analytics.pairedDeltaStats.mean}%`}
                          </b>
                        </div>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-3 space-y-2">
                      <p className="font-extrabold text-amber-900">📈 2. ประสิทธิผล & ขนาดอิทธิพล</p>
                      <div className="space-y-1 text-slate-700 text-[11px]">
                        <div className="flex justify-between">
                          <span>Hake's Gain ⟨g⟩:</span>
                          <b className="text-amber-800">{analytics.hakeGainAvg !== null ? analytics.hakeGainAvg : '-'}</b>
                        </div>
                        <p className="text-[10px] text-amber-700">{analytics.hakeGainCategory}</p>
                        <div className="flex justify-between pt-1 border-t border-amber-200">
                          <span>Cohen's d:</span>
                          <b className="text-purple-700">{analytics.cohensD !== null ? analytics.cohensD : '-'}</b>
                        </div>
                        <p className="text-[10px] text-purple-700">{analytics.cohensCategory}</p>
                      </div>
                    </div>

                    {/* Column 3 */}
                    <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3 space-y-2">
                      <p className="font-extrabold text-emerald-900">🛡️ 3. ทักษะปฏิเสธ & พึงพอใจ</p>
                      <div className="space-y-1 text-slate-700 text-[11px]">
                        <div className="flex justify-between">
                          <span>ทักษะก่อน:</span>
                          <b>{analytics.preSkillStats.str}</b>
                        </div>
                        <div className="flex justify-between">
                          <span>ทักษะหลัง:</span>
                          <b>{analytics.postSkillStats.str}</b>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-emerald-200">
                          <span>ความพึงพอใจบอท:</span>
                          <b className="text-amber-600">⭐ {analytics.evalStats.str}/5.0</b>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-3">
                <span className="text-4xl">📝</span>
                <h3 className="font-display font-bold text-slate-800 text-base">
                  ยังไม่มีข้อมูลผู้เรียนที่ตรงกับเงื่อนไข
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  เมื่อนักเรียนเริ่มเข้าใช้งาน ทำแบบทดสอบก่อนเรียน หรือเล่นเกม ข้อมูลคะแนนและพัฒนาการจะปรากฏที่นี่ทันที
                </p>
              </div>
            )}

            {/* =============================================================== */}
            {/* 1.2 A: CARDS VIEW (1 col on Phone, 2 cols on iPad/PC)           */}
            {/* =============================================================== */}
            {filteredStudents.length > 0 && studentViewMode !== 'table' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {displayedStudents.map((s, idx) => {
                  const globalIdx = pageSize === 'all' ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                  return (
                  <div
                    key={s.userIdHash || idx}
                    onClick={() => setSelectedStudent(s)}
                    className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 space-y-3 cursor-pointer hover:border-blue-300 active:scale-[0.99] transition-all flex flex-col justify-between"
                  >
                    {/* Row 1: Student avatar + name + cert */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 font-display font-black flex items-center justify-center text-xs flex-shrink-0 border border-blue-100">
                          {globalIdx}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {s.realName} {s.nickname && s.nickname !== s.realName && `(${s.nickname})`}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            ID: <b className="text-blue-700">{s.idCode || '-'}</b> · {s.grade} · {s.school}
                          </p>
                        </div>
                      </div>

                      {s.certificateNo ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/80 flex items-center gap-1 flex-shrink-0">
                          🏆 {s.certificateNo.slice(-4)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded-full flex-shrink-0">
                          กำลังเรียน
                        </span>
                      )}
                    </div>

                    {/* Row 2: 3 Score Pillars */}
                    <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-50/90 p-2.5 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold">ก่อนเรียน (Pre)</p>
                        <p className="font-display font-black text-sm text-blue-600 mt-0.5">
                          {s.preTestScore !== undefined ? `${s.preTestScore}%` : '-'}
                        </p>
                      </div>
                      <div className="border-x border-slate-200/70">
                        <p className="text-[10px] text-slate-500 font-bold">หลังเรียน (Post)</p>
                        <p className="font-display font-black text-sm text-emerald-600 mt-0.5">
                          {s.postTestScore !== undefined ? `${s.postTestScore}%` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold">พัฒนาการ</p>
                        <p className={`font-display font-black text-sm mt-0.5 ${
                          s.gainDelta !== undefined && s.gainDelta >= 0 ? 'text-indigo-600' : 'text-rose-600'
                        }`}>
                          {s.gainDelta !== undefined ? `${s.gainDelta > 0 ? '+' : ''}${s.gainDelta}%` : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Row 3: Action Buttons */}
                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-[11px] text-slate-500 font-medium">
                        🎮 ด่าน {s.stagesCompletedCount}/{s.totalStages || 20} · <b className="text-slate-700">{s.totalXP.toLocaleString()} XP</b>
                      </span>
                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEdit(s, e)}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 transition-colors"
                        >
                          ✏️ แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteStudent(s, e)}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200/80 transition-colors"
                          title="ลบข้อมูล"
                        >
                          🗑️ ลบ
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* =============================================================== */}
            {/* 1.2 B: FULL TABLE VIEW (When toggled to Table mode on iPad/PC)   */}
            {/* =============================================================== */}
            {filteredStudents.length > 0 && studentViewMode === 'table' && (
              <div className="bg-white rounded-3xl shadow-clay border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
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
                      {displayedStudents.map((s, idx) => {
                        const globalIdx = pageSize === 'all' ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                        return (
                        <tr
                          key={s.userIdHash || idx}
                          onClick={() => setSelectedStudent(s)}
                          className="hover:bg-sky-50/40 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {globalIdx}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* PAGINATION CONTROLS (Responsive for both Mobile & Desktop)     */}
            {/* =============================================================== */}
            {filteredStudents.length > 0 && (
              <div className="bg-white rounded-2xl p-3 shadow-clay border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                {/* Info */}
                <div className="text-slate-600 text-xs text-center sm:text-left">
                  แสดง{' '}
                  <b className="text-detective-800 font-extrabold">
                    {pageSize === 'all'
                      ? `1 - ${filteredStudents.length}`
                      : `${Math.min((currentPage - 1) * pageSize + 1, filteredStudents.length)} - ${Math.min(
                          currentPage * pageSize,
                          filteredStudents.length
                        )}`}
                  </b>{' '}
                  จากทั้งหมด <b className="text-slate-900 font-extrabold">{filteredStudents.length}</b> คน
                </div>

                {/* Page Controls */}
                {pageSize !== 'all' && totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setCurrentPage((p) => Math.max(1, p - 1));
                      }}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      ‹
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          (p >= currentPage - 1 && p <= currentPage + 1)
                      )
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && p - prev > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span className="px-1 text-slate-400 font-bold">...</span>}
                            <button
                              type="button"
                              onClick={() => {
                                sfx.click();
                                setCurrentPage(p);
                              }}
                              className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                                currentPage === p
                                  ? 'bg-detective-600 text-white shadow-sm'
                                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setCurrentPage((p) => Math.min(totalPages, p + 1));
                      }}
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      ›
                    </button>
                  </div>
                )}

                {/* Page Size Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-semibold">แสดงหน้าละ:</span>
                  {[25, 50, 100, 'all'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setPageSize(sz as any);
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        pageSize === sz
                          ? 'bg-detective-100 text-detective-800 border border-detective-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-transparent'
                      }`}
                    >
                      {sz === 'all' ? 'ทั้งหมด' : sz}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: Item Analysis & Distractor Distribution (21 ข้อ & ตัวลวง)       */}
        {/* =================================================================== */}
        {activeTab === 'item_analysis' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Sub-tabs & Export Bar for Item Analysis */}
            <div className="bg-white p-3.5 sm:p-4 rounded-3xl shadow-sm border border-slate-200/80 space-y-3">
              {/* Row 1: 3-Column Sub-tab Switcher (Fits 100% on Phone, iPad, PC) */}
              <div className="grid grid-cols-3 gap-1.5 bg-slate-100/90 p-1 rounded-2xl">
                {[
                  { id: 'knowledge', label: `🎯 ความรู้ (${PART3_KNOWLEDGE_QUESTIONS.length} ข้อ)`, shortLabel: `🎯 ความรู้ (${PART3_KNOWLEDGE_QUESTIONS.length})` },
                  { id: 'skills', label: `🛡️ ทักษะปฏิเสธ (${PART4_REFUSAL_SKILLS.length} ข้อ)`, shortLabel: `🛡️ ทักษะ (${PART4_REFUSAL_SKILLS.length})` },
                  { id: 'app_eval', label: `⭐ ประเมินบอท (${PART5_CHATBOT_EVALUATION.length} ข้อ)`, shortLabel: `⭐ ประเมิน (${PART5_CHATBOT_EVALUATION.length})` },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => {
                      sfx.click();
                      setItemAnalysisSubTab(st.id as any);
                    }}
                    className={`py-2 px-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center truncate ${
                      itemAnalysisSubTab === st.id
                        ? 'bg-blue-600 text-white shadow-sm font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <span className="sm:hidden">{st.shortLabel}</span>
                    <span className="hidden sm:inline">{st.label}</span>
                  </button>
                ))}
              </div>

              {/* Row 2: School Filter + SPSS Quick Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {availableSchools.length > 1 ? (
                  <div className="w-full sm:w-52">
                    <select
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                    >
                      <option value="all">🏫 ทุกโรงเรียน ({availableSchools.length} แห่ง)</option>
                      {availableSchools.map((sch) => (
                        <option key={sch} value={sch}>
                          🏫 {sch}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-500 font-medium">
                    ส่งออกข้อมูลวิเคราะห์รายข้อ (SPSS / Excel):
                  </span>
                )}

                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 flex items-center gap-1 transition-all shadow-sm"
                  >
                    <span>📊</span>
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyItemAnalysis}
                    className="px-2.5 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-bold hover:bg-sky-100 flex items-center gap-1 transition-all"
                  >
                    <span>📋</span>
                    <span>{copyItemAnalysisSuccess ? 'คัดลอกแล้ว!' : 'คัดลอกตารางรายข้อ'}</span>
                  </button>
                  <button
                    onClick={handleCopyBinaryToClipboard}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold hover:bg-indigo-100 flex items-center gap-1 transition-all"
                  >
                    <span>📋</span>
                    <span>{copyBinarySuccess ? 'คัดลอก 1/0 แล้ว!' : 'คัดลอก 1/0 (SPSS)'}</span>
                  </button>
                  <button
                    onClick={handleDownloadBinaryCsv}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold hover:bg-slate-200 flex items-center gap-1 transition-all"
                  >
                    <span>📥</span>
                    <span>CSV 1/0</span>
                  </button>
                </div>
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
              <div className="space-y-3.5">
                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-1">
                  <h2 className="text-sm sm:text-base font-display font-extrabold text-slate-900 flex items-center gap-2">
                    <span>🛡️</span> การประเมินทักษะการปฏิเสธบุหรี่ไฟฟ้า ({PART4_REFUSAL_SKILLS.length} ข้อ)
                  </h2>
                  <p className="text-xs text-slate-500">
                    เกณฑ์ Likert Scale 1 - 5 ระดับ เปรียบเทียบค่าเฉลี่ยก่อนเรียน (Pre) และหลังเรียน (Post)
                  </p>
                </div>

                {/* Mobile & iPad Card View */}
                <div className="grid grid-cols-1 md:hidden gap-2.5">
                  {refusalSkillsAnalysis.map((sk) => (
                    <div
                      key={sk.no}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-sm space-y-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-extrabold text-xs flex-shrink-0">
                          ข้อ {sk.no}
                        </span>
                        <p className="text-xs font-bold text-slate-800 leading-snug">
                          {sk.item.text}
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px]">
                        <div>
                          <span className="text-[10px] text-slate-400 block">ก่อนเรียน</span>
                          <b className="text-sky-700">{sk.preAvg !== null ? sk.preAvg.toFixed(2) : '-'}</b>
                        </div>
                        <div className="border-x border-slate-200/70">
                          <span className="text-[10px] text-slate-400 block">หลังเรียน</span>
                          <b className="text-emerald-700">{sk.postAvg !== null ? sk.postAvg.toFixed(2) : '-'}</b>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">ผลต่าง (Δ)</span>
                          <b className={sk.delta !== null && sk.delta >= 0 ? 'text-indigo-700' : 'text-rose-600'}>
                            {sk.delta !== null ? (sk.delta > 0 ? `+${sk.delta.toFixed(2)}` : sk.delta.toFixed(2)) : '-'}
                          </b>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block bg-white rounded-3xl shadow-clay border border-slate-100 overflow-hidden">
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
        {/* TAB 2: Exam & App Controls (โหมดจัดสอบ & ตั้งค่าระบบแบบ Mobile-First) */}
        {/* =================================================================== */}
        {activeTab === 'controls' && (
          <div className="space-y-4 animate-fade-in max-w-2xl mx-auto">
            {/* 1. STATUS HEADER CARD (บอกสถานะปัจจุบันชัดเจน ไม่ว่างเปล่า) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm sm:text-base font-display font-extrabold text-slate-900 flex items-center gap-2">
                  <span>⚡</span> โหมดควบคุมระบบ (System Preset Modes)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  แตะปุ่มเพื่อสลับโหมดทันที ซิงค์ไปยังนักเรียนทุกคนแบบเรียลไทม์
                </p>
              </div>

              {/* Status Badge with Live Indicator */}
              <div className="flex items-center gap-1.5 self-start sm:self-center flex-shrink-0">
                <span className="text-[11px] font-bold text-slate-400">สถานะขณะนี้:</span>
                <span className="px-3 py-1.5 rounded-2xl text-xs font-bold border border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  {currentPreset === 'public' && '🌐 โหมดเปิดสาธารณะ (24 ชม.)'}
                  {currentPreset === 'pre_only' && '📝 โหมดสอบก่อนเรียน (Pre-test)'}
                  {currentPreset === 'gameplay' && '🎮 โหมดเรียนรู้ในคาบ (Gameplay)'}
                  {currentPreset === 'post_only' && '🎯 โหมดสอบหลังเรียน (Post-test)'}
                  {currentPreset === 'bypass_all' && '🔓 โหมดทดสอบอิสระ (Bypass All)'}
                  {currentPreset === 'custom' && '⚙️ กำหนดค่าเอง (Custom)'}
                </span>
              </div>
            </div>

            {/* 2. FEATURED: โหมดเปิดบริการสู่สาธารณะ */}
            <div
              onClick={() => handleApplyPreset('public')}
              className={`p-4 sm:p-5 rounded-3xl cursor-pointer transition-all active:scale-[0.98] border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                currentPreset === 'public'
                  ? 'bg-blue-50/50 border-blue-600 ring-2 ring-blue-100 shadow-sm text-slate-900'
                  : 'bg-white hover:border-blue-300 text-slate-800 border-slate-200/90'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm ${
                  currentPreset === 'public' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                }`}>
                  🌐
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-extrabold text-sm sm:text-base text-slate-900">
                      โหมดเปิดบริการสู่สาธารณะ (Public Release)
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-extrabold text-[10px] bg-blue-100 text-blue-800">
                      ⭐ แนะนำสำหรับปล่อยจริง
                    </span>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed text-slate-500">
                    ผู้เรียนเล่นเองได้ 24 ชั่วโมง: <b>Pre-test ➔ ผจญภัยด่าน 1-8 ➔ ปลดล็อก Post-test อัตโนมัติ ➔ รับเกียรติบัตร</b>
                  </p>
                </div>
              </div>

              <div className="self-end sm:self-center flex-shrink-0">
                <span className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                  currentPreset === 'public'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}>
                  {currentPreset === 'public' ? '✓ กำลังเปิดใช้งาน' : 'แตะสลับเป็นโหมดนี้'}
                </span>
              </div>
            </div>

            {/* 3. IN-CLASS 4 PRESETS GRID */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  โหมดคุมสอบในชั้นเรียน & ทดสอบระบบ (In-Class & Sandbox)
                </span>
                <span className="text-[11px] text-slate-400">แตะเพื่อสลับทันที</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    key: 'pre_only',
                    icon: '📝',
                    title: 'คุมสอบก่อนเรียน',
                    sub: 'เปิดเฉพาะ Pre-test ล็อกเกม',
                  },
                  {
                    key: 'gameplay',
                    icon: '🎮',
                    title: 'เรียนรู้ในคาบ',
                    sub: 'ด่าน 1-8 พร้อม AI',
                  },
                  {
                    key: 'post_only',
                    icon: '🎯',
                    title: 'คุมสอบหลังเรียน',
                    sub: 'เปิด Post ออกเกียรติบัตร',
                  },
                  {
                    key: 'bypass_all',
                    icon: '🔓',
                    title: 'ทดสอบอิสระ',
                    sub: 'ปลดล็อกทุกด่านตรวจงาน',
                  },
                ].map((m) => {
                  const isCurrent = currentPreset === m.key;
                  return (
                    <div
                      key={m.key}
                      onClick={() => handleApplyPreset(m.key as any)}
                      className={`p-3.5 sm:p-4 rounded-3xl cursor-pointer transition-all active:scale-95 text-center flex flex-col items-center justify-between gap-2 border min-h-[135px] relative ${
                        isCurrent
                          ? 'bg-blue-50/40 border-blue-600 ring-2 ring-blue-100 shadow-sm text-slate-900'
                          : 'bg-white hover:border-slate-300 text-slate-800 border-slate-200/90 shadow-sm'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                        isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {m.icon}
                      </div>
                      <div>
                        <p className={`font-display font-extrabold text-xs sm:text-sm ${isCurrent ? 'text-blue-900' : 'text-slate-800'}`}>
                          {m.title}
                        </p>
                        <p className="text-[10px] mt-0.5 leading-tight text-slate-400">
                          {m.sub}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCurrent ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {isCurrent ? '✓ เปิดอยู่' : 'เลือก'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. ADVANCED SETTINGS ACCORDION (การตั้งค่าสวิตช์แบบละเอียด - พับเก็บได้ ไม่รกหน้าจอ) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-100 space-y-3">
              <button
                type="button"
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">⚙️</span>
                  <span className="font-extrabold text-sm">การตั้งค่าสวิตช์แบบละเอียด (Fine-grained Controls)</span>
                </div>
                <span className="text-slate-400 font-mono text-xs">
                  {showAdvancedSettings ? '▲ ซ่อนการตั้งค่า' : '▼ เปิดดูสวิตช์ (11 รายการ)'}
                </span>
              </button>

              {showAdvancedSettings && (
                <div className="space-y-4 pt-3 border-t border-slate-100 animate-fade-in text-xs">
                  {/* Group 1: Core Exam Access */}
                  <div className="space-y-2">
                    <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <span>📌 1.</span> การเข้าถึงแบบทดสอบวิจัย (Pre-test / Post-test)
                    </p>
                    <div className="space-y-2">
                      {/* Control 1: Pre-test */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-800">📝 เปิดให้ทำแบบทดสอบก่อนเรียน (Pre-test)</p>
                          <p className="text-[10px] text-slate-500">เปิดให้นักเรียนทำแบบทดสอบวัดผลก่อนเริ่มเล่นเนื้อหา</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('preTestEnabled', !admin.preTestEnabled)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                            admin.preTestEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              admin.preTestEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Control 1.1: Mandatory Pre-test Gatekeeping */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-800">🔒 บังคับทำ Pre-test ก่อนเริ่มเกม</p>
                          <p className="text-[10px] text-slate-500">นักเรียนต้องทำ Pre-test ให้เสร็จก่อนจึงจะปลดล็อกด่านแรก</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('requirePreTestBeforePlaying', !admin.requirePreTestBeforePlaying)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                            admin.requirePreTestBeforePlaying ? 'bg-indigo-600' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              admin.requirePreTestBeforePlaying ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Control 2: Post-test */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-800">🎯 เปิดให้ทำแบบทดสอบหลังเรียน (Post-test)</p>
                          <p className="text-[10px] text-slate-500">เปิดให้นักเรียนทำแบบทดสอบวัดผลหลังเรียนจบ</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('postTestEnabled', !admin.postTestEnabled)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                            admin.postTestEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              admin.postTestEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Control 3: Bypass stage requirement */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-800">🔓 ปลดล็อกให้ข้ามด่านมาทำข้อสอบได้ทันที</p>
                          <p className="text-[10px] text-slate-500">สามารถกดทำ Post-test ได้ทันทีแม้ยังเล่นไม่จบ 8 ด่าน</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('allowBypassStages', !admin.allowBypassStages)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                            admin.allowBypassStages ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              admin.allowBypassStages ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Group 2: Modular Test Sections */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <span>✂️ 2.</span> ปรับลด/เลือกตอนของแบบทดสอบ
                    </p>
                    <div className="space-y-2">
                      {/* Part 2 Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-800">🚬 ตอนที่ 2: แบบสำรวจพฤติกรรม (3 ข้อ)</p>
                          <p className="text-[10px] text-slate-500">สำรวจประวัติการสูบบุหรี่ไฟฟ้า</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('part2Enabled', !admin.part2Enabled)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                            admin.part2Enabled ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              admin.part2Enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Part 3 Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-800">🧠 ตอนที่ 3: แบบทดสอบความรู้บุหรี่ไฟฟ้า</p>
                          <p className="text-[10px] text-slate-500">แบบทดสอบวัดผลสัมฤทธิ์ความรู้</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('part3Enabled', !admin.part3Enabled)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                            admin.part3Enabled ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              admin.part3Enabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Group 3: Anti-Cheat & Display */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                      <span>🛡️ 3.</span> การแสดงผลและการป้องกันการลอก
                    </p>
                    <div className="space-y-2">
                      {/* Randomize Questions */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-800">🔀 สลับลำดับข้อสอบอัตโนมัติ (Randomize)</p>
                          <p className="text-[10px] text-slate-500">สลับข้อสอบแบบสุ่ม ป้องกันการลอกกันในห้อง</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('randomizeQuestions', !admin.randomizeQuestions)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                            admin.randomizeQuestions ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              admin.randomizeQuestions ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Show Explanations */}
                      <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
                        <div>
                          <p className="font-bold text-slate-800">📖 แสดงเฉลยและคำอธิบายหลังทำแบบทดสอบ</p>
                          <p className="text-[10px] text-slate-500">แสดงเฉลยละเอียดเมื่อทำข้อสอบเสร็จ</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('showExplanations', !admin.showExplanations)}
                          className={`w-11 h-6 rounded-full p-0.5 transition-colors ${
                            admin.showExplanations ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                              admin.showExplanations ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: Cloud Database & Academic Export Hub (Responsive Bento UI)   */}
        {/* =================================================================== */}
        {activeTab === 'sheets' && (
          <div className="space-y-4 sm:space-y-5 animate-fade-in">
            {/* 1. COMPACT CLOUD STATUS BAR */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center text-2xl flex-shrink-0">
                  ☁️
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="text-sm sm:text-base font-display font-extrabold text-slate-900">
                      ฐานข้อมูลคลาวด์ & ส่งออกงานวิจัย
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Supabase Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    บันทึกอัตโนมัติระดับเสี้ยววินาที · ผู้เรียนในระบบ <b className="text-slate-800">{analytics.total} คน</b> · RLS ปลอดภัย 100%
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  sfx.click();
                  handleRefreshData();
                }}
                disabled={isLoading}
                className="px-3.5 py-2 rounded-2xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 self-stretch sm:self-center flex-shrink-0"
              >
                <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
                <span>{isLoading ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลสดจากคลาวด์'}</span>
              </button>
            </div>

            {/* 2. PRIMARY HERO CARD: 1-CLICK EXCEL (.XLSX) WORKBOOK */}
            <div className="bg-gradient-to-br from-emerald-700 to-teal-800 rounded-3xl p-5 sm:p-6 text-white shadow-sm border border-emerald-500/30 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold tracking-wide uppercase">
                    ⭐ แนะนำสำหรับอาจารย์และงานวิจัย
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-black leading-snug">
                    📊 ดาวน์โหลดรายงานผลไฟล์ Excel (.xlsx)
                  </h3>
                  <p className="text-xs text-emerald-50/90 leading-relaxed">
                    กดปุ่มเดียวได้ไฟล์ Excel แท้ลงเครื่องทันที (ทั้งในโทรศัพท์ ไอแพด และคอมพิวเตอร์) แยกแผ่นชีตพร้อมใช้งานครบทั้ง 4 แผ่น:
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isExportingExcel}
                  className="w-full md:w-auto px-5 py-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 disabled:opacity-75 font-display font-black text-xs sm:text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0"
                >
                  <span className={`text-lg ${isExportingExcel ? 'animate-spin' : ''}`}>
                    {isExportingExcel ? '⏳' : '📥'}
                  </span>
                  <span>{isExportingExcel ? 'กำลังสร้างไฟล์ Excel...' : 'กดดาวน์โหลด Excel (.xlsx) ทันที'}</span>
                </button>
              </div>

              {/* 4 Sheets Preview Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/20 text-[11px]">
                <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2">
                  <b className="block text-white">1. Players</b>
                  <span className="text-emerald-100 text-[10px]">รายชื่อ & คะแนนรวม</span>
                </div>
                <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2">
                  <b className="block text-white">2. Item_Binary</b>
                  <span className="text-emerald-100 text-[10px]">คะแนนรายข้อ 1/0 (SPSS)</span>
                </div>
                <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2">
                  <b className="block text-white">3. Research</b>
                  <span className="text-emerald-100 text-[10px]">สถิติวิจัย บทที่ 4</span>
                </div>
                <div className="bg-white/10 border border-white/10 rounded-xl px-3 py-2">
                  <b className="block text-white">4. Certificates</b>
                  <span className="text-emerald-100 text-[10px]">ทะเบียนเกียรติบัตร</span>
                </div>
              </div>
            </div>

            {/* 3. BENTO ACTION TILES (1 col on Phone, 3 cols on iPad/PC) */}
            <div className="space-y-2.5">
              <h3 className="text-xs font-extrabold text-slate-700 px-1">
                🛠️ เครื่องมือส่งออกและจัดการข้อมูล (แตะเพื่อใช้งาน)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tile 1: SPSS CSV (1/0) */}
                <button
                  type="button"
                  onClick={handleDownloadBinaryCsv}
                  className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-indigo-300 active:scale-95 transition-all text-left flex flex-col justify-between gap-3"
                >
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl shadow-sm">
                    📥
                  </div>
                  <div>
                    <p className="font-display font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                      ดาวน์โหลด CSV (1/0)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      ไฟล์รหัส 1/0 สำหรับโปรแกรม SPSS
                    </p>
                  </div>
                </button>

                {/* Tile 2: 1-Tap TSV Copy */}
                <button
                  type="button"
                  onClick={handleCopyTableToClipboard}
                  className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-300 active:scale-95 transition-all text-left flex flex-col justify-between gap-3"
                >
                  <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shadow-sm">
                    📋
                  </div>
                  <div>
                    <p className="font-display font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                      {copySuccess ? '✓ คัดลอกตารางแล้ว!' : 'คัดลอกตาราง (TSV)'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      กดปุ่มเดียว แล้ววาง (Ctrl+V) ใน Excel
                    </p>
                  </div>
                </button>

                {/* Tile 3: Open Supabase Dashboard */}
                <a
                  href="https://supabase.com/dashboard/project/yxljxtlgnjwqxhjgfhdv/editor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-blue-300 active:scale-95 transition-all text-left flex flex-col justify-between gap-3"
                >
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl shadow-sm">
                    🌐
                  </div>
                  <div>
                    <p className="font-display font-extrabold text-xs sm:text-sm text-slate-900 leading-snug">
                      เปิด Supabase Studio ↗
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      ดูตารางฐานข้อมูลคลาวด์โดยตรง
                    </p>
                  </div>
                </a>
              </div>
            </div>

            {/* 4. COLLAPSIBLE GUIDES (พับเก็บได้ ไม่เกะกะหน้าจอมือถือ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Guide 1 */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3 self-start">
                <div
                  onClick={() => setShowExportGuide(!showExportGuide)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <h3 className="font-display font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <span>📚</span> คู่มือการนำข้อมูลไปใช้งานวิจัย
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">{showExportGuide ? '▲ ซ่อน' : '▼ เปิดดู'}</span>
                </div>

                {showExportGuide && (
                  <div className="space-y-2.5 text-xs pt-2 border-t border-slate-100 animate-fade-in">
                    <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                      <p className="font-bold text-emerald-900">📊 1. ไฟล์ Excel (.xlsx) ครบ 4 ชีต</p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        กดปุ่มสีเขียวด้านบนเพื่อรับไฟล์ Excel ที่รวมรายชื่อนักเรียน, คะแนนรายข้อ 1/0, สรุปสถิติบทที่ 4 และทะเบียนเกียรติบัตรไว้ในไฟล์เดียว
                      </p>
                    </div>
                    <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
                      <p className="font-bold text-indigo-900">🔢 2. ไฟล์ CSV (1/0) สำหรับ SPSS</p>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        แปลงข้อที่ตอบถูกเป็น 1 และตอบผิดเป็น 0 พร้อมตั้งชื่อตัวแปร Pre_K1 - Post_K8 สำหรับนำเข้าโปรแกรม SPSS หาค่า p, r และ Alpha ได้ทันที
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Guide 2: Data Dictionary */}
              <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 space-y-3 self-start">
                <div
                  onClick={() => setShowDataDictionary(!showDataDictionary)}
                  className="flex items-center justify-between cursor-pointer select-none"
                >
                  <h3 className="font-display font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                    <span>📋</span> โครงสร้างข้อมูลหลัก 18 คอลัมน์
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">{showDataDictionary ? '▲ ซ่อน' : '▼ เปิดดู'}</span>
                </div>

                {showDataDictionary && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-2 border-t border-slate-100 animate-fade-in">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="font-bold text-slate-800">1. ข้อมูลผู้เรียน</p>
                      <p className="text-[11px] text-slate-500">ลำดับ, รหัส ID, ชื่อ-นามสกุล, ชื่อเล่น, ชั้น, โรงเรียน</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="font-bold text-sky-800">2. ก่อนเรียน & หลังเรียน</p>
                      <p className="text-[11px] text-slate-500">Pre/Post ความรู้ (%), ทักษะปฏิเสธ (/100), พัฒนาการ (Delta %)</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="font-bold text-indigo-800">3. ภารกิจเกม & แชตบอต</p>
                      <p className="text-[11px] text-slate-500">ด่านที่ผ่าน (1-8), คะแนน XP, ประเมินความพึงพอใจบอท (1-5)</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <p className="font-bold text-amber-800">4. ทะเบียนเกียรติบัตร</p>
                      <p className="text-[11px] text-slate-500">เลขที่เกียรติบัตร, วันที่ออกเกียรติบัตร, เวลาใช้งานล่าสุด</p>
                    </div>
                  </div>
                )}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-3xl w-full shadow-xl border border-slate-200/90 space-y-4 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
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
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="แก้ไขข้อมูลนักเรียนคนนี้"
                  >
                    <span>✏️</span> แก้ไขข้อมูล
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStudent(selectedStudent)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-bold flex items-center gap-1 transition-colors"
                    title="ลบข้อมูลทดสอบ"
                  >
                    <span>🗑️</span>
                    <span>ลบ</span>
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
                        ? 'bg-blue-600 text-white shadow-sm font-extrabold'
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-xl border border-slate-200/90 space-y-4 max-h-[90vh] flex flex-col"
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
                    แก้ไขชื่อ, รหัส, ระดับชั้น, หรือโรงเรียน (ซิงค์ขึ้นฐานข้อมูลคลาวด์ทันที)
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
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-lg border border-slate-700 text-xs font-bold flex items-center gap-2"
          >
            <span>{editSuccessToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
