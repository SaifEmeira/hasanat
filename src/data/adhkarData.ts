import type {AdhkarCategory, DhikrReminderConfig} from '../types/hasanat';

export const ADHKAR_CATEGORIES: AdhkarCategory[] = [
  {
    id: 'morning',
    title: 'Morning Adhkar',
    arabicTitle: 'أذكار الصباح',
    subtitle: 'Protection, gratitude, and serenity from Fajr until sunrise',
    items: [
      {
        id: 'm-kursi',
        arabic:
          'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ ۗ مَن ذَا الَّذِي يَشْفَعُ عِندَهُ إِلَّا بِإِذْنِهِ ۚ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ ۖ وَلَا يُحِيطُونَ بِشَيْءٍ مِّنْ عِلْمِهِ إِلَّا بِمَا شَاءَ ۚ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ ۖ وَلَا يَئُودُهُ حِفْظُهُمَا ۚ وَهُوَ الْعَلِيُّ الْعَظِيمُ',
        transliteration:
          'Allahu la ilaha illa Huwal-Hayyul-Qayyum. La ta’khudhuhu sinatun wa la nawm...',
        translation:
          'Allah — there is no deity except Him, the Ever-Living, the Sustainer of existence. Neither drowsiness overtakes Him nor sleep...',
        reference: 'Ayat Al-Kursi · Al-Baqarah 2:255',
        repeat: 1,
      },
      {
        id: 'm-sayyid',
        arabic:
          'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
        transliteration:
          'Allahumma Anta Rabbi la ilaha illa Anta, khalaqtani wa ana abduka...',
        translation:
          'O Allah, You are my Lord, none has the right to be worshipped except You. You created me and I am Your servant, and I abide to Your covenant and promise as best I can.',
        reference: 'Sayyid al-Istighfar · Sahih al-Bukhari',
        repeat: 1,
      },
      {
        id: 'm-asbahna',
        arabic:
          'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration:
          'Asbahna wa asbahal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lah.',
        translation:
          'We have reached the morning and at this very time all sovereignty belongs to Allah, and all praise is for Allah.',
        reference: 'Sahih Muslim 2723',
        repeat: 1,
      },
      {
        id: 'm-bismillah',
        arabic:
          'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
        transliteration:
          'Bismillahil-ladhi la yadurru ma’as-mihi shay’un fil-ardi wa la fis-sama’i wa Huwas-Sami’ul-Alim.',
        translation:
          'In the name of Allah, with whose name nothing on earth or in heaven can cause harm, and He is the All-Hearing, the All-Knowing.',
        reference: 'Abu Dawud & At-Tirmidhi',
        repeat: 3,
      },
      {
        id: 'm-raditu',
        arabic:
          'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا',
        transliteration:
          'Raditu billahi Rabban, wa bil-Islami dinan, wa bi-Muhammadin (SAW) nabiyyan.',
        translation:
          'I am pleased with Allah as my Lord, with Islam as my religion, and with Muhammad (peace be upon him) as my Prophet.',
        reference: 'Ahmad & Abu Dawud',
        repeat: 3,
      },
      {
        id: 'm-subhanallah',
        arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ: عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ',
        transliteration:
          'Subhanallahi wa bihamdihi: adada khalqihi, wa rida nafsihi, wa zinata arshihi, wa midada kalimatih.',
        translation:
          'Glory and praise be to Allah, as much as the number of His creation, His own pleasure, the weight of His Throne, and the ink of His words.',
        reference: 'Sahih Muslim 2726',
        repeat: 3,
      },
    ],
  },
  {
    id: 'evening',
    title: 'Evening Adhkar',
    arabicTitle: 'أذكار المساء',
    subtitle: 'Remembrance and refuge from Asr into the tranquil night',
    items: [
      {
        id: 'e-amsayna',
        arabic:
          'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration:
          'Amsayna wa amsal-mulku lillah, wal-hamdu lillah, la ilaha illallahu wahdahu la sharika lah.',
        translation:
          'We have reached the evening and at this very time all sovereignty belongs to Allah, and all praise is for Allah.',
        reference: 'Sahih Muslim 2723',
        repeat: 1,
      },
      {
        id: 'e-kalimat',
        arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
        transliteration: 'A’udhu bikalimatillahit-tammati min sharri ma khalaq.',
        translation: 'I seek refuge in the perfect words of Allah from the evil of what He has created.',
        reference: 'Sahih Muslim 2709',
        repeat: 3,
      },
      {
        id: 'e-hasbi',
        arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ ۖ عَلَيْهِ تَوَكَّلْتُ ۖ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ',
        transliteration: 'Hasbiyallahu la ilaha illa Huwa, alayhi tawakkaltu, wa Huwa Rabbul-Arshil-Azim.',
        translation: 'Allah is sufficient for me; there is no deity except Him. On Him I rely, and He is the Lord of the Mighty Throne.',
        reference: 'At-Tawbah 9:129 · Abu Dawud',
        repeat: 7,
      },
      {
        id: 'e-afiyah',
        arabic:
          'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي',
        transliteration:
          'Allahumma inni as’alukal-afwa wal-afiyata fid-dunya wal-akhirah...',
        translation:
          'O Allah, I ask You for pardon and well-being in this life and the next, in my religion, worldly affairs, family, and wealth.',
        reference: 'Ibn Majah & Abu Dawud',
        repeat: 1,
      },
      {
        id: 'e-salawat',
        arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ',
        transliteration: 'Allahumma salli wa sallim ala nabiyyina Muhammad.',
        translation: 'O Allah, send peace and blessings upon our Prophet Muhammad.',
        reference: 'At-Tabarani',
        repeat: 10,
      },
    ],
  },
  {
    id: 'after_salah',
    title: 'After Salah',
    arabicTitle: 'أذكار بعد الصلاة',
    subtitle: 'Sunnah supplications and Tasbih following every obligatory prayer',
    items: [
      {
        id: 's-istighfar',
        arabic: 'أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، أَسْتَغْفِرُ اللَّهَ، اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
        transliteration:
          'Astaghfirullah (3x). Allahumma Antas-Salam wa minkas-salam, tabarakta ya Dhal-Jalali wal-Ikram.',
        translation:
          'I seek the forgiveness of Allah. O Allah, You are Peace and from You comes peace; Blessed are You, O Possessor of Majesty and Honor.',
        reference: 'Sahih Muslim 591',
        repeat: 1,
      },
      {
        id: 's-subhan',
        arabic: 'سُبْحَانَ اللَّهِ',
        transliteration: 'SubhanAllah',
        translation: 'Glory be to Allah.',
        reference: 'Sahih Muslim 597',
        repeat: 33,
      },
      {
        id: 's-hamd',
        arabic: 'الْحَمْدُ لِلَّهِ',
        transliteration: 'Alhamdulillah',
        translation: 'All praise is due to Allah.',
        reference: 'Sahih Muslim 597',
        repeat: 33,
      },
      {
        id: 's-akbar',
        arabic: 'اللَّهُ أَكْبَرُ',
        transliteration: 'Allahu Akbar',
        translation: 'Allah is the Greatest.',
        reference: 'Sahih Muslim 597',
        repeat: 33,
      },
      {
        id: 's-tahlil',
        arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
        transliteration:
          'La ilaha illallahu wahdahu la sharika lah, lahul-mulku wa lahul-hamdu wa Huwa ala kulli shay’in Qadir.',
        translation:
          'None has the right to be worshipped but Allah alone, without partner; to Him belongs all sovereignty and praise, and He is over all things Omnipotent.',
        reference: 'Completes the 100 · Sahih Muslim 597',
        repeat: 1,
      },
      {
        id: 's-maunah',
        arabic: 'اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ',
        transliteration: 'Allahumma a’inni ala dhikrika, wa shukrika, wa husni ibadatik.',
        translation: 'O Allah, help me to remember You, to thank You, and to worship You in the best manner.',
        reference: 'Abu Dawud & An-Nasa’i',
        repeat: 1,
      },
    ],
  },
  {
    id: 'sleep',
    title: 'Sleep & Waking',
    arabicTitle: 'أذكار النوم والاستيقاظ',
    subtitle: 'Rest in Allah’s protection and awaken with gratitude',
    items: [
      {
        id: 'sl-bismika',
        arabic: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ',
        transliteration:
          'Bismika Rabbi wada’tu janbi wa bika arfa’uh, fa-in amsakta nafsi farhamha, wa in arsaltaha fahfazha...',
        translation:
          'In Your name, my Lord, I lie down and in Your name I rise. If You take my soul, have mercy upon it; if You return it, protect it as You protect Your righteous servants.',
        reference: 'Sahih al-Bukhari 6320',
        repeat: 1,
      },
      {
        id: 'sl-allahumma',
        arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
        transliteration: 'Bismika Allahumma amutu wa ahya.',
        translation: 'In Your name, O Allah, I die and I live.',
        reference: 'Sahih al-Bukhari 6324',
        repeat: 1,
      },
      {
        id: 'sl-wake',
        arabic: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ',
        transliteration: 'Alhamdulillahil-ladhi ahyana ba’da ma amatana wa ilayhin-nushur.',
        translation: 'All praise is for Allah who gave us life after having taken it from us, and unto Him is the resurrection.',
        reference: 'Sahih al-Bukhari 6312',
        repeat: 1,
      },
    ],
  },
  {
    id: 'duas',
    title: 'Quranic & Prophetic Duas',
    arabicTitle: 'جوامع الدعاء',
    subtitle: 'Comprehensive supplications for guidance, forgiveness, and peace',
    items: [
      {
        id: 'd-hasanah',
        arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
        transliteration: 'Rabbana atina fid-dunya hasanatan wa fil-akhirati hasanatan wa qina adhaban-nar.',
        translation: 'Our Lord, give us in this world that which is good and in the Hereafter that which is good, and protect us from the punishment of the Fire.',
        reference: 'Al-Baqarah 2:201',
        repeat: 1,
      },
      {
        id: 'd-ya-muqallib',
        arabic: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبِي عَلَى دِينِكَ',
        transliteration: 'Ya Muqallibal-qulubi thabbit qalbi ala dinik.',
        translation: 'O Turner of the hearts, keep my heart firm upon Your religion.',
        reference: 'At-Tirmidhi 2140',
        repeat: 3,
      },
      {
        id: 'd-hidayah',
        arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى',
        transliteration: 'Allahumma inni as’alukal-huda wat-tuqa wal-afafa wal-ghina.',
        translation: 'O Allah, I ask You for guidance, piety, chastity, and contentment.',
        reference: 'Sahih Muslim 2721',
        repeat: 1,
      },
      {
        id: 'd-maghfirah',
        arabic: 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ',
        transliteration: 'Rabbanaghfir li wa liwalidayya wa lil-mu’minina yawma yaqumul-hisab.',
        translation: 'Our Lord, forgive me and my parents and the believers the Day the account is established.',
        reference: 'Ibrahim 14:41',
        repeat: 1,
      },
    ],
  },
];

