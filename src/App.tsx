import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { initLiff, getUserIdHash } from './lib/liff';
import { flushQueue } from './lib/cloudSync';
import { startBgm } from './lib/bgm';
import { usePlayerStore } from './store/playerStore';
import { useSettingsStore } from './store/settingsStore';
import Toaster from './components/Toaster';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import ScenarioPage from './pages/ScenarioPage';
import Profile from './pages/Profile';
import Certificate from './pages/Certificate';
import Verify from './pages/Verify';
import Shop from './pages/Shop';
import Settings from './pages/Settings';
import Stats from './pages/Stats';
import Knowledge from './pages/Knowledge';
import Room from './pages/Room';

export default function App() {
  const [ready, setReady] = useState(false);
  const setUserHash = usePlayerStore(s => s.setUserHash);
  const fontSize = useSettingsStore(s => s.fontSize);
  const musicEnabled = useSettingsStore(s => s.musicEnabled);

  // apply font-size global ผ่าน <html> font-size
  useEffect(() => {
    const sizeMap: Record<typeof fontSize, string> = {
      sm: '14px', md: '16px', lg: '18px',
    };
    document.documentElement.style.fontSize = sizeMap[fontSize] || '16px';
  }, [fontSize]);

  // BGM auto-start หลัง user gesture แรก (browsers ห้าม autoplay ก่อน gesture)
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
    (async () => {
      try {
        await initLiff();
        const hash = await getUserIdHash();
        setUserHash(hash);
        flushQueue().catch(() => { /* silent */ });
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setReady(true);
      }
    })();
  }, [setUserHash]);

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
      <Toaster />
    </>
  );
}

function HomeOrOnboarding() {
  const initialized = usePlayerStore(s => s.isInitialized);
  return initialized ? <Home /> : <Navigate to="/onboarding" replace />;
}
