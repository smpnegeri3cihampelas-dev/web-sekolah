'use client';

import React from 'react';

export default function Calendar() {
  const events = [
    {
      id: 1,
      date: '15-20',
      month: 'Juli 2026',
      title: 'Masa Pengenalan Lingkungan Sekolah (MPLS)',
      type: 'Akademik',
      badgeClass: 'text-cyan-300 border-cyan-400/30 bg-cyan-500/10'
    },
    {
      id: 2,
      date: '17',
      month: 'Agustus 2026',
      title: 'Upacara Peringatan Hari Kemerdekaan RI Ke-81',
      type: 'Kegiatan',
      badgeClass: 'text-purple-300 border-purple-400/30 bg-purple-500/10'
    },
    {
      id: 3,
      date: '21-26',
      month: 'September 2026',
      title: 'Asesmen Tengah Semester (Sumatif) Ganjil',
      type: 'Ujian CBT',
      badgeClass: 'text-amber-300 border-amber-400/30 bg-amber-500/10'
    },
    {
      id: 4,
      date: '04-12',
      month: 'Desember 2026',
      title: 'Asesmen Akhir Semester (PAS) Berbasis Digital',
      type: 'Ujian CBT',
      badgeClass: 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10'
    }
  ];

  return (
    <section id="kalender" className="relative w-full py-20 sm:py-28 bg-black text-stone-100 overflow-hidden select-none border-b border-white/[0.06]">
      {/* Ambient Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[400px] bg-purple-950/[0.08] rounded-full blur-[160px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[400px] bg-cyan-950/[0.08] rounded-full blur-[160px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Header & Sticky Description */}
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-stone-300 text-[11px] font-normal tracking-[0.2em] uppercase mb-4 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span>Agenda & Kegiatan Resmi</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-5 leading-[1.12] tracking-tight">
              Kalender Akademik <br/> 
              <span className="font-normal text-stone-200">Tahun Ajaran 2026/2027</span>
            </h2>

            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed mb-8 font-light max-w-md">
              Jadwal pelaksanaan kegiatan pembelajaran, evaluasi sumatif CBT, agenda ekstrakurikuler, dan kalender libur semester. Pastikan untuk selalu memantau pembaruan berkala.
            </p>

            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); alert('Kalender akademik versi PDF sedang disiapkan.'); }}
              className="group inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-cyan-400/40 text-xs sm:text-sm font-medium text-stone-200 hover:text-white backdrop-blur-xl transition-all duration-300 shadow-sm"
            >
              <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs group-hover:bg-cyan-400 group-hover:text-black transition-colors">
                ↓
              </span>
              <span>Unduh Kalender Akademik (PDF)</span>
            </a>
          </div>

          {/* Timeline List */}
          <div className="lg:col-span-7">
            <div className="flex flex-col gap-4">
              {events.map((item) => (
                <div 
                  key={item.id} 
                  className="group flex flex-col sm:flex-row items-start sm:items-center p-5 sm:p-6 rounded-[2rem] bg-white/[0.025] hover:bg-white/[0.05] border border-white/[0.08] hover:border-cyan-400/30 backdrop-blur-xl transition-all duration-300 gap-5 sm:gap-6 shadow-lg shadow-black/20"
                >
                  
                  {/* Date Block */}
                  <div className="shrink-0 flex flex-col items-center justify-center w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-white/[0.04] border border-white/10 group-hover:border-cyan-400/40 group-hover:bg-cyan-500/10 transition-all duration-300">
                    <span className="text-2xl sm:text-3xl font-light text-white leading-none mb-1 group-hover:scale-105 transition-transform">
                      {item.date}
                    </span>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-cyan-400/90 text-center px-1">
                      {item.month.split(' ')[0]}
                    </span>
                  </div>

                  {/* Info Block */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded-md border ${item.badgeClass}`}>
                        {item.type}
                      </span>
                      <span className="text-[11px] text-stone-500 font-mono">
                        {item.month}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-normal text-stone-100 group-hover:text-white transition-colors leading-snug">
                      {item.title}
                    </h3>
                  </div>

                  {/* Arrow Indicator */}
                  <div className="hidden sm:flex w-8 h-8 rounded-full border border-white/10 items-center justify-center text-stone-500 group-hover:text-cyan-400 group-hover:border-cyan-400/30 transition-all shrink-0">
                    →
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
