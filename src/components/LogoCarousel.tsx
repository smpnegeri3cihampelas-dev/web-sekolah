'use client';

import React from 'react';

export default function LogoCarousel() {
  const rowTop = [
    {
      name: 'Kemendikbud',
      desc: 'Kementerian Pendidikan & Kebudayaan',
      tag: 'Pusat',
      icon: (
        <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      name: 'Pemkab Bandung Barat',
      desc: 'Pemerintah Kabupaten Bandung Barat',
      tag: 'Wilayah',
      icon: (
        <svg className="w-6 h-6 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      name: 'Kurikulum Merdeka',
      desc: 'Pembelajaran Terdiferensiasi 4.0',
      tag: 'Kurikulum',
      icon: (
        <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      name: 'BAN-S/M',
      desc: 'Terakreditasi "A" (Unggul)',
      tag: 'Akreditasi',
      icon: (
        <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 15l-2 5l9-13h-6l2-5l-9 13h6z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      name: 'Disdik KBB',
      desc: 'Dinas Pendidikan Kab. Bandung Barat',
      tag: 'Dinas',
      icon: (
        <svg className="w-6 h-6 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    }
  ];

  const rowBottom = [
    {
      name: 'Google for Education',
      desc: 'Chromebook & Workspace Cloud',
      tag: 'Partner',
      icon: (
        <svg className="w-6 h-6 text-red-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
        </svg>
      )
    },
    {
      name: 'Belajar.id',
      desc: 'Akun Akses Digital Resmi Siswa',
      tag: 'Portal',
      icon: (
        <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect width="18" height="18" x="3" y="3" rx="4" />
          <path d="M9 12h6M12 9v6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      name: 'Pramuka',
      desc: 'Gugus Depan SMPN 3 Cihampelas',
      tag: 'Karakter',
      icon: (
        <svg className="w-6 h-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 2L8 8h8l-4-6zM12 8v14M8 15h8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    },
    {
      name: 'PMI / PMR',
      desc: 'Palang Merah Remaja Madya',
      tag: 'Kemanusiaan',
      icon: (
        <svg className="w-6 h-6 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 6v12M6 12h12" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      )
    },
    {
      name: 'Bank BRI (SimPel)',
      desc: 'Literasi Keuangan & Tabungan Siswa',
      tag: 'Finansial',
      icon: (
        <svg className="w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect width="20" height="14" x="2" y="5" rx="3" />
          <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
      )
    },
    {
      name: 'Canva for Education',
      desc: 'Desain Kreatif & Portofolio Siswa',
      tag: 'Kreativitas',
      icon: (
        <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12c1.5-2 3-2 4 0s2.5 2 4 0" strokeLinecap="round" />
        </svg>
      )
    }
  ];

  // Quadruple items for 100% infinite seamless continuous loop
  const listTop = [...rowTop, ...rowTop, ...rowTop, ...rowTop];
  const listBottom = [...rowBottom, ...rowBottom, ...rowBottom, ...rowBottom];

  return (
    <section id="kemitraan" className="relative w-full py-14 sm:py-18 bg-black overflow-hidden select-none border-b border-white/[0.06]">
      {/* Dark Cosmic Background Ambient Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[300px] bg-purple-900/[0.06] rounded-full blur-[140px]" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-900/[0.05] rounded-full blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 mb-8 sm:mb-10 text-center">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/[0.03] border border-white/10 text-stone-400 text-[11px] font-normal tracking-[0.2em] uppercase mb-2.5 backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/90 shadow-[0_0_8px_#38bdf8]" />
          <span>Kemitraan & Ekosistem Terpadu</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-light text-stone-300 tracking-tight">
          Didukung Institusi & Platform Teknologi Terpercaya
        </h2>
      </div>

      {/* Marquee Container with Subtle Left & Right Edge Fade Mask */}
      <div 
        className="relative z-10 w-full flex flex-col gap-5 sm:gap-7 overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)'
        }}
      >
        {/* ROW 1: Moves continuous RIGHT → LEFT (Unboxed, Grayscale by default, Full Color on hover) */}
        <div className="animate-marquee-left flex items-center gap-6 sm:gap-10">
          {listTop.map((item, index) => (
            <div 
              key={`top-${index}`}
              className="group shrink-0 inline-flex items-center gap-3 sm:gap-3.5 px-3 sm:px-5 py-2 cursor-pointer filter grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:scale-105 transition-all duration-300"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-medium text-stone-300 group-hover:text-white transition-colors whitespace-nowrap">
                    {item.name}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.06] text-stone-400 group-hover:text-cyan-300 group-hover:bg-cyan-950/40 transition-colors">
                    {item.tag}
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 group-hover:text-stone-300 font-light whitespace-nowrap transition-colors">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ROW 2: Moves continuous LEFT → RIGHT (Unboxed, Grayscale by default, Full Color on hover) */}
        <div className="animate-marquee-right flex items-center gap-6 sm:gap-10">
          {listBottom.map((item, index) => (
            <div 
              key={`bottom-${index}`}
              className="group shrink-0 inline-flex items-center gap-3 sm:gap-3.5 px-3 sm:px-5 py-2 cursor-pointer filter grayscale opacity-40 hover:grayscale-0 hover:opacity-100 hover:scale-105 transition-all duration-300"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-medium text-stone-300 group-hover:text-white transition-colors whitespace-nowrap">
                    {item.name}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.06] text-stone-400 group-hover:text-purple-300 group-hover:bg-purple-950/40 transition-colors">
                    {item.tag}
                  </span>
                </div>
                <span className="text-[11px] text-stone-500 group-hover:text-stone-300 font-light whitespace-nowrap transition-colors">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
