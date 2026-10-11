'use client';

import { useState, useEffect } from 'react';

export interface Leader {
  id: number;
  name: string;
  role: string;
  badge?: string;
  nip: string;
  quote: string;
  status: string;
  photo: string;
  badgeColor?: string;
}

export interface Teacher {
  id: number;
  name: string;
  role?: string;
  subject: string;
  category?: string;
  nip: string;
  photo: string;
  status: string;
  active?: boolean;
  quote?: string;
}

export interface DataPokok {
  siswa: string;
  rombel: string;
  guru: string;
  staf: string;
}

export interface SchoolData {
  leaders: Leader[];
  teachers: Teacher[];
  dataPokok: DataPokok;
}

export const DEFAULT_LEADERS: Leader[] = [
  {
    id: 1,
    name: 'H. Rustandi, S.Pd., M.Pd.',
    role: 'Kepala Sekolah',
    badge: 'Penanggung Jawab Utama',
    nip: '19700608 199802 1 001',
    quote: 'Memimpin peningkatan mutu pendidikan, tata kelola berintegritas, dan pembinaan karakter Profil Pelajar Pancasila.',
    status: 'Aktif (Pembina Utama Muda, IV/c)',
    photo: '/teachers/default_avatar.svg',
    badgeColor: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10'
  },
  {
    id: 2,
    name: 'Rohidin, S.Pd.',
    role: 'PKS Kurikulum',
    badge: 'Bidang Pembelajaran',
    nip: 'Pembina TK I / IV/b',
    quote: 'Mengawal implementasi kurikulum merdeka dan strategi pembelajaran inovatif yang adaptif bagi seluruh siswa.',
    status: 'Aktif (PNS)',
    photo: '/teachers/default_avatar.svg',
    badgeColor: 'text-purple-300 border-purple-400/30 bg-purple-500/10'
  },
  {
    id: 3,
    name: 'Nunik Wahyuni, S.Pd.',
    role: 'PKS Kesiswaan',
    badge: 'Bidang Karakter & Literasi',
    nip: 'Penata TK I / III/d',
    quote: 'Membina kedisiplinan, potensi kepemimpinan siswa, serta menumbuhkan budaya literasi dan kejuaraan prestasi.',
    status: 'Aktif (PNS)',
    photo: '/teachers/default_avatar.svg',
    badgeColor: 'text-amber-300 border-amber-400/30 bg-amber-500/10'
  },
  {
    id: 4,
    name: 'H. Osad, M.Pd.I',
    role: 'PKS Sarana Prasarana',
    badge: 'Bidang Sarpras & Lingkungan',
    nip: 'Pembina / IV/a',
    quote: 'Mewujudkan fasilitas sarana prasarana modern, aman, serta lingkungan sekolah yang asri, nyaman, dan ramah anak.',
    status: 'Aktif (PNS)',
    photo: '/teachers/default_avatar.svg',
    badgeColor: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10'
  },
  {
    id: 5,
    name: 'Yepy Agus R, S.IP., M.Pd.',
    role: 'PKS Humas & Koor. Pembelajaran',
    badge: 'Bidang Kemitraan & Supervisi',
    nip: 'PPPK',
    quote: 'Membangun sinergi kolaboratif bersama orang tua, komite, dan masyarakat demi keunggulan pendidikan anak.',
    status: 'Aktif (PPPK)',
    photo: '/teachers/default_avatar.svg',
    badgeColor: 'text-rose-300 border-rose-400/30 bg-rose-500/10'
  }
];

