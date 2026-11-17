import type {QuranAyah, QuranBookmark} from '../types/hasanat';

const STORAGE_KEY = 'hasanat_quran_bookmarks_v1';

export function loadBookmarks(): QuranBookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QuranBookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(list: QuranBookmark[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota errors
  }
}

export function togglePageBookmark(
  current: QuranBookmark[],
  pageNumber: number,
  surahName?: string,
  surahArabicName?: string
): {next: QuranBookmark[]; added: boolean} {
  const id = `page:${pageNumber}`;
  const exists = current.some((b) => b.id === id);
  if (exists) {
    const next = current.filter((b) => b.id !== id);
    saveBookmarks(next);
    return {next, added: false};
  }
  const bookmark: QuranBookmark = {
    id,
    type: 'page',
    pageNumber,
    surahName: surahName ?? `Page ${pageNumber}`,
    surahArabicName,
    createdAt: Date.now(),
  };
  const next = [bookmark, ...current];
  saveBookmarks(next);
  return {next, added: true};
}

export function toggleVerseBookmark(
  current: QuranBookmark[],
  ayah: QuranAyah
): {next: QuranBookmark[]; added: boolean} {
  const id = `verse:${ayah.number}`;
  const exists = current.some((b) => b.id === id);
  if (exists) {
    const next = current.filter((b) => b.id !== id);
    saveBookmarks(next);
    return {next, added: false};
  }
  const bookmark: QuranBookmark = {
    id,
    type: 'verse',
    pageNumber: ayah.page,
    surahNumber: ayah.surah.number,
    surahName: ayah.surah.englishName,
    surahArabicName: ayah.surah.name,
    ayahNumberInSurah: ayah.numberInSurah,
    globalAyahNumber: ayah.number,
    excerpt: ayah.text.slice(0, 90),
    createdAt: Date.now(),
  };
  const next = [bookmark, ...current];
  saveBookmarks(next);
  return {next, added: true};
}
