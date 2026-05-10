import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { verifyCertificate, type VerifyResponse } from '../lib/cloudSync';

export default function Verify() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [code, setCode] = useState(params.get('code') || '');
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const doVerify = async (c: string) => {
    if (!c) return;
    setLoading(true);
    setResult(null);
    const res = await verifyCertificate(c);
    setResult(res);
    setLoading(false);
  };

  useEffect(() => {
    if (params.get('code')) doVerify(params.get('code')!);
  }, [params]);

  return (
    <div className="min-h-full bg-detective-50 pb-8">
      <header className="sticky top-0 bg-white shadow-sm p-3 flex items-center gap-3 z-10">
        <button onClick={() => nav('/')} className="text-detective-500 px-2">←</button>
        <h2 className="font-display font-bold text-detective-700">ยืนยัน Certificate</h2>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="card">
          <h3 className="font-semibold text-detective-700 mb-2">ตรวจสอบใบประกาศนียบัตร</h3>
          <p className="text-sm text-gray-600 mb-3">
            ใส่รหัสยืนยัน 6 หลักจาก Certificate (หรือสแกน QR Code)
          </p>
          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="เช่น 7K3PQX"
            maxLength={6}
            className="w-full p-3 mb-3 rounded-xl border-2 border-detective-100 focus:border-detective-500 outline-none font-mono text-center text-xl tracking-widest"
          />
          <button onClick={() => doVerify(code)} disabled={!code || loading} className="btn-primary w-full">
            {loading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบ'}
          </button>
        </div>

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {result.valid ? (
              <div className="card border-2 border-success-500 bg-success-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl">✅</span>
                  <p className="font-bold text-success-600 text-lg">ยืนยันแล้ว</p>
                </div>
                <div className="space-y-2 text-sm">
                  <p><b>เลขที่:</b> <span className="font-mono">{result.certificateNo}</span></p>
                  <p><b>ผู้ได้รับ:</b> {result.nickname}</p>
                  <p><b>วันที่ออก:</b> {result.issueDate && new Date(result.issueDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  <p><b>คะแนนรวม:</b> {result.totalXP} XP</p>
                  <p><b>ด่านที่จบ:</b> {result.stagesCount}/8</p>
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Certificate นี้ออกโดย Walailak University - SayNo:สู้บุหรี่ไฟฟ้า
                </p>
              </div>
            ) : (
              <div className="card border-2 border-danger-500 bg-danger-50">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">❌</span>
                  <p className="font-bold text-danger-500 text-lg">ไม่พบ Certificate</p>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  รหัสยืนยันไม่ถูกต้อง หรือ Certificate นี้ไม่ได้ออกโดยระบบของเรา
                </p>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
