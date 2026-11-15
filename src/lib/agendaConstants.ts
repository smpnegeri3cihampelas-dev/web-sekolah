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
