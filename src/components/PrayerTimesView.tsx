import React, {useEffect, useState} from 'react';
import {
  Bell,
  BellOff,
  Check,
  ChevronDown,
  ChevronUp,
  LocateFixed,
  MapPin,
  Volume2,
} from 'lucide-react';
import {GLOBAL_CITIES} from '../data/cities';
import {
  CALCULATION_METHODS,
  DailyPrayerSchedule,
  formatCountdown,
  formatHijriDate,
  formatPrayerTime,
} from '../services/prayerService';
import type {
  AlertTone,
  CalculationMethodId,
  MadhabId,
  PrayerAlertSettings,
  PrayerId,
  UserLocation,
} from '../types/hasanat';

interface PrayerTimesViewProps {
  location: UserLocation;
  onChangeLocation: (loc: UserLocation) => void;
  onDetectGPS: () => void;
  detectingGPS: boolean;
  gpsError: string | null;
  methodId: CalculationMethodId;
  onChangeMethod: (id: CalculationMethodId) => void;
  madhabId: MadhabId;
  onChangeMadhab: (id: MadhabId) => void;
  schedule: DailyPrayerSchedule;
  alertSettings: PrayerAlertSettings;
  onUpdateAlert: (id: PrayerId, patch: Partial<PrayerAlertSettings[PrayerId]>) => void;
  onTestAlert: (id: PrayerId) => void;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
  prayedToday: Record<string, boolean>;
  onTogglePrayed: (id: PrayerId) => void;
}

const TONE_OPTIONS: {id: AlertTone; label: string}[] = [
  {id: 'adhan_chime', label: 'Adhan Melody (Hijaz)'},
  {id: 'fajr_dawn', label: 'Fajr Dawn Call'},
  {id: 'takbir_chime', label: 'Double Takbir Chime'},
  {id: 'golden_bell', label: 'Soft Golden Bell'},
  {id: 'silent', label: 'Silent Notification'},
];

