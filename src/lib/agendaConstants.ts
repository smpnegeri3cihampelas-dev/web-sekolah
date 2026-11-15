export interface AgendaItem {
  id: number;
  name: string;
  date: string;
  category: string;
  status: string;
  semester?: 'Semester 1' | 'Semester 2' | string;
  title?: string;
  type?: string;
  created_at?: string;
}

export interface KaldikPdfInfo {
  url: string;
  fileName: string;
  updatedAt?: string;
}

export const DEFAULT_PDF_URL = '/kalender-akademik-smpn3.pdf';
export const DEFAULT_PDF_NAME = 'Kalender-Pendidikan-SMPN-3-Cihampelas-2026-2027.pdf';

export const OFFICIAL_KALDIK_SMPN3: AgendaItem[] = [
  // SEMESTER 1 (2026)
  {
    id: 1,
    name: 'Hari Pertama Masuk Sekolah',
    date: '13 Juli 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 2,
    name: 'Pengenalan Lingkungan Sekolah (MPLS)',
    date: '15 - 17 & 20 - 21 Juli 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 3,
    name: 'Pelaksanaan Sulingjar (Survei Lingkungan Belajar)',
    date: '03 - 26 Agustus 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 4,
    name: 'Kegiatan Hari Pramuka Nasional',
    date: '14 Agustus 2026',
    category: 'Kegiatan',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 5,
    name: 'Libur Hari Proklamasi Kemerdekaan RI',
    date: '17 Agustus 2026',
    category: 'Libur Resmi',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 6,
    name: 'Olimpiade Olahraga Siswa Nasional (O2SN) Tk. Nasional',
    date: '19 - 23 Agustus 2026',
    category: 'Kesiswaan',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 7,
    name: 'Libur Maulid Nabi Muhammad SAW',
    date: '25 Agustus 2026',
    category: 'Libur Resmi',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 8,
    name: 'Olimpiade Sains Nasional (OSN) Jenjang Dikdas Tk. Nasional',
    date: '25 - 31 Agustus 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 9,
    name: 'FLS2N Jenjang Pendidikan Dasar Tk. Nasional (Daring)',
    date: '28 Sep - 03 Okt 2026',
    category: 'Kreativitas',
    semester: 'Semester 1',
    status: 'Selesai'
  },
  {
    id: 10,
    name: 'Gelar Aksi Karakter Siswa Indonesia Tk. Provinsi',
    date: '21 November 2026',
    category: 'Kesiswaan',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 11,
    name: 'Peringatan Hari Guru Nasional',
    date: '25 November 2026',
    category: 'Kegiatan',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 12,
    name: 'Pelaksanaan Sumatif Akhir Semester 1 (SAS 1)',
    date: '30 Nov - 11 Des 2026',
    category: 'Ujian CBT',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 13,
    name: 'Hari Disabilitas Internasional',
    date: '03 Desember 2026',
    category: 'Kegiatan',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 14,
    name: 'Penetapan dan Pembagian Rapor Semester 1',
    date: '23 Desember 2026',
    category: 'Akademik',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 15,
    name: 'Cuti Bersama & Libur Hari Natal',
    date: '24 - 25 Desember 2026',
    category: 'Libur Resmi',
    semester: 'Semester 1',
    status: 'Mendatang'
  },
  {
    id: 16,
    name: 'Libur Semester 1',
    date: '28 Des 2026 - 08 Jan 2027',
    category: 'Libur Semester',
    semester: 'Semester 1',
    status: 'Mendatang'
  },

  // SEMESTER 2 (2027)
  {
    id: 17,
    name: 'Hari Pertama Masuk Sekolah Semester 2',
    date: '11 Januari 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 18,
    name: 'Kegiatan Penumbuhan Budi Pekerti (SMARTTREN Ramadhan)',
    date: '15 Feb - 05 Mar 2027',
    category: 'Kegiatan',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 19,
    name: 'Perkiraan Libur Hari Raya Idul Fitri 1448 H',
    date: '08 - 19 Maret 2027',
    category: 'Libur Resmi',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 20,
    name: 'Libur Wafat Isa Almasih',
    date: '26 April 2027',
    category: 'Libur Resmi',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 21,
    name: 'Hari Pendidikan Nasional (Hardiknas)',
    date: '02 Mei 2027',
    category: 'Kegiatan',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 22,
    name: 'Perkiraan Sumatif Akhir Jenjang SMP (Ujian Sekolah Kelas 9)',
    date: '11 - 21 Mei 2027',
    category: 'Ujian CBT',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 23,
    name: 'Perkiraan Penetapan Kelulusan Siswa Kelas 9',
    date: '02 Juni 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 24,
    name: 'Perkiraan Sumatif Akhir Tahun (SAT) / Akhir Fase',
    date: '07 - 18 Juni 2027',
    category: 'Ujian CBT',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 25,
    name: 'Tanggal Penetapan dan Pembagian Rapor Semester 2',
    date: '25 Juni 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 26,
    name: 'Libur Akhir Tahun Pelajaran',
    date: '28 Juni - 09 Juli 2027',
    category: 'Libur Semester',
    semester: 'Semester 2',
    status: 'Mendatang'
  },
  {
    id: 27,
    name: 'Masa SPMB / PPDB Tahun Pelajaran 2027/2028',
    date: 'Juni - Juli 2027',
    category: 'Akademik',
    semester: 'Semester 2',
    status: 'Mendatang'
  }
];

