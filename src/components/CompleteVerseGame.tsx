import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Trophy,
  Volume2,
  XCircle,
} from 'lucide-react';
import {SHEIKHS, getAyahAudioUrl, toArabicIndic} from '../data/quranMeta';
import {playGameFeedbackTone} from '../services/notificationService';
import type {SheikhReciter} from '../types/hasanat';

interface VerseChallenge {
  id: string;
  surahNumber: number;
  ayahNumber: number;
  globalAyah: number;
  surahName: string;
  surahArabic: string;
  arabicWords: string[];
  blankIndex: number; // Word index where Sheikh pauses right before reciting it
  distractors: [string, string, string];
  translation: string;
}

const VERSE_CHALLENGES: VerseChallenge[] = [
  {
    id: 'fatihah-2',
    surahNumber: 1,
    ayahNumber: 2,
    globalAyah: 2,
    surahName: 'Al-Fatihah',
    surahArabic: 'سورة الفاتحة',
    arabicWords: ['الْحَمْدُ', 'لِلَّهِ', 'رَبِّ', 'الْعَالَمِينَ'],
    blankIndex: 2,
    distractors: ['مَلِكِ', 'إِلَٰهِ', 'خَالِقِ'],
    translation: 'All praise is due to Allah, Lord of all the worlds.',
  },
  {
    id: 'fatihah-5',
    surahNumber: 1,
    ayahNumber: 5,
    globalAyah: 5,
    surahName: 'Al-Fatihah',
    surahArabic: 'سورة الفاتحة',
    arabicWords: ['إِيَّاكَ', 'نَعْبُدُ', 'وَإِيَّاكَ', 'نَسْتَعِينُ'],
    blankIndex: 3,
    distractors: ['نَسْأَلُ', 'نَسْتَغْفِرُ', 'نَتَوَكَّلُ'],
    translation: 'You alone we worship, and You alone we ask for help.',
  },
  {
    id: 'fatihah-6',
    surahNumber: 1,
    ayahNumber: 6,
    globalAyah: 6,
    surahName: 'Al-Fatihah',
    surahArabic: 'سورة الفاتحة',
    arabicWords: ['اهْدِنَا', 'الصِّرَاطَ', 'الْمُسْتَقِيمَ'],
    blankIndex: 2,
    distractors: ['الْمُبِينَ', 'الْقَوِيمَ', 'الْعَظِيمَ'],
    translation: 'Guide us to the straight path.',
  },
  {
    id: 'baqarah-2',
    surahNumber: 2,
    ayahNumber: 2,
    globalAyah: 9,
    surahName: 'Al-Baqarah',
    surahArabic: 'سورة البقرة',
    arabicWords: ['ذَٰلِكَ', 'الْكِتَابُ', 'لَا', 'رَيْبَ', 'فِيهِ', 'هُدًى', 'لِّلْمُتَّقِينَ'],
    blankIndex: 6,
    distractors: ['لِّلْعَالَمِينَ', 'لِّلْمُؤْمِنِينَ', 'لِّلْمُحْسِنِينَ'],
    translation: 'This is the Book about which there is no doubt, a guidance for the mindful.',
  },
  {
    id: 'baqarah-152',
    surahNumber: 2,
    ayahNumber: 152,
    globalAyah: 159,
    surahName: 'Al-Baqarah',
    surahArabic: 'سورة البقرة',
    arabicWords: ['فَاذْكُرُونِي', 'أَذْكُرْكُمْ', 'وَاشْكُرُوا', 'لِي', 'وَلَا', 'تَكْفُرُونِ'],
    blankIndex: 5,
    distractors: ['تَنسَوْنِ', 'تَحْزَنُوا', 'تَعْصُونِ'],
    translation: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.',
  },
  {
    id: 'baqarah-286',
    surahNumber: 2,
    ayahNumber: 286,
    globalAyah: 293,
    surahName: 'Al-Baqarah',
    surahArabic: 'سورة البقرة',
    arabicWords: ['لَا', 'يُكَلِّفُ', 'اللَّهُ', 'نَفْسًا', 'إِلَّا', 'وُسْعَهَا'],
    blankIndex: 5,
    distractors: ['قَدْرَهَا', 'طَاقَتَهَا', 'رِزْقَهَا'],
    translation: 'Allah does not burden any soul beyond its capacity.',
  },
  {
    id: 'imran-173',
    surahNumber: 3,
    ayahNumber: 173,
    globalAyah: 466,
    surahName: 'Aal-i-Imran',
    surahArabic: 'سورة آل عمران',
    arabicWords: ['حَسْبُنَا', 'اللَّهُ', 'وَنِعْمَ', 'الْوَكِيلُ'],
    blankIndex: 3,
    distractors: ['النَّصِيرُ', 'الْمَوْلَى', 'الْحَفِيظُ'],
    translation: 'Sufficient for us is Allah, and He is the best Disposer of affairs.',
  },
  {
    id: 'rad-28',
    surahNumber: 13,
    ayahNumber: 28,
    globalAyah: 1735,
    surahName: 'Ar-Ra’d',
    surahArabic: 'سورة الرعد',
    arabicWords: ['أَلَا', 'بِذِكْرِ', 'اللَّهِ', 'تَطْمَئِنُّ', 'الْقُلُوبُ'],
    blankIndex: 3,
    distractors: ['تَسْتَنِيرُ', 'تَنْشَرِحُ', 'تَخْشَعُ'],
    translation: 'Unquestionably, by the remembrance of Allah hearts are assured.',
  },
  {
    id: 'rahman-13',
    surahNumber: 55,
    ayahNumber: 13,
    globalAyah: 4914,
    surahName: 'Ar-Rahman',
    surahArabic: 'سورة الرحمن',
    arabicWords: ['فَبِأَيِّ', 'آلَاءِ', 'رَبِّكُمَا', 'تُكَذِّبَانِ'],
    blankIndex: 3,
    distractors: ['تَجْحَدَانِ', 'تَشْكُرَانِ', 'تَعْجَبَانِ'],
    translation: 'So which of the favors of your Lord would you deny?',
  },
  {
    id: 'sharh-5',
    surahNumber: 94,
    ayahNumber: 5,
    globalAyah: 6095,
    surahName: 'Ash-Sharh',
    surahArabic: 'سورة الشرح',
    arabicWords: ['فَإِنَّ', 'مَعَ', 'الْعُسْرِ', 'يُسْرًا'],
    blankIndex: 3,
    distractors: ['فَرَجًا', 'خَيْرًا', 'نَصْرًا'],
    translation: 'For indeed, with hardship comes ease.',
  },
  {
    id: 'asr-2',
    surahNumber: 103,
    ayahNumber: 2,
    globalAyah: 6178,
    surahName: 'Al-Asr',
    surahArabic: 'سورة العصر',
    arabicWords: ['إِنَّ', 'الْإِنسَانَ', 'لَفِي', 'خُسْرٍ'],
    blankIndex: 3,
    distractors: ['غَفْلَةٍ', 'شَكٍّ', 'ضَلَالٍ'],
    translation: 'Indeed, mankind is in loss.',
  },
  {
    id: 'kawthar-1',
    surahNumber: 108,
    ayahNumber: 1,
    globalAyah: 6205,
    surahName: 'Al-Kawthar',
    surahArabic: 'سورة الكوثر',
    arabicWords: ['إِنَّا', 'أَعْطَيْنَاكَ', 'الْكَوْثَرَ'],
    blankIndex: 2,
    distractors: ['الْحِكْمَةَ', 'الْفُرْقَانَ', 'الْبُشْرَى'],
    translation: 'Indeed, We have granted you Al-Kawthar (abundance).',
  },
  {
    id: 'ikhlas-2',
    surahNumber: 112,
    ayahNumber: 2,
    globalAyah: 6223,
    surahName: 'Al-Ikhlas',
    surahArabic: 'سورة الإخلاص',
    arabicWords: ['اللَّهُ', 'الصَّمَدُ'],
    blankIndex: 1,
    distractors: ['الْأَحَدُ', 'الْوَاحِدُ', 'الْقَيُّومُ'],
    translation: 'Allah, the Eternal Refuge.',
  },
  {
    id: 'falaq-3',
    surahNumber: 113,
    ayahNumber: 3,
    globalAyah: 6228,
    surahName: 'Al-Falaq',
    surahArabic: 'سورة الفلق',
    arabicWords: ['وَمِن', 'شَرِّ', 'غَاسِقٍ', 'إِذَا', 'وَقَبَ'],
    blankIndex: 2,
    distractors: ['حَاسِدٍ', 'سَاحِرٍ', 'ظَالِمٍ'],
    translation: 'And from the evil of darkness when it settles.',
  },
  {
    id: 'nas-4',
    surahNumber: 114,
    ayahNumber: 4,
    globalAyah: 6234,
    surahName: 'An-Nas',
    surahArabic: 'سورة الناس',
    arabicWords: ['مِن', 'شَرِّ', 'الْوَسْوَاسِ', 'الْخَنَّاسِ'],
    blankIndex: 2,
    distractors: ['الشَّيْطَانِ', 'الرَّجِيمِ', 'الْمُفْسِدِ'],
    translation: 'From the evil of the retreating whisperer.',
  },
];

