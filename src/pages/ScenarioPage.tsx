import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getScenarioById, SCENARIO_META, isStageUnlocked, CERT_STAGE_COUNT } from '../scenarios';
import { getBadge } from '../lib/badges';
import { usePlayerStore } from '../store/playerStore';
import { useCertNameStore } from '../store/certNameStore';
import { useUIStore } from '../store/uiStore';
import DialogueBubble from '../components/DialogueBubble';
import ChoiceCard from '../components/ChoiceCard';
import CertNameDialog from '../components/CertNameDialog';
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
import { useProgressStore } from '../store/progressStore';
import type { Choice, ScenarioNode } from '../types';

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
  // เก็บ pick ของผู้เล่นทีละข้อ — ใช้สร้างเฉลยตอนจบด่าน
  const [reviewLog, setReviewLog] = useState<Array<{
    prompt: string;
    pickedLabel: string;
    pickedXp: number;
    isBest: boolean;
    bestLabel: string;
    reflection?: string;
    source?: string;
    bestSource?: string;
  }>>([]);
  const [askResume, setAskResume] = useState(false);
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
    const curNode = scenario?.nodes.find(n => n.id === currentNodeId);
    if (curNode && curNode.type === 'choice') {
      const maxXp = Math.max(...curNode.choices.map(c => c.xp || 0));
      const best = curNode.choices.find(c => (c.xp || 0) === maxXp);
      setReviewLog(prev => [
        ...prev,
        {
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
    if (success) {
      sfx.correct();
      vibrate([20, 30, 20]);
      addXP(currentNode.xpOnSuccess);
      pushXP(currentNode.xpOnSuccess);
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
    }
    goToNext(currentNode.next);
  };

  // claim XP/badge เมื่อจบด่าน (ไม่ navigate)
  const claimEndRewards = () => {
    if (!currentNode || currentNode.type !== 'end') return;
    addXP(currentNode.xp);
    pushXP(currentNode.xp);
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
    nav('/');
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
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="self-start mb-2 inline-flex items-center gap-1.5 bg-detective-600
                       text-white text-xs font-bold px-3 py-1 rounded-full shadow-glow-sm"
          >
            <span>🎯</span> ด่าน {scenario.id} · ⏱ ~{scenario.estMinutes} นาที
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-display font-bold text-detective-700 mb-1 leading-tight"
          >
            {scenario.title}
          </motion.h1>
          {scenario.subtitle && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-gray-600 mb-3"
            >
              {scenario.subtitle}
            </motion.p>
          )}

          {/* === Pre-game briefing — เล่นยังไง + เจออะไร === */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card mb-3 border-l-4 border-l-mint-400"
          >
            <p className="text-[11px] font-bold text-mint-600 uppercase tracking-wider mb-1.5">
              📋 ในด่านนี้คุณจะเจอ
            </p>
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
                  <span key={g} className="pill bg-warning-100 text-warning-600">
                    {m.emoji} {m.label}
                  </span>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-600 mt-2 leading-relaxed">
              อ่านสถานการณ์ → เลือกคำตอบหรือเล่นมินิเกม → รับ XP & เหรียญ 🪙
            </p>
          </motion.div>

          {/* === Story intro lines === */}
          {(scenario.intro || []).length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-[11px] font-bold text-detective-500 uppercase tracking-wider">
                📖 เรื่องราว
              </p>
              {(scenario.intro || []).map((line, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.15 }}
                  className="bg-white rounded-2xl p-3 border-l-4 border-l-detective-300 border border-slate-200"
                >
                  <p className="text-sm text-gray-700 leading-relaxed">{line}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 -mx-4 px-4 pt-3
                        pb-[max(0.75rem,env(safe-area-inset-bottom))]
                        bg-gradient-to-t from-white via-white/95 to-white/0
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
                         p-3 flex items-center gap-3">
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
                        💡 ใบ้: ข้อ <b>{String.fromCharCode(65 + bestIdx)}</b> ดูจะให้ XP สูงสุด ({maxXp})
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
                    +{currentNode.xp} XP
                  </motion.p>

                  {/* === 📓 เฉลย — ตรวจคำตอบของผู้เล่นทุกข้อ + ที่มา === */}
                  {reviewLog.length > 0 && (
                    <details className="relative text-left bg-white rounded-2xl border-2 border-mint-200 p-3 mb-3 shadow-glow-sm">
                      <summary className="cursor-pointer text-sm font-bold text-mint-600 flex items-center gap-1.5 select-none">
                        <span>📓</span> ดูเฉลย — ตรวจคำตอบ ({reviewLog.length} ข้อ)
                      </summary>
                      <div className="mt-3 space-y-3">
                        {reviewLog.map((r, i) => (
                          <div key={i} className={`rounded-xl p-2.5 border-l-4 ${
                            r.isBest
                              ? 'border-success-500 bg-success-50'
                              : 'border-warning-500 bg-warning-50'
                          }`}>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              ข้อ {i + 1} · {r.isBest ? '✓ ถูกที่สุด' : '○ ดีกว่านี้ได้'}
                            </p>
                            <p className="text-[11px] text-slate-700 mb-2 italic">"{r.prompt}"</p>
                            <div className="space-y-1.5 text-[11px]">
                              <div>
                                <span className="text-slate-500">คุณตอบ:</span>{' '}
                                <span className={r.isBest ? 'text-success-700 font-semibold' : 'text-warning-700 font-semibold'}>
                                  "{r.pickedLabel}" (+{r.pickedXp} XP)
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
                        ))}
                      </div>
                    </details>
                  )}

                  {/* === แหล่งอ้างอิงของด่าน === */}
                  {scenario.references && scenario.references.length > 0 && (
                    <details className="relative text-left bg-white/70 rounded-xl border border-detective-100 p-3 mb-4">
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