export const MONTH_INDEX_MAP: Record<string, number> = {
  jan: 0, januari: 0,
  feb: 1, februari: 1,
  mar: 2, maret: 2,
  apr: 3, april: 3,
  mei: 4,
  jun: 5, juni: 5,
  jul: 6, juli: 6,
  agu: 7, agustus: 7,
  sep: 8, september: 8,
  okt: 9, oktober: 9,
  nov: 10, november: 10,
  des: 11, desember: 11
};

export function getAgendaSortTime(dateStr: string): number {
  if (!dateStr) return 0;
  const trimmed = dateStr.trim();

  // 1. Cross year range: e.g. '28 Des 2026 - 08 Jan 2027'
  const crossYear = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*[-–]/i);
  if (crossYear) {
    const day = parseInt(crossYear[1], 10);
    const m = MONTH_INDEX_MAP[crossYear[2].toLowerCase().slice(0, 3)] ?? 0;
    const y = parseInt(crossYear[3], 10);
    return new Date(y, m, day).getTime();
  }

  const yearMatch = trimmed.match(/\b(20\d{2})\b/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;

  // 2. Cross month: '30 Nov - 11 Des 2026' or '28 Sep - 03 Okt 2026'
  const crossMonth = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s*[-–]/i);
  if (crossMonth) {
    const day = parseInt(crossMonth[1], 10);
    const m = MONTH_INDEX_MAP[crossMonth[2].toLowerCase().slice(0, 3)] ?? 0;
    return new Date(year, m, day).getTime();
  }

  // 3. Single date or range in same month: '13 Juli 2026' or '03 - 26 Agustus 2026' or '15 - 17 & 20 - 21 Juli 2026'
  const dayMatch = trimmed.match(/^(\d{1,2})/);
  const monthMatch = trimmed.match(/([A-Za-z]+)\s+\d{4}/);
  if (dayMatch && monthMatch) {
    const day = parseInt(dayMatch[1], 10);
    const m = MONTH_INDEX_MAP[monthMatch[1].toLowerCase().slice(0, 3)] ?? 0;
    return new Date(year, m, day).getTime();
  }

  // 4. Month range e.g. 'Juni - Juli 2027'
  const monthRange = trimmed.match(/^([A-Za-z]+)\s*[-–]\s*([A-Za-z]+)/i);
  if (monthRange) {
    const startM = MONTH_INDEX_MAP[monthRange[1].toLowerCase().slice(0, 3)] ?? 0;
    // Agenda rentang bulan tanpa tanggal (seperti Masa PPDB Juni - Juli) dilaksanakan di akhir bulan setelah pembagian rapor
    return new Date(year, startM, 29).getTime();
  }

  const monthOnly = trimmed.match(/^([A-Za-z]+)/);
  if (monthOnly) {
    const m = MONTH_INDEX_MAP[monthOnly[1].toLowerCase().slice(0, 3)] ?? 0;
    return new Date(year, m, 1).getTime();
  }

  return 0;
}

