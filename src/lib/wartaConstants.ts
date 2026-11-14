export interface WartaItem {
  id: number;
  title: string;
  category: 'Prestasi' | 'Pengumuman' | 'Inovasi' | 'Akademik' | 'Kegiatan' | string;
  date: string;
  views?: string;
  status: 'Published' | 'Draft';
  src: string;
  excerpt?: string;
  content?: string;
  author?: string;
}

export const DEFAULT_WARTA: WartaItem[] = [
  {
    id: 1,
    title: 'Siswa SMPN 3 Cihampelas Sabet Juara 1 Porseni Basket KBB 2026',
    category: 'Prestasi',
    date: '22 Sep 2026',
    views: '1.4k',
    status: 'Published',
    src: '/gallery_2.jpg',
    excerpt: 'Prestasi membanggakan kembali ditorehkan oleh tim basket putra SMPN 3 Cihampelas dalam kompetisi bergengsi tingkat Kabupaten Bandung Barat.'
  },
  {
    id: 2,
    title: 'Pembukaan Jalur Zonasi & Afirmasi PPDB Tahun Ajaran 2026/2027',
    category: 'Pengumuman',
    date: '18 Sep 2026',
    views: '3.2k',
    status: 'Published',
    src: '/slide1.jpeg',
    excerpt: 'Pendaftaran Penerimaan Peserta Didik Baru (PPDB) resmi dibuka dengan sistem verifikasi berkas terpadu dan transparan.'
  },
  {
    id: 3,
    title: 'Upacara Bendera Khidmat & Pembinaan Karakter Profil Pelajar Pancasila',
    category: 'Kegiatan',
    date: '14 Sep 2026',
    views: '920',
    status: 'Published',
    src: '/slide4.jpeg',
    excerpt: 'Kegiatan upacara bendera hari Senin yang dirangkaikan dengan penguatan disiplin dan nilai integritas peserta didik.'
  },
  {
    id: 4,
    title: 'Pelaksanaan Asesmen Sumatif Tengah Semester (CBT Berbasis Digital)',
    category: 'Akademik',
    date: '10 Sep 2026',
    views: '2.1k',
    status: 'Published',
    src: '/gallery_1.jpg',
    excerpt: 'Pemanfaatan sistem asesmen digital terintegrasi untuk mengukur capaian kompetensi belajar siswa secara akurat dan objektif.'
  },
  {
    id: 5,
    title: 'Sosialisasi & Simulasi Mitigasi Bencana Sekolah Tangguh Bencana BPBD',
    category: 'Kegiatan',
    date: '06 Sep 2026',
    views: '1.8k',
    status: 'Published',
    src: '/slide5.jpeg',
    excerpt: 'Peningkatan kesiapsiagaan seluruh warga sekolah menghadapi potensi bencana alam bersama tim BPBD Kabupaten Bandung Barat.'
  },
  {
    id: 6,
    title: 'Peluncuran Ekosistem E-Learning & Laboratorium Komputer Terpadu',
    category: 'Inovasi',
    date: '02 Sep 2026',
    views: '2.5k',
    status: 'Published',
    src: '/slide6.jpeg',
    excerpt: 'Modernisasi sarana penunjang pembelajaran digital demi terwujudnya sekolah rujukan berbasis smart campus di wilayah Cihampelas.'
  },
  {
    id: 7,
    title: 'Gelar Karya P5: Pameran Inovasi dan Kearifan Lokal Budaya Sunda',
    category: 'Prestasi',
    date: '28 Agu 2026',
    views: '1.6k',
    status: 'Published',
    src: '/slide2.jpeg',
    excerpt: 'Unjuk bakat dan kreasi peserta didik dalam mengimplementasikan nilai luhur Pancasila melalui karya seni dan wirausaha muda.'
  }
];

