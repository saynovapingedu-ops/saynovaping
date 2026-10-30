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
  ALL_PRESET_SCHOOLS,
  OTHER_SCHOOL_VALUE,
} from '../lib/schools';
import SchoolSelectorModal from '../components/SchoolSelectorModal';
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
  const [consentAgreed, setConsentAgreed] = useState(true);

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
    if (!player.school) return '';
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
  const [age, setAge] = useState<string>('13 ปี');
  const [customAge, setCustomAge] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [allowance, setAllowance] = useState<string>('50 - 100 บาท');
  const [livingWith, setLivingWith] = useState<string>('พ่อ-แม่');
  const [customLivingWith, setCustomLivingWith] = useState<string>('');
  const [fatherSmoke, setFatherSmoke] = useState<string>('ไม่สูบ');
  const [motherSmoke, setMotherSmoke] = useState<string>('ไม่สูบ');
  const [siblingSmoke, setSiblingSmoke] = useState<string>('ไม่สูบ');
  const [friendSmoke, setFriendSmoke] = useState<string>('ไม่สูบ');

  // =========================================================================
  // FORM STATES (ตอนที่ 2: พฤติกรรมการใช้)
  // =========================================================================
  const [part2EverTried, setPart2EverTried] = useState<string>(PART2_BEHAVIORS.everTried.options[0]);
  const [part2FirstAge, setPart2FirstAge] = useState<string>('ตอน ม.1');
  const [part2LastMonth, setPart2LastMonth] = useState<string>('ไม่เคยสูบเลย');

  // Helper to generate Research ID Code: first 2 letters of nickname + 2-digit birth day (e.g. แพร 15 -> พร15)
  const handleAutoGenerateIdCode = () => {
    const rawNick = nickname.trim();
    if (!rawNick) {
      alert('กรุณากรอกชื่อเล่นก่อนสร้างรหัส');
      return;
    }
    const thaiConsonants = rawNick.replace(/[^ก-๙a-zA-Z]/g, '');
    const prefix = (thaiConsonants.length >= 2 ? thaiConsonants.slice(0, 2) : rawNick.slice(0, 2)).toUpperCase();
    const dayDigits = birthDay ? String(parseInt(birthDay, 10) || '').padStart(2, '0') : '15';
    const gen = `${prefix}${dayDigits}`;
    setIdCode(gen);
    sfx.click();
  };

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
  // FORM STATES (ตอนที่ 4: ทักษะการปฏิเสธ 15 ข้อ)
  // =========================================================================
  const [part4Answers, setPart4Answers] = useState<Record<number, number>>({});

  // =========================================================================
  // FORM STATES (ตอนที่ 5: ประเมินแชตบอต 7 ข้อ)
  // =========================================================================
  const [part5Answers, setPart5Answers] = useState<Record<number, number>>({});

  // Unanswered Question Tracking for Part 4 & 5 (for auto-scroll & visual highlight)
  const [unansweredPart4Indices, setUnansweredPart4Indices] = useState<number[]>([]);
  const [unansweredPart5Indices, setUnansweredPart5Indices] = useState<number[]>([]);

  // Draft Key for auto-save & recovery
  const draftKey = kind ? `hd_assessment_draft_${kind}` : null;

  // 1. Restore draft if available
  useEffect(() => {
    if (!draftKey) return;
    try {
      const savedStr = localStorage.getItem(draftKey);
      if (savedStr) {
        const d = JSON.parse(savedStr);
        if (d && typeof d === 'object') {
          if (d.realName) setRealName(d.realName);
          if (d.idCode) setIdCode(d.idCode);
          if (d.nickname) setNickname(d.nickname);
          if (d.birthDay) setBirthDay(d.birthDay);
          if (d.lineName) setLineName(d.lineName);
          if (d.grade) setGrade(d.grade);
          if (d.selectedSchoolChoice !== undefined) setSelectedSchoolChoice(d.selectedSchoolChoice);
          if (d.customSchoolText !== undefined) setCustomSchoolText(d.customSchoolText);
          if (d.sex) setSex(d.sex);
          if (d.age) setAge(d.age);
          if (d.customAge) setCustomAge(d.customAge);
          if (d.allowance) setAllowance(d.allowance);
          if (d.livingWith) setLivingWith(d.livingWith);
          if (d.customLivingWith) setCustomLivingWith(d.customLivingWith);
          if (d.fatherSmoke) setFatherSmoke(d.fatherSmoke);
          if (d.motherSmoke) setMotherSmoke(d.motherSmoke);
          if (d.siblingSmoke) setSiblingSmoke(d.siblingSmoke);
          if (d.friendSmoke) setFriendSmoke(d.friendSmoke);
          if (d.part2EverTried) setPart2EverTried(d.part2EverTried);
          if (d.part2FirstAge) setPart2FirstAge(d.part2FirstAge);
          if (d.part2LastMonth) setPart2LastMonth(d.part2LastMonth);
          if (d.part3Answers) setPart3Answers(d.part3Answers);
          if (d.part4Answers) setPart4Answers(d.part4Answers);
          if (d.part5Answers) setPart5Answers(d.part5Answers);
          if (d.currentStep && d.currentStep !== 'finished' && d.currentStep !== 'intro') {
            setCurrentStep(d.currentStep);
          }
        }
      }
    } catch {
      // ignore
    }
  }, [draftKey]);

  // 2. Auto-save draft on answers/demographics update
  useEffect(() => {
    if (!draftKey || currentStep === 'finished' || currentStep === 'intro') return;
    try {
      const draft = {
        realName,
        idCode,
        nickname,
        birthDay,
        lineName,
        grade,
        selectedSchoolChoice,
        customSchoolText,
        sex,
        age,
        customAge,
        allowance,
        livingWith,
        customLivingWith,
        fatherSmoke,
        motherSmoke,
        siblingSmoke,
        friendSmoke,
        part2EverTried,
        part2FirstAge,
        part2LastMonth,
        part3Answers,
        part4Answers,
        part5Answers,
        currentStep,
        updatedAt: Date.now(),
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      // ignore
    }
  }, [
    draftKey,
    currentStep,
    realName,
    idCode,
    nickname,
    birthDay,
    lineName,
    grade,
    selectedSchoolChoice,
    customSchoolText,
    sex,
    age,
    customAge,
    allowance,
    livingWith,
    customLivingWith,
    fatherSmoke,
    motherSmoke,
    siblingSmoke,
    friendSmoke,
    part2EverTried,
    part2FirstAge,
    part2LastMonth,
    part3Answers,
    part4Answers,
    part5Answers,
  ]);

  // 3. Prevent accidental tab close during active assessment
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentStep !== 'intro' && currentStep !== 'finished') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentStep]);

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

    if (kind === 'pre') {
      sections.push({
        id: 'part1',
        name: `ตอนที่ ${counter}: ข้อมูลส่วนบุคคล (8 ข้อ)`,
        desc: '8 ข้อ',
        partNumber: counter++,
      });

      if (admin.part2Enabled) {
        sections.push({
          id: 'part2',
          name: `ตอนที่ ${counter}: พฤติกรรมการใช้บุหรี่ไฟฟ้า`,
          desc: '3 ข้อ',
          partNumber: counter++,
        });
      }
    } else if (kind === 'post') {
      if (!player.realName || !player.idCode) {
        sections.push({
          id: 'part1',
          name: `ระบุตัวตน: รหัสประจำตัววิจัย (ID Code)`,
          desc: 'รหัสเดิม',
          partNumber: counter++,
        });
      }
    }

    if (admin.part3Enabled) {
      sections.push({
        id: 'part3',
        name: `ตอนที่ ${counter}: แบบทดสอบความรู้เกี่ยวกับบุหรี่ไฟฟ้า`,
        desc: '8 ข้อ (ถูก / ผิด)',
        partNumber: counter++,
      });
    }

    if (admin.part4Enabled) {
      sections.push({
        id: 'part4',
        name: `ตอนที่ ${counter}: แบบประเมินทักษะการปฏิเสธบุหรี่ไฟฟ้า`,
        desc: '15 ข้อ',
        partNumber: counter++,
      });
    }

    if (kind === 'post' && admin.part5Enabled) {
      sections.push({
        id: 'part5',
        name: `ตอนที่ ${counter}: แบบประเมินประโยชน์ของแชตบอต`,
        desc: '7 ข้อ',
        partNumber: counter++,
      });
    }

    return sections;
  }, [kind, admin.part2Enabled, admin.part3Enabled, admin.part4Enabled, admin.part5Enabled, player.realName, player.idCode]);

  const totalActiveParts = activeSections.length;
  const currentPartNumber = activeSections.find((s) => s.id === currentStep)?.partNumber || 1;

  // Post-test eligibility: Must complete all 8 Hero Arc stages (stages 1-8) OR Admin bypass
  const heroStagesCompleted = [1, 2, 3, 4, 5, 6, 7, 8].every((id) => player.stagesCompleted.includes(id));
  const postUnlocked = heroStagesCompleted || admin.allowBypassStages;

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
    if (!consentAgreed) {
      alert('โปรดยืนยันการยินดีตอบแบบสอบถามก่อนเริ่มต้น');
      return;
    }
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
    if (!selectedSchoolChoice || (selectedSchoolChoice === OTHER_SCHOOL_VALUE && !customSchoolText.trim())) {
      alert('กรุณาเลือกหรือระบุชื่อ "โรงเรียน / สถาบันการศึกษา" ของคุณ');
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

  // Submit Part 4 (Validate all 20 questions, scroll & highlight if missing)
  const handleFinishPart4 = () => {
    const missing: number[] = [];
    PART4_REFUSAL_SKILLS.forEach((_, idx) => {
      if (part4Answers[idx] === undefined) {
        missing.push(idx);
      }
    });

    if (missing.length > 0) {
      setUnansweredPart4Indices(missing);
      const firstMissing = missing[0];
      const el = document.getElementById(`part4-q-${firstMissing}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setUnansweredPart4Indices([]);
    sfx.click();

    if (kind === 'post' && admin.part5Enabled) {
      setCurrentStep('part5');
    } else {
      finalizeAssessment();
    }
  };

  // Submit Part 5 (Validate all 7 questions, scroll & highlight if missing)
  const handleFinishPart5 = () => {
    const missing: number[] = [];
    PART5_CHATBOT_EVALUATION.forEach((_, idx) => {
      if (part5Answers[idx] === undefined) {
        missing.push(idx);
      }
    });

    if (missing.length > 0) {
      setUnansweredPart5Indices(missing);
      const firstMissing = missing[0];
      const el = document.getElementById(`part5-q-${firstMissing}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setUnansweredPart5Indices([]);
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

    // Array คำตอบความรู้รายข้อ (8 ข้อ: 0=ถูก, 1=ผิด)
    const kAnswers = knowledgeQuestions.map((_, idx) => part3Answers[idx] ?? -1);

    // Array คำตอบทักษะปฏิเสธรายข้อ (15 ข้อ: คะแนน 1-5)
    const sAnswers = admin.part4Enabled
      ? PART4_REFUSAL_SKILLS.map((_, idx) => part4Answers[idx] || 3)
      : [];

    if (kind === 'pre' || kind === 'post') {
      const existingDemo = player.demographics || {};
      const cleanId = (idCode || player.idCode || '').trim();
      const finalRealName = (realName || player.realName || '').trim();
      const finalNickname = (nickname || player.nickname || '').trim();
      const finalLineName = (lineName || player.lineName || '').trim();
      const finalGrade = grade || player.grade || 'ม.2';
      const finalSchool = currentSchoolValue || player.school || '';

      const finalAge = age === 'อื่นๆ' && customAge.trim() ? `${customAge.trim()} ปี` : age;
      const finalLivingWith = livingWith === 'อื่นๆ' && customLivingWith.trim() ? customLivingWith.trim() : livingWith;

      // ป้องกัน Post-test ลบทับข้อมูลสำรวจจริงด้วยค่าเริ่มต้น (Default)
      const demographicsData =
        kind === 'post' && existingDemo && Object.keys(existingDemo).length > 0
          ? {
              ...existingDemo,
              realName: finalRealName || existingDemo.realName,
              idCode: cleanId || existingDemo.idCode,
              nickname: finalNickname || existingDemo.nickname,
              lineName: finalLineName || existingDemo.lineName,
              grade: finalGrade || existingDemo.grade,
              school: finalSchool || existingDemo.school,
            }
          : {
              realName: finalRealName,
              idCode: cleanId,
              nickname: finalNickname,
              birthDay: birthDay.trim(),
              lineName: finalLineName,
              grade: finalGrade,
              school: finalSchool,
              sex: sex,
              age: finalAge,
              ageRange: finalAge,
              allowance: allowance,
              livingWith: finalLivingWith,
              fatherSmoke: fatherSmoke,
              motherSmoke: motherSmoke,
              siblingSmoke: siblingSmoke,
              friendSmoke: friendSmoke,
              familySmoking: `พ่อ:${fatherSmoke}, แม่:${motherSmoke}, พี่น้อง:${siblingSmoke}`,
              friendsSmoking: friendSmoke,
              behavior: {
                everTried: part2EverTried,
                firstAge: part2EverTried !== 'เคยลอง' ? 'ไม่เคยลอง' : part2FirstAge,
                lastMonth: part2EverTried !== 'เคยลอง' ? 'ไม่เคยสูบเลย' : part2LastMonth,
              },
            };

      recordAssessmentFull({
        kind,
        knowledgePercent: kPercent,
        skillPercent: sPercent,
        knowledgeAnswers: kAnswers,
        skillAnswers: sAnswers,
        idCode: cleanId,
        realName: finalRealName,
        lineName: finalLineName,
        grade: finalGrade,
        school: finalSchool,
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

    if (draftKey) {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
    }

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
          {/* Top Cover Art Hero Card with Walailak Emblem */}
          <div className="rounded-[28px] overflow-hidden shadow-clay border border-slate-100 bg-white">
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#E7F0F9]">
              <img
                src={asset('assessment/cover_wide.jpg')}
                alt="หน้าปกแบบสอบถามวิจัย"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              {/* Walailak University Branding Badge + Step Pill */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-xs border border-amber-200/80 flex items-center justify-center flex-shrink-0">
                    <img
                      src={asset('brand/wu-logo.png')}
                      alt="ตราสัญลักษณ์ มหาวิทยาลัยวลัยลักษณ์"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                      มหาวิทยาลัยวลัยลักษณ์
                    </p>
                    <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                      Walailak University
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-xs flex-shrink-0">
                  {isPre ? '🅰️ Pre-test' : '🅱️ Post-test'}
                </span>
              </div>

              {/* Research Title */}
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold mb-1.5 border border-sky-200/80">
                  {isPre ? 'แบบสอบถามก่อนเรียน' : 'แบบสอบถามหลังเรียน'}
                </span>
                <h1 className="font-display font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                  แบบสอบถาม: การพัฒนาแชตบอตแบบเกมมิฟิเคชันเพื่อส่งเสริมความรู้และทักษะการปฏิเสธบุหรี่ไฟฟ้าในนักเรียนมัธยมศึกษาตอนต้น
                </h1>
              </div>

              {/* Research Team */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span className="text-base">👩‍🏫</span>
                <p>
                  <span className="font-bold text-slate-800">คณะผู้วิจัย:</span> รองศาสตราจารย์ ดร. นิรชร ชูติพัฒนะ และคณะ
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: คำชี้แจงทางการวิจัย */}
          <div className="bg-sky-50/70 rounded-[24px] p-5 border border-sky-100 shadow-sm space-y-2.5">
            <h2 className="text-sm font-display font-extrabold text-slate-900">
              คำชี้แจง:
            </h2>
            <ol className="list-decimal list-outside pl-4 space-y-1.5 text-xs text-slate-700 leading-relaxed font-normal">
              <li>ผู้ตอบแบบสอบถามนี้คือ นักเรียนชั้นมัธยมศึกษาปีที่ 1–3</li>
              <li>
                แบบสอบถามชุดนี้มีวัตถุประสงค์เพื่อพัฒนาแชตบอตและเปรียบเทียบความรู้กับทักษะการปฏิเสธบุหรี่ไฟฟ้าก่อนและหลังใช้แชตบอต
              </li>
              <li>
                คำตอบของนักเรียนจะช่วยพัฒนาแชตบอตให้เหมาะกับวัย และช่วยให้นักเรียนรู้เท่าทันอันตรายของบุหรี่ไฟฟ้า รวมทั้งปฏิเสธและหลีกเลี่ยงการใช้บุหรี่ไฟฟ้าได้อย่างมั่นใจ
              </li>
              <li>
                {isPre
                  ? `แบบสอบถามชุดก่อนเรียนแบ่งออกเป็น 4 ตอน จำนวน 34 ข้อ (ข้อมูลส่วนตัว 8 ข้อ, พฤติกรรม 3 ข้อ, ความรู้ 8 ข้อ, ทักษะ 15 ข้อ) ใช้เวลาตอบประมาณ 10-15 นาที`
                  : `แบบสอบถามชุดหลังเรียนแบ่งออกเป็น 3 ตอน (ความรู้ 8 ข้อ, ทักษะ 15 ข้อ, ประเมินแชตบอต 7 ข้อ) ใช้เวลาตอบประมาณ 10 นาที`}
              </li>
              <li>
                การเข้าร่วมครั้งนี้เป็นไปโดยสมัครใจ นักเรียนมีสิทธิ์ปฏิเสธหรือถอนตัวได้ทุกเมื่อ โดยไม่มีผลกระทบต่อการเรียน ข้อมูลที่ได้รับจะถูกเก็บเป็นความลับและนำเสนอในภาพรวมเท่านั้น
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
                  <span>
                    <b>{sec.name}</b> ({sec.desc})
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 4: Consent Checkbox */}
          <label className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={consentAgreed}
              onChange={(e) => setConsentAgreed(e.target.checked)}
              className="w-5 h-5 rounded-md text-[#0284C7] focus:ring-[#0284C7] border-slate-300 mt-0.5"
            />
            <div className="text-xs text-slate-800">
              <span className="font-bold text-slate-900">ยินดีตอบแบบสอบถาม</span>
              <p className="text-[11px] text-slate-500 mt-0.5">
                ข้าพเจ้าเข้าใจวัตถุประสงค์และยินดีเข้าร่วมการตอบแบบสอบถามนี้ด้วยความสมัครใจ
              </p>
            </div>
          </label>

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
  // VIEW: 2. STEP 1 IDENTITY & DEMOGRAPHICS (ตรงตามแบบวิจัย 100%)
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
          {/* Top 3D Cover Banner Card for Part 1 */}
          <div className="rounded-[28px] overflow-hidden shadow-clay border border-slate-100 bg-white">
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
              <img
                src={asset('assessment/part1_cover.jpg')}
                alt="หน้าปกตอนที่ 1 ข้อมูลส่วนบุคคล"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-4 sm:p-5 text-white">
                <span className="inline-block self-start px-2.5 py-0.5 rounded-full bg-sky-400 text-slate-950 text-[10px] font-black mb-1 shadow-sm">
                  ตอนที่ 1 จาก {totalActiveParts}
                </span>
                <h1 className="font-display font-black text-base sm:text-lg leading-snug text-white drop-shadow">
                  ตอนที่ 1: ข้อมูลส่วนบุคคล (8 ข้อ)
                </h1>
                <p className="text-[11px] text-sky-200 mt-0.5 font-medium">
                  {kind === 'pre'
                    ? 'ขอให้นักเรียนให้ข้อมูลที่ตรงกับความเป็นจริง เพื่อใช้ในการศึกษาเปรียบเทียบผล'
                    : 'ระบุรหัสประจำตัวเดิมเพื่อใช้ในการเปรียบเทียบพัฒนาการก่อนและหลังเรียน'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-clay border border-slate-100 space-y-4">
            {/* Student ID & Verification Header */}
            <div className="p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50/50 rounded-2xl border border-sky-100 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🆔</span>
                <h3 className="text-xs font-bold text-slate-900">
                  การสร้างรหัสประจำตัว (ID Code) เพื่อความเป็นส่วนตัว
                </h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                สร้างรหัสโดยใช้ <b>อักษร 2 ตัวแรกของชื่อเล่น + วันที่เกิด 2 หลัก</b> เช่น ชื่อเล่น “แพร” เกิดวันที่ 15 รหัสคือ <b>พร15</b>
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">ชื่อเล่น</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="เช่น แพร, กอล์ฟ"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">วันที่เกิด (1-31)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={birthDay}
                    onChange={(e) => setBirthDay(e.target.value)}
                    placeholder="เช่น 15"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAutoGenerateIdCode}
                className="w-full py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>⚡ สร้างรหัสประจำตัวอัตโนมัติ</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5 text-xs">
              {/* Field 1: Real Name */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  ชื่อ-นามสกุลจริง <span className="text-rose-500">*</span>
                  <span className="text-[11px] font-normal text-slate-500 ml-1.5">(สำหรับคุณครูใช้ตรวจคะแนนและออกเกียรติบัตร)</span>
                </label>
                <input
                  type="text"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="เช่น เด็กชายสมชาย รักเรียน"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white shadow-sm"
                />
              </div>

              {/* Field 2: Student ID / ID Code */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  รหัสประจำตัววิจัย (ID Code) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={idCode}
                  onChange={(e) => setIdCode(e.target.value.trim().toUpperCase())}
                  placeholder="เช่น พร15 หรือ 66123456"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0284C7] bg-white shadow-sm font-bold tracking-wider"
                />
              </div>

              {/* Field 3: Grade */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-800">
                  ระดับชั้นเรียน <span className="text-rose-500">*</span>
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm font-medium"
                >
                  <optgroup label="🌿 ระดับมัธยมศึกษาตอนต้น (กลุ่มวิจัย)">
                    <option value="ม.1">มัธยมศึกษาปีที่ 1 (ม.1)</option>
                    <option value="ม.2">มัธยมศึกษาปีที่ 2 (ม.2)</option>
                    <option value="ม.3">มัธยมศึกษาปีที่ 3 (ม.3)</option>
                  </optgroup>
                  <optgroup label="🌱 ระดับประถมศึกษา">
                    <option value="ป.4">ประถมศึกษาปีที่ 4 (ป.4)</option>
                    <option value="ป.5">ประถมศึกษาปีที่ 5 (ป.5)</option>
                    <option value="ป.6">ประถมศึกษาปีที่ 6 (ป.6)</option>
                    <option value="ประถมศึกษาอื่นๆ">ประถมศึกษาอื่นๆ</option>
                  </optgroup>
                  <optgroup label="🌳 ระดับมัธยมศึกษาตอนปลาย & อาชีวะ">
                    <option value="ม.4">มัธยมศึกษาปีที่ 4 (ม.4)</option>
                    <option value="ม.5">มัธยมศึกษาปีที่ 5 (ม.5)</option>
                    <option value="ม.6">มัธยมศึกษาปีที่ 6 (ม.6)</option>
                    <option value="ปวช.">ประกาศนียบัตรวิชาชีพ (ปวช.)</option>
                    <option value="อื่นๆ">อื่นๆ</option>
                  </optgroup>
                </select>
              </div>

              {/* Field 4: School */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 flex items-center justify-between">
                  <span>🏫 โรงเรียน / สถาบันการศึกษา <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold border border-sky-100">
                    ค้นหาได้ & แตะเลือกด่วน
                  </span>
                </label>
                <SchoolSelectorModal
                  selectedSchool={selectedSchoolChoice}
                  customSchoolText={customSchoolText}
                  onSelectSchool={(sch) => setSelectedSchoolChoice(sch)}
                  onChangeCustomText={(txt) => setCustomSchoolText(txt)}
                />
              </div>

              {/* Field 5: LINE Profile Name */}
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
                  placeholder="เช่น Somchai_K หรือชื่อในแอป LINE"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm font-medium"
                />
              </div>

              {/* Research Demographics 8 Items (แสดงเฉพาะเมื่อทำแบบสอบถามชุดก่อนเรียน Pre-test) */}
              {kind === 'pre' && (
                <div className="pt-3 border-t border-slate-100 space-y-3.5">
                  <div className="flex items-center gap-2 pb-1">
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                      แบบสอบถามข้อมูลส่วนบุคคล 8 ข้อ
                    </span>
                  </div>

                  {/* Q1: Sex */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      1. เพศ <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                    >
                      <option value="ชาย">(1) ชาย</option>
                      <option value="หญิง">(2) หญิง</option>
                      <option value="เพศทางเลือก">(3) เพศทางเลือก</option>
                    </select>
                  </div>

                  {/* Q2: Age */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      2. นักเรียนอายุกี่ปี <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                    >
                      <option value="12 ปี">(1) 12 ปี</option>
                      <option value="13 ปี">(2) 13 ปี</option>
                      <option value="14 ปี">(3) 14 ปี</option>
                      <option value="15 ปี">(4) 15 ปี</option>
                      <option value="16 ปี">(5) 16 ปี</option>
                      <option value="17 ปี">(6) 17 ปี</option>
                      <option value="อื่นๆ">(7) อื่นๆ (โปรดระบุ)</option>
                    </select>
                    {age === 'อื่นๆ' && (
                      <input
                        type="text"
                        value={customAge}
                        onChange={(e) => setCustomAge(e.target.value)}
                        placeholder="ระบุอายุของท่าน (ปี)"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 mt-1 bg-white"
                      />
                    )}
                  </div>

                  {/* Q3: Allowance */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      3. นักเรียนได้เงินมาโรงเรียนวันละกี่บาท <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={allowance}
                      onChange={(e) => setAllowance(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                    >
                      <option value="ไม่ได้เงินมาโรงเรียน">(1) ไม่ได้เงินมาโรงเรียน</option>
                      <option value="น้อยกว่า 50 บาท">(2) น้อยกว่า 50 บาท</option>
                      <option value="50 - 100 บาท">(3) 50 - 100 บาท</option>
                      <option value="101 - 200 บาท">(4) 101 - 200 บาท</option>
                      <option value="มากกว่า 200 บาทขึ้นไป">(5) มากกว่า 200 บาทขึ้นไป</option>
                    </select>
                  </div>

                  {/* Q4: Living with */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800">
                      4. ปัจจุบันนักเรียนอาศัยอยู่กับใคร <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={livingWith}
                      onChange={(e) => setLivingWith(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                    >
                      <option value="พ่อ">(1) พ่อ</option>
                      <option value="แม่">(2) แม่</option>
                      <option value="พ่อ-แม่">(3) พ่อ-แม่</option>
                      <option value="ปู่ย่า-ตายาย">(4) ปู่ย่า-ตายาย</option>
                      <option value="ญาติ">(5) ญาติ</option>
                      <option value="อื่นๆ">(6) อื่นๆ (โปรดระบุ)</option>
                    </select>
                    {livingWith === 'อื่นๆ' && (
                      <input
                        type="text"
                        value={customLivingWith}
                        onChange={(e) => setCustomLivingWith(e.target.value)}
                        placeholder="ระบุบุคคลที่พักอาศัยอยู่ด้วย เช่น หอพัก"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-slate-800 mt-1 bg-white"
                      />
                    )}
                  </div>

                  {/* Q5: Father Smoking */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800 leading-snug">
                      5. พ่อของนักเรียน สูบบุหรี่หรือไม่
                      <span className="block text-[10px] text-slate-500 font-normal">
                        (เช่น บุหรี่ทุกชนิด ทั้งมวนเอง ยาเส้น ใบจาก บุหรี่ซอง บุหรี่ไฟฟ้า)
                      </span>
                    </label>
                    <select
                      value={fatherSmoke}
                      onChange={(e) => setFatherSmoke(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                    >
                      <option value="สูบ">(1) สูบ</option>
                      <option value="ไม่สูบ">(2) ไม่สูบ</option>
                      <option value="ไม่ทราบ / ไม่แน่ใจ">(3) ไม่ทราบ / ไม่แน่ใจ</option>
                      <option value="พ่อเสียชีวิตแล้ว">(4) พ่อเสียชีวิตแล้ว</option>
                    </select>
                  </div>

                  {/* Q6: Mother Smoking */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800 leading-snug">
                      6. แม่ของนักเรียน สูบบุหรี่หรือไม่
                      <span className="block text-[10px] text-slate-500 font-normal">
                        (เช่น บุหรี่ทุกชนิด ทั้งมวนเอง ยาเส้น ใบจาก บุหรี่ซอง บุหรี่ไฟฟ้า)
                      </span>
                    </label>
                    <select
                      value={motherSmoke}
                      onChange={(e) => setMotherSmoke(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                    >
                      <option value="สูบ">(1) สูบ</option>
                      <option value="ไม่สูบ">(2) ไม่สูบ</option>
                      <option value="ไม่ทราบ / ไม่แน่ใจ">(3) ไม่ทราบ / ไม่แน่ใจ</option>
                      <option value="แม่เสียชีวิตแล้ว">(4) แม่เสียชีวิตแล้ว</option>
                    </select>
                  </div>

                  {/* Q7: Sibling Smoking */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800 leading-snug">
                      7. พี่น้องของนักเรียน สูบบุหรี่หรือไม่
                      <span className="block text-[10px] text-slate-500 font-normal">
                        (เช่น บุหรี่ทุกชนิด ทั้งมวนเอง ยาเส้น ใบจาก บุหรี่ซอง บุหรี่ไฟฟ้า)
                      </span>
                    </label>
                    <select
                      value={siblingSmoke}
                      onChange={(e) => setSiblingSmoke(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                    >
                      <option value="สูบ">(1) สูบ</option>
                      <option value="ไม่สูบ">(2) ไม่สูบ</option>
                      <option value="ไม่ทราบ / ไม่แน่ใจ">(3) ไม่ทราบ / ไม่แน่ใจ</option>
                      <option value="ไม่มีพี่น้อง">(4) ไม่มีพี่น้อง</option>
                    </select>
                  </div>

                  {/* Q8: Friend Smoking */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-800 leading-snug">
                      8. เพื่อนของนักเรียน สูบบุหรี่หรือไม่
                      <span className="block text-[10px] text-slate-500 font-normal">
                        (เช่น บุหรี่ทุกชนิด ทั้งมวนเอง ยาเส้น ใบจาก บุหรี่ซอง บุหรี่ไฟฟ้า)
                      </span>
                    </label>
                    <select
                      value={friendSmoke}
                      onChange={(e) => setFriendSmoke(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
                    >
                      <option value="สูบ">(1) สูบ</option>
                      <option value="ไม่สูบ">(2) ไม่สูบ</option>
                      <option value="ไม่ทราบ / ไม่แน่ใจ">(3) ไม่ทราบ / ไม่แน่ใจ</option>
                    </select>
                  </div>
                </div>
              )}
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
          subtitle={`ตอนที่ ${currentPartNumber}: พฤติกรรมการใช้บุหรี่ไฟฟ้า`}
          backTo="/"
        />

        <main className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-4">
          {/* Top 3D Cover Banner Card for Part 2 */}
          <div className="rounded-[28px] overflow-hidden shadow-clay border border-slate-100 bg-white">
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
              <img
                src={asset('assessment/part1_cover.jpg')}
                alt="หน้าปกตอนที่ 2 พฤติกรรมการใช้บุหรี่ไฟฟ้า"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-4 sm:p-5 text-white">
                <span className="inline-block self-start px-2.5 py-0.5 rounded-full bg-sky-400 text-slate-950 text-[10px] font-black mb-1 shadow-sm">
                  ตอนที่ {currentPartNumber} จาก {totalActiveParts}
                </span>
                <h1 className="font-display font-black text-base sm:text-lg leading-snug text-white drop-shadow">
                  ตอนที่ 2: พฤติกรรมการใช้บุหรี่ไฟฟ้า (3 ข้อ)
                </h1>
                <p className="text-[11px] text-sky-200 mt-0.5 font-medium">
                  ตอบตามความเป็นจริง ข้อมูลทั้งหมดจะไม่ถูกเปิดเผยเป็นรายบุคคล
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-clay border border-slate-100 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-[#0284C7]">
                ตอนที่ {currentPartNumber} จาก {totalActiveParts}
              </span>
              <h2 className="text-base sm:text-lg font-display font-extrabold text-slate-900 mt-1">
                พฤติกรรมการใช้บุหรี่ไฟฟ้า (3 ข้อ)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เลือกคำตอบที่ตรงกับพฤติกรรมและความเป็นจริงของนักเรียน
              </p>
            </div>

            {/* Q1 */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-800">{PART2_BEHAVIORS.everTried.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

            {/* Never tried Callout Banner */}
            {!isEverTried && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-2 text-emerald-900 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <span className="text-base">🎉</span>
                  <span>ยอดเยี่ยมมากครับ! นักเรียนไม่เคยลองบุหรี่ไฟฟ้า</span>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  ตามระเบียบแบบสอบถามวิจัย หากตอบ “ไม่เคยลองเลย” สามารถกด <b>"ข้ามไปตอนที่ 3 (แบบทดสอบความรู้)"</b> ได้ทันทีโดยไม่ต้องตอบข้อ 2 และ 3
                </p>
                <button
                  type="button"
                  onClick={handlePart2Next}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <span>⏩ ข้ามไปทำตอนที่ 3 (แบบทดสอบความรู้) ทันที</span>
                </button>
              </motion.div>
            )}

            {/* Q2: ถ้าเคยลอง */}
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
                          ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-sm font-bold'
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
            {isEverTried && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <p className="text-xs font-bold text-slate-800">{PART2_BEHAVIORS.lastMonth.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  {PART2_BEHAVIORS.lastMonth.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setPart2LastMonth(opt);
                      }}
                      className={`p-3 text-center rounded-xl border text-xs font-medium transition-all ${
                        part2LastMonth === opt
                          ? 'bg-[#0284C7] text-white border-[#0284C7] shadow-sm font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

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
  // VIEW: 4. STEP 3 KNOWLEDGE QUESTIONS (แบบทดสอบความรู้ 8 ข้อ ถูก/ผิด)
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
          {/* Top 3D Cover Banner Card for Part 3 */}
          <div className="rounded-[28px] overflow-hidden shadow-clay border border-slate-100 bg-white">
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
              <img
                src={asset('assessment/part2_cover.jpg')}
                alt="หน้าปกตอนที่ 2 แบบทดสอบความรู้"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-4 sm:p-5 text-white">
                <span className="inline-block self-start px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black mb-1 shadow-sm">
                  ตอนที่ {currentPartNumber} จาก {totalActiveParts}
                </span>
                <h1 className="font-display font-black text-base sm:text-lg leading-snug text-white drop-shadow">
                  แบบทดสอบความรู้เกี่ยวกับบุหรี่ไฟฟ้า (8 ข้อ)
                </h1>
                <p className="text-[11px] text-sky-200 mt-0.5 font-medium">
                  อ่านข้อความอย่างละเอียด แล้วเลือกว่าข้อความนั้น "ถูก" หรือ "ผิด"
                </p>
              </div>
            </div>
          </div>

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

              {/* 2 Big True / False Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {q?.choices.map((choice, cIdx) => {
                  const isSelected = part3Answers[part3CurrentIndex] === cIdx;
                  const isTrueChoice = choice === 'ถูก' || cIdx === 0;

                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => handleSelectKnowledgeChoice(part3CurrentIndex, cIdx)}
                      className={`p-4 sm:p-5 rounded-2xl border-2 text-center transition-all active:scale-[0.98] flex flex-col items-center justify-center gap-2 ${
                        isSelected
                          ? isTrueChoice
                            ? 'bg-emerald-600 text-white border-emerald-700 ring-4 ring-emerald-200 shadow-clay font-black scale-[1.02]'
                            : 'bg-rose-600 text-white border-rose-700 ring-4 ring-rose-200 shadow-clay font-black scale-[1.02]'
                          : isTrueChoice
                          ? 'bg-white hover:bg-emerald-50/60 border-emerald-200 text-emerald-800'
                          : 'bg-white hover:bg-rose-50/60 border-rose-200 text-rose-800'
                      }`}
                    >
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-black ${
                          isSelected
                            ? 'bg-white/25 text-white'
                            : isTrueChoice
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isTrueChoice ? '✓' : '✗'}
                      </span>
                      <span className="text-base sm:text-lg font-display font-extrabold tracking-wide">
                        {choice}
                      </span>
                      <span className={`text-[11px] ${isSelected ? 'text-white/85 font-semibold' : 'text-slate-500'}`}>
                        {isTrueChoice ? '(ข้อความนี้ถูกต้อง)' : '(ข้อความนี้ผิด)'}
                      </span>
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
  // VIEW: 5. STEP 4 REFUSAL SKILLS 15 QUESTIONS (ตอนที่ 4)
  // =========================================================================
  if (currentStep === 'part4') {
    const answeredCount = Object.keys(part4Answers).length;
    const totalSkills = PART4_REFUSAL_SKILLS.length;

    return (
      <div className="min-h-screen bg-slate-50/70 pb-14">
        <PageHeader
          title={kind === 'pre' ? '📝 แบบสอบถามก่อนเรียน (Pre-test)' : '🎯 แบบสอบถามหลังเรียน (Post-test)'}
          subtitle={`ตอนที่ ${currentPartNumber}: แบบประเมินทักษะการปฏิเสธบุหรี่ไฟฟ้า (15 ข้อ)`}
          backTo="/"
        />

        <main className="max-w-md md:max-w-xl mx-auto px-4 pt-3 space-y-4">
          {/* Top 3D Cover Banner Card for Part 4 */}
          <div className="rounded-[28px] overflow-hidden shadow-clay border border-slate-100 bg-white">
            <div className="relative h-44 sm:h-52 w-full overflow-hidden bg-slate-950">
              <img
                src={asset('assessment/part2_cover.jpg')}
                alt="หน้าปกตอนที่ 4 ทักษะการปฏิเสธ"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-4 sm:p-5 text-white">
                <span className="inline-block self-start px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black mb-1 shadow-sm">
                  ตอนที่ {currentPartNumber} จาก {totalActiveParts}
                </span>
                <h1 className="font-display font-black text-base sm:text-lg leading-snug text-white drop-shadow">
                  แบบประเมินทักษะการปฏิเสธบุหรี่ไฟฟ้า (15 ข้อ)
                </h1>
                <p className="text-[11px] text-emerald-200 mt-0.5 font-medium">
                  ประเมินระดับความมั่นใจว่าท่านสามารถปฏิเสธได้หรือไม่ (1 = ไม่มั่นใจเลย ถึง 5 = มั่นใจมากที่สุด)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[28px] p-5 sm:p-6 shadow-clay border border-slate-100 space-y-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                ตอนที่ {currentPartNumber} จาก {totalActiveParts}
              </span>
              <h2 className="font-display font-extrabold text-slate-900 text-base mt-2">
                แบบประเมินทักษะการปฏิเสธบุหรี่ไฟฟ้า (15 ข้อ)
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-1">
                อ่านสถานการณ์แล้วประเมินระดับ <b>"ความมั่นใจ"</b> ว่าท่านจะปฏิเสธได้หรือไม่:
                <br />
                <span className="text-[11px] text-slate-600">
                  (1=ไม่มั่นใจเลย, 2=ไม่ค่อยมั่นใจ, 3=ค่อนข้างมั่นใจ, 4=ค่อนข้างมั่นใจมาก, 5=มั่นใจมากที่สุด)
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
                const isMissing = unansweredPart4Indices.includes(idx);
                return (
                  <div
                    key={item.id}
                    id={`part4-q-${idx}`}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isMissing
                        ? 'border-rose-400 bg-rose-50/80 ring-2 ring-rose-300 shadow-md'
                        : currentScore !== undefined
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-slate-100 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                        <span className="font-bold text-emerald-600 mr-1.5">{item.no}.</span>
                        {item.text}
                      </p>
                      {isMissing && (
                        <span className="flex-shrink-0 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">
                          ⚠️ กรุณาตอบข้อนี้
                        </span>
                      )}
                    </div>
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
                              setUnansweredPart4Indices((prev) => prev.filter((i) => i !== idx));
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

            {/* ส่วนสรุปความคืบหน้า + ปุ่มไปข้อที่ยังไม่ตอบ + ปุ่มไปต่อ (รวมไว้จุดเดียว ไม่ซ้ำซ้อน) */}
            <div className="pt-3 border-t border-slate-100 space-y-3 pb-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    ความคืบหน้า: {answeredCount}/{totalSkills} ข้อ
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {answeredCount === totalSkills ? '✓ ตอบครบถ้วนทั้ง 15 ข้อแล้ว' : `เหลืออีก ${totalSkills - answeredCount} ข้อ`}
                  </p>
                </div>
                {answeredCount < totalSkills && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstUnanswered = PART4_REFUSAL_SKILLS.findIndex((_, i) => part4Answers[i] === undefined);
                      if (firstUnanswered !== -1) {
                        setUnansweredPart4Indices([firstUnanswered]);
                        document.getElementById(`part4-q-${firstUnanswered}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 hover:shadow-md transition-all flex-shrink-0"
                  >
                    <span>⏩ ไปข้อที่ยังไม่ตอบ</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleFinishPart4}
                className="btn-primary w-full py-3.5 text-sm font-bold shadow-clay flex items-center justify-center gap-2"
              >
                <span>
                  {kind === 'post' && admin.part5Enabled
                    ? 'ถัดไป (ตอนที่ 5: ประเมินแชตบอต) →'
                    : 'ส่งคำตอบและดูผลลัพธ์ ✓'}
                </span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // VIEW: 6. STEP 5 CHATBOT EVALUATION (ตอนที่ 5: ประโยชน์ของแชตบอต 7 ข้อ)
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
          {/* Top 3D Cover Banner Card for Part 5 */}
          <div className="rounded-[28px] overflow-hidden shadow-clay border border-slate-100 bg-white">
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-950">
              <img
                src={asset('assessment/cover_wide.jpg')}
                alt="หน้าปกตอนที่ 5 ประเมินประโยชน์ของแชตบอต"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-4 sm:p-5 text-white">
                <span className="inline-block self-start px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black mb-1 shadow-sm">
                  ตอนที่ {currentPartNumber} จาก {totalActiveParts}
                </span>
                <h1 className="font-display font-black text-base sm:text-lg leading-snug text-white drop-shadow">
                  แบบประเมินประโยชน์ของแชตบอต (7 ข้อ)
                </h1>
                <p className="text-[11px] text-amber-200 mt-0.5 font-medium">
                  ประเมินความพึงพอใจและความคิดเห็นหลังการใช้งาน (1 = น้อยที่สุด ถึง 5 = มากที่สุด)
                </p>
              </div>
            </div>
          </div>

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
                const isMissing = unansweredPart5Indices.includes(idx);
                return (
                  <div
                    key={item.id}
                    id={`part5-q-${idx}`}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                      isMissing
                        ? 'border-rose-400 bg-rose-50/80 ring-2 ring-rose-300 shadow-md'
                        : currentScore !== undefined
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-100 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                        <span className="font-bold text-amber-600 mr-1.5">{item.no}.</span>
                        {item.text}
                      </p>
                      {isMissing && (
                        <span className="flex-shrink-0 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 animate-pulse">
                          ⚠️ กรุณาตอบข้อนี้
                        </span>
                      )}
                    </div>
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
                              setUnansweredPart5Indices((prev) => prev.filter((i) => i !== idx));
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

            {/* Concluding Blessing Message from the Researchers */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-rose-50/30 to-amber-50 border border-amber-200/80 shadow-sm text-center space-y-1.5">
              <p className="text-sm font-bold text-amber-900 leading-relaxed">
                🌸 ขอให้ทุกคนเติบโตไปพร้อมกับความสุขและรอยยิ้มที่แท้จริง โดยไม่ต้องพึ่งบุหรี่ไฟฟ้านะคะ 🌟
              </p>
              <p className="text-[11px] text-slate-600 font-medium">
                — รองศาสตราจารย์ ดร. นิรชร ชูติพัฒนะ และคณะผู้วิจัย มหาวิทยาลัยวลัยลักษณ์
              </p>
            </div>

            {/* ส่วนสรุปความคืบหน้า + ปุ่มไปข้อที่ยังไม่ตอบ + ปุ่มบันทึกผล (รวมไว้จุดเดียว ไม่ซ้ำซ้อน) */}
            <div className="pt-3 border-t border-slate-100 space-y-3 pb-4">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between gap-3 shadow-xs">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    ความคืบหน้า: {answeredCount}/{totalPart5} ข้อ
                  </p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {answeredCount === totalPart5 ? '✓ ประเมินครบถ้วนทุกข้อแล้ว' : `เหลืออีก ${totalPart5 - answeredCount} ข้อ`}
                  </p>
                </div>
                {answeredCount < totalPart5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const firstUnanswered = PART5_CHATBOT_EVALUATION.findIndex((_, i) => part5Answers[i] === undefined);
                      if (firstUnanswered !== -1) {
                        setUnansweredPart5Indices([firstUnanswered]);
                        document.getElementById(`part5-q-${firstUnanswered}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 hover:shadow-md transition-all flex-shrink-0"
                  >
                    <span>⏩ ไปข้อที่ยังไม่ตอบ</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleFinishPart5}
                className="btn-primary w-full py-3.5 text-sm font-bold shadow-clay flex items-center justify-center gap-2"
              >
                <span>บันทึกผลการประเมินแชตบอต ✓</span>
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
        {/* Main 3D Cover Banner Card */}
        <div className="rounded-[28px] overflow-hidden shadow-clay border border-slate-100 bg-white">
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#E7F0F9]">
            <img
              src={asset('assessment/cover_wide.jpg')}
              alt="หน้าปกแบบสอบถามวิจัย"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            {/* Walailak University Branding Badge */}
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/70 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-xs border border-amber-200/80 flex items-center justify-center flex-shrink-0">
                <img
                  src={asset('brand/wu-logo.png')}
                  alt="ตราสัญลักษณ์ มหาวิทยาลัยวลัยลักษณ์"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                  มหาวิทยาลัยวลัยลักษณ์
                </p>
                <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                  Walailak University
                </p>
              </div>
            </div>

            {/* Research Title */}
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold mb-1.5 border border-sky-200/80">
                แบบสอบถามเพื่อการวิจัย
              </span>
              <h1 className="font-display font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                การพัฒนาแชตบอตแบบเกมมิฟิเคชันเพื่อส่งเสริมความรู้และทักษะการปฏิเสธบุหรี่ไฟฟ้าในนักเรียนมัธยมศึกษาตอนต้น
              </h1>
            </div>

            {/* Research Team */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <span className="text-base">👩‍🏫</span>
              <p>
                <span className="font-bold text-slate-800">คณะผู้วิจัย:</span> รองศาสตราจารย์ ดร. นิรชร ชูติพัฒนะ และคณะ
              </p>
            </div>
          </div>
        </div>

        {/* Card 1: Pre-test */}
        <button
          onClick={() => startMode('pre')}
          disabled={!admin.preTestEnabled}
          className={`w-full card text-left flex items-center gap-3.5 p-4 transition-all group ${
            admin.preTestEnabled ? 'active:scale-[0.99]' : 'opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl overflow-hidden shadow-clay-sm flex-shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center p-1">
            <img
              src={asset('assessment/icon_pretest_3d.svg')}
              alt="แบบประเมินก่อนเรียน (Pre-test)"
              className="w-full h-full object-contain"
            />
          </div>
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
              4 ตอน (ข้อมูลทั่วไป 8 ข้อ + พฤติกรรม 3 ข้อ + ความรู้ 8 ข้อ ถูก/ผิด + ทักษะ 15 ข้อ)
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
          className={`w-full card text-left flex items-center gap-3.5 p-4 transition-all group ${
            postUnlocked && admin.postTestEnabled ? 'active:scale-[0.99]' : 'opacity-60 cursor-not-allowed'
          }`}
        >
          <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl overflow-hidden shadow-clay-sm flex-shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center p-1">
            <img
              src={asset('assessment/icon_posttest_3d.svg')}
              alt="แบบประเมินหลังเรียน (Post-test)"
              className="w-full h-full object-contain"
            />
          </div>
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
                ? '3 ตอน (ความรู้ 8 ข้อ ถูก/ผิด + ทักษะ 15 ข้อ + ประเมินแชตบอต 7 ข้อ)'
                : `🔒 ปลดล็อกเมื่อเล่นจบ ${CERT_STAGE_COUNT} ด่านแรก หรือได้รับอนุญาตจากครู`}
            </p>
          </div>
          <span className="text-emerald-600 font-bold">→</span>
        </button>

        {/* Card 3: Chatbot Evaluation (Part 5) */}
        {admin.part5Enabled && (
          <button
            onClick={() => startMode('eval')}
            className="w-full card text-left flex items-center gap-3.5 p-4 active:scale-[0.99] transition-all group"
          >
            <div className="w-14 h-14 min-w-[56px] min-h-[56px] max-w-[56px] max-h-[56px] rounded-2xl overflow-hidden shadow-clay-sm flex-shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center p-1">
              <img
                src={asset('assessment/icon_star_3d.svg')}
                alt="ตอนที่ 5 ประโยชน์ของแชตบอต"
                className="w-full h-full object-contain"
              />
            </div>
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
