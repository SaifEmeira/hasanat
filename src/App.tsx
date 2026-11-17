import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Bell,
  BookOpen,
  Clock,
  Compass,
  Gamepad2,
  HeartHandshake,
  Settings,
  X,
} from 'lucide-react';
import {AdhkarView} from './components/AdhkarView';
import {CompleteVerseGame} from './components/CompleteVerseGame';
import {PrayerTimesView} from './components/PrayerTimesView';
import {PWAInstallButton} from './components/PWAInstallButton';
import {QiblaCompass} from './components/QiblaCompass';
import {QuranMushaf} from './components/QuranMushaf';
import {SettingsModal} from './components/SettingsModal';
import {DEFAULT_DHIKR_REMINDERS} from './data/adhkarData';
import {GLOBAL_CITIES, findNearestCity} from './data/cities';
import {SHEIKHS} from './data/quranMeta';
import {useOnlineStatus} from './hooks/useOnlineStatus';
import {requestNotificationPermission, triggerCustomAlert} from './services/notificationService';
import {
  DEFAULT_PRAYER_ALERTS,
  PRAYER_LABELS,
  computeDailySchedule,
  formatCountdown,
  formatPrayerTime,
  getCardinalDirection,
} from './services/prayerService';
import type {
  AdhkarCategoryId,
  AppTab,
  CalculationMethodId,
  DhikrReminderConfig,
  InAppAlertBanner,
  MadhabId,
  PrayerAlertSettings,
  PrayerId,
  SheikhReciter,
  UserLocation,
} from './types/hasanat';

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function App() {
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    const saved = localStorage.getItem('hasanat_active_tab');
    if (
      saved === 'quran' ||
      saved === 'game' ||
      saved === 'prayers' ||
      saved === 'qibla' ||
      saved === 'adhkar'
    ) {
      return saved;
    }
    return 'quran';
  });

  const [selectedSheikh, setSelectedSheikh] = useState<SheikhReciter>(() => {
    const savedId = localStorage.getItem('hasanat_sheikh_id');
    return SHEIKHS.find((s) => s.id === savedId) ?? SHEIKHS[0];
  });

  const [showSettings, setShowSettings] = useState(false);

  const [location, setLocation] = useState<UserLocation>(() => {
    try {
      const saved = localStorage.getItem('hasanat_location');
      if (saved) return JSON.parse(saved) as UserLocation;
    } catch {
      // ignore
    }
    return GLOBAL_CITIES[0];
  });

  const [detectingGPS, setDetectingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const [methodId, setMethodId] = useState<CalculationMethodId>(() => {
    return (localStorage.getItem('hasanat_method') as CalculationMethodId) || 'UmmAlQura';
  });

  const [madhabId, setMadhabId] = useState<MadhabId>(() => {
    return (localStorage.getItem('hasanat_madhab') as MadhabId) || 'shafi';
  });

  const [alertSettings, setAlertSettings] = useState<PrayerAlertSettings>(() => {
    try {
      const saved = localStorage.getItem('hasanat_prayer_alerts');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PrayerAlertSettings>;
        const merged = {...DEFAULT_PRAYER_ALERTS};
        (Object.keys(DEFAULT_PRAYER_ALERTS) as PrayerId[]).forEach((pid) => {
          if (parsed[pid]) {
            merged[pid] = {...DEFAULT_PRAYER_ALERTS[pid], ...parsed[pid]};
          }
        });
        return merged;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PRAYER_ALERTS;
  });

  const [dhikrReminders, setDhikrReminders] = useState<DhikrReminderConfig[]>(() => {
    try {
      const saved = localStorage.getItem('hasanat_dhikr_reminders');
      if (saved) return JSON.parse(saved) as DhikrReminderConfig[];
    } catch {
      // ignore
    }
    return DEFAULT_DHIKR_REMINDERS;
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  const [prayedToday, setPrayedToday] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`hasanat_prayed_${getTodayKey()}`);
      if (saved) return JSON.parse(saved) as Record<string, boolean>;
    } catch {
      // ignore
    }
    return {};
  });

  const [dhikrCounts, setDhikrCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`hasanat_dhikr_${getTodayKey()}`);
      if (saved) return JSON.parse(saved) as Record<string, number>;
    } catch {
      // ignore
    }
    return {};
  });

  const [hasanatScore, setHasanatScore] = useState<number>(() => {
    const saved = localStorage.getItem('hasanat_total_score');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  const [banners, setBanners] = useState<InAppAlertBanner[]>([]);
  const [tickNow, setTickNow] = useState(() => new Date());
  const firedNotificationsRef = useRef<Set<string>>(new Set());
  const snoozedRemindersRef = useRef<
    {id: string; triggerAt: number; title: string; arabicTitle?: string; body: string; tone: PrayerAlertSettings[PrayerId]['tone']; snoozeMinutes: number; prayerId?: PrayerId}[]
  >([]);

  useEffect(() => {
    const timer = window.setInterval(() => setTickNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('hasanat_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('hasanat_sheikh_id', selectedSheikh.id);
  }, [selectedSheikh]);

  useEffect(() => {
    localStorage.setItem('hasanat_location', JSON.stringify(location));
  }, [location]);

  useEffect(() => {
    localStorage.setItem('hasanat_method', methodId);
  }, [methodId]);

  useEffect(() => {
    localStorage.setItem('hasanat_madhab', madhabId);
  }, [madhabId]);

  useEffect(() => {
    localStorage.setItem('hasanat_prayer_alerts', JSON.stringify(alertSettings));
  }, [alertSettings]);

  useEffect(() => {
    localStorage.setItem('hasanat_dhikr_reminders', JSON.stringify(dhikrReminders));
  }, [dhikrReminders]);

  const addHasanat = useCallback((points: number) => {
    setHasanatScore((prev) => {
      const next = prev + points;
      localStorage.setItem('hasanat_total_score', String(next));
      return next;
    });
  }, []);

  const schedule = useMemo(
    () => computeDailySchedule(location, methodId, madhabId, tickNow),
    [location, methodId, madhabId, tickNow]
  );

  const pushBanner = useCallback((banner: InAppAlertBanner) => {
    setBanners((prev) => [banner, ...prev].slice(0, 3));
  }, []);

  const handleSnoozeBanner = (banner: InAppAlertBanner) => {
    const snoozeMins = banner.snoozeMinutes ?? 5;
    snoozedRemindersRef.current.push({
      id: `snooze-${Date.now()}`,
      triggerAt: Date.now() + snoozeMins * 60 * 1000,
      title: `${banner.title} (Snoozed)`,
      arabicTitle: banner.arabicTitle,
      body: banner.body,
      tone: banner.tone ?? 'golden_bell',
      snoozeMinutes: snoozeMins,
      prayerId: banner.prayerId,
    });
    setBanners((prev) => prev.filter((x) => x.id !== banner.id));
  };

  const handleDetectGPS = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by this browser. Select a city offline.');
      return;
    }
    setDetectingGPS(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude);
        setLocation(nearest);
        setDetectingGPS(false);
      },
      () => {
        setGpsError('Location permission denied or unavailable. Choose your city manually.');
        setDetectingGPS(false);
      },
      {enableHighAccuracy: true, timeout: 10000}
    );
  }, []);

  useEffect(() => {
    const alreadySaved = localStorage.getItem('hasanat_location');
    if (!alreadySaved && typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation(findNearestCity(pos.coords.latitude, pos.coords.longitude));
        },
        () => {},
        {timeout: 5000}
      );
    }
  }, []);

  const handleRequestNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      triggerCustomAlert({
        title: 'Salah Notifications Enabled',
        arabicTitle: 'تفعيل تنبيهات الصلاة',
        body: `Custom alerts are active for ${location.name}.`,
        tone: 'golden_bell',
        onInAppBanner: pushBanner,
      });
    }
  };

  // Real-time background scheduler for Pre-Prayer, Exact Adhan, Snoozed & Daily Dhikr Notifications
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const nowMs = now.getTime();
      const today = getTodayKey();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // 1. Check Snoozed Alerts
      const remainingSnoozed: typeof snoozedRemindersRef.current = [];
      for (const s of snoozedRemindersRef.current) {
        if (nowMs >= s.triggerAt) {
          triggerCustomAlert({
            title: s.title,
            arabicTitle: s.arabicTitle,
            body: s.body,
            tone: s.tone,
            snoozeMinutes: s.snoozeMinutes,
            prayerId: s.prayerId,
            onInAppBanner: pushBanner,
          });
        } else {
          remainingSnoozed.push(s);
        }
      }
      snoozedRemindersRef.current = remainingSnoozed;

      // 2. Check Salah alerts (Pre-Prayer Reminder + Exact Adhan Time)
      for (const prayer of schedule.prayers) {
        const cfg = alertSettings[prayer.id];
        if (!cfg.enabled) continue;

        if (cfg.preReminderMinutes > 0) {
          const preMs = prayer.time.getTime() - cfg.preReminderMinutes * 60 * 1000;
          const deltaPre = nowMs - preMs;
          const preKey = `salah-pre-${today}-${prayer.id}-${cfg.preReminderMinutes}`;
          if (deltaPre >= 0 && deltaPre < 60_000 && !firedNotificationsRef.current.has(preKey)) {
            firedNotificationsRef.current.add(preKey);
            triggerCustomAlert({
              title: `${prayer.name} in ${cfg.preReminderMinutes} min`,
              arabicTitle: `اقترب موعد صلاة ${prayer.arabicName}`,
              body: `Prepare for ${prayer.name} prayer at ${formatPrayerTime(prayer.time)}.`,
              tone: cfg.tone,
              snoozeMinutes: cfg.snoozeMinutes,
              prayerId: prayer.id,
              onInAppBanner: pushBanner,
            });
          }
        }

        if (cfg.atAdhanTime) {
          const deltaAdhan = nowMs - prayer.time.getTime();
          const adhanKey = `salah-adhan-${today}-${prayer.id}`;
          if (deltaAdhan >= 0 && deltaAdhan < 60_000 && !firedNotificationsRef.current.has(adhanKey)) {
            firedNotificationsRef.current.add(adhanKey);
            triggerCustomAlert({
              title: `${prayer.name} Prayer (${formatPrayerTime(prayer.time)})`,
              arabicTitle: `صلاة ${prayer.arabicName}`,
              body: cfg.customMessage,
              tone: cfg.tone,
              snoozeMinutes: cfg.snoozeMinutes,
              prayerId: prayer.id,
              onInAppBanner: pushBanner,
            });
          }
        }
      }

      // 3. Check Daily Dhikr reminders
      for (const rem of dhikrReminders) {
        if (!rem.enabled) continue;
        if (rem.id === 'kahf' && now.getDay() !== 5) continue;
        const fireKey = `dhikr-${today}-${rem.id}-${rem.time}`;
        if (rem.time === currentHHMM && !firedNotificationsRef.current.has(fireKey)) {
          firedNotificationsRef.current.add(fireKey);
          triggerCustomAlert({
            title: rem.title,
            arabicTitle: rem.arabicTitle,
            body: rem.message,
            tone: rem.tone,
            snoozeMinutes: 5,
            onInAppBanner: pushBanner,
          });
        }
      }
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 15_000);
    return () => window.clearInterval(interval);
  }, [alertSettings, dhikrReminders, pushBanner, schedule.prayers]);

  const handleUpdateAlert = (id: PrayerId, patch: Partial<PrayerAlertSettings[PrayerId]>) => {
    setAlertSettings((prev) => ({
      ...prev,
      [id]: {...prev[id], ...patch},
    }));
  };

  const handleTestPrayerAlert = (id: PrayerId) => {
    const cfg = alertSettings[id];
    const meta = PRAYER_LABELS[id];
    const prayerEntry = schedule.prayers.find((p) => p.id === id);
    triggerCustomAlert({
      title: `${meta.name} Reminder (${prayerEntry ? formatPrayerTime(prayerEntry.time) : ''})`,
      arabicTitle: `صلاة ${meta.arabicName}`,
      body: cfg.customMessage,
      tone: cfg.tone,
      snoozeMinutes: cfg.snoozeMinutes,
      prayerId: id,
      onInAppBanner: pushBanner,
    });
  };

  const handleTogglePrayed = (id: PrayerId) => {
    setPrayedToday((prev) => {
      const nextVal = !prev[id];
      const next = {...prev, [id]: nextVal};
      localStorage.setItem(`hasanat_prayed_${getTodayKey()}`, JSON.stringify(next));
      if (nextVal) addHasanat(50);
      return next;
    });
  };

  const handleIncrementDhikr = (itemId: string, maxRepeat: number) => {
    setDhikrCounts((prev) => {
      const curr = prev[itemId] ?? 0;
      if (curr >= maxRepeat) return prev;
      const next = {...prev, [itemId]: curr + 1};
      localStorage.setItem(`hasanat_dhikr_${getTodayKey()}`, JSON.stringify(next));
      addHasanat(5);
      return next;
    });
  };

  const handleResetAdhkarCategory = (categoryId: AdhkarCategoryId) => {
    import('./data/adhkarData').then(({ADHKAR_CATEGORIES}) => {
      const cat = ADHKAR_CATEGORIES.find((c) => c.id === categoryId);
      if (!cat) return;
      setDhikrCounts((prev) => {
        const next = {...prev};
        for (const item of cat.items) {
          delete next[item.id];
        }
        localStorage.setItem(`hasanat_dhikr_${getTodayKey()}`, JSON.stringify(next));
        return next;
      });
    });
  };

  const handleUpdateDhikrReminder = (
    id: DhikrReminderConfig['id'],
    patch: Partial<DhikrReminderConfig>
  ) => {
    setDhikrReminders((prev) => prev.map((r) => (r.id === id ? {...r, ...patch} : r)));
  };

  const handleTestDhikrReminder = (rem: DhikrReminderConfig) => {
    triggerCustomAlert({
      title: rem.title,
      arabicTitle: rem.arabicTitle,
      body: rem.message,
      tone: rem.tone,
      snoozeMinutes: 5,
      onInAppBanner: pushBanner,
    });
  };

  const navItems: {id: AppTab; label: string; icon: React.ReactNode}[] = [
    {id: 'quran', label: 'Mushaf', icon: <BookOpen className="w-5 h-5" />},
    {id: 'game', label: 'Verse Game', icon: <Gamepad2 className="w-5 h-5" />},
    {id: 'prayers', label: 'Prayers', icon: <Clock className="w-5 h-5" />},
    {id: 'qibla', label: 'Qibla', icon: <Compass className="w-5 h-5" />},
    {id: 'adhkar', label: 'Adhkar', icon: <HeartHandshake className="w-5 h-5" />},
  ];

  return (
    <div className="min-h-screen bg-[#090806] text-[#F5EFE2] flex flex-col pb-20 md:pb-10">
      {/* Top Bar Contract: Strict 3-Zone Header separated by gap-8 */}
      <header className="sticky top-0 z-30 bg-[#090806]/90 backdrop-blur-md border-b border-[#2B251A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          {/* Zone 1: Single-Element Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('quran');
            }}
            className="font-arabic text-2xl sm:text-3xl font-bold text-[#E8CA68] tracking-normal whitespace-nowrap shrink-0"
          >
            حسنات
          </a>

          {/* Zone 2: 5 Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-[#D4AF37] text-[#E8CA68]'
                      : 'border-transparent text-[#C7BDA8] hover:text-[#F5EFE2]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action (Settings Menu) */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E8CA68] text-[#090806] text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Operational Context Strip (Clean Unboxed Metadata below Header) */}
      <div className="border-b border-[#2B251A]/70 bg-[#0D0B08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#C7BDA8]">
          <div className="flex flex-wrap items-center gap-2 tabular-nums">
            <span className="text-[#E8CA68] font-medium">{location.name}</span>
            <span aria-hidden="true">·</span>
            <span>
              Next: <strong className="text-[#F5EFE2]">{schedule.nextPrayer.name}</strong> at{' '}
              {formatPrayerTime(schedule.nextPrayer.time)} (
              {formatCountdown(schedule.nextPrayer.time.getTime() - tickNow.getTime())})
            </span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              Qibla {schedule.qiblaBearing.toFixed(1)}° {getCardinalDirection(schedule.qiblaBearing)}
            </span>
          </div>

          <div className="flex items-center gap-3 tabular-nums text-[#8B816E]">
            <span>{isOnline ? 'Online · Offline Cache Active' : 'Offline Mode · Local Sanctuary Ready'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#D4AF37]">Hasanat: {hasanatScore.toLocaleString()}</span>
            <PWAInstallButton compact />
          </div>
        </div>
      </div>

      {/* Live In-App Notification Banners with Snooze Action */}
      {banners.length > 0 && (
        <div className="fixed top-16 right-4 z-50 w-[calc(100%-2rem)] max-w-sm space-y-2">
          {banners.map((b) => (
            <div
              key={b.id}
              className="bg-[#16130C] border border-[#D4AF37]/60 rounded-2xl p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span className="text-sm font-semibold text-[#E8CA68] truncate">{b.title}</span>
                  </div>
                  {b.arabicTitle && (
                    <div className="font-arabic text-base text-[#F5EFE2]">{b.arabicTitle}</div>
                  )}
                  <p className="text-xs text-[#C7BDA8] leading-relaxed">{b.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBanners((prev) => prev.filter((x) => x.id !== b.id))}
                  aria-label="Dismiss notification"
                  className="w-8 h-8 rounded-lg bg-[#090806] text-[#8B816E] hover:text-[#F5EFE2] flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {b.snoozeMinutes && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#2B251A]">
                  <button
                    type="button"
                    onClick={() => handleSnoozeBanner(b)}
                    className="min-h-[34px] px-3 py-1 rounded-lg bg-[#1A1711] hover:bg-[#242018] border border-[#D4AF37]/40 text-xs font-medium text-[#E8CA68] cursor-pointer"
                  >
                    Snooze ({b.snoozeMinutes} min)
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Content Area */}
      <main id="top" className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {activeTab === 'quran' && (
          <QuranMushaf
            isOnline={isOnline}
            selectedSheikh={selectedSheikh}
            onChangeSheikh={setSelectedSheikh}
            onHasanatEarned={addHasanat}
          />
        )}
        {activeTab === 'game' && (
          <CompleteVerseGame
            selectedSheikh={selectedSheikh}
            onChangeSheikh={setSelectedSheikh}
            onHasanatEarned={addHasanat}
          />
        )}
        {activeTab === 'prayers' && (
          <PrayerTimesView
            location={location}
            onChangeLocation={setLocation}
            onDetectGPS={handleDetectGPS}
            detectingGPS={detectingGPS}
            gpsError={gpsError}
            methodId={methodId}
            onChangeMethod={setMethodId}
            madhabId={madhabId}
            onChangeMadhab={setMadhabId}
            schedule={schedule}
            alertSettings={alertSettings}
            onUpdateAlert={handleUpdateAlert}
            onTestAlert={handleTestPrayerAlert}
            notificationPermission={notificationPermission}
            onRequestNotificationPermission={handleRequestNotifications}
            prayedToday={prayedToday}
            onTogglePrayed={handleTogglePrayed}
          />
        )}
        {activeTab === 'qibla' && (
          <QiblaCompass
            location={location}
            qiblaBearing={schedule.qiblaBearing}
            distanceKm={schedule.distanceToKaabaKm}
            onDetectGPS={handleDetectGPS}
            detectingGPS={detectingGPS}
          />
        )}
        {activeTab === 'adhkar' && (
          <AdhkarView
            dhikrCounts={dhikrCounts}
            onIncrementDhikr={handleIncrementDhikr}
            onResetCategory={handleResetAdhkarCategory}
            dhikrReminders={dhikrReminders}
            onUpdateDhikrReminder={handleUpdateDhikrReminder}
            onTestDhikrReminder={handleTestDhikrReminder}
            onHasanatEarned={addHasanat}
          />
        )}
      </main>

      {/* Accessible Settings Menu Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        location={location}
        onChangeLocation={setLocation}
        onDetectGPS={handleDetectGPS}
        detectingGPS={detectingGPS}
        methodId={methodId}
        onChangeMethod={setMethodId}
        madhabId={madhabId}
        onChangeMadhab={setMadhabId}
        alertSettings={alertSettings}
        onUpdateAlert={handleUpdateAlert}
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={handleRequestNotifications}
      />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0B08]/95 backdrop-blur-md border-t border-[#2B251A]"
      >
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                  active ? 'text-[#E8CA68]' : 'text-[#8B816E]'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
