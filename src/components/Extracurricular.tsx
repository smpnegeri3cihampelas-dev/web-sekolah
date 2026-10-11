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
      name: 'Gerakan Pramuka (Gudep)', 
      category: 'Kepanduan & Karakter', 
      desc: 'Pendidikan kepanduan wajib, kemandirian alam terbuka, penanaman Dasa Darma, pioneering, dan pembentukan jiwa pemimpin tangguh.',
      badgeColor: 'text-amber-800 border-amber-300 bg-amber-100/80'
    },
    { 
      name: 'Paskibra & Kepemimpinan', 
      category: 'Kedisiplinan', 
      desc: 'Pelatihan baris-berbaris formal, kedisiplinan tingkat tinggi, ketahanan fisik, dan solidaritas tim pengibar bendera.',
      badgeColor: 'text-blue-700 border-blue-200/80 bg-blue-50'
    },
    { 
      name: 'PMR Madya (Kemanusiaan)', 
      category: 'Sosial & Kesehatan', 
      desc: 'Pertolongan pertama pada kecelakaan (P3K), edukasi kesehatan remaja, dan bakti sosial kepedulian lingkungan.',
      badgeColor: 'text-rose-700 border-rose-200/80 bg-rose-50'
    },
    { 
      name: 'Basketball & Futsal', 
      category: 'Olahraga', 
      desc: 'Pembinaan atlet muda berprestasi dengan pelatih berlisensi dan rekam jejak kejuaraan tingkat Kabupaten Bandung Barat.',
      badgeColor: 'text-amber-700 border-amber-200/80 bg-amber-50'
    },
    { 
      name: 'Seni Musik & Vokal', 
      category: 'Kesenian & Budaya', 
      desc: 'Eksplorasi musikalitas, ansambel instrumen tradisional Sunda (angklung) & modern, serta paduan suara sekolah.',
      badgeColor: 'text-emerald-700 border-emerald-200/80 bg-emerald-50'
    },
  ];

  return (
    <section id="ekstrakurikuler" className="relative w-full py-20 sm:py-28 pl-4 sm:pl-8 overflow-hidden bg-white text-slate-900 border-b border-indigo-100/70 select-none">
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-indigo-100/35 blur-[160px] pointer-events-none -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-purple-100/30 blur-[160px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-7xl mx-auto mb-12 sm:mb-16 pr-4 sm:pr-8 relative z-10">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-indigo-50/80 border border-indigo-200/70 text-indigo-700 text-[11px] font-medium tracking-[0.15em] uppercase mb-3 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
          <span>Pengembangan Bakat & Minat</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/80 pb-6">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-slate-900 tracking-tight leading-[1.12]">
              Eksplorasi Potensi <span className="font-semibold text-indigo-950">& Karakter Siswa</span>
            </h2>
            <p className="text-slate-600 mt-3 text-xs sm:text-sm max-w-lg leading-relaxed font-light">
              Wadah penyaluran bakat, olahraga, seni budaya, serta kepemimpinan yang berintegritas tinggi.
            </p>
          </div>
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest hidden md:flex items-center gap-2">
            <span>Geser Untuk Menjelajah</span>
            <span className="animate-pulse text-indigo-600">→</span>
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
            className="snap-center shrink-0 w-[85vw] sm:w-[360px] md:w-[380px] h-[330px] rounded-[2.2rem] p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 bg-[#f8fafc] hover:bg-[#eef2ff]/70 border border-indigo-100 hover:border-indigo-300 shadow-sm hover:shadow-md hover:shadow-indigo-500/5 group"
          >
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider border ${item.badgeColor}`}>
                {item.category}
              </span>
              <span className="text-2xl font-mono text-slate-300 group-hover:text-indigo-600 transition-colors">
                0{idx + 1}
              </span>
            </div>

            <div className="py-4">
              <h3 className="text-xl sm:text-2xl font-medium text-slate-900 mb-2 leading-snug group-hover:text-indigo-900 transition-colors">
                {item.name}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-light">
                {item.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs">
              <span className="font-light text-[11px] text-slate-500">Pembinaan Rutin</span>
              <span className="text-slate-700 font-bold text-[11px] bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/90">
                Terbuka Kelas 7, 8, &amp; 9
              </span>
            </div>
          </div>
        ))}
        <div className="shrink-0 w-6 sm:w-12" />
      </div>
    </section>
  );
}