export const TASBIH_PRESETS = [
  {id: 'subhanallah', arabic: 'سُبْحَانَ اللَّهِ', latin: 'SubhanAllah', defaultTarget: 33},
  {id: 'alhamdulillah', arabic: 'الْحَمْدُ لِلَّهِ', latin: 'Alhamdulillah', defaultTarget: 33},
  {id: 'allahuakbar', arabic: 'اللَّهُ أَكْبَرُ', latin: 'Allahu Akbar', defaultTarget: 33},
  {id: 'istighfar', arabic: 'أَسْتَغْفِرُ اللَّهَ', latin: 'Astaghfirullah', defaultTarget: 100},
  {id: 'salawat', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', latin: 'Salawat upon the Prophet', defaultTarget: 100},
  {id: 'tahlil', arabic: 'لَا إِلَٰهَ إِلَّا اللَّهُ', latin: 'La ilaha illallah', defaultTarget: 100},
];

export const DEFAULT_DHIKR_REMINDERS: DhikrReminderConfig[] = [
  {
    id: 'morning',
    title: 'Morning Adhkar',
    arabicTitle: 'تذكير أذكار الصباح',
    enabled: true,
    time: '06:30',
    tone: 'golden_bell',
    message: 'Begin your morning with remembrance of Allah — Morning Adhkar are ready offline.',
  },
  {
    id: 'evening',
    title: 'Evening Adhkar',
    arabicTitle: 'تذكير أذكار المساء',
    enabled: true,
    time: '17:00',
    tone: 'golden_bell',
    message: 'Take a peaceful moment for Evening Adhkar and gratitude.',
  },
  {
    id: 'sleep',
    title: 'Sleep Adhkar & Al-Mulk',
    arabicTitle: 'أذكار النوم وسورة الملك',
    enabled: false,
    time: '22:00',
    tone: 'golden_bell',
    message: 'Recite Surah Al-Mulk and Sleep Adhkar before resting.',
  },
  {
    id: 'kahf',
    title: 'Friday Surah Al-Kahf',
    arabicTitle: 'سورة الكهف يوم الجمعة',
    enabled: true,
    time: '09:30',
    tone: 'takbir_chime',
    message: 'Jumu’ah Mubarak — illuminate your Friday with Surah Al-Kahf and Salawat.',
  },
];
