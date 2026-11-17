import React, {useMemo, useState} from 'react';
import {Bell, BellOff, Check, RotateCcw, Volume2} from 'lucide-react';
import {ADHKAR_CATEGORIES, TASBIH_PRESETS} from '../data/adhkarData';
import {playTasbihClick} from '../services/notificationService';
import type {AdhkarCategoryId, AlertTone, DhikrReminderConfig} from '../types/hasanat';

interface AdhkarViewProps {
  dhikrCounts: Record<string, number>;
  onIncrementDhikr: (itemId: string, maxRepeat: number) => void;
  onResetCategory: (categoryId: AdhkarCategoryId) => void;
  dhikrReminders: DhikrReminderConfig[];
  onUpdateDhikrReminder: (id: DhikrReminderConfig['id'], patch: Partial<DhikrReminderConfig>) => void;
  onTestDhikrReminder: (reminder: DhikrReminderConfig) => void;
  onHasanatEarned?: (points: number) => void;
}

export const AdhkarView: React.FC<AdhkarViewProps> = ({
  dhikrCounts,
  onIncrementDhikr,
  onResetCategory,
  dhikrReminders,
  onUpdateDhikrReminder,
  onTestDhikrReminder,
  onHasanatEarned,
}) => {
  const [activeCategory, setActiveCategory] = useState<AdhkarCategoryId>('morning');
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [tasbihCount, setTasbihCount] = useState<number>(() => {
    const saved = localStorage.getItem('hasanat_tasbih_count');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [tasbihTarget, setTasbihTarget] = useState<number>(33);
  const [tasbihSound, setTasbihSound] = useState<boolean>(true);

  const currentCategory = useMemo(
    () => ADHKAR_CATEGORIES.find((c) => c.id === activeCategory) ?? ADHKAR_CATEGORIES[0],
    [activeCategory]
  );

  const completedInCategory = useMemo(
    () =>
      currentCategory.items.filter((item) => (dhikrCounts[item.id] ?? 0) >= item.repeat).length,
    [currentCategory, dhikrCounts]
  );

  const activePreset = TASBIH_PRESETS[activePresetIdx] ?? TASBIH_PRESETS[0];

  const handleTasbihTap = () => {
    const next = tasbihCount + 1;
    setTasbihCount(next);
    localStorage.setItem('hasanat_tasbih_count', String(next));
    if (tasbihSound) {
      playTasbihClick();
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(next % tasbihTarget === 0 ? 45 : 15);
    }
    onHasanatEarned?.(1);
  };

  const handleTasbihReset = () => {
    setTasbihCount(0);
    localStorage.setItem('hasanat_tasbih_count', '0');
  };

  const tasbihProgress = tasbihTarget > 0 ? ((tasbihCount % tasbihTarget) / tasbihTarget) * 100 : 0;
  const completedCycles = tasbihTarget > 0 ? Math.floor(tasbihCount / tasbihTarget) : 0;

  return (
    <div className="space-y-6">
      {/* Top Grid: Offline Adhkar Library (Left 8 cols) + Digital Tasbih & Daily Reminders (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Offline Adhkar Collections */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#12100C] border border-[#2B251A] rounded-3xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-[#8B816E]">100% Offline Access · حصن المسلم</p>
                <h2 className="text-xl font-semibold text-[#F5EFE2]">
                  Prayers &amp; Daily Adhkar
                </h2>
              </div>

              <button
                type="button"
                onClick={() => onResetCategory(activeCategory)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] text-xs font-medium text-[#C7BDA8] flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Progress</span>
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#090806] border border-[#2B251A] rounded-2xl">
              {ADHKAR_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-[#D4AF37] text-[#090806] font-semibold'
                      : 'text-[#C7BDA8] hover:text-[#F5EFE2]'
                  }`}
                >
                  {cat.title}
                </button>
              ))}
            </div>

            {/* Category Header Metadata (Unboxed) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#8B816E]">
              <span>
                <strong className="font-arabic text-base text-[#E8CA68] font-normal mr-2">
                  {currentCategory.arabicTitle}
                </strong>
                · {currentCategory.subtitle}
              </span>
              <span className="tabular-nums text-[#D4AF37]">
                {completedInCategory} / {currentCategory.items.length} Completed
              </span>
            </div>

            {/* Adhkar Items List */}
            <div className="space-y-4">
              {currentCategory.items.map((item) => {
                const count = dhikrCounts[item.id] ?? 0;
                const done = count >= item.repeat;

                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-5 transition-colors ${
                      done
                        ? 'bg-[#16130B] border-[#D4AF37]/45'
                        : 'bg-[#0E0C09] border-[#2B251A]'
                    }`}
                  >
                    <p
                      className="font-arabic text-2xl sm:text-[1.7rem] leading-[2.2] text-right text-[#F5EFE2]"
                      dir="rtl"
                      lang="ar"
                    >
                      {item.arabic}
                    </p>

                    <div className="mt-4 pt-4 border-t border-[#2B251A] space-y-2">
                      <p className="text-xs italic text-[#C7BDA8]">{item.transliteration}</p>
                      <p className="text-sm text-[#C7BDA8] leading-relaxed">{item.translation}</p>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-xs text-[#8B816E]">{item.reference}</span>

                        <button
                          type="button"
                          onClick={() => onIncrementDhikr(item.id, item.repeat)}
                          className={`min-h-[44px] px-5 py-2 rounded-xl text-xs font-semibold tabular-nums flex items-center gap-2 transition-colors cursor-pointer ${
                            done
                              ? 'bg-[#D4AF37] text-[#090806]'
                              : 'bg-[#1A1711] hover:bg-[#242018] border border-[#D4AF37]/40 text-[#E8CA68]'
                          }`}
                        >
                          {done ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Completed ({item.repeat} / {item.repeat})</span>
                            </>
                          ) : (
                            <span>
                              Tap to Recite · {count} / {item.repeat}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Rail: Interactive Digital Tasbih + Daily Dhikr Notification Reminders */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-20">
          {/* Digital Subhah / Tasbih */}
          <div className="bg-[#12100C] border border-[#2B251A] rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#8B816E]">Offline Tasbih (المسبحة)</p>
                <h3 className="text-base font-semibold text-[#F5EFE2]">{activePreset.latin}</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTasbihSound((v) => !v)}
                  aria-label="Toggle Tasbih sound"
                  className={`w-9 h-9 rounded-lg border flex items-center justify-center text-xs cursor-pointer ${
                    tasbihSound
                      ? 'border-[#D4AF37]/50 text-[#E8CA68] bg-[#1A1711]'
                      : 'border-[#2B251A] text-[#8B816E] bg-[#090806]'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleTasbihReset}
                  aria-label="Reset Tasbih counter"
                  className="w-9 h-9 rounded-lg border border-[#2B251A] bg-[#090806] text-[#8B816E] hover:text-[#F5EFE2] flex items-center justify-center cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <select
              value={activePresetIdx}
              onChange={(e) => {
                const idx = Number(e.target.value);
                setActivePresetIdx(idx);
                setTasbihTarget(TASBIH_PRESETS[idx].defaultTarget);
              }}
              aria-label="Select Dhikr phrase"
              className="w-full min-h-[42px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] cursor-pointer"
            >
              {TASBIH_PRESETS.map((p, idx) => (
                <option key={p.id} value={idx}>
                  {p.arabic} — {p.latin}
                </option>
              ))}
            </select>

            {/* Circular Interactive Tasbih Bead Button */}
            <div className="flex flex-col items-center py-2">
              <button
                type="button"
                onClick={handleTasbihTap}
                className="relative w-44 h-44 rounded-full bg-[#090806] border border-[#2B251A] hover:border-[#D4AF37]/70 active:scale-[0.97] transition-transform flex flex-col items-center justify-center gap-1 shadow-xl shadow-black/50 cursor-pointer"
              >
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="#1F1B13"
                    strokeWidth="3"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="46"
                    fill="none"
                    stroke="#D4AF37"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={289}
                    strokeDashoffset={289 - (289 * tasbihProgress) / 100}
                    className="transition-all duration-150"
                  />
                </svg>
                <span className="font-arabic text-xl text-[#E8CA68] px-4 text-center leading-tight">
                  {activePreset.arabic}
                </span>
                <span className="text-3xl font-mono-tabular font-bold text-[#F5EFE2]">
                  {tasbihCount}
                </span>
                <span className="text-[11px] text-[#8B816E] tabular-nums">
                  Cycle {completedCycles + 1} · Target {tasbihTarget}
                </span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-[#8B816E]">Cycle Target</span>
              <div className="flex items-center gap-1 bg-[#090806] p-1 rounded-xl border border-[#2B251A]">
                {[33, 99, 100].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTasbihTarget(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono-tabular cursor-pointer ${
                      tasbihTarget === t ? 'bg-[#D4AF37] text-[#090806] font-semibold' : 'text-[#C7BDA8]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Dhikr Reminders */}
          <div className="bg-[#12100C] border border-[#2B251A] rounded-3xl p-6 space-y-4">
            <div>
              <p className="text-xs text-[#8B816E]">Scheduled Notifications</p>
              <h3 className="text-base font-semibold text-[#F5EFE2]">Daily Dhikr Reminders</h3>
            </div>

            <div className="divide-y divide-[#2B251A]">
              {dhikrReminders.map((rem) => (
                <div key={rem.id} className="py-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#F5EFE2] truncate">{rem.title}</div>
                      <div className="font-arabic text-sm text-[#D4AF37]">{rem.arabicTitle}</div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onTestDhikrReminder(rem)}
                        className="min-h-[36px] px-2.5 rounded-lg bg-[#1A1711] border border-[#2B251A] text-xs text-[#E8CA68] cursor-pointer"
                      >
                        Test
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateDhikrReminder(rem.id, {enabled: !rem.enabled})}
                        aria-label={`Toggle ${rem.title}`}
                        className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer ${
                          rem.enabled
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#E8CA68]'
                            : 'bg-[#090806] border-[#2B251A] text-[#8B816E]'
                        }`}
                      >
                        {rem.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="time"
                      value={rem.time}
                      onChange={(e) => onUpdateDhikrReminder(rem.id, {time: e.target.value})}
                      aria-label={`${rem.title} reminder time`}
                      className="px-2.5 py-1.5 rounded-lg bg-[#090806] border border-[#2B251A] text-xs font-mono-tabular text-[#F5EFE2]"
                    />
                    <select
                      value={rem.tone}
                      onChange={(e) =>
                        onUpdateDhikrReminder(rem.id, {tone: e.target.value as AlertTone})
                      }
                      aria-label={`${rem.title} reminder tone`}
                      className="px-2 py-1.5 rounded-lg bg-[#090806] border border-[#2B251A] text-xs text-[#C7BDA8]"
                    >
                      <option value="golden_bell">Golden Bell</option>
                      <option value="takbir_chime">Takbir Chime</option>
                      <option value="adhan_chime">Adhan Chime</option>
                      <option value="silent">Silent</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