export function computeAutomaticStatus(dateStr: string, manualStatus?: string): string {
  if (!dateStr) return manualStatus || 'Mendatang';

  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const trimmed = dateStr.trim();

    // 1. Cross year range: e.g. "28 Des 2026 - 08 Jan 2027"
    const crossYearMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
    if (crossYearMatch) {
      const sDay = parseInt(crossYearMatch[1], 10);
      const sMonth = MONTH_INDEX_MAP[crossYearMatch[2].toLowerCase().slice(0, 3)] ?? 0;
      const sYear = parseInt(crossYearMatch[3], 10);

      const eDay = parseInt(crossYearMatch[4], 10);
      const eMonth = MONTH_INDEX_MAP[crossYearMatch[5].toLowerCase().slice(0, 3)] ?? 0;
      const eYear = parseInt(crossYearMatch[6], 10);

      const start = new Date(sYear, sMonth, sDay).getTime();
      const end = new Date(eYear, eMonth, eDay, 23, 59, 59).getTime();

      if (today < start) return 'Mendatang';
      if (today > end) return 'Selesai';
      return 'Berlangsung';
    }

    // 2. Cross month range same year: e.g. "30 Nov - 11 Des 2026" or "28 Sep - 03 Okt 2026"
    const crossMonthMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
    if (crossMonthMatch) {
      const year = parseInt(crossMonthMatch[5], 10);
      const sDay = parseInt(crossMonthMatch[1], 10);
      const sMonth = MONTH_INDEX_MAP[crossMonthMatch[2].toLowerCase().slice(0, 3)] ?? 0;

      const eDay = parseInt(crossMonthMatch[3], 10);
      const eMonth = MONTH_INDEX_MAP[crossMonthMatch[4].toLowerCase().slice(0, 3)] ?? 0;

      const start = new Date(year, sMonth, sDay).getTime();
      const end = new Date(year, eMonth, eDay, 23, 59, 59).getTime();

      if (today < start) return 'Mendatang';
      if (today > end) return 'Selesai';
      return 'Berlangsung';
    }

    // 3. Multi range in month: e.g. "15 - 17 & 20 - 21 Juli 2026"
    const multiRangeMatch = trimmed.match(/^(\d{1,2}).+[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
    if (multiRangeMatch) {
      const year = parseInt(multiRangeMatch[4], 10);
      const month = MONTH_INDEX_MAP[multiRangeMatch[3].toLowerCase().slice(0, 3)] ?? 0;
      const sDay = parseInt(multiRangeMatch[1], 10);
      const eDay = parseInt(multiRangeMatch[2], 10);

      const start = new Date(year, month, sDay).getTime();
      const end = new Date(year, month, eDay, 23, 59, 59).getTime();

      if (today < start) return 'Mendatang';
      if (today > end) return 'Selesai';
      return 'Berlangsung';
    }

    // 4. Standard range in month: e.g. "03 - 26 Agustus 2026" or "15 - 24 November 2026"
    const stdRangeMatch = trimmed.match(/^(\d{1,2})\s*[-–]\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
    if (stdRangeMatch) {
      const year = parseInt(stdRangeMatch[4], 10);
      const month = MONTH_INDEX_MAP[stdRangeMatch[3].toLowerCase().slice(0, 3)] ?? 0;
      const sDay = parseInt(stdRangeMatch[1], 10);
      const eDay = parseInt(stdRangeMatch[2], 10);

      const start = new Date(year, month, sDay).getTime();
      const end = new Date(year, month, eDay, 23, 59, 59).getTime();

      if (today < start) return 'Mendatang';
      if (today > end) return 'Selesai';
      return 'Berlangsung';
    }

    // 5. Single date: e.g. "13 Juli 2026"
    const singleMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);
    if (singleMatch) {
      const year = parseInt(singleMatch[3], 10);
      const month = MONTH_INDEX_MAP[singleMatch[2].toLowerCase().slice(0, 3)] ?? 0;
      const day = parseInt(singleMatch[1], 10);

      const start = new Date(year, month, day).getTime();
      const end = new Date(year, month, day, 23, 59, 59).getTime();

      if (today < start) return 'Mendatang';
      if (today > end) return 'Selesai';
      return 'Berlangsung';
    }

    // 6. Month range e.g. "Juni - Juli 2027"
    const monthRangeMatch = trimmed.match(/^([A-Za-z]+)\s*[-–]\s*([A-Za-z]+)\s+(\d{4})/i);
    if (monthRangeMatch) {
      const year = parseInt(monthRangeMatch[3], 10);
      const sMonth = MONTH_INDEX_MAP[monthRangeMatch[1].toLowerCase().slice(0, 3)] ?? 0;
      const eMonth = MONTH_INDEX_MAP[monthRangeMatch[2].toLowerCase().slice(0, 3)] ?? 0;

      const start = new Date(year, sMonth, 1).getTime();
      const end = new Date(year, eMonth + 1, 0, 23, 59, 59).getTime();

      if (today < start) return 'Mendatang';
      if (today > end) return 'Selesai';
      return 'Berlangsung';
    }
  } catch {}

  return manualStatus || 'Mendatang';
}
