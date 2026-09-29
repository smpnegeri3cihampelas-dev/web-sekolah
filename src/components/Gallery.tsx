'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function Gallery() {
  const [filter, setFilter] = useState('SEMUA');

  const photos = [
    // Fasilitas Unggulan
    { 
      id: 1, 
      src: '/gallery_2.jpg', 
      category: 'FASILITAS', 
      title: 'Laboratorium Komputer & Digital 4.0',
      desc: 'Perangkat komputasi modern, jaringan serat optik, dan coding interaktif.'
    },
    { 
      id: 2, 
      src: '/gallery_1.jpg', 
      category: 'FASILITAS', 
      title: 'Perpustakaan Digital Terpadu',
      desc: 'Koleksi e-book, repositori karya siswa, dan ruang baca ergonomis.'
    },
    { 
      id: 3, 
      src: '/slide4.jpeg', 
      category: 'FASILITAS', 
      title: 'Creative STEM & Robotika Room',
      desc: 'Area perakitan hardware, sensor IoT, serta eksperimen otomasi siswa.'
    },
    { 
      id: 4, 
      src: '/school_building.jpg', 
      category: 'FASILITAS', 
      title: 'Kawasan Smart Eco-Campus',
      desc: 'Lingkungan sekolah asri dengan sarana olahraga terpadu dan ruang hijau.'
    },
    // Kegiatan & Akademik
    { 
      id: 5, 
      src: '/slide7.jpeg', 
      category: 'AKADEMIK', 
      title: 'Praktikum Sains & Kolaborasi Kelas',
      desc: 'Pembelajaran berbasis proyek dan riset sains mandiri.'
    },
    { 
      id: 6, 
      src: '/slide1.jpeg', 
      category: 'KEGIATAN', 
      title: 'Upacara Bendera & Pembinaan Karakter',
      desc: 'Menumbuhkan kedisiplinan dan integritas kebangsaan siswa.'
    },
    { 
      id: 7, 
      src: '/slide3.jpeg', 
      category: 'EKSTRAKURIKULER', 
      title: 'Turnamen & Kejuaraan Olahraga KBB',
      desc: 'Wadah kompetisi minat bakat dan sportivitas siswa.'
    },
    { 
      id: 8, 
      src: '/slide6.jpeg', 
      category: 'KEGIATAN', 
      title: 'Senam Pagi & Kebersamaan Kampus',
      desc: 'Kebugaran jasmani seluruh sivitas akademika setiap pekan.'
    },
  ];

  const categories = ['SEMUA', 'FASILITAS', 'AKADEMIK', 'KEGIATAN', 'EKSTRAKURIKULER'];

  const filteredPhotos = filter === 'SEMUA' 
    ? photos 
    : photos.filter(p => p.category === filter);

  return (
    <section id="galeri" className="relative w-full py-20 sm:py-28 bg-black text-stone-100 border-b border-white/[0.06] overflow-hidden select-none">
      {/* Anchor for Navbar link #fasilitas */}
      <div id="fasilitas" className="absolute -top-24 pointer-events-none" />

      {/* Ambient Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-900/[0.06] blur-[160px] rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-purple-900/[0.06] blur-[160px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-stone-300 text-[11px] font-normal tracking-[0.2em] uppercase mb-3 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            <span>Dokumentasi & Aktivitas</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-[1.12] mb-4">
            Galeri Momen Berharga <span className="font-normal text-stone-200">Siswa & Guru</span>
          </h2>
          <p className="text-stone-400 text-xs sm:text-sm font-light leading-relaxed max-w-xl mx-auto">
            Merekam dinamika kegiatan belajar, pengembangan potensi ekstrakurikuler, dan rekam jejak prestasi di lingkungan SMP Negeri 3 Cihampelas.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 sm:px-5 py-2 text-xs font-normal tracking-wide transition-all rounded-full cursor-pointer ${
                filter === cat 
                  ? 'bg-white/[0.08] text-white border border-white/20 shadow-md' 
                  : 'bg-white/[0.02] text-stone-400 border border-white/[0.06] hover:bg-white/[0.05] hover:text-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredPhotos.map((photo) => (
            <div 
              key={photo.id} 
              className="group relative aspect-[4/3] rounded-[2.2rem] overflow-hidden border border-white/10 bg-white/[0.02] cursor-pointer shadow-xl shadow-black/30 hover:border-cyan-400/40 transition-all duration-500"
            >
              <Image 
                src={photo.src}
                alt={photo.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 sm:p-7">
                <span className="self-start px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-cyan-300 text-[10px] font-mono uppercase tracking-wider mb-2">
                  {photo.category}
                </span>
                <h3 className="text-white text-base sm:text-lg font-normal tracking-tight group-hover:text-cyan-200 transition-colors mb-1">
                  {photo.title}
                </h3>
                {photo.desc && (
                  <p className="text-stone-300/80 text-xs font-light line-clamp-2">
                    {photo.desc}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
