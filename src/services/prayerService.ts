import {CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla} from 'adhan';
import type {
  CalculationMethodId,
  MadhabId,
  PrayerAlertSettings,
  PrayerId,
  UserLocation,
} from '../types/hasanat';

export const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
};

export const CALCULATION_METHODS: {id: CalculationMethodId; label: string; arabicLabel: string}[] = [
  {id: 'UmmAlQura', label: 'Umm al-Qura (Makkah)', arabicLabel: 'أم القرى — مكة'},
  {id: 'MuslimWorldLeague', label: 'Muslim World League', arabicLabel: 'رابطة العالم الإسلامي'},
  {id: 'Egyptian', label: 'Egyptian General Authority', arabicLabel: 'الهيئة المصرية العامة'},
  {id: 'Dubai', label: 'UAE / Dubai', arabicLabel: 'دبي — الإمارات'},
  {id: 'Kuwait', label: 'Kuwait', arabicLabel: 'الكويت'},
  {id: 'Qatar', label: 'Qatar', arabicLabel: 'قطر'},
  {id: 'NorthAmerica', label: 'ISNA (North America)', arabicLabel: 'أمريكا الشمالية (ISNA)'},
  {id: 'Karachi', label: 'University of Karachi', arabicLabel: 'كراتشي'},
];

export const PRAYER_LABELS: Record<
  PrayerId,
  {name: string; arabicName: string; isFard: boolean}
> = {
  fajr: {name: 'Fajr', arabicName: 'الفجر', isFard: true},
  sunrise: {name: 'Sunrise', arabicName: 'الشروق', isFard: false},
  dhuhr: {name: 'Dhuhr', arabicName: 'الظهر', isFard: true},
  asr: {name: 'Asr', arabicName: 'العصر', isFard: true},
  maghrib: {name: 'Maghrib', arabicName: 'المغرب', isFard: true},
  isha: {name: 'Isha', arabicName: 'العشاء', isFard: true},
};

export const DEFAULT_PRAYER_ALERTS: PrayerAlertSettings = {
  fajr: {
    enabled: true,
    atAdhanTime: true,
    preReminderMinutes: 10,
    snoozeMinutes: 5,
    tone: 'fajr_dawn',
    customMessage: 'حي على الصلاة — Time for Fajr prayer. Prayer is better than sleep.',
  },
  sunrise: {
    enabled: false,
    atAdhanTime: true,
    preReminderMinutes: 15,
    snoozeMinutes: 5,
    tone: 'golden_bell',
    customMessage: 'Sunrise approaches — complete Fajr before Shuruq.',
  },
  dhuhr: {
    enabled: true,
    atAdhanTime: true,
    preReminderMinutes: 5,
    snoozeMinutes: 5,
    tone: 'adhan_chime',
    customMessage: 'حي على الصلاة — Time for Dhuhr prayer. Pause and renew your heart.',
  },
  asr: {
    enabled: true,
    atAdhanTime: true,
    preReminderMinutes: 10,
    snoozeMinutes: 5,
    tone: 'takbir_chime',
    customMessage: 'Asr prayer time is entering — guard the middle prayer.',
  },
  maghrib: {
    enabled: true,
    atAdhanTime: true,
    preReminderMinutes: 5,
    snoozeMinutes: 5,
    tone: 'adhan_chime',
    customMessage: 'حي على الفلاح — Time for Maghrib prayer & Evening Adhkar.',
  },
  isha: {
    enabled: true,
    atAdhanTime: true,
    preReminderMinutes: 10,
    snoozeMinutes: 10,
    tone: 'adhan_chime',
    customMessage: 'Time for Isha prayer — conclude your day in peace.',
  },
};

function getAdhanMethod(id: CalculationMethodId) {
  switch (id) {
    case 'UmmAlQura':
      return CalculationMethod.UmmAlQura();
    case 'Egyptian':
      return CalculationMethod.Egyptian();
    case 'NorthAmerica':
      return CalculationMethod.NorthAmerica();
    case 'Karachi':
      return CalculationMethod.Karachi();
    case 'Dubai':
      return CalculationMethod.Dubai();
    case 'Kuwait':
      return CalculationMethod.Kuwait();
    case 'Qatar':
      return CalculationMethod.Qatar();
    case 'MuslimWorldLeague':
    default:
      return CalculationMethod.MuslimWorldLeague();
  }
}

export interface ComputedPrayerEntry {
  id: PrayerId;
  name: string;
  arabicName: string;
  isFard: boolean;
  time: Date;
}

export interface DailyPrayerSchedule {
  prayers: ComputedPrayerEntry[];
  nextPrayer: ComputedPrayerEntry;
  previousPrayerTime: Date;
  qiblaBearing: number;
  distanceToKaabaKm: number;
}

export function computeDailySchedule(
  location: UserLocation,
  methodId: CalculationMethodId,
  madhabId: MadhabId,
  now: Date = new Date()
): DailyPrayerSchedule {
  const coords = new Coordinates(location.latitude, location.longitude);
  const params = getAdhanMethod(methodId);
  params.madhab = madhabId === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  const todayTimes = new PrayerTimes(coords, now, params);
  const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowTimes = new PrayerTimes(coords, tomorrowDate, params);

  const prayers: ComputedPrayerEntry[] = [
    {id: 'fajr', ...PRAYER_LABELS.fajr, time: todayTimes.fajr},
    {id: 'sunrise', ...PRAYER_LABELS.sunrise, time: todayTimes.sunrise},
    {id: 'dhuhr', ...PRAYER_LABELS.dhuhr, time: todayTimes.dhuhr},
    {id: 'asr', ...PRAYER_LABELS.asr, time: todayTimes.asr},
    {id: 'maghrib', ...PRAYER_LABELS.maghrib, time: todayTimes.maghrib},
    {id: 'isha', ...PRAYER_LABELS.isha, time: todayTimes.isha},
  ];

  let nextPrayer: ComputedPrayerEntry | undefined = prayers.find(
    (p) => p.time.getTime() > now.getTime()
  );
  let previousPrayerTime = new Date(todayTimes.fajr.getTime() - 6 * 60 * 60 * 1000);

  if (nextPrayer) {
    const idx = prayers.findIndex((p) => p.id === nextPrayer!.id);
    if (idx > 0) {
      previousPrayerTime = prayers[idx - 1].time;
    } else {
      const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayTimes = new PrayerTimes(coords, yesterdayDate, params);
      previousPrayerTime = yesterdayTimes.isha;
    }
  } else {
    nextPrayer = {
      id: 'fajr',
      ...PRAYER_LABELS.fajr,
      time: tomorrowTimes.fajr,
    };
    previousPrayerTime = todayTimes.isha;
  }

  const qiblaBearing = Qibla(coords);
  const distanceToKaabaKm = haversineDistanceKm(
    location.latitude,
    location.longitude,
    KAABA_COORDS.latitude,
    KAABA_COORDS.longitude
  );

  return {
    prayers,
    nextPrayer,
    previousPrayerTime,
    qiblaBearing,
    distanceToKaabaKm,
  };
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatPrayerTime(date: Date): string {
  return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

export function formatCountdown(ms: number): string {
  const clamped = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
}

export function formatHijriDate(date: Date = new Date()): {en: string; ar: string} {
  try {
    const en = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    const ar = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    return {en, ar};
  } catch {
    return {
      en: date.toLocaleDateString('en-US', {month: 'long', day: 'numeric', year: 'numeric'}),
      ar: date.toLocaleDateString('ar-SA'),
    };
  }
}

export function getCardinalDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const idx = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return dirs[idx];
}
