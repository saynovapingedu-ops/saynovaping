import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getScenarioById, SCENARIO_META, isStageUnlocked, CERT_STAGE_COUNT, getStageDifficulty } from '../scenarios';
import { getBadge } from '../lib/badges';
import { usePlayerStore } from '../store/playerStore';
import { useCertNameStore } from '../store/certNameStore';
import { useUIStore } from '../store/uiStore';
import DialogueBubble from '../components/DialogueBubble';
import ChoiceCard from '../components/ChoiceCard';
import CertNameDialog from '../components/CertNameDialog';
import RunnerGame from '../components/minigames/RunnerGame';
import TapAdsGame from '../components/minigames/TapAdsGame';
import CatchGame from '../components/minigames/CatchGame';
import ShootMythGame from '../components/minigames/ShootMythGame';
import QuickFireGame from '../components/minigames/QuickFireGame';
import LaneRunGame from '../components/minigames/LaneRunGame';
import SnakeGame from '../components/minigames/SnakeGame';
import MazeGame from '../components/minigames/MazeGame';
import ReactionGame from '../components/minigames/ReactionGame';
import GameErrorBoundary from '../components/minigames/GameErrorBoundary';
import SpotTheLie from '../components/minigames/SpotTheLie';
import OrderCards from '../components/minigames/OrderCards';
import WordMatch from '../components/minigames/WordMatch';
import FillBlank from '../components/minigames/FillBlank';
import SwipeDecide from '../components/minigames/SwipeDecide';
import MemoryMatch from '../components/minigames/MemoryMatch';
import RiskRank from '../components/minigames/RiskRank';
import Confetti from '../components/Confetti';
import { asset } from '../lib/asset';
import { sfx, vibrate } from '../lib/sound';
import { speak, stopSpeaking, ttsSupported } from '../lib/tts';
import { useSettingsStore } from '../store/settingsStore';
import { useProgressStore } from '../store/progressStore';
import { shareChallenge } from '../lib/liff';
import {
  getPendingChallenge, clearPendingChallenge, buildChallengeUrl,
  type PendingChallenge,
} from '../lib/challenge';
import type { Choice, ScenarioNode } from '../types';

// ===== เฉลยจบด่าน — รองรับทั้งข้อเลือกคำตอบ (choice) และมินิเกม =====
type ReviewRow = { q: string; a: string; note?: string; source?: string };
type ReviewEntry =
  | {
      kind: 'choice';
      prompt: string;
      pickedLabel: string;
      pickedXp: number;
      isBest: boolean;
      bestLabel: string;
      reflection?: string;
      source?: string;
      bestSource?: string;
    }
  | {
      kind: 'minigame';
      title: string;
      gameLabel: string;
      success: boolean;
      rows: ReviewRow[];
    };

const DIFFICULTY_LABEL: Record<string, { label: string; cls: string }> = {
  easy:    { label: '🟢 ง่าย',     cls: 'bg-success-100 text-success-700' },
  medium:  { label: '🟡 ปานกลาง', cls: 'bg-detective-100 text-detective-700' },
  hard:    { label: '🟠 ยาก',      cls: 'bg-warning-100 text-warning-700' },
  advance: { label: '🔴 ขั้นกว่า', cls: 'bg-danger-100 text-danger-700' },
};

const GAME_REVIEW_LABEL: Record<string, string> = {
  'spot-the-lie': '🕵️ จับโกหก',
  'order-cards':  '🃏 เรียงลำดับ',
  'word-match':   '🔗 จับคู่คำ',
  'fill-blank':   '✍️ เติมคำ',
  'swipe-decide': '👆 ปัดจริง-เท็จ',
  'memory-match': '🧠 จับคู่ภาพ',
  'risk-rank':    '📊 จัดอันดับเสี่ยง',
  'runner':       '🏃 วิ่งหนีบุหรี่ไฟฟ้า',
  'tap-ads':      '👆 ทุบโฆษณาหลอก',
  'catch-lungs':  '🫁 ปอดสะอาด',
  'shoot-myth':   '🎯 ยิงจับเท็จ',
  'quick-fire':   '⚡ ตอบเร็วจับเวลา',
  'lane-run':     '🛹 รูดหลบ 3 เลน',
  'snake':        '🐍 งูกินของดี',
  'maze':         '🌫️ หนีควันหาทางออก',
  'reaction':     '✋ แตะให้ไว',
};

/** เกมอาร์เคดในด่าน — เล่นจนถึง goalScore แล้วผ่าน (เลี่ยงให้สั้น ไม่ล้า) */
const ARCADE_GAME_TYPES = new Set([
  'runner', 'tap-ads', 'catch-lungs',
  'shoot-myth', 'quick-fire', 'lane-run', 'snake', 'maze', 'reaction',
]);

// สร้างแถวเฉลยของมินิเกม — โชว์คำถาม + คำตอบที่ถูก + คำอธิบาย + อ้างอิง
function buildMinigameRows(node: Extract<ScenarioNode, { type: 'minigame' }>): ReviewRow[] {
  switch (node.game) {
    case 'spot-the-lie':
      return (node.claims || []).map(c => ({
        q: c.text, a: c.isLie ? 'เท็จ ✗' : 'จริง ✓', note: c.reveal, source: c.source,
      }));
    case 'order-cards': {
      const byId = new Map((node.cards || []).map(c => [c.id, c.text]));
      const ordered = (node.correctOrder || []).map((id, i) => `${i + 1}. ${byId.get(id) ?? id}`);
      return [{ q: 'ลำดับที่ถูกต้อง', a: ordered.join('  →  '), source: node.source }];
    }
    case 'word-match':
      return (node.pairs || []).map(p => ({
        q: p.left, a: p.right, source: p.source || node.source,
      }));
    case 'fill-blank':
      return (node.questions || []).map(q => ({
        q: q.sentence.replace('___', '____'), a: q.options[q.correctIndex], note: q.reveal, source: q.source,
      }));
    case 'swipe-decide':
      return (node.swipeCards || []).map(c => ({
        q: c.text, a: c.isTrue ? 'จริง ✓' : 'เท็จ ✗', note: c.reveal, source: c.source,
      }));
    case 'memory-match':
      return (node.memoryPairs || []).map(p => ({
        q: p.a, a: p.b, note: p.reveal, source: p.source,
      }));
    case 'risk-rank': {
      const bucketLabel = new Map((node.buckets || []).map(b => [b.id, b.label]));
      return (node.riskItems || []).map(it => ({
        q: it.text, a: bucketLabel.get(it.bucketId) ?? it.bucketId, source: it.source,
      }));
    }
    default:
      return [];
  }
}

