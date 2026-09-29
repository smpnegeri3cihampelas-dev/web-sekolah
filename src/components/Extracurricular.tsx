'use client';

import { useRef, useState } from 'react';

export default function Extracurricular() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const items = [
    { 
      name: 'Robotika & AI Club', 
      category: 'Inovasi Digital', 
      desc: 'Perakitan robot otonom, pemrograman sensor cerdas, dan pengenalan logika kecerdasan buatan.',
      badgeColor: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10'
    },
    { 
      name: 'Web & UI/UX Design', 
      category: 'Teknologi', 
      desc: 'Pembuatan aplikasi antarmuka web modern, interaksi digital, dan desain tata letak kreatif.',
      badgeColor: 'text-indigo-300 border-indigo-400/30 bg-indigo-500/10'
    },
    { 
      name: 'Paskibra & Kepemimpinan', 
      category: 'Karakter', 
      desc: 'Pelatihan baris-berbaris formal, kedisiplinan tingkat tinggi, ketahanan fisik, dan solidaritas tim.',
      badgeColor: 'text-purple-300 border-purple-400/30 bg-purple-500/10'
    },
    { 
      name: 'PMR Madya (Kemanusiaan)', 
      category: 'Sosial', 
      desc: 'Pertolongan pertama, edukasi kesehatan remaja, dan bakti sosial kepedulian lingkungan.',
      badgeColor: 'text-rose-300 border-rose-400/30 bg-rose-500/10'
    },
    { 
      name: 'Basketball & Futsal', 
      category: 'Olahraga', 
      desc: 'Pembinaan atlet muda berprestasi dengan pelatih berlisensi dan rekam jejak juara tingkat KBB.',
      badgeColor: 'text-amber-300 border-amber-400/30 bg-amber-500/10'
    },
    { 
      name: 'Seni Musik & Vokal', 
      category: 'Kesenian', 
      desc: 'Eksplorasi musikalitas, ansambel instrumen tradisional angklung & modern, serta paduan suara sekolah.',
      badgeColor: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10'
    },
  ];

  return (
    <section id="ekstrakurikuler" className="relative w-full py-20 sm:py-28 pl-4 sm:pl-8 overflow-hidden bg-black text-stone-100 border-b border-white/[0.06] select-none">
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-cyan-900/[0.06] blur-[160px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-900/[0.06] blur-[160px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-7xl mx-auto mb-12 sm:mb-16 pr-4 sm:pr-8 relative z-10">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-stone-300 text-[11px] font-normal tracking-[0.2em] uppercase mb-3 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
          <span>Pengembangan Bakat & Minat</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/[0.08] pb-6">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-tight leading-[1.12]">
              Eksplorasi Potensi <span className="font-normal text-stone-200">& Karakter Siswa</span>
            </h2>
            <p className="text-stone-400 mt-3 text-xs sm:text-sm max-w-lg leading-relaxed font-light">
              Wadah penyaluran bakat, sains terapan, seni budaya, serta kepemimpinan yang berintegritas tinggi.
            </p>
          </div>
          <p className="text-[11px] font-normal text-stone-400 uppercase tracking-widest hidden md:flex items-center gap-2">
            <span>Geser Untuk Menjelajah</span>
            <span className="animate-pulse">→</span>
          </p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-5 sm:gap-6 overflow-x-auto pb-10 snap-x snap-mandatory scrollbar-hide cursor-grab active:cursor-grabbing select-none relative z-10"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, idx) => (
          <div 
            key={idx}
            className="snap-center shrink-0 w-[85vw] sm:w-[360px] md:w-[380px] h-[330px] rounded-[2.2rem] p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.08] hover:border-cyan-400/30 backdrop-blur-xl shadow-xl shadow-black/40 group"
          >
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border ${item.badgeColor}`}>
                {item.category}
              </span>
              <span className="text-2xl font-mono text-stone-600 group-hover:text-cyan-400 transition-colors">
                0{idx + 1}
              </span>
            </div>

            <div className="py-4">
              <h3 className="text-xl sm:text-2xl font-normal text-white mb-2 leading-snug group-hover:text-cyan-200 transition-colors">
                {item.name}
              </h3>
              <p className="text-xs sm:text-sm text-stone-400 leading-relaxed font-light">
                {item.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
              <span className="font-light text-[11px] text-stone-400">Pembinaan Intensif</span>
              <span className="text-cyan-400 font-medium text-xs group-hover:text-white transition-colors flex items-center gap-1.5">
                <span>Daftar Ekskul</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </div>
        ))}
        <div className="shrink-0 w-6 sm:w-12" />
      </div>
    </section>
  );
}
