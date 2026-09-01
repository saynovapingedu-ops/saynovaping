import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminStore, type StudentRecord } from '../store/adminStore';
import { usePlayerStore } from '../store/playerStore';
import { fetchAdminStudents, fetchAppSettings, saveAppSettingsToCloud } from '../lib/cloudSync';
import { sfx } from '../lib/sound';

export default function TeacherAdmin() {
  const nav = useNavigate();
  const admin = useAdminStore();
  const player = usePlayerStore();

  // Authentication State
  const [passcode, setPasscode] = useState('');
  const [passError, setPassError] = useState(false);

  // Tab State: 'analytics' | 'controls' | 'sheets'
  const [activeTab, setActiveTab] = useState<'analytics' | 'controls' | 'sheets'>('analytics');

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
          preTestAt: player.preTestAt,
          stagesCompletedCount: player.stagesCompleted.length,
          totalStages: 10,
          totalXP: player.totalXP,
          level: player.level,
          postTestScore: player.postTestScore,
          postTestSkillScore: player.postTestSkillScore,
          postTestAt: player.postTestAt,
          gainDelta:
            player.preTestScore !== undefined && player.postTestScore !== undefined
              ? player.postTestScore - player.preTestScore
              : undefined,
          evalPart5Avg: player.evalPart5Avg,
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
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

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
              preTestAt: player.preTestAt,
              stagesCompletedCount: player.stagesCompleted.length,
              totalStages: 10,
              totalXP: player.totalXP,
              level: player.level,
              postTestScore: player.postTestScore,
              postTestSkillScore: player.postTestSkillScore,
              postTestAt: player.postTestAt,
              gainDelta:
                player.preTestScore !== undefined && player.postTestScore !== undefined
                  ? player.postTestScore - player.preTestScore
                  : undefined,
              evalPart5Avg: player.evalPart5Avg,
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

  // Filtered students list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.realName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.idCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.school?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchGrade = selectedGrade === 'all' || s.grade === selectedGrade;
      return matchSearch && matchGrade;
    });
  }, [students, searchQuery, selectedGrade]);

  // Analytics Highlights calculated strictly from REAL data
  const analytics = useMemo(() => {
    const total = students.length;
    const preScores = students
      .filter((s) => s.preTestScore !== undefined && s.preTestScore !== null && !isNaN(s.preTestScore))
      .map((s) => s.preTestScore!);
    const postScores = students
      .filter((s) => s.postTestScore !== undefined && s.postTestScore !== null && !isNaN(s.postTestScore))
      .map((s) => s.postTestScore!);
    const deltas = students
      .filter((s) => s.gainDelta !== undefined && s.gainDelta !== null && !isNaN(s.gainDelta))
      .map((s) => s.gainDelta!);
    const certCount = students.filter((s) => !!s.certificateNo).length;

    const avgPre =
      preScores.length > 0
        ? Math.round(preScores.reduce((a, b) => a + b, 0) / preScores.length)
        : null;
    const avgPost =
      postScores.length > 0
        ? Math.round(postScores.reduce((a, b) => a + b, 0) / postScores.length)
        : null;
    const avgDelta =
      deltas.length > 0
        ? Math.round(deltas.reduce((a, b) => a + b, 0) / deltas.length)
        : null;

    return {
      total,
      avgPre,
      avgPost,
      avgDelta,
      certCount,
      preDoneCount: preScores.length,
      postDoneCount: postScores.length,
    };
  }, [students]);

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

    const rows = students.map((s, idx) => [
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

  // Toggle single admin setting with instant cloud sync
  const handleToggleSetting = (key: string, value: any) => {
    sfx.click();
    const next = {
      preTestEnabled: key === 'preTestEnabled' ? value : admin.preTestEnabled,
      postTestEnabled: key === 'postTestEnabled' ? value : admin.postTestEnabled,
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

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-2.5 justify-between items-center">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
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

                <div className="flex gap-1">
                  {['all', 'ม.1', 'ม.2', 'ม.3'].map((g) => (
                    <button
                      key={g}
                      onClick={() => setSelectedGrade(g)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        selectedGrade === g
                          ? 'bg-detective-600 text-white border-detective-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {g === 'all' ? 'ทุกชั้น' : g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={handleCopyTableToClipboard}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
                >
                  <span>📋</span>
                  <span>{copySuccess ? 'คัดลอกแล้ว!' : 'คัดลอกตาราง (TSV)'}</span>
                </button>

                <button
                  onClick={() => {
                    sfx.click();
                    handleRefreshData();
                  }}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-detective-50 text-detective-700 border border-detective-200 text-xs font-bold hover:bg-detective-100 flex items-center gap-1.5"
                >
                  <span className={isLoading ? 'animate-spin' : ''}>🔄</span>
                  <span>{isLoading ? 'กำลังดึงข้อมูลสด...' : 'ดึงข้อมูลสถิติล่าสุด'}</span>
                </button>
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
                        {admin.part3Enabled ? `เปิดใช้งาน (${admin.knowledgeQuestionCount === 10 ? 'ฉบับย่อ 10 ข้อ' : 'ชุดมาตรฐาน 21 ข้อ'})` : 'ปิดใช้งาน (ข้ามส่วนความรู้)'}
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
                      <span className="text-[11px] text-slate-600 font-semibold">จำนวนข้อสอบความรู้:</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('knowledgeQuestionCount', 21)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                            admin.knowledgeQuestionCount !== 10
                              ? 'bg-detective-600 text-white border-detective-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          ครบ 21 ข้อ (มาตรฐาน)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSetting('knowledgeQuestionCount', 10)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                            admin.knowledgeQuestionCount === 10
                              ? 'bg-detective-600 text-white border-detective-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          ⚡ ฉบับย่อ 10 ข้อ (ประหยัดเวลา)
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Part 4 Toggle: Refusal Skills */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      🛡️ ตอนที่ 4: แบบประเมินทักษะและความมั่นใจในการปฏิเสธ (20 ข้อ)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {admin.part4Enabled ? 'เปิดใช้งาน (ประเมินระดับความมั่นใจ 1-5 ครบ 20 ข้อ)' : 'ปิดใช้งาน (ข้ามส่วนนี้เพื่อลดเวลาทำข้อสอบลง 5-7 นาที)'}
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
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-bold text-detective-600 bg-detective-50 px-2 py-0.5 rounded-lg">
                    ID: {selectedStudent.idCode || '-'}
                  </span>
                  <h3 className="text-base font-display font-extrabold text-slate-900 mt-1">
                    {selectedStudent.realName} {selectedStudent.nickname && selectedStudent.nickname !== selectedStudent.realName && `(${selectedStudent.nickname})`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedStudent.grade} · {selectedStudent.school}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Scores breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100 flex justify-between items-center">
                  <span className="font-bold text-sky-900">Pre-test (ก่อนเรียน):</span>
                  <span className="font-display font-bold text-sm text-sky-800">
                    {selectedStudent.preTestScore !== undefined
                      ? `ความรู้: ${selectedStudent.preTestScore}% | ทักษะ: ${selectedStudent.preTestSkillScore || '-'}`
                      : 'ยังไม่ทำ'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                  <span className="font-bold text-emerald-900">Post-test (หลังเรียน):</span>
                  <span className="font-display font-bold text-sm text-emerald-800">
                    {selectedStudent.postTestScore !== undefined
                      ? `ความรู้: ${selectedStudent.postTestScore}% | ทักษะ: ${selectedStudent.postTestSkillScore || '-'}`
                      : 'ยังไม่ทำ'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100 flex justify-between items-center">
                  <span className="font-bold text-indigo-900">🚀 พัฒนาการ (Gain Delta):</span>
                  <span className="font-display font-extrabold text-sm text-indigo-700">
                    {selectedStudent.gainDelta !== undefined
                      ? `${selectedStudent.gainDelta > 0 ? '+' : ''}${selectedStudent.gainDelta}%`
                      : 'รอข้อมูลเปรียบเทียบ'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100 flex justify-between items-center">
                  <span className="font-bold text-amber-900">⭐ ประเมินแชตบอต (ตอนที่ 5):</span>
                  <span className="font-display font-bold text-sm text-amber-700">
                    {selectedStudent.evalPart5Avg ? `${selectedStudent.evalPart5Avg} / 5.0` : 'ยังไม่ประเมิน'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-700">🏆 เกียรติบัตร:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedStudent.certificateNo || 'ยังไม่ออกเกียรติบัตร'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="btn-primary w-full py-2.5 text-xs font-bold"
              >
                ปิดหน้าต่าง
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