export const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: 1,
    name: 'H. Rustandi, S.Pd., M.Pd.',
    role: 'Kepala Sekolah',
    subject: 'Manajemen Pendidikan',
    category: 'Pimpinan',
    nip: '19700608 199802 1 001',
    photo: '/teachers/default_avatar.svg',
    status: 'PNS (IV/c)',
    active: true,
    quote: 'Memimpin transformasi mutu pendidikan dan karakter peserta didik.'
  },
  {
    id: 2,
    name: 'Dedeh Komalasari, S.Pd.',
    role: 'Kepala Lab IPA',
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    category: 'MIPA',
    nip: 'Pembina Utama Muda, IV/c',
    photo: '/teachers/default_avatar.svg',
    status: 'PNS (IV/c)',
    active: true,
    quote: 'Mengembangkan kecintaan pada sains melalui eksperimen laboratorium.'
  },
  {
    id: 3,
    name: 'E. Hamdani, S.Pd., M.M.Pd.',
    role: 'Guru PJOK',
    subject: 'Pendidikan Jasmani, Olahraga & Kesehatan',
    category: 'Olahraga & Seni',
    nip: 'Pembina TK I / IV/b',
    photo: '/teachers/default_avatar.svg',
    status: 'PNS (IV/b)',
    active: true,
    quote: 'Menanamkan sportivitas, daya juang, dan kebugaran jasmani sejak dini.'
  },
  {
    id: 4,
    name: 'Rohidin, S.Pd.',
    role: 'PKS Kurikulum / Guru B. Inggris',
    subject: 'Bahasa Inggris',
    category: 'Pimpinan',
    nip: 'Pembina TK I / IV/b',
    photo: '/teachers/default_avatar.svg',
    status: 'PNS (IV/b)',
    active: true,
    quote: 'Membuka wawasan global melalui penguasaan bahasa internasional.'
  },
  {
    id: 5,
    name: 'Dian Nuryati, SP., MM',
    role: 'Guru IPS',
    subject: 'Ilmu Pengetahuan Sosial (IPS)',
    category: 'Sosial & Agama',
    nip: 'Pembina / IV/a',
    photo: '/teachers/default_avatar.svg',
    status: 'PNS (IV/a)',
    active: true,
    quote: 'Memahami dinamika sosial, ekonomi, dan sejarah peradaban bangsa.'
  },
  {
    id: 6,
    name: 'Rachmi Fatwalia, S.Pd.',
    role: 'Guru Bahasa Inggris',
    subject: 'Bahasa Inggris',
    category: 'Bahasa',
    nip: 'Pembina / IV/a',
    photo: '/teachers/default_avatar.svg',
    status: 'PNS (IV/a)',
    active: true,
    quote: 'Belajar bahasa Inggris secara komunikatif, percaya diri, dan interaktif.'
  },
  {
    id: 7,
    name: 'H. Osad, M.Pd.I',
    role: 'PKS Sarana / Guru PABP',
    subject: 'Pendidikan Agama Islam & Budi Pekerti',
    category: 'Pimpinan',
    nip: 'Pembina / IV/a',
    photo: '/teachers/default_avatar.svg',
    status: 'PNS (IV/a)',
    active: true,
    quote: 'Menjadikan nilai-nilai keimanan dan akhlak mulia sebagai fondasi hidup.'
  },
  {
    id: 8,
    name: 'Nunik Wahyuni, S.Pd.',
    role: 'PKS Kesiswaan / Ka. Perpustakaan',
    subject: 'Bahasa Indonesia',
    category: 'Pimpinan',
    nip: 'Penata TK I / III/d',
    photo: '/teachers/default_avatar.svg',
    status: 'PNS (III/d)',
    active: true,
    quote: 'Mengembangkan kemahiran berbahasa dan kecintaan budaya membaca.'
  },
  {
    id: 9,
    name: 'N. Euis Kurnia, S.Pd.',
    role: 'Staf Perpustakaan / Guru B. Indonesia',
    subject: 'Bahasa Indonesia',
    category: 'Bahasa',
    nip: 'Penata Muda / III/c',
    photo: '/teachers/default_avatar.svg',
    status: 'PNS (III/c)',
    active: true,
    quote: 'Membina kecakapan literasi dan kreativitas karya tulis siswa.'
  },
  {
    id: 10,
    name: 'Rifayanti Maulani, S.Pd.',
    role: 'Guru PPKn',
    subject: 'Pendidikan Pancasila & Kewarganegaraan',
    category: 'Sosial & Agama',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Membentuk generasi sadar hukum, bertoleransi, dan berjiwa Pancasila.'
  },
  {
    id: 11,
    name: 'Yulia M. Ahmad, S.Pd.',
    role: 'Guru Matematika',
    subject: 'Matematika',
    category: 'MIPA',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Matematika melatih ketelitian, penalaran logis, dan problem solving.'
  },
  {
    id: 12,
    name: 'Yepy Agus R, S.IP., M.Pd.',
    role: 'PKS Humas / Koor. Pembelajaran',
    subject: 'Pendidikan Pancasila & Kewarganegaraan',
    category: 'Pimpinan',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Sinergi kemitraan sekolah demi pembelajaran yang berdaya saing.'
  },
  {
    id: 13,
    name: 'Dudi Yusup, S.Pd.',
    role: 'Pembina OSIS / Guru Seni Budaya',
    subject: 'Seni Budaya & Keterampilan (SBK)',
    category: 'Olahraga & Seni',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Mengembangkan bakat artistik, daya cipta seni, dan karakter kepemimpinan.'
  },
  {
    id: 14,
    name: 'Gugun Gunawan, S.Pd.',
    role: 'Pembina OSIS / Guru PJOK',
    subject: 'Pendidikan Jasmani, Olahraga & Kesehatan',
    category: 'Olahraga & Seni',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Membangun karakter tangguh, jiwa ksatria, dan jasmani yang prima.'
  },
  {
    id: 15,
    name: 'Nursifa Fauziah, S.Pd.',
    role: 'Staf Lab IPA / Guru IPA',
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    category: 'MIPA',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Membimbing siswa mencintai alam semesta dan fenomena ilmiah sains.'
  },
  {
    id: 16,
    name: 'Krisna Lestari, S.Pd.',
    role: 'Guru Seni Budaya',
    subject: 'Seni Budaya & Keterampilan (SBK)',
    category: 'Olahraga & Seni',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Seni adalah sarana ekspresi rasa, estetika, dan pelestarian budaya.'
  },
  {
    id: 17,
    name: 'Wiwin S, S.Pd.I., M.Pd.',
    role: 'Guru PABP & Bahasa Sunda',
    subject: 'PABP & Bahasa Sunda',
    category: 'Sosial & Agama',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Ngamumule basa jeung sastra Sunda tur ngaraksa akhlak nu mulya.'
  },
  {
    id: 18,
    name: 'Cincin Cintawati, S.Pd.',
    role: 'Staf Lab IPA / Guru IPA',
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    category: 'MIPA',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Mendorong eksplorasi sains yang kritis, faktual, dan penuh rasa ingin tahu.'
  },
  {
    id: 19,
    name: 'Budiyanto, S.Pd.',
    role: 'Guru Matematika',
    subject: 'Matematika',
    category: 'MIPA',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Belajar matematika dengan konsep yang mudah dipahami dan aplikatif.'
  },
  {
    id: 20,
    name: 'Muhammad Ahiq T, S.Pd.',
    role: 'Guru IPS',
    subject: 'Ilmu Pengetahuan Sosial (IPS)',
    category: 'Sosial & Agama',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Membangun kepekaan sosial kemasyarakatan dan wawasan kebangsaan.'
  },
  {
    id: 21,
    name: 'Riski Ismawarni M, S.Pd.',
    role: 'Guru Bahasa Indonesia',
    subject: 'Bahasa Indonesia',
    category: 'Bahasa',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Bahasa Indonesia adalah pemersatu bangsa dan wahana kreasi ide.'
  },
  {
    id: 22,
    name: 'Siti Nurjanah, S.Pd.',
    role: 'Pembina PMR / Guru B. Inggris',
    subject: 'Bahasa Inggris',
    category: 'Bahasa',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Menumbuhkan kepedulian kemanusiaan PMR dan kecakapan komunikasi global.'
  },
  {
    id: 23,
    name: 'Tina A. Rosdiana, S.Pd.I',
    role: 'Pembina Keputrian / Guru PABP',
    subject: 'Pendidikan Agama Islam & Budi Pekerti',
    category: 'Sosial & Agama',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Membimbing pembinaan keputrian dan kepribadian muslimah yang anggun berilmu.'
  },
  {
    id: 24,
    name: 'Sonia Winjuni L, S.Pd.',
    role: 'Guru Matematika',
    subject: 'Matematika',
    category: 'MIPA',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Mengasah ketangkasan logika komputasional dan penalaran terstruktur.'
  },
  {
    id: 25,
    name: 'Elis Siti Sa\'adah, S.Pd.',
    role: 'Guru Bahasa Sunda',
    subject: 'Bahasa Sunda',
    category: 'Bahasa',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'PPPK',
    active: true,
    quote: 'Raksa basa, rawat budaya, ngajunjung luhur martabat pituin Sunda.'
  },
  {
    id: 26,
    name: 'Nira Destriyani, S.Pd.',
    role: 'Guru Bimbingan & Konseling (BK)',
    subject: 'Bimbingan & Konseling (BK)',
    category: 'Sosial & Agama',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'GTT / Honorer',
    active: true,
    quote: 'Mendampingi tumbuh kembang emosional, minat studi, dan solusi siswa.'
  },
  {
    id: 27,
    name: 'Ichsanul Arifin, S.Kom.',
    role: 'Guru Informatika',
    subject: 'Informatika',
    category: 'Teknologi',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'GTT / Honorer',
    active: true,
    quote: 'Mengakselerasi literasi digital, computational thinking, dan rekayasa teknologi cerdas.'
  },
  {
    id: 28,
    name: 'Dani Ramdani, S.Pd.',
    role: 'Guru Bahasa Indonesia',
    subject: 'Bahasa Indonesia',
    category: 'Bahasa',
    nip: '-',
    photo: '/teachers/default_avatar.svg',
    status: 'GTT / Honorer',
    active: true,
    quote: 'Membudayakan ekspresi sastra, tata bahasa santun, dan pemikiran kritis.'
  }
];

