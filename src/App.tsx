import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { initLiff, getUserIdHash } from './lib/liff';
import { flushQueue } from './lib/cloudSync';
import { startBgm } from './lib/bgm';
import { usePlayerStore } from './store/playerStore';
import { useSettingsStore } from './store/settingsStore';
import Toaster from './components/Toaster';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';

// ===== Lazy-loaded routes — โหลดเฉพาะตอนเปิดหน้านั้นๆ =====
const ScenarioPage = lazy(() => import('./pages/ScenarioPage'));
const Profile      = lazy(() => import('./pages/Profile'));
const Certificate  = lazy(() => import('./pages/Certificate'));
const Verify       = lazy(() => import('./pages/Verify'));
const Shop         = lazy(() => import('./pages/Shop'));
const Settings     = lazy(() => import('./pages/Settings'));
const Stats        = lazy(() => import('./pages/Stats'));
const Knowledge    = lazy(() => import('./pages/Knowledge'));
const Room         = lazy(() => import('./pages/Room'));

function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
      <div className="text-4xl mb-3 animate-pulse">✨</div>
      <p className="text-detective-600 font-semibold text-sm">กำลังโหลด...</p>
    </div>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const setUserHash = usePlayerStore(s => s.setUserHash);
  const fontSize = useSettingsStore(s => s.fontSize);
  const musicEnabled = useSettingsStore(s => s.musicEnabled);

  useEffect(() => {
    const sizeMap: Record<typeof fontSize, string> = {
      sm: '14px', md: '16px', lg: '18px',
    };
    document.documentElement.style.fontSize = sizeMap[fontSize] || '16px';
  }, [fontSize]);

  useEffect(() => {
    if (!musicEnabled) return;
    const onGesture = () => {
      startBgm();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
    window.addEventListener('pointerdown', onGesture, { once: true });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [musicEnabled]);

  useEffect(() => {
    const timer = setTimeout(() => {
      console.warn('[App] init timeout 5s — forcing ready');
      setReady(true);
    }, 5000);
    (async () => {
      try {
        await initLiff();
        const hash = await getUserIdHash();
        setUserHash(hash);
        flushQueue().catch(() => { /* silent */ });
        const target = sessionStorage.getItem('hd_liff_target');
        if (target && target !== '/') {
          sessionStorage.removeItem('hd_liff_target');
          navigate(target, { replace: true });
        }
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        clearTimeout(timer);
        setReady(true);
      }
    })();
  }, [setUserHash, navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <div className="text-5xl mb-4 animate-pulse">🔍</div>
        <p className="text-detective-700 font-semibold">กำลังเตรียมเกม...</p>
      </div>
    );
  }

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomeOrOnboarding />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/scenario/:id" element={<ScenarioPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/certificate" element={<Certificate />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/room" element={<Room />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </>
  );
}

function HomeOrOnboarding() {
  const initialized = usePlayerStore(s => s.isInitialized);
  return initialized ? <Home /> : <Navigate to="/onboarding" replace />;
}
