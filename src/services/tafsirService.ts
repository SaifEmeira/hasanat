import type {TafsirEntry, TafsirScholarId} from '../types/hasanat';

export interface TafsirScholarInfo {
  id: TafsirScholarId;
  name: string;
  arabicName: string;
  language: 'en' | 'ar';
  description: string;
}

export const TAFSIR_SCHOLARS: TafsirScholarInfo[] = [
  {
    id: 'en-ibn-kathir',
    name: 'Tafsir Ibn Kathir',
    arabicName: 'تفسير ابن كثير (إنجليزي)',
    language: 'en',
    description: 'Classical Sunni exegesis by Imam Ismail ibn Kathir',
  },
  {
    id: 'ar-ibn-kathir',
    name: 'Ibn Kathir (Arabic)',
    arabicName: 'تفسير ابن كثير',
    language: 'ar',
    description: 'تفسير القرآن العظيم للحافظ ابن كثير',
  },
  {
    id: 'ar-muyassar',
    name: 'Al-Tafsir Al-Muyassar',
    arabicName: 'التفسير الميسر',
    language: 'ar',
    description: 'مجمع الملك فهد لطباعة المصحف الشريف',
  },
  {
    id: 'ar-jalalayn',
    name: 'Tafsir Al-Jalalayn',
    arabicName: 'تفسير الجلالين',
    language: 'ar',
    description: 'لجلال الدين المحلي وجلال الدين السيوطي',
  },
  {
    id: 'en-sahih',
    name: 'Sahih International',
    arabicName: 'ترجمة صحيح إنترناشونال',
    language: 'en',
    description: 'Clear contemporary English translation of meanings',
  },
];

// Bundled offline starter Tafsir so key Surahs work with zero network
const STARTER_TAFSIR: Record<string, string> = {
  'en-ibn-kathir:1:1':
    'In the Name of Allah, the Most Gracious, the Most Merciful. Scholars explain that starting every noble action and Surah with the Basmalah seeks Allah’s blessing, guidance, and aid. Ar-Rahman indicates His vast mercy encompassing all creation, while Ar-Rahim signifies His special mercy bestowed upon the believers.',
  'ar-muyassar:1:1':
    'أبتدئ قراءة القرآن باسم الله مستعيناً به، (اللهِ) علم على الرب -تبارك وتعالى- المعبود بحق دون سواه، (الرَّحْمَنِ) ذي الرحمة العامة الذي وسعت رحمته جميع الخلق، (الرَّحِيمِ) بالمؤمنين.',
  'en-ibn-kathir:1:2':
    'All praise and thanks belong exclusively to Allah, the Lord and Sustainer of all the worlds — every realm of creation including angels, humanity, jinn, and the cosmos.',
  'ar-muyassar:1:2':
    'الثناء على الله بصفاته التي كلها أوصاف كمال، وبنعمه الظاهرة والباطنة، الدينية والدنيوية، وفي ضمنه أمرٌ لعباده أن يحمدوه، فهو المستحق له وحده، وهو سبحانه المنشئ للخلق، القائم بأمورهم.',
  'en-ibn-kathir:2:255':
    'Ayat Al-Kursi is the greatest verse in the Book of Allah. It affirms Allah’s absolute Oneness, eternal life (Al-Hayy), and self-subsisting sovereignty (Al-Qayyum). Neither slumber nor sleep ever touches Him; everything in the heavens and earth belongs solely to Him, and none can intercede except by His permission.',
  'ar-muyassar:2:255':
    'الله الذي لا يستحق الألوهية والعبودية إلا هو، الحيُّ الذي له جميع معاني الحياة الكاملة كما يليق بجلاله، القائم على كل شيء، لا تأخذه سِنَة أي: نعاس، ولا نوم، كل ما في السماوات وما في الأرض ملك له.',
  'en-ibn-kathir:112:1':
    'Say: He is Allah, the One and Unique. Surah Al-Ikhlas equals one-third of the Quran in meaning because it purifies belief in Allah’s absolute Oneness (Tawhid) — He is As-Samad (the Eternal Refuge upon whom all depend), He neither begets nor is born, and nothing is comparable to Him.',
  'ar-muyassar:112:1':
    'قل -أيها الرسول-: هو الله المتفرد بالألوهية والربوبية والأسماء والصفات، لا شريك له فيها.',
};

const DB_NAME = 'hasanat-tafsir-db';
const DB_VERSION = 1;
const STORE_NAME = 'tafsir';

function openTafsirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {keyPath: 'key'});
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getTafsirFromDB(key: string): Promise<TafsirEntry | null> {
  try {
    const db = await openTafsirDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as TafsirEntry) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function saveTafsirToDB(entry: TafsirEntry): Promise<void> {
  try {
    const db = await openTafsirDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

function cleanTafsirHtml(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function getVerseTafsir(
  scholarId: TafsirScholarId,
  surahNumber: number,
  ayahNumber: number
): Promise<TafsirEntry> {
  const key = `${scholarId}:${surahNumber}:${ayahNumber}`;

  const cached = await getTafsirFromDB(key);
  if (cached && cached.text) {
    return cached;
  }

  let fetchedText = '';
  try {
    if (scholarId === 'en-ibn-kathir' || scholarId === 'ar-ibn-kathir') {
      const slug =
        scholarId === 'en-ibn-kathir' ? 'en-tafisr-ibn-kathir' : 'ar-tafsir-ibn-kathir';
      const res = await fetch(
        `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/${slug}/${surahNumber}/${ayahNumber}.json`
      );
      if (res.ok) {
        const json = (await res.json()) as {text?: string};
        if (json.text) fetchedText = cleanTafsirHtml(json.text);
      }
    } else {
      const edition =
        scholarId === 'ar-muyassar'
          ? 'ar.muyassar'
          : scholarId === 'ar-jalalayn'
            ? 'ar.jalalayn'
            : 'en.sahih';
      const res = await fetch(
        `https://api.alquran.cloud/v1/ayah/${surahNumber}:${ayahNumber}/${edition}`
      );
      if (res.ok) {
        const json = (await res.json()) as {data?: {text?: string}};
        if (json.data?.text) fetchedText = cleanTafsirHtml(json.data.text);
      }
    }
  } catch {
    // fallback below
  }

  if (!fetchedText && STARTER_TAFSIR[key]) {
    fetchedText = STARTER_TAFSIR[key];
  }

  if (!fetchedText) {
    throw new Error(
      'Unable to load Tafsir while offline for this verse. Connect once to cache it locally.'
    );
  }

  const entry: TafsirEntry = {
    key,
    scholarId,
    surahNumber,
    ayahNumber,
    text: fetchedText,
    cachedAt: Date.now(),
  };
  await saveTafsirToDB(entry);
  return entry;
}
