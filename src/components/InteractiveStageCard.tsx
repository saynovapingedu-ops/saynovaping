import React from 'react';
import { motion } from 'framer-motion';
import type { SpeakerKey } from '../types';
import { useSettingsStore } from '../store/settingsStore';
import { speak, useTtsAvailable } from '../lib/tts';
import { NPC_CHARACTERS } from '../lib/characters';
import { asset } from '../lib/asset';

interface Props {
  speaker: SpeakerKey;
  speakerName?: string;
  speakerAvatar?: string;
  title?: string;
  image?: string;
  imageBadge?: string;
  text: string;
  btnLabel?: string;
  onNext: () => void;
}

export default function InteractiveStageCard({
  speaker,
  speakerName,
  speakerAvatar,
  title,
  image,
  imageBadge = 'ภาพจำลองเพื่อการเรียนรู้',
  text,
  btnLabel = 'ต่อไป →',
  onNext,
}: Props) {
  const npc = NPC_CHARACTERS[speaker];
  const displayName = speakerName || npc?.label || (speaker === 'doctor' ? 'พี่หมอเก๋' : 'ผู้แนะนำ');
  const ttsEnabled = useSettingsStore((s) => s.ttsEnabled);
  const ttsAvailable = useTtsAvailable();
  const showTts = ttsEnabled && ttsAvailable && !!text;

  // Banner image for the card (only used when image is explicitly provided)
  const bannerSrc = image
    ? (image.startsWith('http') || image.startsWith('data:') ? image : asset(image))
    : undefined;
  // 3D Doctor Presenter character
  const isDoctor = speaker === 'doctor';
  const doctor3dSrc = asset('characters/doctor_3d.png');
  const speakerEmoji = isDoctor
    ? '👩‍⚕️'
    : speaker === 'player'
    ? '🧒'
    : speaker === 'vapor'
    ? '👤'
    : speaker === 'narrator'
    ? '📖'
    : speaker === 'baitoey'
    ? '🌿'
    : '🧑';

  return (
    <div className="w-full space-y-3.5 sm:space-y-4 animate-fade-in">
      {/* Main 3D Presenter + Interactive Learning Card Container */}
      <div className="relative rounded-[28px] sm:rounded-[32px] bg-gradient-to-b from-[#F0F7FD] to-[#E5F2FC] p-2.5 sm:p-5 md:p-6 border border-sky-200/70 shadow-sm overflow-hidden">
        
        {/* Soft background decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-200/40 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="relative z-10 flex flex-row items-end sm:items-stretch gap-2.5 sm:gap-4 md:gap-6">
          
          {/* LEFT: 3D Doctor Presenter Character */}
          {isDoctor ? (
            <motion.div
              initial={{ opacity: 0, x: -15, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="w-28 sm:w-36 md:w-52 flex-shrink-0 flex flex-col items-center justify-end relative self-end"
            >
              <div className="relative w-full">
                <img
                  src={doctor3dSrc}
                  alt={displayName}
                  className="w-full h-auto object-contain max-h-[260px] sm:max-h-[340px] md:max-h-[420px] drop-shadow-md select-none pointer-events-none"
                  loading="eager"
                />
              </div>
            </motion.div>
          ) : (
            // Fallback avatar for other speakers
            speakerAvatar || npc?.src ? (
              <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-100 flex-shrink-0 self-center">
                <img
                  src={speakerAvatar || npc?.src}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null
          )}

          {/* RIGHT: Floating White Learning Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="flex-1 min-w-0 bg-white rounded-2xl sm:rounded-[28px] border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between"
          >
            {/* 1. Header Banner Image with Learning Badge (ถ้ามีการกำหนดรูปภาพมา) */}
            {bannerSrc && (
              <div className="relative w-full h-24 sm:h-36 md:h-44 bg-slate-100 overflow-hidden">
                <img
                  src={bannerSrc}
                  alt="ภาพประกอบบทเรียน"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
                
                {/* Badge: ภาพจำลองเพื่อการเรียนรู้ */}
                {imageBadge && (
                  <div className="absolute bottom-2 left-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/95 backdrop-blur-md text-[9px] sm:text-[11px] font-extrabold text-slate-800 shadow-sm border border-white/60 flex items-center gap-1">
                    <span className="text-blue-600 text-[10px] sm:text-xs">🔍</span>
                    <span>{imageBadge}</span>
                  </div>
                )}
              </div>
            )}

            {/* 2. Card Body Content */}
            <div className="p-3 sm:p-5 space-y-1.5 sm:space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                {/* Speaker indicator */}
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-sky-100/80 text-sky-800 text-[10px] sm:text-[11px] font-extrabold flex items-center gap-1">
                    <span>{speakerEmoji}</span> {displayName}
                  </span>
                </div>

                {/* Card Title */}
                {title && (
                  <h3 className="font-display font-black text-slate-900 text-xs sm:text-sm md:text-base leading-snug">
                    {title}
                  </h3>
                )}

                {/* Dialogue Text */}
                <p className="text-slate-800 text-xs sm:text-sm md:text-base leading-relaxed font-medium whitespace-pre-line">
                  {text}
                </p>
              </div>

              {/* TTS Listen Again Button */}
              {showTts && (
                <div className="pt-1.5">
                  <button
                    type="button"
                    onClick={() => speak(text)}
                    aria-label="อ่านออกเสียงอีกครั้ง"
                    className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg font-bold transition-all active:scale-95"
                  >
                    <span>🔊</span>
                    <span>ฟังอีกครั้ง</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* 3. Big Pill Action CTA Button (ต่อไป →) */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={onNext}
        className="w-full py-3.5 sm:py-4 px-6 rounded-full bg-[#0284C7] hover:bg-[#0369A1] text-white font-display font-black text-sm sm:text-base shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-sky-400/40"
      >
        <span>{btnLabel}</span>
      </motion.button>
    </div>
  );
}
