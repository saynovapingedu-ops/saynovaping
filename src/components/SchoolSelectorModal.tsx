import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  NAKHON_SI_THAMMARAT_SCHOOLS,
  ALL_PRESET_SCHOOLS,
  OTHER_SCHOOL_VALUE,
} from '../lib/schools';
import { sfx } from '../lib/sound';

interface SchoolSelectorModalProps {
  selectedSchool: string;
  customSchoolText: string;
  onSelectSchool: (school: string) => void;
  onChangeCustomText: (text: string) => void;
  error?: boolean;
}

const POPULAR_SCHOOLS = [
  'โรงเรียนท่าศาลาประสิทธิ์ศึกษา',
  'โรงเรียนสาธิตมหาวิทยาลัยวลัยลักษณ์',
  'โรงเรียนเบญจมราชูทิศ',
  'โรงเรียนกัลยาณีศรีธรรมราช',
  'โรงเรียนโมคลานประชาสรรค์',
  'โรงเรียนสระแก้วรัตนวิทย์',
  'โรงเรียนท่าศาลา',
];

export default function SchoolSelectorModal({
  selectedSchool,
  customSchoolText,
  onSelectSchool,
  onChangeCustomText,
  error,
}: SchoolSelectorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // กรองโรงเรียนตามคำค้นหา
  const filteredSchools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ALL_PRESET_SCHOOLS.filter((name) => name.toLowerCase().includes(q));
  }, [searchQuery]);

  const handleOpen = () => {
    sfx.click();
    setSearchQuery('');
    setIsOpen(true);
  };

  const handleClose = () => {
    sfx.click();
    setIsOpen(false);
  };

  const handlePick = (schoolName: string) => {
    sfx.click();
    onSelectSchool(schoolName);
    setIsOpen(false);
  };

  const displayText = useMemo(() => {
    if (selectedSchool === OTHER_SCHOOL_VALUE) {
      return customSchoolText.trim()
        ? `✏️ อื่นๆ: ${customSchoolText.trim()}`
        : '➕ อื่นๆ (คลิกเพื่อพิมพ์ระบุชื่อโรงเรียนเอง)';
    }
    return selectedSchool || '🔍 แตะเพื่อเลือกโรงเรียน (มีระบบค้นหา)...';
  }, [selectedSchool, customSchoolText]);

  return (
    <div className="space-y-2">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full px-3.5 py-3 rounded-2xl border text-left flex items-center justify-between gap-2 shadow-sm transition-all active:scale-[0.99] ${
          error
            ? 'border-rose-400 bg-rose-50/50 ring-2 ring-rose-200'
            : selectedSchool
            ? 'border-sky-300 bg-sky-50/40 text-slate-800'
            : 'border-slate-200 bg-white text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-xl flex-shrink-0">🏫</span>
          <span
            className={`text-sm font-semibold truncate ${
              selectedSchool ? 'text-slate-800' : 'text-slate-400'
            }`}
          >
            {displayText}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full font-bold">
            ค้นหา
          </span>
          <span className="text-slate-400 text-sm">▼</span>
        </div>
      </button>

      {/* Input box for Custom School Text */}
      {selectedSchool === OTHER_SCHOOL_VALUE && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-1"
        >
          <label className="block text-xs font-bold text-slate-700 mb-1">
            ✏️ พิมพ์ระบุชื่อโรงเรียน / สถาบันการศึกษาของคุณ <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={customSchoolText}
            onChange={(e) => onChangeCustomText(e.target.value)}
            placeholder="ตัวอย่าง: โรงเรียนเทศบาล... หรือ โรงเรียน..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-sky-300 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0284C7] shadow-sm"
            autoFocus
          />
        </motion.div>
      )}

      {/* Modal / Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white w-full sm:max-w-lg rounded-t-[28px] sm:rounded-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏫</span>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      เลือกโรงเรียน / สถาบัน
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      พิมพ์ค้นหาหรือแตะเลือกจากรายการ
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100 bg-white">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    🔍
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="พิมพ์ชื่อโรงเรียน เช่น ท่าศาลา, เบญจม..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs bg-slate-200 w-5 h-5 rounded-full flex items-center justify-center font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Popular School Quick Chips */}
                {!searchQuery && (
                  <div className="mt-3">
                    <p className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <span>⚡ แตะด่วน: โรงเรียนยอดนิยม</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SCHOOLS.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => handlePick(name)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                            selectedSchool === name
                              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-sky-50 hover:text-sky-700'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* School List Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Always provide Other option at the top */}
                <button
                  type="button"
                  onClick={() => handlePick(OTHER_SCHOOL_VALUE)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between font-semibold text-sm transition-all ${
                    selectedSchool === OTHER_SCHOOL_VALUE
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-amber-50/70 border-amber-200 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>➕</span>
                    <span>ระบุโรงเรียนอื่นๆ (พิมพ์ชื่อเอง)</span>
                  </div>
                  <span className="text-xs opacity-75 font-bold">เลือก →</span>
                </button>

                {/* If searching */}
                {searchQuery ? (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-slate-500 mb-2">
                      ผลการค้นหา ({filteredSchools.length} แห่ง)
                    </p>
                    {filteredSchools.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <p className="text-3xl mb-2">🔍</p>
                        <p className="text-sm font-semibold text-slate-600">
                          ไม่พบชื่อโรงเรียน "${searchQuery}"
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          คุณสามารถเลือก "ระบุโรงเรียนอื่นๆ" ด้านบนเพื่อพิมพ์เองได้เลย
                        </p>
                      </div>
                    ) : (
                      filteredSchools.map((sch) => (
                        <button
                          key={sch}
                          type="button"
                          onClick={() => handlePick(sch)}
                          className={`w-full p-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                            selectedSchool === sch
                              ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm'
                              : 'bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-sky-50 hover:border-sky-300'
                          }`}
                        >
                          <span>{sch}</span>
                          {selectedSchool === sch && <span>✓</span>}
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  /* Grouped categories */
                  <div className="space-y-4">
                    {NAKHON_SI_THAMMARAT_SCHOOLS.map((cat) => (
                      <div key={cat.category} className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-500 px-1">
                          {cat.category}
                        </p>
                        <div className="space-y-1">
                          {cat.schools.map((sch) => (
                            <button
                              key={sch}
                              type="button"
                              onClick={() => handlePick(sch)}
                              className={`w-full p-2.5 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between ${
                                selectedSchool === sch
                                  ? 'bg-sky-600 text-white border-sky-600 font-bold shadow-sm'
                                  : 'bg-white border-slate-100 text-slate-700 hover:bg-sky-50'
                              }`}
                            >
                              <span>{sch}</span>
                              {selectedSchool === sch && <span>✓</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-300 active:scale-[0.99] transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
