import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Bookmark,
  BookOpen,
  BookText,
  ChevronLeft,
  ChevronRight,
  Download,
  HardDriveDownload,
  List,
  Lock,
  Pause,
  Play,
  Repeat,
  Search,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  X,
} from 'lucide-react';
import {
  JUZ_START_PAGES,
  SHEIKHS,
  SURAH_LIST,
  getAyahAudioUrl,
  globalAyahToSurahAyah,
  toArabicIndic,
} from '../data/quranMeta';
import {
  loadBookmarks,
  saveBookmarks,
  togglePageBookmark,
  toggleVerseBookmark,
} from '../services/bookmarkStore';
import {
  cachePageAudioOffline,
  downloadFullQuranOffline,
  getCachedAudioBlobUrl,
  getCachedPageCount,
  getMushafPage,
} from '../services/quranStore';
import {TAFSIR_SCHOLARS, getVerseTafsir} from '../services/tafsirService';
import type {
  MushafPageData,
  QuranAyah,
  QuranBookmark,
  SheikhReciter,
  TafsirScholarId,
} from '../types/hasanat';

interface QuranMushafProps {
  isOnline: boolean;
  selectedSheikh: SheikhReciter;
  onChangeSheikh: (sheikh: SheikhReciter) => void;
  onHasanatEarned?: (points: number) => void;
}

const BISMILLAH_PREFIX = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';

function stripLeadingBismillah(ayah: QuranAyah): string {
  if (ayah.numberInSurah === 1 && ayah.surah.number !== 1 && ayah.surah.number !== 9) {
    const trimmed = ayah.text.trim();
    if (trimmed.startsWith(BISMILLAH_PREFIX)) {
      const rest = trimmed.slice(BISMILLAH_PREFIX.length).trim();
      return rest.length > 0 ? rest : trimmed;
    }
  }
  return ayah.text;
}

