import React, {useState} from 'react';
import {Bell, BellOff, LocateFixed, Volume2, X} from 'lucide-react';
import {GLOBAL_CITIES} from '../data/cities';
import {playAlertTone} from '../services/notificationService';
import {CALCULATION_METHODS, PRAYER_LABELS} from '../services/prayerService';
import type {
  AlertTone,
  CalculationMethodId,
  MadhabId,
  PrayerAlertSettings,
  PrayerId,
  UserLocation,
} from '../types/hasanat';
import {PWAInstallButton} from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: UserLocation;
  onChangeLocation: (loc: UserLocation) => void;
  onDetectGPS: () => void;
  detectingGPS: boolean;
  methodId: CalculationMethodId;
  onChangeMethod: (id: CalculationMethodId) => void;
  madhabId: MadhabId;
  onChangeMadhab: (id: MadhabId) => void;
  alertSettings: PrayerAlertSettings;
  onUpdateAlert: (id: PrayerId, patch: Partial<PrayerAlertSettings[PrayerId]>) => void;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
}

const TONE_OPTIONS: {id: AlertTone; label: string}[] = [
  {id: 'adhan_chime', label: 'Adhan Melody (Hijaz)'},
  {id: 'fajr_dawn', label: 'Fajr Dawn Call'},
  {id: 'takbir_chime', label: 'Double Takbir Chime'},
  {id: 'golden_bell', label: 'Soft Golden Bell'},
  {id: 'silent', label: 'Silent Notification'},
];

const PRAYER_IDS: PrayerId[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  location,
  onChangeLocation,
  onDetectGPS,
  detectingGPS,
  methodId,
  onChangeMethod,
  madhabId,
  onChangeMadhab,
  alertSettings,
  onUpdateAlert,
  notificationPermission,
  onRequestNotificationPermission,
}) => {
  const [tab, setTab] = useState<'notifications' | 'location'>('notifications');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[88vh] bg-[#12100C] border border-[#2B251A] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#2B251A] flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#F5EFE2]">
              Settings · <span className="font-arabic text-[#E8CA68]">الإعدادات</span>
            </h2>
            <p className="text-xs text-[#8B816E]">
              Customize Salah notification sounds, pre-prayer reminders, snooze duration &amp; location
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="w-10 h-10 rounded-xl bg-[#1A1711] border border-[#2B251A] flex items-center justify-center text-[#C7BDA8] hover:text-[#F5EFE2] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sub-Navigation & Browser Permission Strip */}
        <div className="px-5 py-3 border-b border-[#2B251A] bg-[#0D0B08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-[#090806] p-1 rounded-xl border border-[#2B251A]">
            <button
              type="button"
              onClick={() => setTab('notifications')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                tab === 'notifications' ? 'bg-[#D4AF37] text-[#090806] font-semibold' : 'text-[#C7BDA8]'
              }`}
            >
              Prayer Notifications &amp; Snooze
            </button>
            <button
              type="button"
              onClick={() => setTab('location')}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                tab === 'location' ? 'bg-[#D4AF37] text-[#090806] font-semibold' : 'text-[#C7BDA8]'
              }`}
            >
              Location &amp; Calculation
            </button>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />
            {notificationPermission !== 'granted' && (
              <button
                type="button"
                onClick={onRequestNotificationPermission}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#1A1711] border border-[#D4AF37]/50 text-xs font-medium text-[#E8CA68] flex items-center gap-1.5 cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Allow Browser Alerts</span>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {tab === 'notifications' ? (
            <div className="space-y-4">
              {PRAYER_IDS.map((pid) => {
                const meta = PRAYER_LABELS[pid];
                const cfg = alertSettings[pid];
                return (
                  <div
                    key={pid}
                    className="rounded-2xl bg-[#0E0C09] border border-[#2B251A] p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base font-semibold text-[#F5EFE2]">{meta.name}</span>
                        <span className="font-arabic text-base text-[#E8CA68]">{meta.arabicName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => playAlertTone(cfg.tone)}
                          className="min-h-[36px] px-3 rounded-lg bg-[#1A1711] border border-[#2B251A] text-xs text-[#E8CA68] flex items-center gap-1.5 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Preview Sound</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onUpdateAlert(pid, {enabled: !cfg.enabled})}
                          className={`min-h-[36px] px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                            cfg.enabled
                              ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#E8CA68]'
                              : 'bg-[#090806] border-[#2B251A] text-[#8B816E]'
                          }`}
                        >
                          {cfg.enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                          <span>{cfg.enabled ? 'Enabled' : 'Muted'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#8B816E] mb-1">
                          Notification Sound
                        </label>
                        <select
                          value={cfg.tone}
                          onChange={(e) => onUpdateAlert(pid, {tone: e.target.value as AlertTone})}
                          className="w-full min-h-[38px] px-2.5 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] cursor-pointer"
                        >
                          {TONE_OPTIONS.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#8B816E] mb-1">
                          Pre-Prayer Reminder
                        </label>
                        <select
                          value={cfg.preReminderMinutes}
                          onChange={(e) =>
                            onUpdateAlert(pid, {preReminderMinutes: Number(e.target.value)})
                          }
                          className="w-full min-h-[38px] px-2.5 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] cursor-pointer"
                        >
                          <option value={0}>Off (At Adhan only)</option>
                          <option value={5}>5 min before prayer</option>
                          <option value={10}>10 min before prayer</option>
                          <option value={15}>15 min before prayer</option>
                          <option value={20}>20 min before prayer</option>
                          <option value={30}>30 min before prayer</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#8B816E] mb-1">
                          Snooze Duration
                        </label>
                        <select
                          value={cfg.snoozeMinutes}
                          onChange={(e) =>
                            onUpdateAlert(pid, {snoozeMinutes: Number(e.target.value)})
                          }
                          className="w-full min-h-[38px] px-2.5 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] cursor-pointer"
                        >
                          <option value={3}>3 minutes</option>
                          <option value={5}>5 minutes</option>
                          <option value={10}>10 minutes</option>
                          <option value={15}>15 minutes</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <label className="flex items-center gap-2 text-xs text-[#C7BDA8] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cfg.atAdhanTime}
                          onChange={(e) => onUpdateAlert(pid, {atAdhanTime: e.target.checked})}
                          className="accent-[#D4AF37] w-4 h-4"
                        />
                        <span>Also notify at exact prayer start time</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-[#0E0C09] border border-[#2B251A] p-4 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[#F5EFE2]">Location</h3>
                    <p className="text-xs text-[#8B816E]">
                      Used for astronomical prayer times and Qibla bearing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onDetectGPS}
                    disabled={detectingGPS}
                    className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#D4AF37] text-[#090806] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>{detectingGPS ? 'Locating...' : 'Detect GPS'}</span>
                  </button>
                </div>

                <select
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
                  className="w-full min-h-[42px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-sm text-[#F5EFE2]"
                >
                  <option value="__custom__">
                    {location.name} ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
                  </option>
                  {GLOBAL_CITIES.map((c) => (
                    <option key={`${c.name}-${c.country}`} value={c.name}>
                      {c.name}, {c.country} — {c.arabicName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl bg-[#0E0C09] border border-[#2B251A] p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8B816E] mb-1">Calculation Method</label>
                  <select
                    value={methodId}
                    onChange={(e) => onChangeMethod(e.target.value as CalculationMethodId)}
                    className="w-full min-h-[42px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2]"
                  >
                    {CALCULATION_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#8B816E] mb-1">Asr Juristic School</label>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