export const DEFAULT_DATA_POKOK: DataPokok = {
  siswa: '535',
  rombel: '17',
  guru: '33',
  staf: '8'
};

const STORAGE_KEY = 'smpn3_school_data_v3';
const EVENT_NAME = 'smpn3_school_data_changed';

export function getStoredSchoolData(): SchoolData {
  if (typeof window === 'undefined') {
    return {
      leaders: DEFAULT_LEADERS,
      teachers: DEFAULT_TEACHERS,
      dataPokok: DEFAULT_DATA_POKOK
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: SchoolData = {
        leaders: DEFAULT_LEADERS,
        teachers: DEFAULT_TEACHERS,
        dataPokok: DEFAULT_DATA_POKOK
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return {
      leaders: parsed.leaders && parsed.leaders.length > 0 ? parsed.leaders : DEFAULT_LEADERS,
      teachers: parsed.teachers && parsed.teachers.length > 0 ? parsed.teachers : DEFAULT_TEACHERS,
      dataPokok: parsed.dataPokok || DEFAULT_DATA_POKOK
    };
  } catch (err) {
    console.error('Error reading school data from storage', err);
    return {
      leaders: DEFAULT_LEADERS,
      teachers: DEFAULT_TEACHERS,
      dataPokok: DEFAULT_DATA_POKOK
    };
  }
}

export function saveStoredSchoolData(data: Partial<SchoolData>): SchoolData {
  if (typeof window === 'undefined') {
    return {
      leaders: DEFAULT_LEADERS,
      teachers: DEFAULT_TEACHERS,
      dataPokok: DEFAULT_DATA_POKOK,
      ...data
    };
  }

  try {
    const current = getStoredSchoolData();
    const updated: SchoolData = {
      ...current,
      ...data
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event(EVENT_NAME));
    return updated;
  } catch (err) {
    console.error('Error saving school data to storage', err);
    return {
      leaders: DEFAULT_LEADERS,
      teachers: DEFAULT_TEACHERS,
      dataPokok: DEFAULT_DATA_POKOK,
      ...data
    };
  }
}

export function resetStoredSchoolData(): SchoolData {
  const initialData: SchoolData = {
    leaders: DEFAULT_LEADERS,
    teachers: DEFAULT_TEACHERS,
    dataPokok: DEFAULT_DATA_POKOK
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    window.dispatchEvent(new Event(EVENT_NAME));
  }
  return initialData;
}

export function useSchoolData() {
  const [data, setData] = useState<SchoolData>({
    leaders: DEFAULT_LEADERS,
    teachers: DEFAULT_TEACHERS,
    dataPokok: DEFAULT_DATA_POKOK
  });

  useEffect(() => {
    // Initial sync
    setData(getStoredSchoolData());

    const handleUpdate = () => {
      setData(getStoredSchoolData());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return {
    leaders: data.leaders,
    teachers: data.teachers,
    dataPokok: data.dataPokok,
    setLeaders: (newLeaders: Leader[]) => saveStoredSchoolData({ leaders: newLeaders }),
    setTeachers: (newTeachers: Teacher[]) => saveStoredSchoolData({ teachers: newTeachers }),
    setDataPokok: (newDataPokok: DataPokok) => saveStoredSchoolData({ dataPokok: newDataPokok }),
    resetData: () => resetStoredSchoolData()
  };
}