type GamePhase = 'READY' | 'RECITING_PREFIX' | 'WAITING_CHOICE' | 'CONTINUING' | 'COMPLETED';

interface CompleteVerseGameProps {
  selectedSheikh: SheikhReciter;
  onChangeSheikh: (sheikh: SheikhReciter) => void;
  onHasanatEarned?: (points: number) => void;
}

export const CompleteVerseGame: React.FC<CompleteVerseGameProps> = ({
  selectedSheikh,
  onChangeSheikh,
  onHasanatEarned,
}) => {
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('READY');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(() => {
    const saved = localStorage.getItem('hasanat_verse_best_streak');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });
  const [wrongChoices, setWrongChoices] = useState<string[]>([]);
  const [statusFeedback, setStatusFeedback] = useState<string>(
    'Press Start Listening. The Sheikh will recite the verse and pause right before the missing word.'
  );
  const [audioProgress, setAudioProgress] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPausedForBlankRef = useRef(false);

  const challenge = VERSE_CHALLENGES[challengeIdx];

  // Deterministically shuffle 4 choices per round
  const choices = useMemo(() => {
    const correct = challenge.arabicWords[challenge.blankIndex];
    const all = [correct, ...challenge.distractors];
    // Deterministic Fisher-Yates seeded by challenge index
    const arr = [...all];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (challengeIdx * 7 + i * 3) % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [challenge, challengeIdx]);

  // Compute proportional pause point right before the missing word
  const pauseFraction = useMemo(() => {
    const cleanLen = (w: string) => w.replace(/[\u064B-\u065F\u0670]/g, '').length;
    const prefixChars = challenge.arabicWords
      .slice(0, challenge.blankIndex)
      .reduce((acc, w) => acc + cleanLen(w), 0);
    const totalChars = challenge.arabicWords.reduce((acc, w) => acc + cleanLen(w), 0);
    if (totalChars === 0) return 0.55;
    // Pause slightly before the word begins so the Sheikh stops cleanly right before it
    const raw = prefixChars / totalChars - 0.05;
    return Math.max(0.32, Math.min(0.76, raw));
  }, [challenge]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Wire timeupdate & ended events for exact pause-on-word and resume-on-correct
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (!audio.duration || Number.isNaN(audio.duration)) return;
      const ratio = audio.currentTime / audio.duration;
      setAudioProgress(Math.min(100, ratio * 100));

      if (
        phase === 'RECITING_PREFIX' &&
        !hasPausedForBlankRef.current &&
        ratio >= pauseFraction
      ) {
        hasPausedForBlankRef.current = true;
        audio.pause();
        setPhase('WAITING_CHOICE');
        setStatusFeedback('The Sheikh paused — choose the missing word so he can continue!');
      }
    };

    const handleEnded = () => {
      if (phase === 'CONTINUING') {
        setPhase('COMPLETED');
        setAudioProgress(100);
        setStatusFeedback('Verse completed! Tap Next Verse to continue.');
      } else if (phase === 'RECITING_PREFIX' && !hasPausedForBlankRef.current) {
        // Safety fallback if short ayah finished before timeupdate hit threshold
        hasPausedForBlankRef.current = true;
        setPhase('WAITING_CHOICE');
        setStatusFeedback('Choose the missing word to complete the verse!');
      }
    };

    const handleError = () => {
      setPhase('WAITING_CHOICE');
      setStatusFeedback('Audio stream unavailable — complete the verse visually below.');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [pauseFraction, phase]);

  const startRoundAudio = useCallback(
    (fromStart = true) => {
      const audio = audioRef.current;
      if (!audio) return;

      const url = getAyahAudioUrl(
        selectedSheikh.everyAyahFolder,
        challenge.globalAyah,
        challenge.surahNumber,
        challenge.ayahNumber
      );

      if (fromStart) {
        hasPausedForBlankRef.current = false;
        setWrongChoices([]);
        setAudioProgress(0);
        audio.src = url;
        audio.currentTime = 0;
      }

      setPhase('RECITING_PREFIX');
      setStatusFeedback(`${selectedSheikh.name} is reciting — listen for the pause...`);
      audio.play().catch(() => {
        setPhase('WAITING_CHOICE');
        setStatusFeedback('Tap a word below to complete the verse.');
      });
    },
    [challenge, selectedSheikh]
  );

  const handleSelectWord = (word: string) => {
    if (phase !== 'WAITING_CHOICE') return;
    const correctWord = challenge.arabicWords[challenge.blankIndex];

    if (word === correctWord) {
      playGameFeedbackTone(true);
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setScore((s) => s + 25 + nextStreak * 5);
      if (nextStreak > bestStreak) {
        setBestStreak(nextStreak);
        localStorage.setItem('hasanat_verse_best_streak', String(nextStreak));
      }
      onHasanatEarned?.(25);
      setPhase('CONTINUING');
      setStatusFeedback('Correct! Listen as the Sheikh completes the verse...');

      const audio = audioRef.current;
      if (audio && audio.src) {
        if (audio.ended || audio.currentTime >= (audio.duration || 1) - 0.15) {
          // Short verse ended near pause; play from pause point or full verse to celebrate
          audio.currentTime = Math.max(0, (audio.duration || 2) * Math.max(0, pauseFraction - 0.1));
        }
        audio.play().catch(() => {
          setPhase('COMPLETED');
          setStatusFeedback('Correct! Verse completed.');
        });
      } else {
        setPhase('COMPLETED');
      }
    } else {
      playGameFeedbackTone(false);
      setStreak(0);
      setWrongChoices((prev) => (prev.includes(word) ? prev : [...prev, word]));
      setStatusFeedback('Incorrect choice — listen again or select another word.');
    }
  };

  const handleNextChallenge = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    hasPausedForBlankRef.current = false;
    setWrongChoices([]);
    setAudioProgress(0);
    setChallengeIdx((i) => (i + 1) % VERSE_CHALLENGES.length);
    setPhase('READY');
    setStatusFeedback('Press Start Listening when ready for the next verse.');
  };

  const handleRestartGame = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    hasPausedForBlankRef.current = false;
    setScore(0);
    setStreak(0);
    setWrongChoices([]);
    setAudioProgress(0);
    setChallengeIdx(0);
    setPhase('READY');
    setStatusFeedback('Game reset. Press Start Listening to begin.');
  };

  const isBlankRevealed = phase === 'CONTINUING' || phase === 'COMPLETED';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Compact Unobtrusive Game HUD */}
      <div className="bg-[#12100C] border border-[#2B251A] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-0.5">
          <p className="text-xs text-[#8B816E]">Interactive Quran Challenge · أكمل الآية</p>
          <h2 className="text-lg sm:text-xl font-semibold text-[#F5EFE2]">Complete the Verse</h2>
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-4 sm:gap-6 w-full sm:w-auto tabular-nums">
          <div>
            <div className="text-xs text-[#8B816E]">Score</div>
            <div className="text-lg sm:text-xl font-mono-tabular font-semibold text-[#E8CA68]">{score}</div>
          </div>
          <div>
            <div className="text-xs text-[#8B816E]">Streak</div>
            <div className="text-lg sm:text-xl font-mono-tabular font-semibold text-[#F5EFE2]">{streak}</div>
          </div>
          <div>
            <div className="text-xs text-[#8B816E]">Best</div>
            <div className="text-lg sm:text-xl font-mono-tabular font-semibold text-[#D4AF37] flex items-center gap-1">
              <Trophy className="w-4 h-4" />
              <span>{bestStreak}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRestartGame}
            className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#2B251A] text-xs font-medium text-[#C7BDA8] flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        <div className="lg:col-span-8 bg-[#12100C] border border-[#2B251A] rounded-3xl p-4 sm:p-8 space-y-5 sm:space-y-6">
          {/* Round Header Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-[#2B251A]">
            <div className="flex items-center gap-2 text-xs text-[#C7BDA8]">
              <span className="font-arabic text-lg text-[#E8CA68]">{challenge.surahArabic}</span>
              <span aria-hidden="true">·</span>
              <span>
                {challenge.surahName} {challenge.surahNumber}:{challenge.ayahNumber}
              </span>
            </div>
            <span className="text-xs text-[#8B816E] tabular-nums">
              Round {challengeIdx + 1} / {VERSE_CHALLENGES.length}
            </span>
          </div>

          {/* Verse Display Canvas */}
          <div
            className="rounded-2xl bg-[#0B0A07] border border-[#D4AF37]/30 p-4 sm:p-8 text-center space-y-4 sm:space-y-5"
            dir="rtl"
            lang="ar"
          >
            <div className="font-arabic text-2xl sm:text-4xl leading-[2.2] sm:leading-[2.3] text-[#F5EFE2] flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-3 gap-y-2">
              {challenge.arabicWords.map((word, idx) => {
                if (idx === challenge.blankIndex) {
                  return (
                    <span
                      key={idx}
                      className={`inline-flex items-center justify-center min-w-[84px] sm:min-w-[110px] px-3 sm:px-4 py-1 rounded-xl border transition-all ${
                        isBlankRevealed
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#F5DC84]'
                          : 'bg-[#1A1711] border-[#D4AF37]/60 text-[#D4AF37]'
                      }`}
                    >
                      {isBlankRevealed ? word : '؟'}
                    </span>
                  );
                }
                const afterBlankHidden = idx > challenge.blankIndex && !isBlankRevealed;
                return (
                  <span
                    key={idx}
                    className={afterBlankHidden ? 'opacity-25 blur-[3px] select-none' : ''}
                  >
                    {word}
                  </span>
                );
              })}
              <span className="text-2xl text-[#D4AF37]">
                ﴿{toArabicIndic(challenge.ayahNumber)}﴾
              </span>
            </div>

            {isBlankRevealed && (
              <p className="text-sm text-[#C7BDA8] pt-2 border-t border-[#2B251A]" dir="ltr">
                {challenge.translation}
              </p>
            )}
          </div>

          {/* Recitation Progress & Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#E8CA68] font-medium">{statusFeedback}</span>
              <span className="font-mono-tabular text-[#8B816E]">{Math.round(audioProgress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#1A1711] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#D4AF37] transition-all duration-150"
                style={{width: `${audioProgress}%`}}
              />
            </div>
          </div>

          {/* 4 Multiple-Choice Word Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3" dir="rtl" lang="ar">
            {choices.map((choice) => {
              const isWrong = wrongChoices.includes(choice);
              const isCorrect =
                isBlankRevealed && choice === challenge.arabicWords[challenge.blankIndex];

              return (
                <button
                  key={choice}
                  type="button"
                  disabled={phase !== 'WAITING_CHOICE' || isWrong}
                  onClick={() => handleSelectWord(choice)}
                  className={`min-h-[56px] sm:min-h-[60px] px-2.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border font-arabic text-xl sm:text-2xl transition-colors flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer disabled:cursor-default ${
                    isCorrect
                      ? 'bg-[#D4AF37] border-[#E8CA68] text-[#090806] font-bold'
                      : isWrong
                        ? 'bg-[#2A1414] border-[#7F2D2D] text-[#D48A8A] opacity-75'
                        : phase === 'WAITING_CHOICE'
                          ? 'bg-[#1A1711] hover:bg-[#252017] border-[#D4AF37]/45 text-[#F5EFE2]'
                          : 'bg-[#12100C] border-[#2B251A] text-[#8B816E] opacity-70'
                  }`}
                >
                  <span>{choice}</span>
                  {isCorrect && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  {isWrong && <XCircle className="w-5 h-5 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Round Controls */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {phase === 'READY' || phase === 'WAITING_CHOICE' ? (
                <button
                  type="button"
                  onClick={() => startRoundAudio(true)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E8CA68] text-[#090806] text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>{phase === 'READY' ? 'Start Listening' : 'Replay Prefix'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const audio = audioRef.current;
                    if (!audio) return;
                    if (audio.paused) {
                      audio.play().catch(() => {});
                    } else {
                      audio.pause();
                    }
                  }}
                  disabled={phase === 'COMPLETED'}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1A1711] border border-[#2B251A] text-xs font-medium text-[#E8CA68] flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {phase === 'RECITING_PREFIX' || phase === 'CONTINUING' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{phase === 'COMPLETED' ? 'Completed' : 'Pause / Resume'}</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleNextChallenge}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1A1711] hover:bg-[#242018] border border-[#D4AF37]/45 text-xs font-semibold text-[#E8CA68] flex items-center gap-2 cursor-pointer"
            >
              <span>Next Verse</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Reciter Selector & Game Instructions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#12100C] border border-[#2B251A] rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1A1711] border border-[#2B251A] flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#F5EFE2]">Game Reciter</h3>
                <p className="text-xs text-[#8B816E]">Select your Sheikh for this challenge</p>
              </div>
            </div>

            <select
              value={selectedSheikh.id}
              onChange={(e) => {
                const found = SHEIKHS.find((s) => s.id === e.target.value);
                if (found) onChangeSheikh(found);
              }}
              className="w-full min-h-[42px] px-3 rounded-xl bg-[#090806] border border-[#2B251A] text-sm text-[#F5EFE2] cursor-pointer"
            >
              {SHEIKHS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.arabicName} — {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#12100C] border border-[#2B251A] rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#F5EFE2]">How to Play</h3>
            <ol className="space-y-2 text-xs text-[#C7BDA8] list-decimal list-inside leading-relaxed">
              <li>Tap <strong className="text-[#E8CA68]">Start Listening</strong> to hear the Sheikh recite the verse.</li>
              <li>The reciter pauses automatically right before the missing word.</li>
              <li>Choose the exact Arabic word from the 4 options.</li>
              <li>On a correct answer, the Sheikh immediately resumes and completes the verse.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
