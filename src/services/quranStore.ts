import {STARTER_MUSHAF_PAGES, getAyahAudioUrl} from '../data/quranMeta';
import type {MushafPageData, QuranAyah} from '../types/hasanat';

const DB_NAME = 'hasanat-quran-db';
const DB_VERSION = 1;
const STORE_PAGES = 'pages';
const AUDIO_CACHE_NAME = 'hasanat-quran-audio-v1';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PAGES)) {
        db.createObjectStore(STORE_PAGES, {keyPath: 'pageNumber'});
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getPageFromDB(pageNumber: number): Promise<MushafPageData | null> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_PAGES, 'readonly');
      const store = tx.objectStore(STORE_PAGES);
      const req = store.get(pageNumber);
      req.onsuccess = () => resolve((req.result as MushafPageData) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function savePagesToDB(pages: MushafPageData[]): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_PAGES, 'readwrite');
      const store = tx.objectStore(STORE_PAGES);
      for (const page of pages) {
        store.put(page);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore storage quota or private-mode errors gracefully
  }
}

export async function getCachedPageCount(): Promise<number> {
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_PAGES, 'readonly');
      const store = tx.objectStore(STORE_PAGES);
      const req = store.count();
      req.onsuccess = () => resolve(req.result ?? 0);
      req.onerror = () => resolve(Object.keys(STARTER_MUSHAF_PAGES).length);
    });
  } catch {
    return Object.keys(STARTER_MUSHAF_PAGES).length;
  }
}

interface ApiAyahRaw {
  number: number;
  numberInSurah: number;
  text: string;
  page: number;
  juz: number;
  hizbQuarter: number;
  sajda: boolean | object;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    revelationType: string;
    numberOfAyahs: number;
  };
}

function normalizeAyah(raw: ApiAyahRaw): QuranAyah {
  return {
    number: raw.number,
    numberInSurah: raw.numberInSurah,
    text: raw.text,
    page: raw.page,
    juz: raw.juz,
    hizbQuarter: raw.hizbQuarter,
    sajda: Boolean(raw.sajda),
    surah: {
      number: raw.surah.number,
      name: raw.surah.name,
      englishName: raw.surah.englishName,
      englishNameTranslation: raw.surah.englishNameTranslation,
      revelationType: raw.surah.revelationType,
      numberOfAyahs: raw.surah.numberOfAyahs,
    },
  };
}

export async function getMushafPage(pageNumber: number): Promise<MushafPageData> {
  const safePage = Math.max(1, Math.min(604, pageNumber));

  // 1. Check IndexedDB
  const dbPage = await getPageFromDB(safePage);
  if (dbPage && dbPage.ayahs.length > 0) {
    return dbPage;
  }

  // 2. Fetch from AlQuran Cloud API if online
  try {
    const res = await fetch(`https://api.alquran.cloud/v1/page/${safePage}/quran-uthmani`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as {
      code: number;
      data?: {number: number; ayahs: ApiAyahRaw[]};
    };
    if (json.code === 200 && json.data?.ayahs?.length) {
      const ayahs = json.data.ayahs.map(normalizeAyah);
      const pageData: MushafPageData = {
        pageNumber: safePage,
        ayahs,
        juz: ayahs[0].juz,
        hizbQuarter: ayahs[0].hizbQuarter,
        cachedAt: Date.now(),
      };
      await savePagesToDB([pageData]);
      return pageData;
    }
  } catch {
    // Fallback below if offline
  }

  // 3. Fallback to bundled starter pages if offline
  if (STARTER_MUSHAF_PAGES[safePage]) {
    return STARTER_MUSHAF_PAGES[safePage];
  }

  throw new Error('This Mushaf page has not been downloaded for offline viewing yet.');
}

export async function downloadFullQuranOffline(
  onProgress?: (percent: number, label: string) => void
): Promise<number> {
  onProgress?.(10, 'Connecting to Uthmani Mushaf archive...');
  const res = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
  if (!res.ok) {
    throw new Error('Unable to download full Quran. Check your internet connection.');
  }
  onProgress?.(45, 'Parsing 6,236 Ayahs across 604 pages...');
  const json = (await res.json()) as {
    code: number;
    data?: {
      surahs: Array<{
        number: number;
        name: string;
        englishName: string;
        englishNameTranslation: string;
        revelationType: string;
        ayahs: Array<{
          number: number;
          numberInSurah: number;
          text: string;
          page: number;
          juz: number;
          hizbQuarter: number;
          sajda: boolean | object;
        }>;
      }>;
    };
  };

  if (json.code !== 200 || !json.data?.surahs) {
    throw new Error('Unexpected response while downloading Mushaf.');
  }

  const pageMap = new Map<number, QuranAyah[]>();
  for (const surah of json.data.surahs) {
    const ayahTotal = surah.ayahs.length;
    for (const a of surah.ayahs) {
      const list = pageMap.get(a.page) ?? [];
      list.push({
        number: a.number,
        numberInSurah: a.numberInSurah,
        text: a.text,
        page: a.page,
        juz: a.juz,
        hizbQuarter: a.hizbQuarter,
        sajda: Boolean(a.sajda),
        surah: {
          number: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
          revelationType: surah.revelationType,
          numberOfAyahs: ayahTotal,
        },
      });
      pageMap.set(a.page, list);
    }
  }

  onProgress?.(75, 'Saving 604 Mushaf pages to offline storage...');
  const allPages: MushafPageData[] = [];
  for (let p = 1; p <= 604; p++) {
    const ayahs = pageMap.get(p) ?? [];
    if (ayahs.length > 0) {
      allPages.push({
        pageNumber: p,
        ayahs,
        juz: ayahs[0].juz,
        hizbQuarter: ayahs[0].hizbQuarter,
        cachedAt: Date.now(),
      });
    }
  }

  await savePagesToDB(allPages);
  onProgress?.(100, 'All 604 Mushaf pages ready offline.');
  return allPages.length;
}

export async function cachePageAudioOffline(
  ayahNumbers: number[],
  everyAyahFolder: string,
  onProgress?: (done: number, total: number) => void
): Promise<number> {
  if (typeof caches === 'undefined') return 0;
  const cache = await caches.open(AUDIO_CACHE_NAME);
  let cachedCount = 0;
  for (let i = 0; i < ayahNumbers.length; i++) {
    const url = getAyahAudioUrl(everyAyahFolder, ayahNumbers[i]);
    try {
      const existing = await cache.match(url);
      if (!existing) {
        const res = await fetch(url, {mode: 'cors'});
        if (res.ok) {
          await cache.put(url, res);
        }
      }
      cachedCount++;
    } catch {
      // Skip failed individual fetch
    }
    onProgress?.(i + 1, ayahNumbers.length);
  }
  return cachedCount;
}

export async function getCachedAudioBlobUrl(
  everyAyahFolder: string,
  globalAyahNumber: number
): Promise<string | null> {
  const url = getAyahAudioUrl(everyAyahFolder, globalAyahNumber);
  if (typeof caches === 'undefined') return null;
  try {
    const cache = await caches.open(AUDIO_CACHE_NAME);
    const match = await cache.match(url);
    if (match) {
      const blob = await match.blob();
      return URL.createObjectURL(blob);
    }
  } catch {
    // ignore
  }
  return null;
}
