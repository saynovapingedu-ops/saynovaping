import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore } from '../store/playerStore';
import { getAssessmentQuestions } from '../lib/quizBank';
import { CERT_STAGE_COUNT } from '../scenarios';
import QuizRunner from '../components/QuizRunner';
import PageHeader from '../components/PageHeader';
import { sfx } from '../lib/sound';

const ASSESS_N = 10;

/**
 * Assessment — แบบประเมินก่อน/หลังเรียน (วัดผลสำหรับโรงเรียน)
 *   ?kind=pre  → ก่อนเรียน
 *   ?kind=post → หลังเรียน (ปลดเมื่อจบ Hero Arc / มี cert)
 *   ไม่ระบุ → เลือกเอง
 */
export default function Assessment() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const player = usePlayerStore();
  const recordAssessment = usePlayerStore(s => s.recordAssessment);

  const kindParam = params.get('kind') === 'post' ? 'post'
    : params.get('kind') === 'pre' ? 'pre' : null;
  const [kind, setKind] = useState<'pre' | 'post' | null>(kindParam);
  const [started, setStarted] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const questions = useMemo(() => getAssessmentQuestions(ASSESS_N), []);
  const postUnlocked = player.stagesCompleted.length >= CERT_STAGE_COUNT || !!player.certificateNo;

  const handleFinish = (score: number, total: number) => {
    const percent = Math.round((score / total) * 100);
    if (kind) recordAssessment(kind, percent);
    setResult(percent);
    sfx.victory();
  };

  // ===== ผลลัพธ์ =====
  if (result !== null) {
    const pre = player.preTestScore;
    const post = player.postTestScore;
    const showDelta = pre !== undefined && post !== undefined;
    const delta = showDelta ? post! - pre! : 0;
    return (
      <div className="min-h-full pb-10">
        <PageHeader title="📋 แบบประเมิน" backTo="/" />
        <main className="max-w-md mx-auto px-4 pt-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="card-hero text-center py-8">
            <div className="text-6xl mb-3 leading-none">📋</div>
            <h2 className="font-display font-bold text-xl text-detective-700 mb-1">
              {kind === 'pre' ? 'แบบประเมินก่อนเรียน' : kind === 'post' ? 'แบบประเมินหลังเรียน' : 'ผลแบบประเมิน'}
            </h2>
            <p className="text-3xl font-bold text-detective-700 my-2">{result}%</p>

            {showDelta && (
              <div className="mt-3 bg-white/70 rounded-2xl p-3 border border-detective-100">
                <p className="text-xs text-slate-500 mb-1">เปรียบเทียบก่อน-หลังเรียน</p>
                <p className="text-sm">
                  ก่อน <b className="text-slate-600">{pre}%</b> → หลัง <b className="text-success-600">{post}%</b>{' '}
                  <span className={`font-bold ${delta >= 0 ? 'text-success-600' : 'text-danger-500'}`}>
                    ({delta >= 0 ? '+' : ''}{delta}%)
                  </span>
                </p>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
              💡 แบบประเมินนี้ช่วยวัดว่าความรู้เรื่องบุหรี่ไฟฟ้าเพิ่มขึ้นแค่ไหน
            </p>
          </motion.div>
          <button onClick={() => { sfx.click(); nav('/'); }} className="btn-primary w-full mt-4">
            🏠 กลับหน้าหลัก
          </button>
        </main>
      </div>
    );
  }

  // ===== เลือกชนิด (ถ้าไม่ได้ส่ง ?kind) =====
  if (!kind) {
    return (
      <div className="min-h-full pb-10">
        <PageHeader title="📋 แบบประเมิน" subtitle="วัดความรู้ก่อน-หลังเรียน" backTo="/" />
        <main className="max-w-md mx-auto px-4 pt-6 space-y-3">
          <button
            onClick={() => { sfx.click(); setKind('pre'); }}
            className="w-full card text-left flex items-center gap-3 active:scale-[0.99]"
          >
            <span className="text-3xl">🅰️</span>
            <div className="flex-1">
              <p className="font-bold text-detective-700">แบบประเมินก่อนเรียน</p>
              <p className="text-xs text-slate-500">
                {player.preTestScore !== undefined ? `ทำแล้ว: ${player.preTestScore}% (ทำซ้ำได้)` : 'ทำก่อนเริ่มเล่นด่าน'}
              </p>
            </div>
            <span className="text-detective-400">→</span>
          </button>

          <button
            onClick={() => { if (postUnlocked) { sfx.click(); setKind('post'); } }}
            disabled={!postUnlocked}
            className={`w-full card text-left flex items-center gap-3 ${postUnlocked ? 'active:scale-[0.99]' : 'opacity-60'}`}
          >
            <span className="text-3xl">🅱️</span>
            <div className="flex-1">
              <p className="font-bold text-detective-700">แบบประเมินหลังเรียน</p>
              <p className="text-xs text-slate-500">
                {postUnlocked
                  ? (player.postTestScore !== undefined ? `ทำแล้ว: ${player.postTestScore}% (ทำซ้ำได้)` : 'ทำหลังจบ Hero Arc')
                  : `🔒 ปลดเมื่อจบ ${CERT_STAGE_COUNT} ด่านแรก`}
              </p>
            </div>
            <span className="text-detective-400">→</span>
          </button>

          <p className="text-[11px] text-slate-500 text-center leading-relaxed pt-2">
            📊 ทำ "ก่อนเรียน" ก่อนเริ่มเล่น แล้วทำ "หลังเรียน" ตอนจบ
            เพื่อดูว่าความรู้เพิ่มขึ้นเท่าไหร่
          </p>
        </main>
      </div>
    );
  }

  // ===== หน้าเริ่ม =====
  if (!started) {
    return (
      <div className="min-h-full pb-10">
        <PageHeader title="📋 แบบประเมิน" backTo="/" />
        <main className="max-w-md mx-auto px-4 pt-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-hero text-center py-8">
            <div className="text-6xl mb-3 leading-none">{kind === 'pre' ? '🅰️' : '🅱️'}</div>
            <h2 className="font-display font-bold text-xl text-detective-700 mb-2">
              {kind === 'pre' ? 'แบบประเมินก่อนเรียน' : 'แบบประเมินหลังเรียน'}
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-4">
              {ASSESS_N} ข้อ — ไม่มีรางวัล/บทลงโทษ ตอบตามที่รู้จริงเพื่อวัดผล
            </p>
            <button onClick={() => { sfx.click(); setStarted(true); }} className="btn-primary w-full">
              เริ่มทำ →
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  // ===== ทำควิซ =====
  return (
    <div className="min-h-full pb-10">
      <PageHeader title="📋 แบบประเมิน" backTo="/" />
      <main className="max-w-md mx-auto px-4 pt-4">
        <QuizRunner questions={questions} onFinish={handleFinish} finishLabel="ส่งคำตอบ →" />
      </main>
    </div>
  );
}