const PRE_REMINDER_OPTIONS = [0, 5, 10, 15, 20, 30];
const SNOOZE_OPTIONS = [3, 5, 10, 15];

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  location,
  onChangeLocation,
  onDetectGPS,
  detectingGPS,
  gpsError,
  methodId,
  onChangeMethod,
  madhabId,
  onChangeMadhab,
  schedule,
  alertSettings,
  onUpdateAlert,
  onTestAlert,
  notificationPermission,
  onRequestNotificationPermission,
  prayedToday,
  onTogglePrayed,
}) => {
  const [now, setNow] = useState(() => new Date());
  const [expandedPrayer, setExpandedPrayer] = useState<PrayerId | null>('fajr');
  const [showCustomCoords, setShowCustomCoords] = useState(false);
  const [customLat, setCustomLat] = useState(String(location.latitude));
  const [customLng, setCustomLng] = useState(String(location.longitude));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const hijri = formatHijriDate(now);
  const msUntilNext = schedule.nextPrayer.time.getTime() - now.getTime();
  const totalWindowMs = Math.max(
    1,
    schedule.nextPrayer.time.getTime() - schedule.previousPrayerTime.getTime()
  );
  const progressPct = Math.min(
    100,
    Math.max(0, ((totalWindowMs - msUntilNext) / totalWindowMs) * 100)
  );

  return (
    <div className="space-y-6">
      {/* Hero Banner: Next Salah Countdown + Location & Calculation Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-[#12100C] border border-[#2B251A] rounded-3xl p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs text-[#8B816E] flex flex-wrap items-center gap-2">
                <span>{hijri.en}</span>
                <span aria-hidden="true">·</span>
                <span className="font-arabic text-sm text-[#D4AF37]">{hijri.ar}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#F5EFE2] text-balance">
                Next Salah: {schedule.nextPrayer.name}{' '}
                <span className="font-arabic text-[#E8CA68] font-normal">
                  ({schedule.nextPrayer.arabicName})
                </span>
              </h2>
            </div>

            <div className="text-right">
              <div className="text-xs text-[#8B816E]">Time Remaining</div>
              <div className="text-3xl sm:text-4xl font-mono-tabular font-semibold text-[#E8CA68]">
                {formatCountdown(msUntilNext)}
              </div>
              <div className="text-xs text-[#C7BDA8] tabular-nums mt-0.5">
                Adhan at {formatPrayerTime(schedule.nextPrayer.time)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#8B816E] tabular-nums">
              <span>Current Prayer Window</span>
              <span>{Math.round(progressPct)}% elapsed</span>
            </div>
            <div className="h-1.5 w-full bg-[#1A1711] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D4AF37] transition-all duration-500"
                style={{width: `${progressPct}%`}}
              />
            </div>
          </div>

          {/* Notification Permission Banner inside Hero */}
          <div className="pt-4 border-t border-[#2B251A] flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-[#C7BDA8]">
              {notificationPermission === 'granted'
                ? 'Browser & custom audio Salah alerts are active throughout the day.'
                : 'Enable browser notifications so Hasanat can alert you at each Salah time.'}
            </div>
            {notificationPermission !== 'granted' && (
              <button
                type="button"
                onClick={onRequestNotificationPermission}
                className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E8CA68] text-[#090806] text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Enable Notifications</span>
              </button>
            )}
          </div>
        </div>

        {/* Location & Astronomical Method Panel */}
        <div className="lg:col-span-5 bg-[#12100C] border border-[#2B251A] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="text-base font-semibold text-[#F5EFE2]">Location &amp; Method</h3>
            </div>
            <button
              type="button"
              onClick={onDetectGPS}
              disabled={detectingGPS}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] text-xs font-medium text-[#E8CA68] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span>{detectingGPS ? 'Detecting...' : 'Use GPS'}</span>
            </button>
          </div>

          {gpsError && (
            <p className="text-xs text-[#E8CA68] bg-[#1A1711] border border-[#D4AF37]/30 rounded-xl px-3 py-2">
              {gpsError}
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="city-select" className="block text-xs text-[#8B816E] mb-1">
                City (Works 100% Offline)
              </label>
              <select
                id="city-select"
                value={
                  GLOBAL_CITIES.find(
                    (c) =>
                      Math.abs(c.latitude - location.latitude) < 0.05 &&
                      Math.abs(c.longitude - location.longitude) < 0.05
                  )?.name ?? '__custom__'
                }
                onChange={(e) => {
                  const found = GLOBAL_CITIES.find((c) => c.name === e.target.value);
                  if (found) onChangeLocation(found);
                }}
                className="w-full min-h-[42px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-sm text-[#F5EFE2] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                <option value="__custom__">
                  {location.name} ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
                </option>
                {GLOBAL_CITIES.map((city) => (
                  <option key={`${city.name}-${city.country}`} value={city.name}>
                    {city.name}, {city.country} — {city.arabicName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="method-select" className="block text-xs text-[#8B816E] mb-1">
                  Calculation Method
                </label>
                <select
                  id="method-select"
                  value={methodId}
                  onChange={(e) => onChangeMethod(e.target.value as CalculationMethodId)}
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  {CALCULATION_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs text-[#8B816E] mb-1">Asr Juristic Method</span>
                <div className="flex items-center gap-1 bg-[#090806] p-1 rounded-xl border border-[#2B251A] h-[42px]">
                  <button
                    type="button"
                    onClick={() => onChangeMadhab('shafi')}
                    className={`flex-1 h-full rounded-lg text-xs font-medium cursor-pointer ${
                      madhabId === 'shafi' ? 'bg-[#D4AF37] text-[#090806]' : 'text-[#C7BDA8]'
                    }`}
                  >
                    Shafi’i
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeMadhab('hanafi')}
                    className={`flex-1 h-full rounded-lg text-xs font-medium cursor-pointer ${
                      madhabId === 'hanafi' ? 'bg-[#D4AF37] text-[#090806]' : 'text-[#C7BDA8]'
                    }`}
                  >
                    Hanafi
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowCustomCoords((v) => !v)}
                className="text-xs text-[#8B816E] hover:text-[#E8CA68] underline cursor-pointer"
              >
                {showCustomCoords ? 'Hide custom coordinates' : 'Enter custom latitude / longitude'}
              </button>

              {showCustomCoords && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const lat = parseFloat(customLat);
                    const lng = parseFloat(customLng);
                    if (
                      Number.isFinite(lat) &&
                      Number.isFinite(lng) &&
                      lat >= -90 &&
                      lat <= 90 &&
                      lng >= -180 &&
                      lng <= 180
                    ) {
                      onChangeLocation({
                        name: 'Custom Coordinates',
                        arabicName: 'موقع مخصص',
                        country: `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
                        latitude: lat,
                        longitude: lng,
                        source: 'custom',
                      });
                    }
                  }}
                  className="mt-2 grid grid-cols-3 gap-2"
                >
                  <input
                    type="number"
                    step="any"
                    value={customLat}
                    onChange={(e) => setCustomLat(e.target.value)}
                    placeholder="Latitude"
                    className="px-2.5 py-2 rounded-lg bg-[#090806] border border-[#2B251A] text-xs font-mono-tabular text-[#F5EFE2]"
                  />
                  <input
                    type="number"
                    step="any"
                    value={customLng}
                    onChange={(e) => setCustomLng(e.target.value)}
                    placeholder="Longitude"
                    className="px-2.5 py-2 rounded-lg bg-[#090806] border border-[#2B251A] text-xs font-mono-tabular text-[#F5EFE2]"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#D4AF37] text-[#090806] text-xs font-semibold cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Salah Timetable & Per-Prayer Custom Notification Settings */}
      <div className="bg-[#12100C] border border-[#2B251A] rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#2B251A]">
          <div>
            <h3 className="text-lg font-semibold text-[#F5EFE2]">
              Daily Salah Schedule &amp; Custom Reminders
            </h3>
            <p className="text-xs text-[#8B816E]">
              Customize pre-prayer reminders, notification sounds, snooze durations, and messages per prayer.
            </p>
          </div>
          <span className="text-xs text-[#8B816E] tabular-nums">
            {Object.values(prayedToday).filter(Boolean).length} / 5 Fard Completed Today
          </span>
        </div>

        <div className="divide-y divide-[#2B251A]">
          {schedule.prayers.map((prayer) => {
            const cfg = alertSettings[prayer.id];
            const isNext = schedule.nextPrayer.id === prayer.id;
            const isExpanded = expandedPrayer === prayer.id;
            const isPrayed = Boolean(prayedToday[prayer.id]);

            return (
              <div
                key={prayer.id}
                className={`py-4 transition-colors ${isNext ? 'bg-[#D4AF37]/[0.04] -mx-3 px-3 rounded-2xl' : ''}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-[190px]">
                    {prayer.isFard ? (
                      <button
                        type="button"
                        onClick={() => onTogglePrayed(prayer.id)}
                        aria-label={`Mark ${prayer.name} as prayed`}
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          isPrayed
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-[#090806]'
                            : 'bg-[#090806] border-[#2B251A] text-[#8B816E] hover:border-[#D4AF37]/60'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#090806] border border-[#2B251A] flex items-center justify-center text-xs text-[#8B816E] shrink-0">
                        Sun
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-semibold text-[#F5EFE2]">{prayer.name}</span>
                        <span className="font-arabic text-base text-[#E8CA68]">{prayer.arabicName}</span>
                        {isNext && (
                          <span className="text-xs font-medium text-[#D4AF37]">· Next</span>
                        )}
                      </div>
                      <div className="text-xs text-[#8B816E] tabular-nums">
                        {cfg.enabled
                          ? `${cfg.atAdhanTime ? 'At Adhan' : ''}${
                              cfg.preReminderMinutes > 0
                                ? `${cfg.atAdhanTime ? ' + ' : ''}${cfg.preReminderMinutes}m pre-alert`
                                : ''
                            } · Snooze ${cfg.snoozeMinutes}m`
                          : 'Notifications muted'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                    <span className="text-xl font-mono-tabular font-semibold text-[#F5EFE2] mr-2">
                      {formatPrayerTime(prayer.time)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onTestAlert(prayer.id)}
                      className="min-h-[40px] px-3 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] text-xs font-medium text-[#E8CA68] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Test</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onUpdateAlert(prayer.id, {enabled: !cfg.enabled})}
                      aria-label={cfg.enabled ? `Mute ${prayer.name} alert` : `Enable ${prayer.name} alert`}
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                        cfg.enabled
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#E8CA68]'
                          : 'bg-[#090806] border-[#2B251A] text-[#8B816E]'
                      }`}
                    >
                      {cfg.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedPrayer(isExpanded ? null : prayer.id)}
                      aria-label={`Customize ${prayer.name} notification`}
                      className="w-10 h-10 rounded-xl bg-[#1A1711] border border-[#2B251A] flex items-center justify-center text-[#C7BDA8] hover:text-[#F5EFE2] cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#2B251A]/70 grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3">
                      <label className="block text-xs text-[#8B816E] mb-1">Pre-Prayer Reminder</label>
                      <select
                        value={cfg.preReminderMinutes}
                        onChange={(e) =>
                          onUpdateAlert(prayer.id, {preReminderMinutes: Number(e.target.value)})
                        }
                        className="w-full min-h-[40px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] cursor-pointer"
                      >
                        {PRE_REMINDER_OPTIONS.map((min) => (
                          <option key={min} value={min}>
                            {min === 0 ? 'Off (Adhan only)' : `${min} min before`}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-[#8B816E] mb-1">Snooze</label>
                      <select
                        value={cfg.snoozeMinutes}
                        onChange={(e) =>
                          onUpdateAlert(prayer.id, {snoozeMinutes: Number(e.target.value)})
                        }
                        className="w-full min-h-[40px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] cursor-pointer"
                      >
                        {SNOOZE_OPTIONS.map((min) => (
                          <option key={min} value={min}>
                            {min} min
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs text-[#8B816E] mb-1">Notification Sound</label>
                      <select
                        value={cfg.tone}
                        onChange={(e) =>
                          onUpdateAlert(prayer.id, {tone: e.target.value as AlertTone})
                        }
                        className="w-full min-h-[40px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] cursor-pointer"
                      >
                        {TONE_OPTIONS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-4">
                      <label className="block text-xs text-[#8B816E] mb-1">
                        Custom Notification Message
                      </label>
                      <input
                        type="text"
                        value={cfg.customMessage}
                        onChange={(e) =>
                          onUpdateAlert(prayer.id, {customMessage: e.target.value})
                        }
                        className="w-full min-h-[40px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
