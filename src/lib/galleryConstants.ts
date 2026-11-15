export interface GalleryItem {
  id: number;
  src: string;
  category: 'FASILITAS' | 'KEGIATAN' | 'EKSTRAKURIKULER' | 'AKADEMIK' | string;
  title: string;
  desc?: string;
  created_at?: string;
}

export const DEFAULT_GALLERY_PHOTOS: GalleryItem[] = [
  { 
    id: 1, 
    src: '/gallery_2.jpg', 
    category: 'FASILITAS', 
    title: 'Laboratorium Komputer & Praktikum TIK',
    desc: 'Sarana pembelajaran komputasi, literasi digital, dan pelaksanaan asesmen nasional ANBK.'
  },
  { 
    id: 2, 
    src: '/gallery_1.jpg', 
    category: 'FASILITAS', 
    title: 'Perpustakaan & Pojok Baca Siswa',
    desc: 'Pusat sumber belajar, koleksi buku literasi harian, dan ruang baca yang nyaman bagi siswa.'
  },
  { 
    id: 3, 
    src: '/slide1.jpeg', 
    category: 'KEGIATAN', 
    title: 'Upacara Bendera & Apel Kedisiplinan',
    desc: 'Pembiasaan rutin hari Senin untuk menanamkan jiwa patriotisme, budi pekerti, dan kepemimpinan.'
  },
  { 
    id: 4, 
    src: '/slide3.jpeg', 
    category: 'EKSTRAKURIKULER', 
    title: 'Kegiatan Olahraga & Pengembangan Bakat',
    desc: 'Wadah pembinaan bakat olahraga, sportivitas, dan kebugaran jasmani seluruh siswa.'
  },
  { 
    id: 5, 
    src: '/slide4.jpeg', 
    category: 'KEGIATAN', 
    title: 'Pentas Seni & Gelar Budaya Sunda',
    desc: 'Apresiasi bakat seni budaya daerah, pelestarian kearifan lokal, dan unjuk kreativitas siswa.'
  },
  { 
    id: 6, 
    src: '/slide7.jpeg', 
    category: 'AKADEMIK', 
    title: 'Praktikum Sains & Diskusi Berdiferensiasi',
    desc: 'Pembelajaran kontekstual melalui observasi langsung, eksperimen ilmiah, dan kerja sama tim.'
  },
  { 
    id: 7, 
    src: '/slide2.jpeg', 
    category: 'AKADEMIK', 
    title: 'Gelar Karya Projek Penguatan P5',
    desc: 'Pameran hasil karya inovatif, daur ulang ramah lingkungan, dan kewirausahaan siswa.'
  },
  { 
    id: 8, 
    src: '/slide6.jpeg', 
    category: 'KEGIATAN', 
    title: 'Senam Sehat & Jumat Bersih Lingkungan',
    desc: 'Pembiasaan rutin hidup sehat dan gotong royong memelihara keasrian lingkungan sekolah.'
  },
];

export const GALLERY_CATEGORIES = [
  { key: 'SEMUA', label: 'Semua' },
  { key: 'FASILITAS', label: 'Fasilitas' },
  { key: 'AKADEMIK', label: 'Akademik' },
  { key: 'KEGIATAN', label: 'Kegiatan Siswa' },
  { key: 'EKSTRAKURIKULER', label: 'Ekstrakurikuler' },
];
