import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { useAdminStore } from '../store/adminStore';
import { useCertNameStore } from '../store/certNameStore';
import { getLineProfile } from '../lib/liff';
import { fetchAppSettings } from '../lib/cloudSync';
import {
  PART2_BEHAVIORS,
  PART3_KNOWLEDGE_QUESTIONS,
  PART4_REFUSAL_SKILLS,
  PART5_CHATBOT_EVALUATION,
} from '../data/questionnaireData';
import { CERT_STAGE_COUNT } from '../scenarios';
import {
  NAKHON_SI_THAMMARAT_SCHOOLS,
  ALL_PRESET_SCHOOLS,
  OTHER_SCHOOL_VALUE,
} from '../lib/schools';
import PageHeader from '../components/PageHeader';
import { sfx } from '../lib/sound';
import ResultHero from '../components/ui/ResultHero';
import ProgressCircle from '../components/ui/ProgressCircle';
import CountUp from '../components/ui/CountUp';
import Confetti from '../components/Confetti';
import { asset } from '../lib/asset';

type AssessKind = 'pre' | 'post' | 'eval';

export default function Assessment() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const player = usePlayerStore();
  const recordAssessmentFull = usePlayerStore((s) => s.recordAssessmentFull);
  const recordEvaluationPart5 = usePlayerStore((s) => s.recordEvaluationPart5);

  const admin = useAdminStore();
  const realNameFromStore = useCertNameStore((s) => s.realName);

  const rawKind = params.get('kind');
  const initialKind: AssessKind | null =
    rawKind === 'post' ? 'post' : rawKind === 'pre' ? 'pre' : rawKind === 'eval' ? 'eval' : null;

  const [kind, setKind] = useState<AssessKind | null>(initialKind);

  // Flow steps:
  // 'intro' -> 'part1' -> 'part2' -> 'part3' -> 'part4' -> (part5) -> 'finished'
  const [currentStep, setCurrentStep] = useState<
    'intro' | 'part1' | 'part2' | 'part3' | 'part4' | 'part5' | 'finished'
  >('intro');

  // =========================================================================
  // FORM STATES (ตอนที่ 1: ข้อมูลส่วนบุคคลและการระบุตัวตน)
  // =========================================================================
  const [realName, setRealName] = useState(player.realName || realNameFromStore || '');
  const [idCode, setIdCode] = useState(player.idCode || '');
  const [nickname, setNickname] = useState(player.nickname || 'ผู้เล่น');
  const [lineName, setLineName] = useState('');
  const [isLineLoading, setIsLineLoading] = useState(false);

  // Auto-fetch LINE profile and latest teacher exam controls on mount
  useEffect(() => {
    (async () => {
      try {
        setIsLineLoading(true);
        const prof = await getLineProfile();
        if (prof?.displayName) {
          setLineName((prev) => prev || prof.displayName || '');
        }
      } catch (err) {
        console.warn('[Assessment] Failed to auto-fetch LINE profile:', err);
      } finally {
        setIsLineLoading(false);
      }
    })();

    // Always fetch latest teacher exam controls from cloud
    fetchAppSettings().then((settings) => {
      if (settings) {
        useAdminStore.getState().updateSettings(settings);
      }
    }).catch(() => {});
  }, []);
  const [grade, setGrade] = useState(player.grade || 'ม.2');
  const [selectedSchoolChoice, setSelectedSchoolChoice] = useState<string>(() => {
    if (!player.school) return ALL_PRESET_SCHOOLS[0]; // 'มหาวิทยาลัยวลัยลักษณ์' หรือโรงเรียนเริ่มต้น
    if (ALL_PRESET_SCHOOLS.includes(player.school)) return player.school;
    return OTHER_SCHOOL_VALUE;
  });
  const [customSchoolText, setCustomSchoolText] = useState<string>(() => {
    if (!player.school) return '';
    if (ALL_PRESET_SCHOOLS.includes(player.school)) return '';
    return player.school;
  });

  const currentSchoolValue =
    selectedSchoolChoice === OTHER_SCHOOL_VALUE ? customSchoolText.trim() : selectedSchoolChoice;

  const [sex, setSex] = useState<string>('ชาย');
  const [ageRange, setAgeRange] = useState<string>('13-14 ปี');
  const [allowance, setAllowance] = useState<string>('50 - 100 บาท');
  const [livingWith, setLivingWith] = useState<string>('บิดาและมารดา');
  const [familySmoking, setFamilySmoking] = useState<string>('ไม่มีใครสูบเลย');
  const [friendsSmoking, setFriendsSmoking] = useState<string>('ไม่มีเพื่อนสูบเลย');

  // =========================================================================
  // FORM STATES (ตอนที่ 2: พฤติกรรมการใช้)
  // =========================================================================
  const [part2EverTried, setPart2EverTried] = useState<string>('ไม่เคยลองเลย');
  const [part2FirstAge, setPart2FirstAge] = useState<string>('มัธยมศึกษาตอนต้น (ม.1 - ม.3)');
  const [part2LastMonth, setPart2LastMonth] = useState<string>('ไม่เคยสูบเลย');

  // =========================================================================
  // FORM STATES (ตอนที่ 3: แบบทดสอบความรู้)
  // =========================================================================
  const knowledgeQuestions = useMemo(() => {
    let list = [...PART3_KNOWLEDGE_QUESTIONS];
    if (admin.knowledgeQuestionCount === 10) {
      list = list.slice(0, 10);
    }
    return list;
  }, [admin.knowledgeQuestionCount]);

  const [part3Answers, setPart3Answers] = useState<Record<number, number>>({});
  const [part3CurrentIndex, setPart3CurrentIndex] = useState(0);

  // =========================================================================
  // FORM STATES (ตอนที่ 4: ทักษะการปฏิเสธ 20 ข้อ)
  // =========================================================================
  const [part4Answers, setPart4Answers] = useState<Record<number, number>>({});

  // =========================================================================
  // FORM STATES (ตอนที่ 5: ประเมินแชตบอต 7 ข้อ)
  // =========================================================================
  const [part5Answers, setPart5Answers] = useState<Record<number, number>>({});

  // Calculation Results
  const [results, setResults] = useState<{
    knowledgeScore: number;
    knowledgeTotal: number;
    knowledgePercent: number;
    skillScore: number;
    skillPercent: number;
    part5Avg?: number;
  } | null>(null);

  // Active enabled test sections structure
  const activeSections = useMemo(() => {
    const sections: { id: string; name: string; desc: string; partNumber: number }[] = [];
    let counter = 1;

    sections.push({
      id: 'part1',
      name: `ตอนที่ ${counter}: ข้อมูลส่วนบุคคลและการระบุตัวตน`,
      desc: '8 ข้อ',
      partNumber: counter++,
    });

    if (kind === 'pre' && admin.part2Enabled) {
      sections.push({
        id: 'part2',
        name: `ตอนที่ ${counter}: พฤติกรรมการใช้และประสบการณ์`,
        desc: '3 ข้อ',
        partNumber: counter++,
      });
    }

    if (admin.part3Enabled) {
      sections.push({
        id: 'part3',
        name: `ตอนที่ ${counter}: แบบทดสอบความรู้`,
        desc: `${admin.knowledgeQuestionCount === 10 ? '10' : '21'} ข้อ 4 ตัวเลือก`,
        partNumber: counter++,
      });
    }

    if (admin.part4Enabled) {
      sections.push({
        id: 'part4',
        name: `ตอนที่ ${counter}: แบบประเมินทักษะและความมั่นใจ`,
        desc: '20 ข้อ',
        partNumber: counter++,
      });
    }

    if (kind === 'post' && admin.part5Enabled) {
      sections.push({
        id: 'part5',
        name: `ตอนที่ ${counter}: แบบประเมินแชตบอต`,
        desc: '7 ข้อ',
        partNumber: counter++,
      });
    }

    return sections;
  }, [kind, admin.part2Enabled, admin.part3Enabled, admin.knowledgeQuestionCount, admin.part4Enabled, admin.part5Enabled]);

  const totalActiveParts = activeSections.length;
  const currentPartNumber = activeSections.find((s) => s.id === currentStep)?.partNumber || 1;

  // Post-test eligibility: Finished stages OR Admin bypass
  const postUnlocked =
    player.stagesCompleted.length >= CERT_STAGE_COUNT ||
    !!player.certificateNo ||
    admin.allowBypassStages;

  // Handler when starting a test kind from menu
  const startMode = (selectedKind: AssessKind) => {
    sfx.click();
    setKind(selectedKind);
    if (selectedKind === 'eval') {
      setCurrentStep('part5');
    } else {
      setCurrentStep('intro');
    }
  };

  // Start from Intro to next enabled step
  const handleIntroStart = () => {
    sfx.click();
    if (kind === 'post' && player.realName && player.idCode) {
      // In post-test, if identity was already collected, route directly to first enabled test part
      if (admin.part3Enabled) {
        setCurrentStep('part3');
        setPart3CurrentIndex(0);
      } else if (admin.part4Enabled) {
        setCurrentStep('part4');
      } else if (admin.part5Enabled) {
        setCurrentStep('part5');
      } else {
        finalizeAssessment();
      }
    } else {
      setCurrentStep('part1');
    }
  };

  // Validate Part 1 & Route to next enabled step
  const handlePart1Next = () => {
    if (!realName.trim()) {
      alert('กรุณากรอก "ชื่อ-นามสกุลจริง" เพื่อให้อาจารย์สามารถระบุตัวตนและบันทึกคะแนนได้อย่างถูกต้อง');
      return;
    }
    if (!idCode.trim()) {
      alert('กรุณากรอก "รหัสนักศึกษา / รหัสประจำตัวนักเรียน" เพื่อให้อาจารย์สามารถบันทึกคะแนนได้อย่างถูกต้อง');
      return;
    }
    if (selectedSchoolChoice === OTHER_SCHOOL_VALUE && !customSchoolText.trim()) {
      alert('กรุณากรอกระบุชื่อ "โรงเรียน / สถาบันการศึกษา" ของคุณ');
      return;
    }
    sfx.click();

    if (kind === 'pre' && admin.part2Enabled) {
      setCurrentStep('part2');
    } else if (admin.part3Enabled) {
      setCurrentStep('part3');
      setPart3CurrentIndex(0);
    } else if (admin.part4Enabled) {
      setCurrentStep('part4');
    } else if (kind === 'post' && admin.part5Enabled) {
      setCurrentStep('part5');
    } else {
      finalizeAssessment();
    }
  };

  // Validate Part 2 & Route to next enabled step
  const handlePart2Next = () => {
    sfx.click();
    if (admin.part3Enabled) {
      setCurrentStep('part3');
      setPart3CurrentIndex(0);
    } else if (admin.part4Enabled) {
      setCurrentStep('part4');
    } else if (kind === 'post' && admin.part5Enabled) {
      setCurrentStep('part5');
    } else {
      finalizeAssessment();
    }
  };

  // Part 3 selection
  const handleSelectKnowledgeChoice = (qIndex: number, choiceIndex: number) => {
    sfx.click();
    setPart3Answers((prev) => ({ ...prev, [qIndex]: choiceIndex }));
  };

  // Move between questions in Part 3
  const handleNextKnowledgeQ = () => {
    if (part3Answers[part3CurrentIndex] === undefined) {
      alert('กรุณาเลือกคำตอบก่อนไปข้อถัดไป');
      return;
    }
    sfx.click();
    if (part3CurrentIndex < knowledgeQuestions.length - 1) {
      setPart3CurrentIndex((i) => i + 1);
    } else {
      // Finished Part 3 -> Go to Part 4 or next enabled step
      if (admin.part4Enabled) {
        setCurrentStep('part4');
      } else if (kind === 'post' && admin.part5Enabled) {
        setCurrentStep('part5');
      } else {
        finalizeAssessment();
      }
    }
  };

  // Submit Part 4
  const handleFinishPart4 = () => {
    const answeredCount = Object.keys(part4Answers).length;
    if (answeredCount < PART4_REFUSAL_SKILLS.length) {
      alert(`กรุณาประเมินระดับความมั่นใจให้ครบทั้ง ${PART4_REFUSAL_SKILLS.length} ข้อ (ตอบแล้ว ${answeredCount} ข้อ)`);
      return;
    }
    sfx.click();

    if (kind === 'post' && admin.part5Enabled) {
      setCurrentStep('part5');
    } else {
      finalizeAssessment();
    }
  };

  // Submit Part 5
  const handleFinishPart5 = () => {
    const answeredCount = Object.keys(part5Answers).length;
    if (answeredCount < PART5_CHATBOT_EVALUATION.length) {
      alert(`กรุณาประเมินความคิดเห็นให้ครบทั้ง ${PART5_CHATBOT_EVALUATION.length} ข้อ (ตอบแล้ว ${answeredCount} ข้อ)`);
      return;
    }
    sfx.click();
    finalizeAssessment();
  };

  // Calculate final scores and save to playerStore and Google Sheets database
  const finalizeAssessment = () => {
    let kScore = 0;
    knowledgeQuestions.forEach((q, idx) => {
      if (part3Answers[idx] === q.correctIndex) {
        kScore += 1;
      }
    });
    const kTotal = knowledgeQuestions.length;
    const kPercent = kTotal > 0 ? Math.round((kScore / kTotal) * 100) : 100;

    // Refusal skill score (max 100 = 20 * 5)
    let sScore = 0;
    if (admin.part4Enabled) {
      PART4_REFUSAL_SKILLS.forEach((_, idx) => {
        sScore += part4Answers[idx] || 3;
      });
    }
    const sPercent = admin.part4Enabled
      ? Math.round((sScore / (PART4_REFUSAL_SKILLS.length * 5)) * 100)
      : 80;

    // Part 5 average (1.00 to 5.00)
    let p5Avg: number | undefined;
    let p5Details: number[] = [];
    if (Object.keys(part5Answers).length > 0) {
      let p5Sum = 0;
      PART5_CHATBOT_EVALUATION.forEach((_, idx) => {
        const val = part5Answers[idx] || 5;
        p5Sum += val;
        p5Details.push(val);
      });
      p5Avg = Number((p5Sum / PART5_CHATBOT_EVALUATION.length).toFixed(2));
      recordEvaluationPart5(p5Avg, p5Details);
    }

    if (kind === 'pre' || kind === 'post') {
      const cleanId = idCode.trim();
      const demographicsData = {
        realName: realName.trim(),
        idCode: cleanId,
        nickname: nickname.trim(),
        lineName: lineName.trim(),
        grade: grade,
        school: currentSchoolValue,
        sex: sex,
        ageRange: ageRange,
        allowance: allowance,
        livingWith: livingWith,
        familySmoking: familySmoking,
        friendsSmoking: friendsSmoking,
        behavior: {
          everTried: part2EverTried,
          firstAge: part2FirstAge,
          lastMonth: part2LastMonth,
        },
      };

      recordAssessmentFull({
        kind,
        knowledgePercent: kPercent,
        skillPercent: sPercent,
        idCode: cleanId,
        realName: realName.trim(),
        lineName: lineName.trim(),
        grade: grade,
        school: currentSchoolValue,
        demographics: demographicsData,
      });
    }

    setResults({
      knowledgeScore: kScore,
      knowledgeTotal: kTotal,
      knowledgePercent: kPercent,
      skillScore: sScore,
      skillPercent: sPercent,
      part5Avg: p5Avg,
    });
    setCurrentStep('finished');
    sfx.victory();
  };

  // =========================================================================
  // VIEW: 1. INTRO / COVER SCREEN (ตรงตามแบบภาพอ้างอิง 1)
  // =========================================================================
  if (currentStep === 'intro' && (kind === 'pre' || kind === 'post')) {
    const isPre = kind === 'pre';

    return (
      <div className="min-h-screen bg-slate-50/70 pb-12">
        <PageHeader
          title={isPre ? '📝 แบบสอบถามก่อนเรียน (Pre-test)' : '🎯 แบบสอบถามหลังเรียน (Post-test)'}
          subtitle="โครงการวิจัยเพื่อการเรียนรู้ มหาวิทยาลัยวลัยลักษณ์"
          backTo="/"
        />

        <main className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-3.5">
          {/* Top Hero Card with Walailak Emblem */}
          <div className="bg-white rounded-[26px] p-6 text-center shadow-sm border border-slate-100 space-y-3.5">
            {/* Walailak Crest Graphic (Logo Only) */}
            <div className="flex justify-center pt-1">
              <img
                src={asset('brand/wu-logo.png')}
                alt="มหาวิทยาลัยวลัยลักษณ์"
                className="h-16 w-auto object-contain drop-shadow-sm"
              />
            </div>

            {/* University Tag Badge */}
            <div className="inline-block px-3.5 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-bold shadow-sm">
              มหาวิทยาลัยวลัยลักษณ์ (Walailak University)
            </div>

            <div className="space-y-2">
              <h1 className="text-base sm:text-lg font-display font-extrabold text-slate-900 leading-snug">
                แบบสอบถาม: การพัฒนาแชตบอตแบบเกมมิฟิเคชันเพื่อส่งเสริมความรู้และทักษะการปฏิเสธบุหรี่ไฟฟ้าในนักเรียนมัธยมศึกษาตอนต้น
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {isPre
                  ? '📌 แบบประเมินก่อนเรียน (Pre-test) — ทำเพื่อวัดระดับความรู้เบื้องต้น (ไม่แสดงเฉลย)'
                  : '📌 แบบประเมินหลังเรียน (Post-test) — ทำเพื่อวัดความรู้และประเมินผลการเรียนรู้'}
              </p>
            </div>
          </div>

          {/* Card 2: คำชี้แจงสำหรับนักเรียน/นักศึกษา */}
          <div className="bg-sky-50/70 rounded-[24px] p-5 border border-sky-100/90 shadow-sm space-y-2.5">
            <h2 className="text-sm font-display font-extrabold text-slate-900">
              คำชี้แจงสำหรับนักเรียน / นักศึกษา:
            </h2>
            <ol className="list-decimal list-outside pl-4 space-y-1.5 text-xs text-slate-700 leading-relaxed font-normal">
              <li>
                แบบสอบถามชุดนี้มีวัตถุประสงค์เพื่อประเมินความรู้และทักษะ ก่อนและหลังการใช้แชตบอตและเกมการเรียนรู้
              </li>
              <li>
                การตอบแบบสอบถามไม่มีผลกระทบต่อคะแนนวิชาการใดๆ โปรดตอบตามความเป็นจริงของตนเอง
              </li>
              <li>
                แบบสอบถามประกอบด้วย {totalActiveParts} ตอน ใช้เวลาทำประมาณ {totalActiveParts <= 3 ? '5-8' : '10-15'} นาที
              </li>
            </ol>
          </div>

          {/* Card 3: โครงสร้างแบบสอบถาม */}
          <div className="bg-white rounded-[24px] p-5 border border-slate-100 shadow-sm space-y-2.5">
            <h2 className="text-sm font-display font-extrabold text-slate-900">
              โครงสร้างแบบสอบถาม ({totalActiveParts} ตอน):
            </h2>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium">
              {activeSections.map((sec) => (
                <li key={sec.id} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>
                    <b>{sec.name}</b> ({sec.desc})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleIntroStart}
            className="w-full !bg-[#0284C7] hover:!bg-[#0369A1] text-white font-display font-bold py-3.5 px-6 rounded-2xl shadow-clay active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2"
          >
            <span>{isPre ? 'เริ่มทำแบบสอบถาม (Pre-test) →' : 'เริ่มทำแบบสอบถาม (Post-test) →'}</span>
          </button>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 2. STEP 1 IDENTITY & DEMOGRAPHICS (ตรงตามแบบภาพอ้างอิง 2)
  // =========================================================================
  if (currentStep === 'part1') {
    return (
      <div className="min-h-screen bg-slate-50/70 pb-14">
        <PageHeader
          title={kind === 'pre' ? '📝 แบบสอบถามก่อนเรียน (Pre-test)' : '🎯 แบบสอบถามหลังเรียน (Post-test)'}
          subtitle="โครงการวิจัยเพื่อการเรียนรู้ มหาวิทยาลัยวลัยลักษณ์"
          backTo="/"
        />

        <main className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-4">
          <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-clay border border-slate-100 space-y-4">
            {/* Header tag */}
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-[#0284C7]">
                ตอนที่ 1 จาก {totalActiveParts}
              </span>
              <h2 className="text-base sm:text-lg font-display font-extrabold text-slate-900 mt-1">
                ข้อมูลส่วนบุคคลและการระบุตัวตน
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                กรอกข้อมูลให้ตรงกับตัวนักเรียน เพื่อให้อาจารย์สามารถติดตามผลได้อย่างถูกต้อง
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              {/* Field 1: Real Name */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  ชื่อ-นามสกุลจริง <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="เช่น นายสมชาย รักเรียน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white shadow-sm"
                />
              </div>

              {/* Field 2: Student ID */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  รหัสนักศึกษา / รหัสประจำตัวนักเรียน <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={idCode}
                  onChange={(e) => setIdCode(e.target.value.trim())}
                  placeholder="เช่น 66123456, 12345 หรือเลขประจำตัวนักเรียน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white shadow-sm font-semibold"
                />
                <p className="text-[11px] text-slate-500">
                  💡 กรอกรหัสนักเรียนหรือรหัสนักศึกษาตามจริง เพื่อให้อาจารย์บันทึกและตรวจผลคะแนนได้ถูกต้อง
                </p>
              </div>

              {/* Field 3: App Nickname */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  ชื่อเล่นในแอป (นามสมมุติ)
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="เช่น ลุงเอ หรือ ไข่เจียว"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0284C7]"
                />
              </div>

              {/* Field 4: LINE Profile Name */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 flex items-center gap-1.5">
                    <span>💬</span> ชื่อบัญชีใน LINE (LINE Display Name)
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      sfx.click();
                      setIsLineLoading(true);
                      const prof = await getLineProfile();
                      if (prof?.displayName) {
                        setLineName(prof.displayName);
                      }
                      setIsLineLoading(false);
                    }}
                    disabled={isLineLoading}
                    className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 active:scale-95 px-2 py-0.5 rounded-lg font-bold border border-emerald-200/80 flex items-center gap-1 transition-all"
                  >
                    <span>{isLineLoading ? '⏳ กำลังดึง...' : '🔄 ดึงจาก LINE'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={lineName}
                  onChange={(e) => setLineName(e.target.value)}
                  placeholder="เช่น Somchai_K, น้องแพรวา, หรือชื่อที่ตั้งไว้ในแอป LINE"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm font-medium"
                />
                <p className="text-[11px] text-slate-500">
                  {lineName
                    ? '✓ ดึงชื่อจาก LINE มาให้เรียบร้อยแล้ว (สามารถแก้ไขได้ตามต้องการ)'
                    : '💡 ระบบจะดึงชื่อโปรไฟล์จาก LINE ให้อัตโนมัติเมื่อเปิดผ่านแอป LINE (หรือพิมพ์เองได้)'}
                </p>
              </div>

              {/* Field 5: Grade */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  ระดับชั้นเรียน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                >
                  <option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option>
                  <option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option>
                  <option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option>
                </select>
              </div>

              {/* Field 6: School */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 flex items-center justify-between">
                  <span>🏫 โรงเรียน / สถาบันการศึกษา <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold border border-sky-100">
                    จ.นครศรีธรรมราช & อื่นๆ
                  </span>
                </label>
                <select
                  value={selectedSchoolChoice}
                  onChange={(e) => setSelectedSchoolChoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm font-medium"
                >
                  {NAKHON_SI_THAMMARAT_SCHOOLS.map((cat) => (
                    <optgroup key={cat.category} label={cat.category}>
                      {cat.schools.map((sch) => (
                        <option key={sch} value={sch}>
                          {sch}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <optgroup label="✏️ สถาบันการศึกษาอื่นๆ">
                    <option value={OTHER_SCHOOL_VALUE}>
                      ➕ อื่นๆ (พิมพ์ระบุชื่อโรงเรียน / สถาบันเอง)
                    </option>
                  </optgroup>
                </select>

                {/* กล่องข้อความกรอกชื่อโรงเรียนเองเมื่อเลือก "อื่นๆ" */}
                {selectedSchoolChoice === OTHER_SCHOOL_VALUE && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-1 space-y-1"
                  >
                    <input
                      type="text"
                      value={customSchoolText}
                      onChange={(e) => setCustomSchoolText(e.target.value)}
                      placeholder="พิมพ์ชื่อโรงเรียน หรือสถาบันการศึกษาของคุณที่นี่..."
                      className="w-full px-3.5 py-2.5 rounded-xl border-2 border-sky-400 text-slate-800 bg-sky-50/40 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm font-medium"
                      autoFocus
                    />
                    <p className="text-[11px] text-sky-700">
                      💡 ระบุชื่อโรงเรียน สถาบัน หรือสังกัดของคุณให้ชัดเจน
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Field 7: Sex */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  เพศ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                >
                  <option value="ชาย">ชาย</option>
                  <option value="หญิง">หญิง</option>
                  <option value="ทางเลือก / ไม่ระบุ">ทางเลือก / ไม่ระบุ</option>
                </select>
              </div>

              {/* Field 7: Age Range */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  ช่วงอายุ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                >
                  <option value="12 - 13 ปี">12 - 13 ปี</option>
                  <option value="14 - 15 ปี">14 - 15 ปี</option>
                  <option value="16 - 18 ปี">16 - 18 ปี</option>
                </select>
              </div>

              {/* Field 8: Daily Allowance */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  เงินค่าใช้จ่ายที่ได้รับมาโรงเรียนต่อวัน
                </label>
                <select
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                >
                  <option value="ต่ำกว่า 50 บาท">ต่ำกว่า 50 บาท</option>
                  <option value="50 - 100 บาท">50 - 100 บาท</option>
                  <option value="101 - 150 บาท">101 - 150 บาท</option>
                  <option value="มากกว่า 150 บาท">มากกว่า 150 บาท</option>
                </select>
              </div>

              {/* Field 9: Living With */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  ปัจจุบันท่านพักอาศัยอยู่กับใคร
                </label>
                <select
                  value={livingWith}
                  onChange={(e) => setLivingWith(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                >
                  <option value="บิดาและมารดา">บิดาและมารดา</option>
                  <option value="บิดาหรือมารดาคนใดคนหนึ่ง">บิดาหรือมารดาคนใดคนหนึ่ง</option>
                  <option value="ญาติ (ปู่ ย่า ตา ยาย ลุง ป้า น้า อา)">ญาติ (ปู่ ย่า ตา ยาย ลุง ป้า น้า อา)</option>
                  <option value="หอพัก / อยู่กับเพื่อน">หอพัก / อยู่กับเพื่อน</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              {/* Field 10: Family Smoking */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  บุคคลในครอบครัวของท่านสูบบุหรี่หรือบุหรี่ไฟฟ้าหรือไม่
                </label>
                <select
                  value={familySmoking}
                  onChange={(e) => setFamilySmoking(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                >
                  <option value="ไม่มีใครสูบเลย">ไม่มีใครสูบเลย</option>
                  <option value="มีคนสูบบุหรี่ธรรมดา">มีคนสูบบุหรี่ธรรมดา</option>
                  <option value="มีคนสูบบุหรี่ไฟฟ้า">มีคนสูบบุหรี่ไฟฟ้า</option>
                  <option value="มีคนสูบทั้งสองแบบ">มีคนสูบทั้งสองแบบ</option>
                </select>
              </div>

              {/* Field 11: Friends Smoking */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  เพื่อนสนิทของท่านสูบบุหรี่หรือบุหรี่ไฟฟ้าหรือไม่
                </label>
                <select
                  value={friendsSmoking}
                  onChange={(e) => setFriendsSmoking(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                >
                  <option value="ไม่มีเพื่อนสูบเลย">ไม่มีเพื่อนสูบเลย</option>
                  <option value="มีเพื่อนสูบบุหรี่ธรรมดา">มีเพื่อนสูบบุหรี่ธรรมดา</option>
                  <option value="มีเพื่อนสูบบุหรี่ไฟฟ้า">มีเพื่อนสูบบุหรี่ไฟฟ้า</option>
                  <option value="มีเพื่อนสูบทั้งสองแบบ">มีเพื่อนสูบทั้งสองแบบ</option>
                </select>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep('intro')}
                className="btn-secondary flex-1 py-3 text-xs"
              >
                ← ย้อนกลับ
              </button>
              <button
                onClick={handlePart1Next}
                className="btn-primary flex-1 py-3 text-xs font-bold shadow-clay"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 3. STEP 2 VAPING BEHAVIORS (Pre-test ตอนที่ 2)
  // =========================================================================
  if (currentStep === 'part2') {
    const isEverTried = part2EverTried === 'เคยลอง';

    return (
      <div className="min-h-screen bg-slate-50/70 pb-14">
        <PageHeader
          title="📝 แบบสอบถามก่อนเรียน (Pre-test)"
          subtitle={`ตอนที่ ${currentPartNumber}: พฤติกรรมการใช้และประสบการณ์`}
          backTo="/"
        />

        <main className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-4">
          <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-clay border border-slate-100 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-[#0284C7]">
                ตอนที่ {currentPartNumber} จาก {totalActiveParts}
              </span>
              <h2 className="text-base sm:text-lg font-display font-extrabold text-slate-900 mt-1">
                พฤติกรรมการใช้และประสบการณ์ (3 ข้อ)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                ตอบตามความเป็นจริง ข้อมูลทั้งหมดจะไม่ถูกเปิดเผยเป็นรายบุคคล
              </p>
            </div>

            {/* Q1 */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">{PART2_BEHAVIORS.everTried.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {PART2_BEHAVIORS.everTried.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setPart2EverTried(opt);
                    }}
                    className={`p-3 text-center rounded-xl border text-xs font-bold transition-all ${
                      part2EverTried === opt
                        ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Q2: ถ้าเคย */}
            {isEverTried && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <p className="text-xs font-bold text-slate-800">{PART2_BEHAVIORS.firstAge.label}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {PART2_BEHAVIORS.firstAge.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setPart2FirstAge(opt);
                      }}
                      className={`p-2.5 text-center rounded-xl border text-xs font-medium transition-all ${
                        part2FirstAge === opt
                          ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Q3 */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">{PART2_BEHAVIORS.lastMonth.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {PART2_BEHAVIORS.lastMonth.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setPart2LastMonth(opt);
                    }}
                    className={`p-2.5 text-left rounded-xl border text-xs font-medium transition-all ${
                      part2LastMonth === opt
                        ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-sm font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep('part1')}
                className="btn-secondary flex-1 py-3 text-xs"
              >
                ← ย้อนกลับ
              </button>
              <button
                onClick={handlePart2Next}
                className="btn-primary flex-1 py-3 text-xs font-bold shadow-clay"
              >
                ถัดไป →
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 4. STEP 3 KNOWLEDGE QUESTIONS (ตอนที่ 3)
  // =========================================================================
  if (currentStep === 'part3') {
    const q = knowledgeQuestions[part3CurrentIndex];
    const totalQ = knowledgeQuestions.length;
    const progressPercent = Math.round(((part3CurrentIndex + 1) / totalQ) * 100);

    return (
      <div className="min-h-screen bg-slate-50/70 pb-14">
        <PageHeader
          title={kind === 'pre' ? '📝 แบบสอบถามก่อนเรียน (Pre-test)' : '🎯 แบบสอบถามหลังเรียน (Post-test)'}
          subtitle={`ตอนที่ ${currentPartNumber}: แบบทดสอบความรู้ (ข้อ ${part3CurrentIndex + 1}/${totalQ})`}
          backTo="/"
        />

        <main className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-4">
          {/* Progress Bar */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100">
            <div className="flex justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>ข้อที่ {part3CurrentIndex + 1} จาก {totalQ}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#0284C7] to-indigo-600 rounded-full"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={q?.id || part3CurrentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-[28px] p-5 sm:p-6 shadow-clay border border-slate-100 space-y-4"
            >
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-xl bg-sky-100 text-[#0284C7] font-display font-extrabold flex items-center justify-center text-sm flex-shrink-0">
                  {part3CurrentIndex + 1}
                </span>
                <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base leading-snug pt-0.5">
                  {q?.question}
                </h3>
              </div>

              {/* Choices */}
              <div className="space-y-2 pt-1">
                {q?.choices.map((choice, cIdx) => {
                  const isSelected = part3Answers[part3CurrentIndex] === cIdx;
                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleSelectKnowledgeChoice(part3CurrentIndex, cIdx)}
                      className={`w-full p-3.5 rounded-2xl text-left text-xs sm:text-sm font-medium border transition-all active:scale-[0.99] flex items-center gap-3 ${
                        isSelected
                          ? 'bg-gradient-to-r from-sky-50 to-indigo-50/40 border-[#0284C7] text-slate-900 ring-2 ring-[#0284C7] font-bold shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          isSelected
                            ? 'bg-[#0284C7] border-[#0284C7] text-white'
                            : 'border-slate-300 text-slate-400'
                        }`}
                      >
                        {isSelected ? '✓' : String.fromCharCode(65 + cIdx)}
                      </span>
                      <span className="flex-1">{choice}</span>
                    </button>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {part3CurrentIndex > 0 && (
                  <button
                    onClick={() => setPart3CurrentIndex((i) => i - 1)}
                    className="btn-secondary flex-1 py-3 text-xs"
                  >
                    ← ข้อก่อนหน้า
                  </button>
                )}
                <button
                  onClick={handleNextKnowledgeQ}
                  className="btn-primary flex-1 py-3 text-xs sm:text-sm font-bold shadow-clay"
                >
                  {part3CurrentIndex === totalQ - 1 ? 'เสร็จสิ้นข้อสอบความรู้ →' : 'ข้อถัดไป →'}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 5. STEP 4 REFUSAL SKILLS 20 QUESTIONS (ตอนที่ 4)
  // =========================================================================
  if (currentStep === 'part4') {
    const answeredCount = Object.keys(part4Answers).length;
    const totalSkills = PART4_REFUSAL_SKILLS.length;

    return (
      <div className="min-h-screen bg-slate-50/70 pb-14">
        <PageHeader
          title={kind === 'pre' ? '📝 แบบสอบถามก่อนเรียน (Pre-test)' : '🎯 แบบสอบถามหลังเรียน (Post-test)'}
          subtitle={`ตอนที่ ${currentPartNumber}: แบบประเมินทักษะและความมั่นใจ (20 ข้อ)`}
          backTo="/"
        />

        <main className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-4">
          <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-clay border border-slate-100 space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                ตอนที่ {currentPartNumber} จาก {totalActiveParts}
              </span>
              <h2 className="font-display font-extrabold text-slate-900 text-base mt-2">
                แบบประเมินทักษะการปฏิเสธบุหรี่ไฟฟ้า
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                อ่านสถานการณ์แล้วประเมินระดับ <b>"ความมั่นใจ"</b> ว่าท่านจะปฏิเสธได้หรือไม่:
                <br />
                <span className="text-[11px] text-slate-600">
                  (1=ไม่มั่นใจเลย, 2=ไม่ค่อยมั่นใจ, 3=ค่อนข้างมั่นใจ, 4=มั่นใจมาก, 5=มั่นใจที่สุด)
                </span>
              </p>
            </div>

            {/* Answered progress */}
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-2 rounded-xl">
              <span>ตอบแล้ว: {answeredCount}/{totalSkills} ข้อ</span>
              <span>{Math.round((answeredCount / totalSkills) * 100)}%</span>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {PART4_REFUSAL_SKILLS.map((item, idx) => {
                const currentScore = part4Answers[idx];
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-2.5"
                  >
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                      <span className="font-bold text-emerald-600 mr-1.5">{item.no}.</span>
                      {item.text}
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const isSelected = currentScore === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => {
                              sfx.click();
                              setPart4Answers((prev) => ({ ...prev, [idx]: level }));
                            }}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm scale-[1.02]'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handleFinishPart4}
                className="btn-primary w-full py-3.5 text-sm font-bold shadow-clay"
              >
                {kind === 'post' && admin.part5Enabled
                  ? 'ถัดไป (ตอนที่ 5: ประเมินแชตบอต) →'
                  : 'ส่งคำตอบและดูผลลัพธ์ ✓'}
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 6. STEP 5 CHATBOT EVALUATION (ตอนที่ 5)
  // =========================================================================
  if (currentStep === 'part5') {
    const answeredCount = Object.keys(part5Answers).length;
    const totalPart5 = PART5_CHATBOT_EVALUATION.length;

    return (
      <div className="min-h-screen bg-slate-50/70 pb-14">
        <PageHeader
          title="🎯 แบบสอบถามหลังเรียน (Post-test)"
          subtitle={`ตอนที่ ${currentPartNumber}: แบบประเมินประโยชน์ของแชตบอต (7 ข้อ)`}
          backTo="/"
        />

        <main className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-4">
          <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-clay border border-slate-100 space-y-4">
            <div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                ตอนที่ {currentPartNumber} จาก {totalActiveParts}
              </span>
              <h2 className="font-display font-extrabold text-slate-900 text-base mt-2">
                แบบประเมินความคิดเห็นหลังเล่นแชตบอต
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                โปรดให้คะแนนตามความรู้สึกของนักเรียน:
                <br />
                <span className="text-[11px] text-slate-600">
                  (1=น้อยที่สุด, 2=น้อย, 3=ปานกลาง, 4=มาก, 5=มากที่สุด)
                </span>
              </p>
            </div>

            {/* Questions List */}
            <div className="space-y-3">
              {PART5_CHATBOT_EVALUATION.map((item, idx) => {
                const currentScore = part5Answers[idx];
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 space-y-2.5"
                  >
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                      <span className="font-bold text-amber-600 mr-1.5">{item.no}.</span>
                      {item.text}
                    </p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const isSelected = currentScore === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onClick={() => {
                              sfx.click();
                              setPart5Answers((prev) => ({ ...prev, [idx]: level }));
                            }}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm scale-[1.02]'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {level}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={handleFinishPart5}
                className="btn-primary w-full py-3.5 text-sm font-bold shadow-clay"
              >
                บันทึกผลการประเมินแชตบอต ✓
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 7. RESULTS PAGE (หน้าสรุปผลคะแนน)
  // =========================================================================
  if (currentStep === 'finished' && results) {
    const preK = player.preTestScore;
    const postK = kind === 'post' ? results.knowledgePercent : player.postTestScore;
    const hasBothK = preK !== undefined && postK !== undefined;
    const deltaK = hasBothK ? postK! - preK! : 0;

    const preS = player.preTestSkillScore;
    const postS = kind === 'post' ? results.skillPercent : player.postTestSkillScore;
    const hasBothS = preS !== undefined && postS !== undefined;
    const deltaS = hasBothS ? postS! - preS! : 0;

    return (
      <div className="min-h-screen bg-slate-50/70 pb-12">
        <Confetti active={kind === 'post'} count={80} duration={2500} />
        <PageHeader title="📋 ส่งแบบประเมินเรียบร้อย" backTo="/" />

        <main className="max-w-md md:max-w-xl mx-auto px-4 pt-4 space-y-4">
          <ResultHero
            emoji="✅"
            tone="success"
            title={
              kind === 'pre'
                ? 'ส่งแบบประเมินก่อนเรียน (Pre-test) เรียบร้อยแล้ว'
                : kind === 'post'
                ? 'ส่งแบบประเมินหลังเรียน (Post-test) เรียบร้อยแล้ว'
                : 'บันทึกแบบประเมินความคิดเห็นเรียบร้อยแล้ว'
            }
            subtitle={
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                ระบบได้บันทึกคำตอบของคุณเข้าสู่ฐานข้อมูลงานวิจัยเรียบร้อยแล้ว
              </p>
            }
          >
            <div className="w-full max-w-sm my-3 p-4 rounded-2xl bg-white/90 border border-slate-100 shadow-sm text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl">
                ☁️
              </div>
              <h4 className="font-bold text-slate-800 text-sm">บันทึกข้อมูลเข้าสู่ระบบเรียบร้อย</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {kind === 'pre'
                  ? 'นักเรียนสามารถเริ่มสืบคดีและเรียนรู้ในด่านเกมเพื่อสะสม XP และรับเกียรติบัตรได้เลย!'
                  : 'ขอบคุณที่ร่วมเป็นส่วนหนึ่งในโครงการวิจัย มหาวิทยาลัยวลัยลักษณ์'}
              </p>
            </div>

            <div className="w-full max-w-sm bg-sky-50 border border-sky-100 rounded-2xl p-3 text-left space-y-1">
              <p className="text-[11px] font-bold text-sky-900 flex items-center gap-1.5">
                <span>🔒</span> ข้อมูลการวิจัยถูกจัดเก็บอย่างปลอดภัย
              </p>
              <p className="text-[10px] text-slate-600 leading-relaxed">
                คะแนนและผลการประเมินจะถูกส่งตรงไปยังอาจารย์ผู้สอนเพื่อใช้ในการวิเคราะห์และประเมินผลโครงการวิจัย
              </p>
            </div>
          </ResultHero>

          <button
            onClick={() => {
              sfx.click();
              nav('/');
            }}
            className="btn-primary w-full py-3.5 text-sm font-bold shadow-clay active:scale-[0.98]"
          >
            {kind === 'pre' ? '🎮 เริ่มเล่นเกมเลย' : '🏠 กลับหน้าหลัก'}
          </button>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 8. MAIN SELECTION MENU (เมื่อเข้ามาที่ /assessment โดยไม่มี kind)
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-50/70 pb-12">
      <PageHeader
        title="📋 แบบประเมินวิจัย"
        subtitle="โครงการวิจัย มหาวิทยาลัยวลัยลักษณ์"
        backTo="/"
      />

      <main className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-3.5">
        {/* Banner Topic */}
        <div className="bg-white rounded-[26px] p-5 text-center shadow-sm border border-slate-100 space-y-2">
          <div className="flex justify-center pt-0.5">
            <img
              src={asset('brand/wu-logo.png')}
              alt="มหาวิทยาลัยวลัยลักษณ์"
              className="h-14 w-auto object-contain drop-shadow-sm"
            />
          </div>
          <span className="inline-block px-3 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] text-[11px] font-bold">
            มหาวิทยาลัยวลัยลักษณ์ (Walailak University)
          </span>
          <h2 className="font-display font-extrabold text-slate-900 text-sm leading-snug">
            การพัฒนาแชตบอตแบบเกมมิฟิเคชันเพื่อส่งเสริมความรู้และทักษะการปฏิเสธบุหรี่ไฟฟ้า
          </h2>
        </div>

        {/* Card 1: Pre-test */}
        <button
          onClick={() => startMode('pre')}
          disabled={!admin.preTestEnabled}
          className={`w-full card text-left flex items-center gap-3.5 p-4 transition-all ${
            admin.preTestEnabled ? 'active:scale-[0.99]' : 'opacity-60 cursor-not-allowed'
          }`}
        >
          <span className="w-12 h-12 rounded-2xl bg-sky-100 text-[#0284C7] flex items-center justify-center text-2xl flex-shrink-0">
            🅰️
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">แบบประเมินก่อนเรียน (Pre-test)</h3>
              {player.preTestScore !== undefined && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  เสร็จสมบูรณ์ ✓
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalActiveParts} ตอน ({admin.part3Enabled ? `${admin.knowledgeQuestionCount === 10 ? '10' : '21'} ข้อความรู้` : ''} {admin.part4Enabled ? '+ ทักษะ 20 ข้อ' : ''})
            </p>
          </div>
          <span className="text-[#0284C7] font-bold">→</span>
        </button>

        {/* Card 2: Post-test */}
        <button
          onClick={() => {
            if (postUnlocked && admin.postTestEnabled) startMode('post');
          }}
          disabled={!postUnlocked || !admin.postTestEnabled}
          className={`w-full card text-left flex items-center gap-3.5 p-4 transition-all ${
            postUnlocked && admin.postTestEnabled ? 'active:scale-[0.99]' : 'opacity-60 cursor-not-allowed'
          }`}
        >
          <span className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl flex-shrink-0">
            🅱️
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 text-sm">แบบประเมินหลังเรียน (Post-test)</h3>
              {player.postTestScore !== undefined && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                  เสร็จสมบูรณ์ ✓
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {postUnlocked
                ? 'ทำหลังเรียนจบเนื้อหา เพื่อบันทึกผลงานวิจัย'
                : `🔒 ปลดล็อกเมื่อเล่นจบ ${CERT_STAGE_COUNT} ด่านแรก หรือได้รับอนุญาตจากครู`}
            </p>
          </div>
          <span className="text-emerald-600 font-bold">→</span>
        </button>

        {/* Card 3: Chatbot Evaluation (Part 5) */}
        {admin.part5Enabled && (
          <button
            onClick={() => startMode('eval')}
            className="w-full card text-left flex items-center gap-3.5 p-4 active:scale-[0.99] transition-all"
          >
            <span className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl flex-shrink-0">
              ⭐
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm">
                  ตอนที่ 5: ประโยชน์ของแชตบอต
                </h3>
                {player.evalPart5Avg !== undefined && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                    เสร็จสมบูรณ์ ✓
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                ประเมินความพึงพอใจและความคิดเห็นหลังการใช้งาน (7 ข้อ)
              </p>
            </div>
            <span className="text-amber-600 font-bold">→</span>
          </button>
        )}

        {/* Admin Bypass Notice (if active) */}
        {admin.allowBypassStages && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed flex items-center gap-2">
            <span>⚙️</span>
            <span>
              <b>โหมดอาจารย์เปิดอยู่:</b> ปลดล็อกให้สามารถทำแบบทดสอบหลังเรียนได้ทันทีโดยไม่ต้องจบบทเรียน
            </span>
          </div>
        )}
      </main>
    </div>
  );
}