export const QuranMushaf: React.FC<QuranMushafProps> = ({
  isOnline,
  selectedSheikh,
  onChangeSheikh,
  onHasanatEarned,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(() => {
    const saved = localStorage.getItem('hasanat_mushaf_page');
    const parsed = saved ? parseInt(saved, 10) : 1;
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 604 ? parsed : 1;
  });
  const [pageData, setPageData] = useState<MushafPageData | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAyahNumber, setActiveAyahNumber] = useState<number | null>(null);
  const [inspectedAyah, setInspectedAyah] = useState<QuranAyah | null>(null);
  const [recitingPage, setRecitingPage] = useState<number | null>(null);
  const [autoFollowPage, setAutoFollowPage] = useState(true);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'three'>('none');
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');

  const [showIndexDrawer, setShowIndexDrawer] = useState(false);
  const [indexTab, setIndexTab] = useState<'surah' | 'juz'>('surah');
  const [surahQuery, setSurahQuery] = useState('');
  const [pageJumpInput, setPageJumpInput] = useState('');

  // Tafsir state
  const [showTafsirModal, setShowTafsirModal] = useState(false);
  const [tafsirScholar, setTafsirScholar] = useState<TafsirScholarId>(() => {
    return (localStorage.getItem('hasanat_tafsir_scholar') as TafsirScholarId) || 'en-ibn-kathir';
  });
  const [tafsirText, setTafsirText] = useState<string>('');
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [tafsirError, setTafsirError] = useState<string | null>(null);

  // Bookmarks state
  const [bookmarks, setBookmarks] = useState<QuranBookmark[]>(() => loadBookmarks());
  const [showAllBookmarks, setShowAllBookmarks] = useState(false);

  const [cachedPageCount, setCachedPageCount] = useState<number>(0);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{percent: number; label: string} | null>(null);
  const [cachingPageAudio, setCachingPageAudio] = useState(false);
  const [audioStatusMsg, setAudioStatusMsg] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const repeatCounterRef = useRef<number>(0);
  const activeAyahRef = useRef<HTMLSpanElement | null>(null);
  const playAyahByNumberRef = useRef<(globalAyah: number, ayahMeta?: QuranAyah, targetPageHint?: number) => void>(() => {});

  const refreshCachedCount = useCallback(async () => {
    const count = await getCachedPageCount();
    setCachedPageCount(count);
  }, []);

  useEffect(() => {
    refreshCachedCount();
  }, [refreshCachedCount]);

  useEffect(() => {
    localStorage.setItem('hasanat_tafsir_scholar', tafsirScholar);
  }, [tafsirScholar]);

  // Load Mushaf page whenever currentPage changes
  useEffect(() => {
    let cancelled = false;
    setLoadingPage(true);
    setPageError(null);
    localStorage.setItem('hasanat_mushaf_page', String(currentPage));

    getMushafPage(currentPage)
      .then((data) => {
        if (!cancelled) {
          setPageData(data);
          setLoadingPage(false);
          setInspectedAyah((prev) => {
            if (prev && data.ayahs.some((a) => a.number === prev.number)) {
              return prev;
            }
            return data.ayahs[0] ?? null;
          });
          refreshCachedCount();
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setPageError(
            err instanceof Error ? err.message : 'Unable to load this page while offline.'
          );
          setLoadingPage(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentPage, refreshCachedCount]);

  // Load Tafsir automatically when Tafsir panel is open or inspectedAyah changes
  const activeTafsirAyah = useMemo(() => {
    if (inspectedAyah) return inspectedAyah;
    if (activeAyahNumber && pageData) {
      return pageData.ayahs.find((a) => a.number === activeAyahNumber) ?? pageData.ayahs[0] ?? null;
    }
    return pageData?.ayahs[0] ?? null;
  }, [activeAyahNumber, inspectedAyah, pageData]);

  useEffect(() => {
    if (!showTafsirModal || !activeTafsirAyah) return;
    let cancelled = false;
    setTafsirLoading(true);
    setTafsirError(null);

    getVerseTafsir(
      tafsirScholar,
      activeTafsirAyah.surah.number,
      activeTafsirAyah.numberInSurah
    )
      .then((entry) => {
        if (!cancelled) {
          setTafsirText(entry.text);
          setTafsirLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setTafsirError(err instanceof Error ? err.message : 'Tafsir unavailable.');
          setTafsirLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeTafsirAyah, showTafsirModal, tafsirScholar]);

  useEffect(() => {
    if (activeAyahRef.current) {
      activeAyahRef.current.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
  }, [activeAyahNumber, currentPage]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Initialize HTML5 Audio elements
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const preload = new Audio();
    preload.preload = 'auto';
    preloadAudioRef.current = preload;

    return () => {
      audio.pause();
      audio.src = '';
      preload.src = '';
    };
  }, []);

  // Synchronous-first playback so browser autoplay never blocks Sheikh audio
  const playAyahByNumber = useCallback(
    (globalAyah: number, ayahMeta?: QuranAyah, targetPageHint?: number) => {
      if (globalAyah < 1 || globalAyah > 6236) {
        setIsPlaying(false);
        setActiveAyahNumber(null);
        return;
      }

      const audio = audioRef.current;
      if (!audio) return;

      setAudioStatusMsg(null);
      setActiveAyahNumber(globalAyah);
      setIsPlaying(true);

      const matchingAyah = ayahMeta ?? pageData?.ayahs.find((a) => a.number === globalAyah);
      if (matchingAyah) {
        setInspectedAyah(matchingAyah);
        setRecitingPage(matchingAyah.page);
        if (autoFollowPage && currentPage !== matchingAyah.page) {
          setCurrentPage(matchingAyah.page);
        }
      } else if (targetPageHint) {
        setRecitingPage(targetPageHint);
        if (autoFollowPage && currentPage !== targetPageHint) {
          setCurrentPage(targetPageHint);
        }
      }

      const resolved = matchingAyah
        ? {surahNumber: matchingAyah.surah.number, ayahNumber: matchingAyah.numberInSurah}
        : globalAyahToSurahAyah(globalAyah);

      const networkUrl = getAyahAudioUrl(
        selectedSheikh.everyAyahFolder,
        globalAyah,
        resolved.surahNumber,
        resolved.ayahNumber
      );

      // Start playback immediately from networkUrl when online to preserve user gesture!
      if (isOnline) {
        audio.src = networkUrl;
        audio.playbackRate = playbackRate;
        audio.play().then(
          () => {
            onHasanatEarned?.(10);
            if (globalAyah < 6236 && preloadAudioRef.current) {
              preloadAudioRef.current.src = getAyahAudioUrl(
                selectedSheikh.everyAyahFolder,
                globalAyah + 1
              );
            }
          },
          () => {
            // Try offline cache if network fails
            getCachedAudioBlobUrl(selectedSheikh.everyAyahFolder, globalAyah).then((blobUrl) => {
              if (blobUrl) {
                audio.src = blobUrl;
                audio.playbackRate = playbackRate;
                audio.play().catch(() => {
                  setIsPlaying(false);
                  setAudioStatusMsg('Tap Play again to resume audio recitation.');
                });
              } else {
                setIsPlaying(false);
                setAudioStatusMsg('Tap Play to start audio recitation.');
              }
            });
          }
        );
      } else {
        // Offline: read cached Blob URL
        getCachedAudioBlobUrl(selectedSheikh.everyAyahFolder, globalAyah).then((blobUrl) => {
          if (!blobUrl) {
            setIsPlaying(false);
            setAudioStatusMsg('Offline mode: save this page’s audio while online first.');
            return;
          }
          audio.src = blobUrl;
          audio.playbackRate = playbackRate;
          audio.play().then(
            () => onHasanatEarned?.(10),
            () => setIsPlaying(false)
          );
        });
      }
    },
    [
      autoFollowPage,
      currentPage,
      isOnline,
      onHasanatEarned,
      pageData,
      playbackRate,
      selectedSheikh.everyAyahFolder,
    ]
  );

  useEffect(() => {
    playAyahByNumberRef.current = playAyahByNumber;
  }, [playAyahByNumber]);

  // Auto-advance & Auto-Page-Follow on Ayah end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = async () => {
      if (activeAyahNumber === null) return;

      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
        return;
      }
      if (repeatMode === 'three' && repeatCounterRef.current < 2) {
        repeatCounterRef.current += 1;
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
        return;
      }
      repeatCounterRef.current = 0;

      const nextGlobal = activeAyahNumber + 1;
      if (nextGlobal > 6236) {
        setIsPlaying(false);
        setActiveAyahNumber(null);
        return;
      }

      const onCurrentPage = pageData?.ayahs.find((a) => a.number === nextGlobal);
      if (onCurrentPage) {
        playAyahByNumberRef.current(nextGlobal, onCurrentPage, onCurrentPage.page);
        return;
      }

      // Transition to the next Mushaf page!
      const nextPageNum = Math.min(604, (recitingPage ?? currentPage) + 1);
      if (autoFollowPage && nextPageNum !== currentPage) {
        setCurrentPage(nextPageNum);
      }
      setRecitingPage(nextPageNum);

      try {
        const nextData = await getMushafPage(nextPageNum);
        const found = nextData.ayahs.find((a) => a.number === nextGlobal);
        const resolvedPage = found ? found.page : nextPageNum;
        if (autoFollowPage && resolvedPage !== currentPage) {
          setCurrentPage(resolvedPage);
        }
        setRecitingPage(resolvedPage);
        playAyahByNumberRef.current(nextGlobal, found, resolvedPage);
      } catch {
        playAyahByNumberRef.current(nextGlobal, undefined, nextPageNum);
      }
    };

    const handleError = () => {
      setIsPlaying(false);
      setAudioStatusMsg(
        isOnline
          ? 'Unable to load verse audio. Try switching reciter or retry.'
          : 'Offline mode: cache this page’s audio while online for offline playback.'
      );
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [activeAyahNumber, autoFollowPage, currentPage, isOnline, pageData, recitingPage, repeatMode]);

  // Keyboard page navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === 'ArrowRight') {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentPage((p) => Math.min(604, p + 1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleTogglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    if (activeAyahNumber !== null && audio.src) {
      audio.play().then(
        () => setIsPlaying(true),
        () => playAyahByNumber(activeAyahNumber, inspectedAyah ?? undefined, recitingPage ?? currentPage)
      );
      return;
    }

    const startAyah = inspectedAyah ?? pageData?.ayahs[0];
    if (startAyah) {
      repeatCounterRef.current = 0;
      playAyahByNumber(startAyah.number, startAyah, startAyah.page);
    }
  };

  const handlePrevAyah = () => {
    if (activeAyahNumber && activeAyahNumber > 1) {
      repeatCounterRef.current = 0;
      const prev = activeAyahNumber - 1;
      const found = pageData?.ayahs.find((a) => a.number === prev);
      const targetPage = found ? found.page : Math.max(1, currentPage - 1);
      playAyahByNumber(prev, found, targetPage);
    } else if (pageData?.ayahs[0]) {
      playAyahByNumber(pageData.ayahs[0].number, pageData.ayahs[0], pageData.ayahs[0].page);
    }
  };

  const handleNextAyah = () => {
    if (activeAyahNumber && activeAyahNumber < 6236) {
      repeatCounterRef.current = 0;
      const next = activeAyahNumber + 1;
      const found = pageData?.ayahs.find((a) => a.number === next);
      const targetPage = found ? found.page : Math.min(604, currentPage + 1);
      playAyahByNumber(next, found, targetPage);
    } else if (pageData?.ayahs[0]) {
      playAyahByNumber(pageData.ayahs[0].number, pageData.ayahs[0], pageData.ayahs[0].page);
    }
  };

  const handleSheikhChange = (sheikhId: string) => {
    const nextSheikh = SHEIKHS.find((s) => s.id === sheikhId);
    if (!nextSheikh) return;
    onChangeSheikh(nextSheikh);
    if (isPlaying && activeAyahNumber !== null && audioRef.current) {
      const audio = audioRef.current;
      const resolved = globalAyahToSurahAyah(activeAyahNumber);
      audio.src = getAyahAudioUrl(
        nextSheikh.everyAyahFolder,
        activeAyahNumber,
        resolved.surahNumber,
        resolved.ayahNumber
      );
      audio.playbackRate = playbackRate;
      audio.play().catch(() => setIsPlaying(false));
    }
  };

  const handleDownloadFullQuran = async () => {
    if (downloadingAll) return;
    setDownloadingAll(true);
    setDownloadProgress({percent: 5, label: 'Preparing offline Mushaf archive...'});
    try {
      await downloadFullQuranOffline((percent, label) => {
        setDownloadProgress({percent, label});
      });
      await refreshCachedCount();
    } catch (err) {
      setDownloadProgress({
        percent: 0,
        label: err instanceof Error ? err.message : 'Download failed. Please retry online.',
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleCacheCurrentPageAudio = async () => {
    if (!pageData || cachingPageAudio) return;
    setCachingPageAudio(true);
    setAudioStatusMsg('Saving page audio for offline playback...');
    const count = await cachePageAudioOffline(
      pageData.ayahs.map((a) => a.number),
      selectedSheikh.everyAyahFolder
    );
    setCachingPageAudio(false);
    setAudioStatusMsg(
      count > 0
        ? `Cached ${count} verses (${selectedSheikh.name}) for offline listening.`
        : 'Unable to cache audio offline.'
    );
  };

  const filteredSurahs = useMemo(() => {
    const q = surahQuery.trim().toLowerCase();
    if (!q) return SURAH_LIST;
    return SURAH_LIST.filter(
      (s) =>
        s.englishName.toLowerCase().includes(q) ||
        s.englishNameTranslation.toLowerCase().includes(q) ||
        s.name.includes(surahQuery.trim()) ||
        String(s.number) === q
    );
  }, [surahQuery]);

  const surahSectionsOnPage = useMemo(() => {
    if (!pageData) return [];
    const groups: {surah: QuranAyah['surah']; ayahs: QuranAyah[]}[] = [];
    for (const ayah of pageData.ayahs) {
      const last = groups[groups.length - 1];
      if (!last || last.surah.number !== ayah.surah.number) {
        groups.push({surah: ayah.surah, ayahs: [ayah]});
      } else {
        last.ayahs.push(ayah);
      }
    }
    return groups;
  }, [pageData]);

  const primarySurah = surahSectionsOnPage[0]?.surah;
  const activeAyahObj = useMemo(() => {
    if (activeAyahNumber) {
      return pageData?.ayahs.find((a) => a.number === activeAyahNumber) ?? inspectedAyah;
    }
    return inspectedAyah;
  }, [activeAyahNumber, inspectedAyah, pageData]);

  const isCurrentPageBookmarked = bookmarks.some((b) => b.id === `page:${currentPage}`);
  const isSelectedVerseBookmarked = activeAyahObj
    ? bookmarks.some((b) => b.id === `verse:${activeAyahObj.number}`)
    : false;

  const handleTogglePageBookmark = () => {
    const {next} = togglePageBookmark(
      bookmarks,
      currentPage,
      primarySurah?.englishName,
      primarySurah?.name
    );
    setBookmarks(next);
  };

  const handleToggleVerseBookmark = (ayah: QuranAyah) => {
    const {next} = toggleVerseBookmark(bookmarks, ayah);
    setBookmarks(next);
  };

  const handleOpenBookmark = (bm: QuranBookmark) => {
    setCurrentPage(bm.pageNumber);
    if (bm.type === 'verse' && bm.globalAyahNumber) {
      setActiveAyahNumber(bm.globalAyahNumber);
    }
    setShowAllBookmarks(false);
  };

  const handleDeleteBookmark = (id: string) => {
    const next = bookmarks.filter((b) => b.id !== id);
    setBookmarks(next);
    saveBookmarks(next);
  };

  const handleStepTafsirVerse = (delta: -1 | 1) => {
    if (!pageData || !activeTafsirAyah) return;
    const idx = pageData.ayahs.findIndex((a) => a.number === activeTafsirAyah.number);
    const nextIdx = idx + delta;
    if (nextIdx >= 0 && nextIdx < pageData.ayahs.length) {
      setInspectedAyah(pageData.ayahs[nextIdx]);
    }
  };

  const arabicTextSizeClass =
    fontScale === 'sm'
      ? 'text-[1.45rem] leading-[2.45]'
      : fontScale === 'md'
        ? 'text-[1.7rem] leading-[2.55]'
        : fontScale === 'lg'
          ? 'text-[1.95rem] md:text-[2.15rem] leading-[2.65]'
          : 'text-[2.3rem] md:text-[2.5rem] leading-[2.75]';

  const currentScholarInfo =
    TAFSIR_SCHOLARS.find((s) => s.id === tafsirScholar) ?? TAFSIR_SCHOLARS[0];

  return (
    <div className="space-y-6">
      {/* Top Workspace Control Bar: Surah Index, Sheikh Selector, Offline Download */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5 bg-[#12100C] border border-[#2B251A] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setShowIndexDrawer(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] text-xs font-medium text-[#F5EFE2] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <List className="w-4 h-4 text-[#D4AF37]" />
              <span>Surahs &amp; Juz</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTafsirModal(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#D4AF37]/40 text-xs font-medium text-[#E8CA68] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <BookText className="w-4 h-4 text-[#D4AF37]" />
              <span>Tafsir</span>
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const num = parseInt(pageJumpInput, 10);
              if (Number.isFinite(num) && num >= 1 && num <= 604) {
                setCurrentPage(num);
                setPageJumpInput('');
              }
            }}
            className="flex items-center gap-2"
          >
            <input
              type="number"
              min={1}
              max={604}
              value={pageJumpInput}
              onChange={(e) => setPageJumpInput(e.target.value)}
              placeholder="Page #"
              aria-label="Jump to Mushaf page number"
              className="w-20 min-h-[44px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-xs font-mono-tabular text-[#F5EFE2] placeholder-[#8B816E] focus:outline-none focus:border-[#D4AF37]"
            />
            <button
              type="submit"
              className="min-h-[44px] px-3 rounded-xl border border-[#2B251A] hover:border-[#D4AF37]/60 text-xs font-medium text-[#E8CA68] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Go
            </button>
          </form>
        </div>

        {/* Center/Right: Sheikh Reciter & Sync Controls */}
        <div className="lg:col-span-7 bg-[#12100C] border border-[#2B251A] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-[220px]">
            <div className="w-10 h-10 rounded-xl bg-[#1A1711] border border-[#2B251A] flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div className="flex-1 min-w-0">
              <label htmlFor="sheikh-select" className="block text-xs text-[#8B816E] mb-0.5">
                Reciter (الشيخ القارئ)
              </label>
              <select
                id="sheikh-select"
                value={selectedSheikh.id}
                onChange={(e) => handleSheikhChange(e.target.value)}
                className="w-full bg-[#090806] border border-[#2B251A] rounded-lg px-2.5 py-1.5 text-sm text-[#F5EFE2] focus:outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                {SHEIKHS.map((sheikh) => (
                  <option key={sheikh.id} value={sheikh.id}>
                    {sheikh.arabicName} — {sheikh.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setAutoFollowPage((v) => !v)}
              className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                autoFollowPage
                  ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#E8CA68]'
                  : 'bg-[#1A1711] border-[#2B251A] text-[#C7BDA8]'
              }`}
              title="Automatically turn Mushaf pages as the Sheikh recites"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{autoFollowPage ? 'Auto-Follow Page' : 'Auto-Follow Off'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFullQuran}
              disabled={downloadingAll || !isOnline || cachedPageCount >= 604}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-[#1A1711] hover:bg-[#242018] disabled:opacity-60 border border-[#2B251A] text-xs font-medium text-[#F5EFE2] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>
                {cachedPageCount >= 604
                  ? '604 Pages Offline'
                  : downloadingAll
                    ? 'Downloading...'
                    : `Save 604 Pages (${cachedPageCount}/604)`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Visible Saved Bookmarks Bar directly on Main Quran Screen */}
      {bookmarks.length > 0 && (
        <div className="bg-[#12100C] border border-[#2B251A] rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <span className="text-xs font-medium text-[#D4AF37] flex items-center gap-1.5 shrink-0">
              <Bookmark className="w-3.5 h-3.5 fill-current" />
              <span>Bookmarks ({bookmarks.length})</span>
            </span>
            {bookmarks.slice(0, 4).map((bm) => (
              <button
                key={bm.id}
                type="button"
                onClick={() => handleOpenBookmark(bm)}
                className="min-h-[34px] px-3 py-1 rounded-lg bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] text-xs text-[#F5EFE2] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span className="text-[#E8CA68]">
                  {bm.type === 'verse'
                    ? `${bm.surahName} ${bm.surahNumber}:${bm.ayahNumberInSurah}`
                    : `${bm.surahName ?? 'Page'} · p.${bm.pageNumber}`}
                </span>
              </button>
            ))}
          </div>

          {bookmarks.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllBookmarks(true)}
              className="text-xs text-[#E8CA68] hover:underline cursor-pointer shrink-0"
            >
              View All ({bookmarks.length})
            </button>
          )}
        </div>
      )}

      {/* Offline Bulk Download Progress */}
      {downloadProgress && (
        <div className="bg-[#12100C] border border-[#D4AF37]/40 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#E8CA68] font-medium">{downloadProgress.label}</span>
            <span className="font-mono-tabular text-[#C7BDA8]">{downloadProgress.percent}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#1A1711] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4AF37] transition-all duration-300"
              style={{width: `${downloadProgress.percent}%`}}
            />
          </div>
        </div>
      )}

      {/* Main Layout: Ornate Mushaf Page (Left/Center) + Sticky Recitation, Tafsir & Bookmarks Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ornate Dark-Gold Mushaf Page Canvas */}
        <div className="lg:col-span-8 bg-[#12100C] border border-[#2B251A] rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl shadow-black/50">
          <div className="border border-[#D4AF37]/30 rounded-2xl p-4 sm:p-6 md:p-8 bg-[#0E0C09] relative">
            {/* Top Page Metadata & Page Bookmark Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-[#2B251A] text-xs text-[#C7BDA8]">
              <div className="flex items-center gap-2 font-arabic text-base text-[#E8CA68]">
                <span>{primarySurah ? primarySurah.name : 'القرآن الكريم'}</span>
              </div>

              <div className="flex flex-wrap items-center gap-3 tabular-nums text-[#8B816E]">
                <span>Juz {pageData?.juz ?? 1}</span>
                <span aria-hidden="true">·</span>
                <span>Page {currentPage} of 604</span>
                <button
                  type="button"
                  onClick={handleTogglePageBookmark}
                  className={`min-h-[34px] px-3 py-1 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isCurrentPageBookmarked
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#E8CA68]'
                      : 'bg-[#1A1711] border-[#2B251A] text-[#C7BDA8] hover:text-[#F5EFE2]'
                  }`}
                >
                  <Bookmark
                    className={`w-3.5 h-3.5 ${isCurrentPageBookmarked ? 'fill-current' : ''}`}
                  />
                  <span>{isCurrentPageBookmarked ? 'Page Saved' : 'Bookmark Page'}</span>
                </button>
              </div>
            </div>

            {/* Return to Reciter Banner if user manually flipped away */}
            {isPlaying && recitingPage !== null && recitingPage !== currentPage && (
              <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#1A1711] border border-[#D4AF37]/40">
                <span className="text-xs text-[#E8CA68]">
                  {selectedSheikh.name} is reciting on Page {recitingPage}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(recitingPage)}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-[#D4AF37] text-[#090806] text-xs font-semibold hover:bg-[#E8CA68] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Jump to Page {recitingPage}
                </button>
              </div>
            )}

            {/* Page Body */}
            {loadingPage ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-[#C7BDA8]">Opening Mushaf Page {currentPage}...</p>
              </div>
            ) : pageError ? (
              <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                <Lock className="w-8 h-8 text-[#D4AF37] mx-auto" />
                <h3 className="text-lg font-semibold text-[#F5EFE2]">Page {currentPage} Not Cached Yet</h3>
                <p className="text-sm text-[#8B816E]">
                  {pageError} Starter pages (1, 2, 604) are always bundled, and downloading the 604-page Mushaf while online makes every page permanently available offline.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-[#D4AF37] text-[#090806] text-xs font-semibold cursor-pointer"
                  >
                    Open Al-Fatihah (Page 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(604)}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-[#2B251A] text-xs font-medium text-[#F5EFE2] cursor-pointer"
                  >
                    Page 604
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-8" dir="rtl" lang="ar">
                {surahSectionsOnPage.map((group) => {
                  const startsHere = group.ayahs[0]?.numberInSurah === 1;
                  const showBismillah =
                    startsHere && group.surah.number !== 1 && group.surah.number !== 9;

                  return (
                    <section
                      key={`${group.surah.number}-${group.ayahs[0]?.number}`}
                      className="space-y-5"
                    >
                      {startsHere && (
                        <div className="border border-[#D4AF37]/45 bg-[#15120C] rounded-xl px-5 py-3.5 text-center space-y-1">
                          <div
                            className="flex items-center justify-between gap-4 text-xs text-[#8B816E]"
                            dir="ltr"
                          >
                            <span>{group.surah.revelationType}</span>
                            <span className="font-arabic text-2xl text-[#E8CA68] font-bold">
                              {group.surah.name}
                            </span>
                            <span className="tabular-nums">{group.surah.numberOfAyahs} Ayahs</span>
                          </div>
                          <div className="text-xs text-[#C7BDA8]" dir="ltr">
                            {group.surah.englishName} · {group.surah.englishNameTranslation}
                          </div>
                        </div>
                      )}

                      {showBismillah && (
                        <p className="text-center font-arabic text-2xl md:text-3xl text-[#E8CA68] py-1">
                          {BISMILLAH_PREFIX}
                        </p>
                      )}

                      <div
                        className={`font-arabic text-justify text-[#F5EFE2] ${arabicTextSizeClass}`}
                      >
                        {group.ayahs.map((ayah) => {
                          const isReciting = activeAyahNumber === ayah.number;
                          const isInspected = inspectedAyah?.number === ayah.number;
                          const isBookmarked = bookmarks.some((b) => b.id === `verse:${ayah.number}`);
                          const displayBody = stripLeadingBismillah(ayah);

                          return (
                            <span
                              key={ayah.number}
                              ref={isReciting ? activeAyahRef : undefined}
                              role="button"
                              tabIndex={0}
                              onClick={() => {
                                repeatCounterRef.current = 0;
                                setInspectedAyah(ayah);
                                playAyahByNumber(ayah.number, ayah, ayah.page);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  repeatCounterRef.current = 0;
                                  setInspectedAyah(ayah);
                                  playAyahByNumber(ayah.number, ayah, ayah.page);
                                }
                              }}
                              className={`inline cursor-pointer rounded-lg px-1 py-0.5 transition-colors duration-150 ${
                                isReciting
                                  ? 'bg-[#D4AF37]/20 text-[#F5DC84] ring-1 ring-[#D4AF37]/50'
                                  : isInspected
                                    ? 'bg-[#1D1911] ring-1 ring-[#2B251A]'
                                    : 'hover:bg-[#1E1A12]'
                              }`}
                              title={`${ayah.surah.englishName} ${ayah.surah.number}:${ayah.numberInSurah} — Click to recite & inspect`}
                            >
                              {displayBody}{' '}
                              <span
                                className={`inline-block mx-1 text-[0.78em] font-normal select-none ${
                                  isReciting || isBookmarked ? 'text-[#E8CA68]' : 'text-[#D4AF37]'
                                }`}
                              >
                                ﴿{toArabicIndic(ayah.numberInSurah)}﴾
                              </span>{' '}
                            </span>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}

            {/* Page Footer Navigation */}
            <div className="mt-8 pt-5 border-t border-[#2B251A] flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1A1711] hover:bg-[#242018] disabled:opacity-40 border border-[#2B251A] text-xs font-medium text-[#F5EFE2] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-[#D4AF37]" />
                <span>Previous Page</span>
              </button>

              <span className="font-arabic text-lg text-[#E8CA68] tabular-nums">
                {toArabicIndic(currentPage)} / ٦٠٤
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(604, p + 1))}
                disabled={currentPage >= 604}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1A1711] hover:bg-[#242018] disabled:opacity-40 border border-[#2B251A] text-xs font-medium text-[#F5EFE2] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Next Page</span>
                <ChevronRight className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Rail: Sheikh Audio Player, Verse Tafsir & Bookmarks */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          {/* Synchronized Audio Deck */}
          <div className="bg-[#12100C] border border-[#2B251A] rounded-2xl p-5 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#8B816E]">Synchronized Recitation</p>
                <h3 className="text-base font-semibold text-[#F5EFE2]">
                  {selectedSheikh.name}
                </h3>
                <p className="font-arabic text-base text-[#D4AF37]">{selectedSheikh.arabicName}</p>
              </div>
              <span className="text-xs text-[#8B816E] tabular-nums">
                {activeAyahObj
                  ? `${activeAyahObj.surah.englishName} ${activeAyahObj.surah.number}:${activeAyahObj.numberInSurah}`
                  : `Page ${currentPage}`}
              </span>
            </div>

            {/* Active / Selected Verse Preview & Immediate Tafsir + Bookmark Actions */}
            <div className="p-3.5 rounded-xl bg-[#090806] border border-[#2B251A] space-y-3">
              {activeAyahObj ? (
                <>
                  <p className="font-arabic text-lg text-[#F5DC84] line-clamp-2 text-right" dir="rtl">
                    {stripLeadingBismillah(activeAyahObj)}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-[#2B251A]">
                    <button
                      type="button"
                      onClick={() => setShowTafsirModal(true)}
                      className="flex-1 min-h-[38px] px-3 rounded-lg bg-[#1A1711] hover:bg-[#242018] border border-[#D4AF37]/40 text-xs font-medium text-[#E8CA68] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <BookText className="w-3.5 h-3.5" />
                      <span>Read Tafsir</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleVerseBookmark(activeAyahObj)}
                      className={`flex-1 min-h-[38px] px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelectedVerseBookmarked
                          ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#E8CA68]'
                          : 'bg-[#1A1711] border-[#2B251A] text-[#C7BDA8] hover:text-[#F5EFE2]'
                      }`}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 ${isSelectedVerseBookmarked ? 'fill-current' : ''}`}
                      />
                      <span>{isSelectedVerseBookmarked ? 'Verse Saved' : 'Save Verse'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-xs text-[#8B816E] text-center py-2">
                  Tap any verse on the Mushaf page or press Play to recite with automatic page-turning.
                </p>
              )}
            </div>

            {/* Primary Transport Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handlePrevAyah}
                aria-label="Previous Ayah"
                className="w-11 h-11 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] flex items-center justify-center text-[#F5EFE2] transition-colors cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? 'Pause Recitation' : 'Play Recitation'}
                className="h-12 px-7 rounded-xl bg-[#D4AF37] hover:bg-[#E8CA68] text-[#090806] font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-[#D4AF37]/15 cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause' : 'Recite Page'}</span>
              </button>

              <button
                type="button"
                onClick={handleNextAyah}
                aria-label="Next Ayah"
                className="w-11 h-11 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] flex items-center justify-center text-[#F5EFE2] transition-colors cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* Repeat & Speed & Offline Audio Cache */}
            <div className="pt-3 border-t border-[#2B251A] flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setRepeatMode((m) => (m === 'none' ? 'one' : m === 'one' ? 'three' : 'none'))
                }
                className={`min-h-[40px] px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  repeatMode !== 'none'
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#E8CA68]'
                    : 'bg-[#1A1711] border-[#2B251A] text-[#C7BDA8]'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>
                  {repeatMode === 'none'
                    ? 'Repeat: Off'
                    : repeatMode === 'one'
                      ? 'Repeat: Loop 1'
                      : 'Repeat: 3x'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setPlaybackRate((r) => (r === 1 ? 1.25 : r === 1.25 ? 0.75 : 1))
                }
                className="min-h-[40px] px-3 rounded-lg bg-[#1A1711] border border-[#2B251A] text-xs font-mono-tabular text-[#C7BDA8] hover:text-[#F5EFE2] cursor-pointer"
              >
                {playbackRate}x Speed
              </button>

              <button
                type="button"
                onClick={handleCacheCurrentPageAudio}
                disabled={cachingPageAudio || !pageData || !isOnline}
                className="min-h-[40px] px-3 rounded-lg bg-[#1A1711] hover:bg-[#242018] disabled:opacity-50 border border-[#2B251A] text-xs font-medium text-[#E8CA68] flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{cachingPageAudio ? 'Saving...' : 'Save Page Audio'}</span>
              </button>
            </div>

            {audioStatusMsg && (
              <p className="text-xs text-[#C7BDA8] bg-[#1A1711] border border-[#2B251A] rounded-xl px-3 py-2">
                {audioStatusMsg}
              </p>
            )}
          </div>

          {/* Reading Comfort, Quick Surahs & Bookmarks Manager */}
          <div className="bg-[#12100C] border border-[#2B251A] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#C7BDA8]">Script Size</span>
              <div className="flex items-center gap-1 bg-[#090806] p-1 rounded-lg border border-[#2B251A]">
                {(['sm', 'md', 'lg', 'xl'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setFontScale(sz)}
                    className={`px-2.5 py-1 rounded text-xs font-medium uppercase transition-colors cursor-pointer ${
                      fontScale === sz
                        ? 'bg-[#D4AF37] text-[#090806]'
                        : 'text-[#8B816E] hover:text-[#F5EFE2]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#2B251A] flex items-center justify-between">
              <span className="text-xs text-[#8B816E]">Saved Bookmarks</span>
              <button
                type="button"
                onClick={() => setShowAllBookmarks(true)}
                className="text-xs font-medium text-[#E8CA68] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Manage ({bookmarks.length})</span>
              </button>
            </div>

            <div className="pt-2 border-t border-[#2B251A] space-y-2.5">
              <p className="text-xs text-[#8B816E]">Quick Jump</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {label: 'Al-Fatihah', page: 1},
                  {label: 'Ayat Al-Kursi', page: 42},
                  {label: 'Al-Kahf', page: 293},
                  {label: 'Ya-Sin', page: 440},
                  {label: 'Ar-Rahman', page: 531},
                  {label: 'Al-Mulk', page: 562},
                  {label: 'Juz Amma', page: 582},
                  {label: 'Al-Mu’awwidhat', page: 604},
                ].map((q) => (
                  <button
                    key={q.page}
                    type="button"
                    onClick={() => setCurrentPage(q.page)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                      currentPage === q.page
                        ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#E8CA68]'
                        : 'bg-[#1A1711] border-[#2B251A] text-[#C7BDA8] hover:text-[#F5EFE2]'
                    }`}
                  >
                    <div className="font-medium truncate">{q.label}</div>
                    <div className="text-[11px] text-[#8B816E] tabular-nums">Page {q.page}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scholarly Tafsir Modal Drawer */}
      {showTafsirModal && activeTafsirAyah && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[88vh] bg-[#12100C] border border-[#2B251A] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2B251A] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#F5EFE2]">
                  Tafsir &amp; Exegesis · <span className="font-arabic text-[#E8CA68]">التفسير</span>
                </h2>
                <p className="text-xs text-[#8B816E]">
                  {activeTafsirAyah.surah.englishName} ({activeTafsirAyah.surah.name}) · Verse{' '}
                  {activeTafsirAyah.surah.number}:{activeTafsirAyah.numberInSurah}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTafsirModal(false)}
                aria-label="Close Tafsir"
                className="w-10 h-10 rounded-xl bg-[#1A1711] border border-[#2B251A] flex items-center justify-center text-[#C7BDA8] hover:text-[#F5EFE2] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scholar Selector */}
            <div className="px-5 py-3 border-b border-[#2B251A] bg-[#0D0B08] flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1 min-w-[220px]">
                <label htmlFor="tafsir-scholar" className="block text-[11px] text-[#8B816E] mb-1">
                  Select Scholar / Commentary
                </label>
                <select
                  id="tafsir-scholar"
                  value={tafsirScholar}
                  onChange={(e) => setTafsirScholar(e.target.value as TafsirScholarId)}
                  className="w-full min-h-[38px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] cursor-pointer"
                >
                  {TAFSIR_SCHOLARS.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name} — {sch.arabicName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-4 sm:pt-0">
                <button
                  type="button"
                  onClick={() => handleStepTafsirVerse(-1)}
                  className="min-h-[38px] px-3 rounded-xl bg-[#1A1711] border border-[#2B251A] text-xs text-[#C7BDA8] hover:text-[#F5EFE2] cursor-pointer"
                >
                  Prev Verse
                </button>
                <button
                  type="button"
                  onClick={() => handleStepTafsirVerse(1)}
                  className="min-h-[38px] px-3 rounded-xl bg-[#1A1711] border border-[#2B251A] text-xs text-[#C7BDA8] hover:text-[#F5EFE2] cursor-pointer"
                >
                  Next Verse
                </button>
              </div>
            </div>

            {/* Tafsir Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div
                className="rounded-2xl bg-[#090806] border border-[#D4AF37]/30 p-5 text-right"
                dir="rtl"
                lang="ar"
              >
                <p className="font-arabic text-2xl leading-[2.2] text-[#F5DC84]">
                  {stripLeadingBismillah(activeTafsirAyah)}{' '}
                  <span className="text-[#D4AF37]">
                    ﴿{toArabicIndic(activeTafsirAyah.numberInSurah)}﴾
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs text-[#8B816E]">
                  {currentScholarInfo.name} · {currentScholarInfo.description}
                </div>

                {tafsirLoading ? (
                  <div className="py-10 text-center space-y-2">
                    <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs text-[#8B816E]">Loading commentary...</p>
                  </div>
                ) : tafsirError ? (
                  <p className="text-sm text-[#E8CA68] bg-[#1A1711] border border-[#2B251A] rounded-xl p-4">
                    {tafsirError}
                  </p>
                ) : (
                  <p
                    dir={currentScholarInfo.language === 'ar' ? 'rtl' : 'ltr'}
                    lang={currentScholarInfo.language}
                    className={
                      currentScholarInfo.language === 'ar'
                        ? 'font-arabic text-xl leading-[2.1] text-[#F5EFE2] text-right'
                        : 'text-sm leading-relaxed text-[#F5EFE2]'
                    }
                  >
                    {tafsirText}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bookmarks Manager Modal */}
      {showAllBookmarks && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[82vh] bg-[#12100C] border border-[#2B251A] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2B251A] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#F5EFE2]">
                  Saved Bookmarks · <span className="font-arabic text-[#E8CA68]">المحفوظات</span>
                </h2>
                <p className="text-xs text-[#8B816E]">Saved offline on this device</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllBookmarks(false)}
                aria-label="Close bookmarks"
                className="w-10 h-10 rounded-xl bg-[#1A1711] border border-[#2B251A] flex items-center justify-center text-[#C7BDA8] hover:text-[#F5EFE2] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {bookmarks.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Bookmark className="w-7 h-7 text-[#8B816E] mx-auto" />
                  <p className="text-sm text-[#C7BDA8]">No bookmarks saved yet.</p>
                  <p className="text-xs text-[#8B816E]">
                    Tap &ldquo;Bookmark Page&rdquo; or select any verse and tap &ldquo;Save Verse&rdquo;.
                  </p>
                </div>
              ) : (
                bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="rounded-2xl bg-[#0E0C09] border border-[#2B251A] p-3.5 flex items-center justify-between gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenBookmark(bm)}
                      className="flex-1 text-left min-w-0 cursor-pointer"
                    >
                      <div className="text-sm font-semibold text-[#E8CA68] truncate">
                        {bm.type === 'verse'
                          ? `${bm.surahName} ${bm.surahNumber}:${bm.ayahNumberInSurah}`
                          : `Page ${bm.pageNumber} · ${bm.surahName ?? 'Mushaf'}`}
                      </div>
                      {bm.excerpt && (
                        <p className="font-arabic text-base text-[#F5EFE2] truncate mt-0.5" dir="rtl">
                          {bm.excerpt}
                        </p>
                      )}
                      <div className="text-[11px] text-[#8B816E] tabular-nums mt-0.5">
                        Page {bm.pageNumber} · {bm.type === 'verse' ? 'Verse Bookmark' : 'Page Bookmark'}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBookmark(bm.id)}
                      aria-label="Remove bookmark"
                      className="w-9 h-9 rounded-xl bg-[#1A1711] border border-[#2B251A] text-[#8B816E] hover:text-[#E8CA68] flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Surah & Juz Index Modal Drawer */}
      {showIndexDrawer && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[85vh] bg-[#12100C] border border-[#2B251A] rounded-3xl flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-[#2B251A] flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#F5EFE2]">Quran Index (الفهرس)</h2>
                <p className="text-xs text-[#8B816E]">114 Surahs · 30 Juz · 604 Madani Mushaf Pages</p>
              </div>
              <button
                type="button"
                onClick={() => setShowIndexDrawer(false)}
                aria-label="Close index"
                className="w-10 h-10 rounded-xl bg-[#1A1711] border border-[#2B251A] flex items-center justify-center text-[#C7BDA8] hover:text-[#F5EFE2] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-[#2B251A] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 bg-[#090806] p-1 rounded-xl border border-[#2B251A]">
                <button
                  type="button"
                  onClick={() => setIndexTab('surah')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    indexTab === 'surah' ? 'bg-[#D4AF37] text-[#090806]' : 'text-[#C7BDA8]'
                  }`}
                >
                  Surahs (114)
                </button>
                <button
                  type="button"
                  onClick={() => setIndexTab('juz')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                    indexTab === 'juz' ? 'bg-[#D4AF37] text-[#090806]' : 'text-[#C7BDA8]'
                  }`}
                >
                  Juz (30)
                </button>
              </div>

              {indexTab === 'surah' && (
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-[#8B816E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={surahQuery}
                    onChange={(e) => setSurahQuery(e.target.value)}
                    placeholder="Search Surah name or number..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#090806] border border-[#2B251A] text-xs text-[#F5EFE2] placeholder-[#8B816E] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              )}
            </div>

            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              {indexTab === 'surah' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredSurahs.map((surah) => (
                    <button
                      key={surah.number}
                      type="button"
                      onClick={() => {
                        setCurrentPage(surah.startPage);
                        setShowIndexDrawer(false);
                      }}
                      className="min-h-[56px] p-3 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-[#090806] border border-[#2B251A] flex items-center justify-center text-xs font-mono-tabular text-[#D4AF37] shrink-0">
                          {surah.number}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-[#F5EFE2] truncate">
                            {surah.englishName}
                          </div>
                          <div className="text-[11px] text-[#8B816E] tabular-nums truncate">
                            {surah.revelationType} · {surah.ayahCount} Ayahs · Page {surah.startPage}
                          </div>
                        </div>
                      </div>
                      <span className="font-arabic text-lg text-[#E8CA68] shrink-0">
                        {surah.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {JUZ_START_PAGES.map((j) => (
                    <button
                      key={j.juz}
                      type="button"
                      onClick={() => {
                        setCurrentPage(j.page);
                        setShowIndexDrawer(false);
                      }}
                      className="min-h-[56px] p-3 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] flex items-center justify-between gap-3 text-left transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-sm font-medium text-[#F5EFE2]">Juz {j.juz}</div>
                        <div className="text-xs text-[#8B816E] tabular-nums">Starts Page {j.page}</div>
                      </div>
                      <span className="font-arabic text-lg text-[#E8CA68]">{j.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
