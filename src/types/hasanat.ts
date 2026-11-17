export type AppTab = 'quran' | 'game' | 'prayers' | 'qibla' | 'adhkar';

export type AppLocale = 'en' | 'ar';

export type PrayerId = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export type AlertTone =
  | 'adhan_chime'
  | 'takbir_chime'
  | 'golden_bell'
  | 'fajr_dawn'
  | 'silent';

export type CalculationMethodId =
  | 'UmmAlQura'
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'NorthAmerica'
  | 'Karachi'
  | 'Dubai'
  | 'Kuwait'
  | 'Qatar';

export type MadhabId = 'shafi' | 'hanafi';

export interface UserLocation {
  name: string;
  arabicName: string;
  country: string;
  latitude: number;
  longitude: number;
  source: 'gps' | 'city' | 'custom';
}

export interface PrayerNotificationConfig {
  enabled: boolean;
  atAdhanTime: boolean; // Notify right when prayer enters
  preReminderMinutes: number; // 0 = off, or 5/10/15/20/30 minutes before prayer time
  snoozeMinutes: number; // 3/5/10/15 minutes snooze duration
  tone: AlertTone;
  customMessage: string;
}

export type PrayerAlertSettings = Record<PrayerId, PrayerNotificationConfig>;

export interface DhikrReminderConfig {
  id: 'morning' | 'evening' | 'sleep' | 'kahf';
  title: string;
  arabicTitle: string;
  enabled: boolean;
  time: string; // HH:MM 24h
  tone: AlertTone;
  message: string;
}

export interface SheikhReciter {
  id: string;
  name: string;
  arabicName: string;
  style: string;
  arabicStyle: string;
  everyAyahFolder: string;
}

export interface QuranAyah {
  number: number; // Global ayah number 1..6236
  numberInSurah: number;
  text: string;
  page: number;
  juz: number;
  hizbQuarter: number;
  sajda: boolean;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: 'Meccan' | 'Medinan' | string;
    numberOfAyahs: number;
  };
}

export interface MushafPageData {
  pageNumber: number;
  ayahs: QuranAyah[];
  juz: number;
  hizbQuarter: number;
  cachedAt: number;
  isBundled?: boolean;
}

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: 'Meccan' | 'Medinan';
  ayahCount: number;
  startPage: number;
  juz: number;
}

export type TafsirScholarId =
  | 'en-ibn-kathir'
  | 'ar-ibn-kathir'
  | 'ar-muyassar'
  | 'ar-jalalayn'
  | 'en-sahih';

export interface TafsirEntry {
  key: string; // `${scholarId}:${surah}:${ayah}`
  scholarId: TafsirScholarId;
  surahNumber: number;
  ayahNumber: number;
  text: string;
  cachedAt: number;
}

export interface QuranBookmark {
  id: string;
  type: 'page' | 'verse';
  pageNumber: number;
  surahNumber?: number;
  surahName?: string;
  surahArabicName?: string;
  ayahNumberInSurah?: number;
  globalAyahNumber?: number;
  excerpt?: string;
  note?: string;
  createdAt: number;
}

export interface AdhkarItem {
  id: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference: string;
  repeat: number;
}

export type AdhkarCategoryId = 'morning' | 'evening' | 'after_salah' | 'sleep' | 'duas';

export interface AdhkarCategory {
  id: AdhkarCategoryId;
  title: string;
  arabicTitle: string;
  subtitle: string;
  items: AdhkarItem[];
}

export interface InAppAlertBanner {
  id: string;
  title: string;
  arabicTitle?: string;
  body: string;
  timestamp: number;
  tone?: AlertTone;
  snoozeMinutes?: number;
  prayerId?: PrayerId;
}
