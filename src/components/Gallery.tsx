'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface PhotoItem {
  id: number;
  src: string;
  category: string;
  title: string;
  desc?: string;
}

const DEFAULT_PHOTOS: PhotoItem[] = [
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

const CATEGORIES = [
  { key: 'SEMUA', label: 'Semua' },
  { key: 'FASILITAS', label: 'Fasilitas' },
  { key: 'AKADEMIK', label: 'Akademik' },
  { key: 'KEGIATAN', label: 'Kegiatan Siswa' },
  { key: 'EKSTRAKURIKULER', label: 'Ekstrakurikuler' },
];

const INITIAL_LIMIT = 6;

export default function Gallery() {
  const [photos, setPhotos] = useState<PhotoItem[]>(DEFAULT_PHOTOS);
  const [filter, setFilter] = useState('SEMUA');
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

  // Sync with Dashboard LocalStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smpn3_gallery_data_v1');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPhotos(
              parsed.map((p) => ({
                id: p.id || Date.now(),
                src: p.src || '/gallery_2.jpg',
                category: (p.category || 'KEGIATAN').toUpperCase(),
                title: p.title || 'Dokumentasi Sekolah',
                desc: p.desc || (p.category === 'FASILITAS' ? 'Sarana penunjang kegiatan di SMPN 3 Cihampelas.' : 'Dokumentasi kegiatan siswa dan guru SMP Negeri 3 Cihampelas.')
              }))
            );
          }
        }
      } catch {}
    }
  }, []);

  const filteredPhotos = filter === 'SEMUA' 
    ? photos 
    : photos.filter((p) => p.category === filter);

  const displayedPhotos = filteredPhotos.slice(0, visibleCount);
  const remainingCount = filteredPhotos.length - visibleCount;
  const hasMore = remainingCount > 0;

  const currentIndex = selectedPhoto 
    ? filteredPhotos.findIndex((p) => p.id === selectedPhoto.id) 
    : -1;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedPhoto(filteredPhotos[currentIndex - 1]);
    } else {
      setSelectedPhoto(filteredPhotos[filteredPhotos.length - 1]);
    }
  }, [currentIndex, filteredPhotos]);

  const handleNext = useCallback(() => {
    if (currentIndex < filteredPhotos.length - 1) {
      setSelectedPhoto(filteredPhotos[currentIndex + 1]);
    } else {
      setSelectedPhoto(filteredPhotos[0]);
    }
  }, [currentIndex, filteredPhotos]);

  // Keyboard Navigation & Escape listener for Lightbox
  useEffect(() => {
    if (!selectedPhoto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedPhoto, handlePrev, handleNext]);

  const getCategoryCount = (key: string) => {
    if (key === 'SEMUA') return photos.length;
    return photos.filter((p) => p.category === key).length;
  };

  return (
    <section id="galeri" className="relative w-full py-20 sm:py-28 bg-[#f8fafc] text-slate-900 border-b border-indigo-100/70 overflow-hidden select-none">
      {/* Anchor for Navbar link #fasilitas */}
      <div id="fasilitas" className="absolute -top-24 pointer-events-none" />

      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-indigo-100/35 blur-[160px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-100/30 blur-[160px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-indigo-50/80 border border-indigo-200/70 text-indigo-700 text-[11px] font-medium tracking-[0.15em] uppercase mb-3 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
            <span>Dokumentasi & Aktivitas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.12] mb-4">
            Galeri Momen Berharga <span className="font-semibold text-indigo-950">Siswa & Guru</span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm font-light leading-relaxed max-w-xl mx-auto">
            Merekam dinamika kegiatan belajar, pengembangan potensi ekstrakurikuler, dan lingkungan asri di SMP Negeri 3 Cihampelas.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mb-10 sm:mb-12">
          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat.key);
            const isActive = filter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => {
                  setFilter(cat.key);
                  setVisibleCount(INITIAL_LIMIT);
                }}
                className={`inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-xs font-semibold tracking-wide transition-all rounded-full cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                    : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shadow-xs'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Photo Grid - Clean Card Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {displayedPhotos.map((photo) => (
            <div 
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
            >
              {/* Photo Viewport */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <Image 
                  src={photo.src}
                  alt={photo.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Category Pill Tag */}
                <div className="absolute top-3 left-3 z-10">
                  <span className="px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-indigo-700 text-[10px] font-bold tracking-wider uppercase shadow-sm border border-indigo-100">
                    {photo.category}
                  </span>
                </div>

                {/* Subtle Hover Action Hint */}
                <div className="absolute inset-0 bg-slate-950/25 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 text-xs font-semibold shadow-md flex items-center gap-1.5 scale-95 group-hover:scale-100 transition-transform">
                    <span>🔍 Perbesar Foto</span>
                  </span>
                </div>
              </div>

              {/* Text Information (Clean & Bright) */}
              <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between bg-white">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-2">
                    {photo.title}
                  </h3>
                  {photo.desc && (
                    <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed line-clamp-2">
                      {photo.desc}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
                  <span>Buka Foto Penuh</span>
                  <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-xs group-hover:translate-x-0.5 transition-transform">
                    ↗
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="mt-10 sm:mt-12 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 6)}
              className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-full bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 text-xs sm:text-sm font-bold border border-indigo-200/90 shadow-sm hover:shadow-md transition-all active:scale-98 cursor-pointer"
            >
              <span>+ Tampilkan Lebih Banyak Foto</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono text-[11px] font-semibold">
                {remainingCount} lagi
              </span>
            </button>
          </div>
        )}

        {/* Show Less Option */}
        {!hasMore && filteredPhotos.length > INITIAL_LIMIT && (
          <div className="mt-10 text-center flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <span className="text-xs text-slate-400 font-medium">
              Menampilkan seluruh {filteredPhotos.length} foto
            </span>
            <button
              type="button"
              onClick={() => {
                setVisibleCount(INITIAL_LIMIT);
                const el = document.getElementById('galeri');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline underline-offset-4 cursor-pointer"
            >
              Tampilkan Lebih Sedikit ↑
            </button>
          </div>
        )}

        {filteredPhotos.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm font-medium">
              Tidak ada foto dalam kategori ini.
            </p>
          </div>
        )}

      </div>

      {/* Lightbox Modal (Zoom Layar Penuh) */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900/95 border-b border-slate-800 text-white z-20">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 text-[10px] font-mono uppercase tracking-wider border border-indigo-500/30">
                  {selectedPhoto.category}
                </span>
                <span className="text-xs text-slate-400">
                  {currentIndex + 1} dari {filteredPhotos.length}
                </span>
              </div>
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                title="Tutup (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Image Area */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-black flex items-center justify-center overflow-hidden">
              <Image 
                src={selectedPhoto.src}
                alt={selectedPhoto.title}
                fill
                className="object-contain"
                priority
              />

              {/* Prev / Next Arrows */}
              {filteredPhotos.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-indigo-600 text-white text-xl flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs z-10"
                    title="Foto Sebelumnya (←)"
                  >
                    ‹
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-indigo-600 text-white text-xl flex items-center justify-center transition-colors cursor-pointer backdrop-blur-xs z-10"
                    title="Foto Selanjutnya (→)"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Modal Caption Area */}
            <div className="p-5 sm:p-6 bg-slate-900 border-t border-slate-800">
              <h3 className="text-white text-base sm:text-xl font-bold mb-1.5 tracking-tight">
                {selectedPhoto.title}
              </h3>
              {selectedPhoto.desc && (
                <p className="text-slate-300 text-xs sm:text-sm font-light leading-relaxed">
                  {selectedPhoto.desc}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