export default function ScenarioPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const stageId = Number(id);
  const scenario = getScenarioById(stageId);
  const addXP = usePlayerStore(s => s.addXP);
  const awardBadge = usePlayerStore(s => s.awardBadge);
  const completeStage = usePlayerStore(s => s.completeStage);
  const pushXP = useUIStore(s => s.pushXP);
  const pushBadge = useUIStore(s => s.pushBadge);

  const [showIntro, setShowIntro] = useState(true);
  const [history, setHistory] = useState<ScenarioNode[]>([]);
  const [currentNodeId, setCurrentNodeId] = useState<string>(scenario?.startNode || '');
  const [confettiActive, setConfettiActive] = useState(false);
  const [certNameOpen, setCertNameOpen] = useState(false);
  const markCertNamePrompted = usePlayerStore(s => s.markCertNamePrompted);
  // ใช้ Hint — เก็บ id ของ node ที่ผู้เล่นเปิด hint แล้ว (โชว์ best choice)
  const [hintRevealedNode, setHintRevealedNode] = useState<string | null>(null);
  const hintTokens = usePlayerStore(s => s.hintTokens || 0);
  const coinX2Remaining = usePlayerStore(s => s.coinX2Remaining || 0);
  const useHintToken = usePlayerStore(s => s.useHintToken);
  // เก็บคำตอบของผู้เล่นทีละข้อ (เลือกคำตอบ + มินิเกม) — ใช้สร้างเฉลยตอนจบด่าน
  const [reviewLog, setReviewLog] = useState<ReviewEntry[]>([]);
  const [askResume, setAskResume] = useState(false);
  // ===== ท้าเพื่อน (async) — แต้มที่ได้ในด่านนี้ + คำท้าที่ค้างอยู่ =====
  const nickname = usePlayerStore(s => s.nickname);
  const [stageScore, setStageScore] = useState(0);
  const [challenge, setChallenge] = useState<PendingChallenge | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  // ดาวประเมินความสนุก/พึงพอใจหลังจบด่าน (เก็บครั้งเดียวต่อด่าน)
  const rateFun = usePlayerStore(s => s.rateFun);
  const [funStars, setFunStars] = useState(0);
  // เลื่อนหน้าจอไปที่ฉากปัจจุบันอัตโนมัติ + ย่อบทสนทนาเก่าให้หน้าสั้นลง
  const currentRef = useRef<HTMLDivElement>(null);
  const [showOlder, setShowOlder] = useState(false);

  const saveProgress  = useProgressStore(s => s.saveProgress);
  const getProgress   = useProgressStore(s => s.getProgress);
  const clearProgress = useProgressStore(s => s.clearProgress);

  // reset state เมื่อเปลี่ยน stage + เช็คว่ามี save ค้างไว้ไหม
  useEffect(() => {
    setHistory([]);
    setCurrentNodeId(scenario?.startNode || '');
    setStageScore(0);
    // โหลดคำท้าถ้าเป็นด่านเดียวกับที่ถูกท้า
    const pending = getPendingChallenge();
    setChallenge(pending && pending.stageId === stageId ? pending : null);
    const saved = getProgress(stageId);
    if (saved && scenario) {
      // ตรวจสอบว่า save ยัง valid (node ยังอยู่)
      const nodeExists = scenario.nodes.some(n => n.id === saved.currentNodeId);
      if (nodeExists && saved.currentNodeId !== scenario.startNode) {
        setAskResume(true);
        setShowIntro(true);
        return;
      }
    }
    setAskResume(false);
    setShowIntro(true);
  }, [stageId, scenario, getProgress]);

  // กดเล่นต่อจาก save
  const handleResume = () => {
    const saved = getProgress(stageId);
    if (!saved || !scenario) return;
    // คืน history จาก historyIds + reconstruct player echoes
    const restored: ScenarioNode[] = [];
    for (const id of saved.historyIds) {
      if (id.startsWith('__pick_')) {
        // re-create player echo
        const sourceNodeId = id.split('_')[2];
        const text = saved.pickedChoices[sourceNodeId];
        if (text) {
          restored.push({
            type: 'dialogue', id, speaker: 'player', text, next: '',
          });
        }
      } else {
        const n = scenario.nodes.find(node => node.id === id);
        if (n) restored.push(n);
      }
    }
    setHistory(restored);
    setCurrentNodeId(saved.currentNodeId);
    setShowIntro(false);
    setAskResume(false);
    sfx.click();
  };

  const handleStartFresh = () => {
    clearProgress(stageId);
    setAskResume(false);
    setShowIntro(true);
    setHistory([]);
    setCurrentNodeId(scenario?.startNode || '');
  };

  // auto-save ทุกครั้งที่ history เปลี่ยน (ยกเว้นเมื่อจบด่าน)
  useEffect(() => {
    if (!scenario || showIntro || history.length === 0) return;
    const cur = scenario.nodes.find(n => n.id === currentNodeId);
    if (!cur || cur.type === 'end') return;
    saveProgress({
      stageId,
      currentNodeId,
      historyIds: history.map(h => h.id),
      pickedChoices: history.reduce<Record<string, string>>((acc, h) => {
        if (h.id.startsWith('__pick_') && h.type === 'dialogue') {
          const sourceNodeId = h.id.split('_')[2];
          acc[sourceNodeId] = h.text;
        }
        return acc;
      }, {}),
    });
  }, [history, currentNodeId, stageId, scenario, showIntro, saveProgress]);

  useEffect(() => {
    if (!scenario) return;
    if (!showIntro && history.length === 0) {
      const startNode = scenario.nodes.find(n => n.id === scenario.startNode);
      if (startNode) {
        setHistory([startNode]);
        setCurrentNodeId(startNode.id);
      }
    }
  }, [showIntro, scenario, history.length]);

  // ตอนเข้าหน้า end → เล่น confetti + เสียงชัยชนะ
  useEffect(() => {
    const node = scenario?.nodes.find(n => n.id === currentNodeId);
    if (node?.type === 'end') {
      setConfettiActive(true);
      sfx.victory();
      vibrate([30, 50, 30, 50, 60]);
      const t = setTimeout(() => setConfettiActive(false), 2600);

      // ถามชื่อจริงสำหรับเกียรติบัตร — ครั้งเดียว ตอนผ่านเกณฑ์
      const p = usePlayerStore.getState();
      const completedAfter = p.stagesCompleted.includes(stageId)
        ? p.stagesCompleted
        : [...p.stagesCompleted, stageId];
      const eligible = completedAfter.length >= CERT_STAGE_COUNT || p.totalXP >= 1500;
      const hasRealName = useCertNameStore.getState().realName.trim().length > 0;
      let t2: ReturnType<typeof setTimeout> | undefined;
      if (eligible && !p.certNamePrompted && !hasRealName) {
        t2 = setTimeout(() => {
          setCertNameOpen(true);
          markCertNamePrompted();
        }, 1600);
      }
      return () => { clearTimeout(t); if (t2) clearTimeout(t2); };
    }
  }, [currentNodeId, scenario, stageId, markCertNamePrompted]);

  // เลื่อนไปฉากปัจจุบันทุกครั้งที่เปลี่ยน node + ย่อบทสนทนาเก่ากลับมาตอนเริ่มสเต็ปใหม่
  useEffect(() => {
    if (showIntro) return;
    setShowOlder(false);
    const t = setTimeout(() => {
      currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(t);
  }, [currentNodeId, showIntro]);

  // หยุดเสียงอ่านบทสนทนาเมื่อออกจากด่าน
  useEffect(() => stopSpeaking, []);

  // พากย์บทสนทนาอัตโนมัติเมื่อขึ้น dialogue ใหม่ (ถ้าเปิด TTS ในตั้งค่า)
  const ttsEnabled = useSettingsStore(s => s.ttsEnabled);
  useEffect(() => {
    if (showIntro || !ttsEnabled || !ttsSupported()) return;
    const node = scenario?.nodes.find(n => n.id === currentNodeId);
    if (node && node.type === 'dialogue' && node.text) {
      speak(node.text);
    }
    return () => stopSpeaking();
  }, [currentNodeId, showIntro, ttsEnabled, scenario]);

  // รีเซ็ตดาวประเมินเมื่อเปลี่ยนด่าน (ให้คะแนนใหม่ได้ทุกด่าน)
  useEffect(() => { setFunStars(0); }, [stageId]);

  if (!scenario) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-600 mb-4">ด่านนี้ยังไม่พร้อมเล่น</p>
        <button onClick={() => nav('/')} className="btn-primary">กลับหน้าแรก</button>
      </div>
    );
  }

  const currentNode = scenario.nodes.find(n => n.id === currentNodeId);

  const goToNext = (nextId: string) => {
    const next = scenario.nodes.find(n => n.id === nextId);
    if (!next) return;
    setHistory(prev => [...prev, next]);
    setCurrentNodeId(nextId);
  };

  const handleChoice = (choice: Choice) => {
    sfx.pick();
    vibrate(15);
    if (choice.xp && choice.xp > 0) {
      addXP(choice.xp);
      pushXP(choice.xp);
      setStageScore(s => s + choice.xp!);
      sfx.xp();
    }
    if (choice.badge) {
      const newly = awardBadge(choice.badge);
      const b = getBadge(choice.badge);
      if (newly && b) {
        pushBadge(b.name, b.emoji);
        sfx.badge();
        vibrate([20, 40, 20]);
      }
    }
    // เก็บ pick สำหรับเฉลยจบด่าน — เทียบ XP กับตัวเลือกสูงสุดในชุดนี้
    // ข้ามข้อเกริ่น/ถามเล่นๆ ที่ไม่มีเฉลย (ทุกตัวเลือกไปทางเดียวกัน + ไม่มี reflection)
    const curNode = scenario?.nodes.find(n => n.id === currentNodeId);
    if (curNode && curNode.type === 'choice') {
      const isThrowaway =
        curNode.choices.every(c => !c.reflection) &&
        new Set(curNode.choices.map(c => c.next)).size === 1;
      if (!isThrowaway) {
        const maxXp = Math.max(...curNode.choices.map(c => c.xp || 0));
        const best = curNode.choices.find(c => (c.xp || 0) === maxXp);
        setReviewLog(prev => [
          ...prev,
          {
            kind: 'choice',
            prompt: curNode.prompt,
            pickedLabel: choice.label,
            pickedXp: choice.xp || 0,
            isBest: (choice.xp || 0) === maxXp,
            bestLabel: best?.label || choice.label,
            reflection: choice.reflection,
            source: choice.source,
            bestSource: best?.source,
          },
        ]);
      }
    }
    const playerEcho: ScenarioNode = {
      type: 'dialogue',
      id: `__pick_${currentNodeId}_${Date.now()}`,
      speaker: 'player',
      text: choice.label,
      next: choice.next,
    };
    const next = scenario.nodes.find(n => n.id === choice.next);
    if (next) {
      setHistory(prev => [...prev, playerEcho, next]);
      setCurrentNodeId(choice.next);
    }
  };

  const handleMinigameComplete = (success: boolean) => {
    if (!currentNode || currentNode.type !== 'minigame') return;
    // เก็บเฉลยมินิเกมลง review — โชว์คำถาม/คำตอบที่ถูก/อ้างอิง ตอนจบด่าน
    const mgNode = currentNode;
    setReviewLog(prev => [
      ...prev,
      {
        kind: 'minigame',
        title: mgNode.title,
        gameLabel: GAME_REVIEW_LABEL[mgNode.game] || 'มินิเกม',
        success,
        rows: buildMinigameRows(mgNode),
      },
    ]);
    if (success) {
      sfx.correct();
      vibrate([20, 30, 20]);
      addXP(currentNode.xpOnSuccess);
      pushXP(currentNode.xpOnSuccess);
      setStageScore(s => s + currentNode.xpOnSuccess);
      if (currentNode.badge) {
        const newly = awardBadge(currentNode.badge);
        const b = getBadge(currentNode.badge);
        if (newly && b) {
          pushBadge(b.name, b.emoji);
          sfx.badge();
        }
      }
    } else {
      sfx.wrong();
      vibrate(50);
      // ตอบไม่ครบ — ให้ XP บางส่วน
      const partial = Math.floor(currentNode.xpOnSuccess / 2);
      addXP(partial);
      pushXP(partial);
      setStageScore(s => s + partial);
    }
    goToNext(currentNode.next);
  };

  // claim XP/badge เมื่อจบด่าน (ไม่ navigate)
  const claimEndRewards = () => {
    if (!currentNode || currentNode.type !== 'end') return;
    addXP(currentNode.xp);
    pushXP(currentNode.xp);
    setStageScore(s => s + currentNode.xp);
    if (currentNode.badge) {
      const newly = awardBadge(currentNode.badge);
      const b = getBadge(currentNode.badge);
      if (newly && b) pushBadge(b.name, b.emoji);
    }
    completeStage(stageId);
    clearProgress(stageId);  // ลบ save mid-stage หลังจบ
  };

  // ไปด่านถัดไป — useEffect บน stageId จะ reset state ให้อัตโนมัติ
  const goNextStage = (nextId: number) => {
    claimEndRewards();
    nav(`/scenario/${nextId}`, { replace: true });
  };

  const goHome = () => {
    claimEndRewards();
    clearPendingChallenge();
    nav('/');
  };

  // แชร์คำท้าไปยังเพื่อนผ่าน LINE (หรือ fallback)
  const handleShareChallenge = async (finalScore: number) => {
    const text = `🔍 ฉันทำได้ ${finalScore} แต้ม ในด่าน ${scenario.id}: ${scenario.title} — มาลองเอาชนะฉันสิ!`;
    const url = buildChallengeUrl(stageId, finalScore, nickname || 'เพื่อน');
    const ok = await shareChallenge(text, url);
    setShareMsg(ok ? '✅ ส่งคำท้า/คัดลอกลิงก์ให้แล้ว!' : '❌ แชร์ไม่สำเร็จ ลองใหม่อีกครั้ง');
  };

  // หาด่านถัดไปที่จะปลดล็อกหลังจบด่านนี้
  const completedAfter = (() => {
    const cur = usePlayerStore.getState().stagesCompleted;
    return cur.includes(stageId) ? cur : [...cur, stageId];
  })();
  const nextMeta = SCENARIO_META.find(m => m.unlockAfter === stageId);
  const canPlayNext = nextMeta && nextMeta.available && isStageUnlocked(nextMeta.id, completedAfter);

  // render บทสนทนา/feedback ที่ผ่านมาแล้ว 1 รายการ (ใช้ทั้งส่วนที่ย่อและไม่ย่อ)
  const renderPastNode = (node: ScenarioNode) =>
    node.type === 'dialogue' ? (
      <DialogueBubble key={node.id} speaker={node.speaker} text={node.text} />
    ) : node.type === 'feedback' ? (
      <motion.div key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="card bg-warning-50 border-l-4 border-warning-500 mb-3">
        <p className="font-semibold text-warning-600 mb-1">{node.title}</p>
        <p className="text-sm text-gray-700 leading-relaxed">{node.body}</p>
        {node.source && (
          <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
            📚 อ้างอิง: {node.source}
          </p>
        )}
      </motion.div>
    ) : node.type === 'educationalPopup' ? (
      <motion.div key={node.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="card bg-success-50 border-l-4 border-success-500 mb-3">
        <p className="font-semibold text-success-600 mb-1">💡 รู้หรือไม่?</p>
        <p className="text-sm text-gray-700 leading-relaxed">{node.fact}</p>
        <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">📚 อ้างอิง: {node.source}</p>
      </motion.div>
    ) : null;

  // ความคืบหน้าในด่าน — นับ node หลัก (ไม่นับ feedback/__pick_) ที่ผ่านแบบไม่ซ้ำ ÷ ทั้งหมด
  // โตไปข้างหน้าเสมอ แม้วน loop ตอบผิด → ลดความรู้สึก "ยาว/น่าเบื่อ" ในด่านยาว (5,6,8,12)
  const MAIN_TYPES = new Set(['dialogue', 'choice', 'minigame', 'end']);
  const totalMainNodes = scenario.nodes.filter(n => MAIN_TYPES.has(n.type)).length;
  const visitedMainNodes = new Set(
    history
      .filter(h => !h.id.startsWith('__pick_') && MAIN_TYPES.has(h.type))
      .map(h => h.id)
  ).size;
  const stageProgress = totalMainNodes > 0
    ? Math.min(1, visitedMainNodes / totalMainNodes)
    : 0;

  // บทสนทนาที่ผ่านมา — โชว์แค่ 2 รายการล่าสุด ที่เหลือซ่อนไว้ (กดดูได้) เพื่อไม่ให้หน้ายาว
  const pastNodes = history.slice(0, -1);
  const RECENT = 2;
  const olderNodes = pastNodes.slice(0, Math.max(0, pastNodes.length - RECENT));
  const recentNodes = pastNodes.slice(Math.max(0, pastNodes.length - RECENT));

  // ---- Intro screen ----
  if (showIntro) {
    // ตรวจรูปแบบเกมในด่านนี้ — จะแสดงเป็น chips ให้ผู้เล่นรู้ว่าจะเจออะไรบ้าง
    const hasChoice    = scenario.nodes.some(n => n.type === 'choice');
    const hasDialogue  = scenario.nodes.some(n => n.type === 'dialogue');
    const minigameSet  = new Set<string>();
    scenario.nodes.forEach(n => { if (n.type === 'minigame') minigameSet.add(n.game); });
    const MINIGAME_LABEL: Record<string, { emoji: string; label: string }> = {
      'spot-the-lie':  { emoji: '🕵️',  label: 'จับโกหก' },
      'order-cards':   { emoji: '🃏',  label: 'เรียงลำดับ' },
      'word-match':    { emoji: '🔗',  label: 'จับคู่คำ' },
      'fill-blank':    { emoji: '✍️',  label: 'เติมคำ' },
      'swipe-decide':  { emoji: '👆',  label: 'ปัดจริง-เท็จ' },
      'memory-match':  { emoji: '🧠',  label: 'จับคู่ภาพ' },
      'risk-rank':     { emoji: '📊',  label: 'จัดอันดับเสี่ยง' },
      'runner':        { emoji: '🏃',  label: 'วิ่งหลบ' },
      'tap-ads':       { emoji: '👆',  label: 'ทุบโฆษณา' },
      'catch-lungs':   { emoji: '🫁',  label: 'รับ-หลบ' },
      'shoot-myth':    { emoji: '🎯',  label: 'ยิงจับเท็จ' },
      'quick-fire':    { emoji: '⚡',  label: 'ตอบเร็ว' },
      'lane-run':      { emoji: '🛹',  label: 'รูดหลบเลน' },
      'snake':         { emoji: '🐍',  label: 'งูกินของดี' },
      'maze':          { emoji: '🌫️',  label: 'หนีควัน' },
      'reaction':      { emoji: '✋',  label: 'แตะให้ไว' },
    };

    return (
      <div className="min-h-screen flex flex-col p-4 max-w-md md:max-w-2xl mx-auto relative">
        <button
          onClick={() => nav('/')}
          className="self-start text-detective-500 font-semibold mb-3 active:opacity-70 px-2 py-1"
        >
          ← กลับ
        </button>

        <div className="flex-1 flex flex-col">
          {/* === Hero: ปกแฟ้มคดี === */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="card-hero mb-3 relative overflow-hidden"
          >
            {/* ลวดลายเล็กๆ มุมขวา (case file vibe) */}
            <div className="absolute -top-2 -right-2 text-7xl opacity-[0.06] rotate-12 pointer-events-none"
                 aria-hidden>🔍</div>

            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 16 }}
              className="inline-flex items-center gap-1.5 bg-gradient-to-r from-detective-500 to-detective-700
                         text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-glow-sm"
            >
              <span>🎯</span> ด่าน {scenario.id} · ⏱ ~{scenario.estMinutes} นาที
            </motion.div>
            <span className={`ml-2 inline-block text-[11px] font-bold px-2 py-1 rounded-full
                              ${DIFFICULTY_LABEL[getStageDifficulty(scenario.id)].cls}`}>
              {DIFFICULTY_LABEL[getStageDifficulty(scenario.id)].label}
            </span>
            {scenario.basedOnRealEvents && (
              <span className="ml-2 inline-block text-[11px] font-bold px-2 py-1 rounded-full bg-danger-100 text-danger-700">
                📰 อิงเหตุการณ์จริง
              </span>
            )}

            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl md:text-3xl font-display font-extrabold text-detective-800 mt-2 leading-tight"
            >
              {scenario.title}
            </motion.h1>
            {scenario.subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-slate-600 mt-1 leading-relaxed"
              >
                {scenario.subtitle}
              </motion.p>
            )}
          </motion.div>

          {/* === Pre-game briefing — เล่นยังไง + เจออะไร === */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card mb-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="icon-tile-sm bg-mint-50 text-mint-600">📋</div>
              <p className="text-xs font-bold text-mint-600 uppercase tracking-wider">
                ในด่านนี้คุณจะเจอ
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {hasDialogue && (
                <span className="pill bg-detective-100 text-detective-700">💬 บทสนทนา</span>
              )}
              {hasChoice && (
                <span className="pill bg-detective-100 text-detective-700">✅ เลือกคำตอบ</span>
              )}
              {Array.from(minigameSet).map(g => {
                const m = MINIGAME_LABEL[g];
                if (!m) return null;
                return (
                  <span key={g} className="pill bg-warning-100 text-warning-700">
                    {m.emoji} {m.label}
                  </span>
                );
              })}
            </div>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed
                          bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-100">
              อ่านสถานการณ์ → เลือกคำตอบหรือเล่นมินิเกม → รับแต้ม & เหรียญ 🪙
            </p>
          </motion.div>

          {/* === Story intro — case file style + numbered timeline === */}
          {(scenario.intro || []).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="relative rounded-[24px]
                         bg-[#F3EADD] shadow-clay-pressed p-4 pt-5 mb-3"
            >
              {/* "stamp" label หัวมุม */}
              <span className="absolute -top-3 left-4 bg-[#FFFCF7]
                               px-2.5 py-0.5 rounded-full shadow-clay-sm">
                <span className="text-[11px] font-bold text-detective-600 uppercase tracking-wider">
                  📖 เรื่องราว
                </span>
              </span>

              {/* timeline ของ bullet พร้อม connector */}
              <div className="relative pl-6 space-y-3
                              before:absolute before:left-[11px] before:top-1 before:bottom-1 before:w-0.5
                              before:bg-detective-200 before:rounded-full">
                {(scenario.intro || []).map((line, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.12 }}
                    className="relative"
                  >
                    {/* number dot บนเส้น */}
                    <span className="absolute -left-[26px] top-0 w-6 h-6 rounded-full
                                     bg-gradient-to-br from-detective-400 to-detective-600
                                     text-white text-[11px] font-extrabold
                                     flex items-center justify-center shadow-clay-blue">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{line}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* === บทเรียนสอนก่อนเริ่ม (เช่น ด่านกฎหมาย) — รู้ก่อนเล่นจะตอบถูก === */}
          {scenario.preLesson && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card mb-3 border-2 border-warning-300 bg-gradient-to-br from-warning-50 to-[#FFFCF7]"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="icon-tile-sm bg-warning-100 text-warning-600">{scenario.preLesson.emoji || '📚'}</div>
                <p className="text-sm font-bold text-warning-700 leading-tight">{scenario.preLesson.title}</p>
              </div>
              <ul className="space-y-1.5">
                {scenario.preLesson.points.map((pt, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
                    <span className="text-warning-500 flex-shrink-0 font-bold">•</span>
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
              {scenario.preLesson.source && (
                <p className="text-[10px] text-slate-500 mt-2 leading-snug">📚 อ้างอิง: {scenario.preLesson.source}</p>
              )}
              <p className="text-[11px] text-warning-600 font-semibold mt-2">💡 จำไว้แล้วจะตอบมินิเกมได้ถูก!</p>
            </motion.div>
          )}
        </div>

        <div className="sticky bottom-0 -mx-4 px-4 pt-3
                        pb-[max(0.75rem,env(safe-area-inset-bottom))]
                        bg-gradient-to-t from-[#FBF3EA] via-[#FBF3EA]/95 to-transparent
                        backdrop-blur-sm">
          {askResume ? (
            <div className="space-y-2">
              <div className="card text-center py-2 bg-detective-50">
                <p className="text-sm text-detective-700 font-semibold">💾 พบข้อมูลที่บันทึกไว้</p>
                <p className="text-[11px] text-gray-500">เล่นต่อจากที่ค้าง หรือเริ่มใหม่?</p>
              </div>
              <button onClick={handleResume} className="btn-primary w-full text-base">
                ▶ เล่นต่อจากที่ค้างไว้
              </button>
              <button onClick={handleStartFresh} className="btn-secondary w-full">
                🔄 เริ่มใหม่ทั้งด่าน
              </button>
            </div>
          ) : (
            <button
              onClick={() => { sfx.click(); setShowIntro(false); }}
              className="btn-primary w-full text-base"
            >
              เริ่มภารกิจ →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ---- Game loop ----
  return (
    <div className="min-h-full pb-8 relative">
      <Confetti active={confettiActive} count={100} duration={2600} />
      <header className="sticky top-0 z-10 bg-detective-50/90 backdrop-blur-md border-b border-detective-100
                         px-3 pt-3 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => nav('/')}
            className="text-detective-500 px-3 py-1.5 rounded-lg hover:bg-detective-50 active:scale-95"
          >
            ←
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-detective-400 font-semibold">ด่าน {scenario.id}</p>
            <p className="font-semibold text-sm text-detective-700 truncate">{scenario.title}</p>
          </div>
          {coinX2Remaining > 0 && (
            <span className="flex-shrink-0 text-[10px] font-bold bg-warning-100 text-warning-700
                             border border-warning-300 px-2 py-1 rounded-full"
                  title="โบนัสเหรียญ x2 กำลังทำงาน">
              💰 x2 · {coinX2Remaining}
            </span>
          )}
        </div>
        {/* แถบความคืบหน้าในด่าน — ให้ผู้เล่นเห็นว่าใกล้จบแค่ไหน */}
        <div className="flex items-center gap-2 mt-2">
          <div className="progress-track flex-1 h-1.5">
            <div
              className="progress-fill transition-all duration-500"
              style={{ width: `${stageProgress * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-detective-500 flex-shrink-0 tabular-nums">
            {Math.round(stageProgress * 100)}%
          </span>
        </div>
        {/* แบนเนอร์คำท้า — ถ้ามาจากลิงก์ท้าเพื่อน */}
        {challenge && (
          <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold
                          bg-warning-50 border border-warning-300 text-warning-700
                          rounded-full px-3 py-1">
            <span>🎯</span>
            <span className="flex-1 min-w-0 truncate">
              คำท้าจาก <b>{challenge.by}</b> — ทำให้เกิน <b>{challenge.score}</b> แต้ม!
            </span>
            <span className="flex-shrink-0 tabular-nums">คุณ {stageScore}</span>
          </div>
        )}
      </header>

      <main className="max-w-md md:max-w-2xl mx-auto p-4">
        {/* แสดง history dialogue/feedback — ย่อรายการเก่าไว้ให้หน้าสั้น */}
        <div className="space-y-1 mb-4">
          {olderNodes.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => { setShowOlder(v => !v); sfx.click(); }}
                className="w-full text-xs font-semibold text-detective-500 bg-detective-50
                           border border-detective-200 rounded-full py-1.5 active:scale-[0.98]"
              >
                {showOlder
                  ? '▴ ซ่อนบทสนทนาก่อนหน้า'
                  : `▾ ดูบทสนทนาก่อนหน้า (${olderNodes.length})`}
              </button>
              {showOlder && (
                <div className="space-y-1 mt-2 opacity-80">
                  {olderNodes.map(renderPastNode)}
                </div>
              )}
            </div>
          )}
          <AnimatePresence>
            {recentNodes.map(renderPastNode)}
          </AnimatePresence>
        </div>

        {/* current node */}
        {currentNode && (
          <AnimatePresence mode="wait">
            <motion.div key={currentNode.id} ref={currentRef} className="scroll-mt-20"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              {currentNode.type === 'dialogue' && (
                <>
                  <DialogueBubble speaker={currentNode.speaker} text={currentNode.text} />
                  <button onClick={() => goToNext(currentNode.next)}
                    className="btn-primary w-full mt-2">ต่อไป →</button>
                </>
              )}

              {currentNode.type === 'choice' && (() => {
                const maxXp = Math.max(...currentNode.choices.map(c => c.xp || 0));
                const bestIdx = currentNode.choices.findIndex(c => (c.xp || 0) === maxXp);
                const hintShown = hintRevealedNode === currentNode.id;
                return (
                  <div>
                    <div className="surface-soft border-l-4 border-l-detective-400
                                    px-3 py-2.5 mb-3 flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-detective-500 font-semibold mb-0.5">เลือกคำตอบ</p>
                        <p className="text-sm text-detective-700 font-semibold leading-snug">
                          {currentNode.prompt}
                        </p>
                      </div>
                      {!hintShown && hintTokens > 0 && (
                        <button
                          onClick={() => {
                            if (useHintToken()) {
                              setHintRevealedNode(currentNode.id);
                              sfx.click();
                            }
                          }}
                          className="flex-shrink-0 bg-warning-100 text-warning-700 text-[11px]
                                     font-bold px-2 py-1 rounded-lg border border-warning-300
                                     active:scale-95 hover:bg-warning-200"
                          title={`ใช้บัตรใบ้คำตอบ (เหลือ ${hintTokens})`}
                        >
                          💡 บัตรใบ้ × {hintTokens}
                        </button>
                      )}
                    </div>
                    {hintShown && (
                      <div className="mb-3 text-[11px] bg-warning-50 border border-warning-300 rounded-xl p-2 text-warning-700">
                        💡 ใบ้: ข้อ <b>{String.fromCharCode(65 + bestIdx)}</b> ดูจะให้แต้มสูงสุด ({maxXp})
                      </div>
                    )}
                    {currentNode.choices.map((c, i) => (
                      <ChoiceCard key={i} choice={c} index={i} onPick={handleChoice} />
                    ))}
                  </div>
                );
              })()}

              {currentNode.type === 'minigame' && currentNode.game === 'spot-the-lie' && currentNode.claims && (
                <SpotTheLie title={currentNode.title} claims={currentNode.claims}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'order-cards' && currentNode.cards && currentNode.correctOrder && (
                <OrderCards title={currentNode.title} cards={currentNode.cards}
                  correctOrder={currentNode.correctOrder}
                  source={currentNode.source}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'word-match' && currentNode.pairs && (
                <WordMatch title={currentNode.title} pairs={currentNode.pairs}
                  source={currentNode.source}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'fill-blank' && currentNode.questions && (
                <FillBlank title={currentNode.title} questions={currentNode.questions}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'swipe-decide' && currentNode.swipeCards && (
                <SwipeDecide title={currentNode.title} cards={currentNode.swipeCards}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'memory-match' && currentNode.memoryPairs && (
                <MemoryMatch title={currentNode.title} pairs={currentNode.memoryPairs}
                  onComplete={handleMinigameComplete} />
              )}

              {currentNode.type === 'minigame' && currentNode.game === 'risk-rank' && currentNode.buckets && currentNode.riskItems && (
                <RiskRank title={currentNode.title} buckets={currentNode.buckets}
                  items={currentNode.riskItems}
                  source={currentNode.source}
                  onComplete={handleMinigameComplete} />
              )}

              {/* ===== เกมอาร์เคดในด่าน — ผ่านเมื่อถึง goalScore (ครอบ ErrorBoundary กันจอขาว) ===== */}
              {currentNode.type === 'minigame' && ARCADE_GAME_TYPES.has(currentNode.game) && (
                <GameErrorBoundary gameName={currentNode.title}>
                  {(() => {
                    const node = currentNode;
                    const done = (success: boolean) => handleMinigameComplete(success);
                    switch (node.game) {
                      case 'runner':      return <RunnerGame goalScore={node.goalScore ?? 8} onComplete={done} />;
                      case 'tap-ads':     return <TapAdsGame goalScore={node.goalScore ?? 12} onComplete={done} />;
                      case 'catch-lungs': return <CatchGame goalScore={node.goalScore ?? 12} onComplete={done} />;
                      case 'shoot-myth':  return <ShootMythGame goalScore={node.goalScore ?? 8} seconds={25} onComplete={done} />;
                      case 'quick-fire':  return <QuickFireGame goalScore={node.goalScore ?? 8} seconds={25} onComplete={done} />;
                      case 'lane-run':    return <LaneRunGame goalScore={node.goalScore ?? 10} onComplete={done} />;
                      case 'snake':       return <SnakeGame goalScore={node.goalScore ?? 5} onComplete={done} />;
                      case 'maze':        return <MazeGame goalScore={node.goalScore ?? 2} onComplete={done} />;
                      case 'reaction':    return <ReactionGame goalScore={node.goalScore ?? 10} seconds={20} onComplete={done} />;
                      default:            return null;
                    }
                  })()}
                </GameErrorBoundary>
              )}

              {currentNode.type === 'feedback' && (
                <>
                  <div className="card bg-warning-50 border-l-4 border-warning-500 mb-3">
                    <p className="font-semibold text-warning-600 mb-1">{currentNode.title}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{currentNode.body}</p>
                    {currentNode.source && (
                      <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                        📚 อ้างอิง: {currentNode.source}
                      </p>
                    )}
                  </div>
                  <button onClick={() => goToNext(currentNode.next)} className="btn-primary w-full">
                    ต่อไป →
                  </button>
                </>
              )}

              {currentNode.type === 'educationalPopup' && (
                <>
                  <div className="card bg-success-50 border-l-4 border-success-500 mb-3">
                    <p className="font-semibold text-success-600 mb-1">💡 รู้หรือไม่?</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{currentNode.fact}</p>
                    <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
                      📚 อ้างอิง: {currentNode.source}
                    </p>
                  </div>
                  <button onClick={() => goToNext(currentNode.next)} className="btn-primary w-full">
                    ต่อไป →
                  </button>
                </>
              )}

              {currentNode.type === 'end' && (
                <div className="relative card-hero text-center py-10 overflow-hidden">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-warning-500/20 rounded-full blur-2xl" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-detective-300/30 rounded-full blur-2xl" />
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="mb-3 relative inline-block"
                  >
                    <img
                      src={asset('characters/party-popper.png')}
                      alt="เยี่ยมมาก!"
                      className="w-40 h-40 md:w-48 md:h-48 object-contain drop-shadow-xl"
                    />
                  </motion.div>
                  <h2 className="font-display text-2xl font-bold text-detective-700 mb-2 relative">
                    {currentNode.title}
                  </h2>
                  <p className="text-gray-600 mb-6 leading-relaxed relative">{currentNode.message}</p>
                  <motion.p
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                    className="inline-block bg-gradient-to-r from-warning-400 to-warning-500
                               text-white font-bold text-xl px-6 py-2 rounded-full shadow-glow mb-6 relative"
                  >
                    +{currentNode.xp} แต้ม
                  </motion.p>

                  {/* ผลคำท้า — เทียบแต้มรวมของด่านนี้กับเป้าของผู้ท้า */}
                  {challenge && (() => {
                    const finalScore = stageScore + currentNode.xp;
                    const win = finalScore >= challenge.score;
                    return (
                      <div className={`relative mx-auto mb-5 max-w-xs rounded-2xl border-2 p-3 ${
                        win ? 'border-success-300 bg-success-50' : 'border-warning-300 bg-warning-50'
                      }`}>
                        <p className="font-bold text-sm mb-1">
                          {win ? '🏆 คุณชนะคำท้า!' : '💪 ยังไม่ชนะ — เล่นซ้ำเพื่อแก้มือได้!'}
                        </p>
                        <p className="text-xs text-slate-600">
                          คุณ <b>{finalScore}</b> แต้ม · {challenge.by} <b>{challenge.score}</b> แต้ม
                        </p>
                      </div>
                    );
                  })()}

                  {/* === 📓 เฉลย — ตรวจคำตอบของผู้เล่นทุกข้อ + ที่มา === */}
                  {reviewLog.length > 0 && (
                    <details className="relative text-left bg-[#FFFCF7] rounded-2xl border-2 border-mint-200 p-3 mb-3 shadow-clay-sm">
                      <summary className="cursor-pointer text-sm font-bold text-mint-600 flex items-center gap-1.5 select-none">
                        <span>📓</span> ดูเฉลย — ตรวจคำตอบ ({reviewLog.length} ข้อ)
                      </summary>
                      <div className="mt-3 space-y-3">
                        {reviewLog.map((r, i) => r.kind === 'choice' ? (
                          <div key={i} className={`rounded-xl p-2.5 border-l-4 ${
                            r.isBest
                              ? 'border-success-500 bg-success-50'
                              : 'border-warning-500 bg-warning-50'
                          }`}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              ข้อ {i + 1} · เลือกคำตอบ · {r.isBest ? '✓ ถูกที่สุด' : '○ ดีกว่านี้ได้'}
                            </p>
                            <p className="text-[11px] text-slate-700 mb-2 italic">"{r.prompt}"</p>
                            <div className="space-y-1.5 text-[11px]">
                              <div>
                                <span className="text-slate-500">คุณตอบ:</span>{' '}
                                <span className={r.isBest ? 'text-success-700 font-semibold' : 'text-warning-700 font-semibold'}>
                                  "{r.pickedLabel}" (+{r.pickedXp} แต้ม)
                                </span>
                              </div>
                              {!r.isBest && (
                                <>
                                  <div>
                                    <span className="text-slate-500">คำตอบที่ดีที่สุด:</span>{' '}
                                    <span className="text-success-700 font-semibold">"{r.bestLabel}"</span>
                                  </div>
                                  {r.reflection && (
                                    <div className="bg-white rounded-md p-2 mt-1">
                                      <p className="text-slate-700">
                                        <b className="text-warning-600">เหตุผล:</b> {r.reflection}
                                      </p>
                                    </div>
                                  )}
                                </>
                              )}
                              {(r.bestSource || r.source) && (
                                <p className="text-[10px] text-slate-500 italic leading-snug mt-1">
                                  📚 อ้างอิง: {r.bestSource || r.source}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div key={i} className={`rounded-xl p-2.5 border-l-4 ${
                            r.success ? 'border-success-500 bg-success-50' : 'border-warning-500 bg-warning-50'
                          }`}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              ข้อ {i + 1} · {r.gameLabel} · {r.success ? '✓ ผ่าน' : '○ ฝึกต่อได้'}
                            </p>
                            <p className="text-[11px] text-slate-700 mb-2 italic">"{r.title}"</p>
                            <div className="space-y-2">
                              {r.rows.map((row, j) => (
                                <div key={j} className="bg-white rounded-md p-2 text-[11px]">
                                  <p className="text-slate-700 leading-snug">{row.q}</p>
                                  <p className="text-success-700 font-semibold mt-0.5">
                                    ✓ {row.a}
                                  </p>
                                  {row.note && (
                                    <p className="text-slate-600 leading-snug mt-1">{row.note}</p>
                                  )}
                                  {row.source && (
                                    <p className="text-[10px] text-slate-500 italic leading-snug mt-1">
                                      📚 อ้างอิง: {row.source}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}

                  {/* === แหล่งอ้างอิงของด่าน === */}
                  {scenario.references && scenario.references.length > 0 && (
                    <details className="relative text-left bg-[#FFFCF7] rounded-xl border border-detective-100 p-3 mb-4">
                      <summary className="cursor-pointer text-xs font-bold text-detective-700 flex items-center gap-1.5 select-none">
                        <span>📚</span> แหล่งอ้างอิงรวมของด่านนี้ ({scenario.references.length})
                      </summary>
                      <ul className="mt-2 space-y-1">
                        {scenario.references.map((ref, i) => (
                          <li key={i} className="text-[11px] text-gray-600 leading-relaxed flex gap-1.5">
                            <span className="text-detective-400 flex-shrink-0">•</span>
                            <span>{ref}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  {/* === ⭐ ดาวประเมินความสนุก — เก็บค่า + ส่งขึ้น Sheets === */}
                  <div className="relative mb-4 rounded-2xl border-2 border-detective-100 bg-[#FFFCF7] p-3">
                    <p className="text-sm font-semibold text-detective-700 mb-2">ด่านนี้สนุกแค่ไหน?</p>
                    <div className="flex justify-center gap-1.5">
                      {[1, 2, 3, 4, 5].map(n => (
                        <button
                          key={n}
                          aria-label={`${n} ดาว`}
                          disabled={funStars > 0}
                          onClick={() => { setFunStars(n); rateFun(n); sfx.pick(); }}
                          className="text-3xl active:scale-90 transition-transform disabled:cursor-default"
                        >
                          {n <= funStars ? '⭐' : '☆'}
                        </button>
                      ))}
                    </div>
                    {funStars > 0 && (
                      <p className="text-xs text-success-600 mt-2 text-center">ขอบคุณสำหรับคะแนน! 🙏</p>
                    )}
                  </div>

                  <div className="space-y-2 relative">
                    {canPlayNext && nextMeta && (
                      <button
                        onClick={() => goNextStage(nextMeta.id)}
                        className="btn-primary w-full"
                      >
                        ▶ ไปด่าน {nextMeta.id}: {nextMeta.title}
                      </button>
                    )}
                    <button
                      onClick={() => handleShareChallenge(stageScore + currentNode.xp)}
                      className="btn-secondary w-full"
                    >
                      🎯 ท้าเพื่อนให้เอาชนะ {stageScore + currentNode.xp} แต้ม
                    </button>
                    {shareMsg && <p className="text-xs text-slate-500">{shareMsg}</p>}
                    <button
                      onClick={goHome}
                      className={canPlayNext ? 'btn-secondary w-full' : 'btn-primary w-full'}
                    >
                      🏠 กลับหน้าหลัก
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <CertNameDialog
        open={certNameOpen}
        onClose={() => setCertNameOpen(false)}
        title="🎉 ผ่านเกณฑ์รับเกียรติบัตร!"
        subtitle="ใส่ชื่อจริงเพื่อพิมพ์บนเกียรติบัตร (ไม่บังคับ)"
      />
    </div>
  );
}
